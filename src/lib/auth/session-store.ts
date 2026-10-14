"use client";

import {
  changeEmail as changeEmailApi,
  completeAccountLink as completeAccountLinkApi,
  confirmMarketplaceAccess as confirmMarketplaceAccessApi,
  getCurrentUser,
  googleAuth as googleAuthApi,
  linkGoogle as linkGoogleApi,
  linkGoogleWeb as linkGoogleWebApi,
  loginCustomer,
  logoutCustomer,
  refreshSession,
  registerCustomer,
  sendAccountLink as sendAccountLinkApi,
  unlinkGoogle as unlinkGoogleApi,
} from "@/lib/api/customer-auth";
import {
  ApiError,
  invalidateSessionRefresh,
  isTerminalRefreshError,
  setOnLogout,
  setTokenStore,
} from "@/lib/api/http";
import { CSRF_COOKIE_NAME, clearCookie, readCookie } from "@/lib/auth/cookies";
import { googleOAuthRedirectUri } from "@/lib/auth/google-oauth";
import { getJwtExpiryMs } from "@/lib/auth/jwt";
import type {
  AuthContextValue,
  AuthResponse,
  AuthUser,
  OptimisticUser,
} from "@/lib/auth/types";

// The server snapshot is deliberately anonymous and immutable. The mutable
// controller is created ONLY in the browser; no visitor's session can enter a
// server module singleton. Tokens remain in tab memory, never browser storage.
type SessionSnapshot = Pick<
  AuthContextValue,
  "status" | "user" | "optimisticUser" | "initializing" | "error"
> & { sessionId: number | null };
export const SERVER_SESSION: SessionSnapshot = {
  sessionId: null,
  status: "idle",
  user: null,
  optimisticUser: null,
  initializing: true,
  error: null,
};
const PROACTIVE_REFRESH_LEAD_MS = 60_000;
const LAST_DISPLAY_NAME_KEY = "zv.auth.lastDisplayName:v1";
const expiredListeners = new Set<() => void>();

export function subscribeSessionExpired(listener: () => void): () => void {
  expiredListeners.add(listener);
  return () => {
    expiredListeners.delete(listener);
  };
}

function cachedIdentity(): OptimisticUser {
  try {
    const value = JSON.parse(
      window.localStorage.getItem(LAST_DISPLAY_NAME_KEY) ?? "null",
    );
    return {
      firstName: typeof value?.firstName === "string" ? value.firstName : "",
      lastName: typeof value?.lastName === "string" ? value.lastName : "",
      profileImage:
        typeof value?.profileImage === "string" ? value.profileImage : null,
    };
  } catch {
    return { firstName: "", lastName: "" };
  }
}

function cacheIdentity(user: AuthUser | null): void {
  try {
    if (user) {
      const { firstName, lastName, profileImage } = user;
      window.localStorage.setItem(
        LAST_DISPLAY_NAME_KEY,
        JSON.stringify({
          firstName,
          lastName,
          profileImage: profileImage ?? null,
        }),
      );
    } else {
      window.localStorage.removeItem(LAST_DISPLAY_NAME_KEY);
    }
  } catch {
    /* Cosmetic cache is best-effort, never authentication. */
  }
}

function createBrowserSession() {
  let snapshot = SERVER_SESSION;
  let accessToken: string | null = null;
  let revision = 0;
  let profileRevision = 0;
  let started = false;
  let expiryAnnounced = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let retryAttempt = 0;
  let retryAt = 0;
  let bootstrap: Promise<void> | null = null;
  let profileRequest: Promise<void> | null = null;
  let channel: BroadcastChannel | null = null;
  const listeners = new Set<() => void>();

  function update(patch: Partial<SessionSnapshot>) {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  }

  function clearTimer() {
    clearTimeout(timer);
    timer = undefined;
  }

  function replaceSession() {
    revision += 1;
    profileRevision += 1;
    bootstrap = null;
    profileRequest = null;
    invalidateSessionRefresh();
    retryAttempt = 0;
    retryAt = 0;
    clearTimer();
    return revision;
  }

  function endSession(involuntary = false) {
    replaceSession();
    accessToken = null;
    clearCookie(CSRF_COOKIE_NAME);
    cacheIdentity(null);
    update({
      status: "unauthenticated",
      sessionId: null,
      user: null,
      optimisticUser: null,
      initializing: false,
      error: null,
    });
    if (involuntary && !expiryAnnounced) {
      expiryAnnounced = true;
      expiredListeners.forEach((listener) => listener());
    }
  }

  function recoverSession(error: unknown, owner: number) {
    if (owner !== revision) return;
    if (isTerminalRefreshError(error) ||
        (error instanceof ApiError && error.status === 401 &&
         error.code !== "csrf_invalid")) {
      endSession(true);
      return;
    }
    // An outage says nothing about the validity of the HttpOnly session.
    // Preserve known authenticated state and retry with a bounded delay;
    // an already-expired JWT must never create a zero-ms loop. An unresolved
    // bootstrap uses the existing recoverable error gate, not endless loading.
    if (snapshot.status !== "authenticated") {
      update({ status: "error", initializing: false, optimisticUser: null });
    }
    const backoff = Math.min(60_000, 5_000 * 2 ** Math.min(retryAttempt++, 4));
    const retryAfter = error instanceof ApiError
      ? (error.retryAfterSeconds ?? 0) * 1_000 : 0;
    retryAt = Date.now() + Math.max(backoff, retryAfter);
    scheduleRecovery();
  }

  function scheduleRecovery() {
    clearTimer();
    if (!started || !readCookie(CSRF_COOKIE_NAME)) return;
    const owner = revision;
    timer = setTimeout(() => {
      if (owner !== revision) return;
      if (snapshot.status === "authenticated") void actions.refresh();
      else void checkSession();
    }, Math.max(0, retryAt - Date.now()));
  }

  function scheduleRefresh(token: string) {
    clearTimer();
    if (!started) return;
    const expiry = getJwtExpiryMs(token);
    if (!expiry) return;
    const owner = revision;
    // A suspended tab may resume after expiry. Do not leave an already-due
    // token unscheduled; refresh promptly through the existing shared queue.
    timer = setTimeout(
      () => {
        void refreshSession().catch((error: unknown) => {
          recoverSession(error, owner);
        });
      },
      Math.max(0, expiry - Date.now() - PROACTIVE_REFRESH_LEAD_MS,
        retryAt - Date.now()),
    );
  }

  function setToken(token: string | null) {
    accessToken = token;
    if (token) {
      retryAttempt = 0;
      retryAt = 0;
    }
    if (token && started) scheduleRefresh(token);
    else clearTimer();
  }

  function setUser(user: AuthUser) {
    if (snapshot.user && snapshot.user.uuid !== user.uuid) {
      establish(user);
      return;
    }
    cacheIdentity(user);
    update({ user });
  }

  function establish(user: AuthUser) {
    // A tab can return after missing another tab's login broadcast. If the
    // authoritative profile identifies a different account, isolate caches
    // and old requests even when this tab did not initiate that replacement.
    if (snapshot.user && snapshot.user.uuid !== user.uuid &&
        snapshot.sessionId === revision) {
      replaceSession();
      if (accessToken) scheduleRefresh(accessToken);
    }
    expiryAnnounced = false;
    cacheIdentity(user);
    update({
      status: "authenticated",
      sessionId: revision,
      user,
      optimisticUser: null,
      initializing: false,
      error: null,
    });
  }

  function checkSession(): Promise<void> {
    if (bootstrap) return bootstrap;
    if (snapshot.status === "authenticated" && accessToken)
      return Promise.resolve();
    if (retryAt > Date.now()) {
      scheduleRecovery();
      return Promise.resolve();
    }
    if (!readCookie(CSRF_COOKIE_NAME)) {
      if (snapshot.status !== "unauthenticated") {
        // First-load anonymous detection is not a session replacement: child
        // effects may already be fetching public data in this same commit.
        cacheIdentity(null);
        update({
          status: "unauthenticated",
          user: null,
          optimisticUser: null,
          initializing: false,
          error: null,
        });
      }
      return Promise.resolve();
    }
    const owner = revision;
    if (snapshot.status !== "error") {
      update({
        status: "loading",
        initializing: true,
        optimisticUser: cachedIdentity(),
      });
    }
    const request = (async () => {
      try {
        await refreshSession();
        if (owner !== revision) return;
        const user = await getCurrentUser();
        if (owner === revision) establish(user);
      } catch (error) {
        recoverSession(error, owner);
      } finally {
        if (owner === revision) bootstrap = null;
      }
    })();
    bootstrap = request;
    return request;
  }

  async function authenticate(
    request: () => Promise<AuthResponse>,
    fallback?: string,
    pending = true,
  ) {
    const owner = replaceSession();
    update({
      error: null,
      optimisticUser: null,
      initializing: false,
      ...(pending ? { status: "loading" as const } : {}),
    });
    try {
      const response = await request();
      if (owner !== revision)
        throw new ApiError("Session changed", 401, "SESSION_CHANGED");
      setToken(response.accessToken);
      const user = await getCurrentUser().catch(() => response.user);
      if (owner !== revision)
        throw new ApiError("Session changed", 401, "SESSION_CHANGED");
      establish(user);
      channel?.postMessage({ type: "login" });
    } catch (error) {
      if (owner === revision) {
        update({
          error: error instanceof ApiError ? error.message : (fallback ?? null),
          ...(pending ? { status: "unauthenticated" as const } : {}),
        });
        // A failed account-link attempt keeps the previous authenticated
        // session; resume its timer after replacing the operation generation.
        if (accessToken) scheduleRefresh(accessToken);
      }
      throw error;
    }
  }

  function refreshUser(): Promise<void> {
    if (profileRequest) return profileRequest;
    const owner = revision;
    const profileOwner = profileRevision;
    const request = (async () => {
      const user = await getCurrentUser();
      if (owner === revision && profileOwner === profileRevision) setUser(user);
    })().finally(() => {
      if (owner === revision && profileOwner === profileRevision)
        profileRequest = null;
    });
    profileRequest = request;
    return request;
  }

  function onVisible() {
    if (document.visibilityState === "hidden") return;
    if (!readCookie(CSRF_COOKIE_NAME)) {
      if (accessToken || snapshot.user) endSession();
    } else if (retryAt > Date.now()) {
      scheduleRecovery();
    } else if (accessToken) {
      scheduleRefresh(accessToken);
    } else if (!bootstrap) {
      void checkSession();
    }
  }

  function start() {
    if (started) return;
    started = true;
    setTokenStore({
      get: () => accessToken,
      set: setToken,
      clear: () => setToken(null),
    });
    setOnLogout(() => endSession(true));
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("auth");
      channel.onmessage = (event) => {
        if (event.data?.type === "logout") endSession();
        if (event.data?.type === "login") {
          replaceSession();
          accessToken = null;
          update({ status: "idle", user: null, error: null });
          void checkSession();
        }
        if (
          event.data?.type === "user-updated" &&
          snapshot.status === "authenticated"
        ) {
          profileRevision += 1;
          profileRequest = null;
          void refreshUser().catch(() => {});
        }
      };
    }
    // Owned by the browser session, not a locale's provider instance. These
    // listeners, the refresh timer and in-flight bootstrap survive remounts.
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    if (accessToken) scheduleRefresh(accessToken);
    void checkSession();
  }

  function stop() {
    if (!started) return;
    started = false;
    clearTimer();
    channel?.close();
    channel = null;
    window.removeEventListener("focus", onVisible);
    document.removeEventListener("visibilitychange", onVisible);
  }

  const actions: Omit<AuthContextValue, keyof SessionSnapshot> = {
    login: (dto) => authenticate(() => loginCustomer(dto), "Unable to sign in"),
    register: (dto) =>
      authenticate(() => registerCustomer(dto), "Unable to register"),
    completeAccountLink: (token, password) =>
      authenticate(
        () => completeAccountLinkApi(token, password),
        undefined,
        false,
      ),
    googleSignIn: (code, intent, locale) =>
      authenticate(() =>
        googleAuthApi(code, googleOAuthRedirectUri(), intent, locale),
      ),
    confirmMarketplaceAccess: (txId, locale) =>
      authenticate(
        () => confirmMarketplaceAccessApi(txId, locale),
        "Unable to enable marketplace access",
      ),
    linkGoogleAccount: (txId, proof) =>
      authenticate(
        () => linkGoogleApi(txId, proof),
        "Unable to link Google account",
      ),
    linkGoogle: (code) =>
      authenticate(
        () => linkGoogleWebApi(code, googleOAuthRedirectUri()),
        undefined,
        false,
      ),
    sendAccountLink: async (email, locale) =>
      (await sendAccountLinkApi(email, locale)).message,
    refreshUser,
    async unlinkGoogle(password) {
      const owner = revision;
      try {
        await unlinkGoogleApi(password);
        if (owner === revision && snapshot.user) {
          profileRevision += 1;
          profileRequest = null;
          setUser({ ...snapshot.user, googleSub: null });
          channel?.postMessage({ type: "user-updated" });
        }
      } catch (error) {
        if (owner === revision && error instanceof ApiError)
          update({ error: error.message });
        throw error;
      }
    },
    async changeEmail(currentEmail, newEmail) {
      const owner = revision;
      try {
        const result = await changeEmailApi(currentEmail, newEmail);
        if (owner === revision && snapshot.user) {
          profileRevision += 1;
          profileRequest = null;
          setUser({ ...snapshot.user, email: result.email });
          channel?.postMessage({ type: "user-updated" });
        }
        return result;
      } catch (error) {
        if (owner === revision && error instanceof ApiError)
          update({ error: error.message });
        throw error;
      }
    },
    async logout() {
      // Invalidate immediately so late bootstrap/profile responses cannot
      // restore the session while the logout request is pending. Keep its
      // token long enough for the endpoint's Authorization header to be built.
      const owner = replaceSession();
      const request = logoutCustomer();
      update({
        status: "unauthenticated",
        user: null,
        optimisticUser: null,
        initializing: false,
        error: null,
      });
      cacheIdentity(null);
      channel?.postMessage({ type: "logout" });
      try {
        await request;
      } catch {
        /* Logout remains best-effort. */
      }
      if (owner === revision) endSession();
    },
    async refresh() {
      const owner = revision;
      try {
        await refreshSession();
        if (owner !== revision) return;
        const user = await getCurrentUser();
        if (owner === revision) establish(user);
      } catch (error) {
        recoverSession(error, owner);
      }
    },
  };

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        // The replacement locale subscribes in the same commit. A genuinely
        // detached provider (including Fast Refresh) releases its resources;
        // its snapshot and bootstrap can still be reused on reattachment.
        queueMicrotask(() => {
          if (listeners.size === 0) stop();
        });
      };
    },
    start,
    actions,
  };
}

let browserSession: ReturnType<typeof createBrowserSession> | undefined;
function session() {
  if (typeof window === "undefined")
    throw new Error("Browser session accessed on the server");
  return (browserSession ??= createBrowserSession());
}

export function getSessionSnapshot() {
  return session().getSnapshot();
}
/** Stable for one authenticated session, independent of profile object updates.
 * A logout/login (even the same UUID) or credential replacement gets a new ID. */
export function getAuthenticatedSessionId(): number | null {
  const snapshot = getSessionSnapshot();
  return snapshot.status === "authenticated" ? snapshot.sessionId : null;
}
export function getServerSessionSnapshot() {
  return SERVER_SESSION;
}
export function subscribeSession(listener: () => void) {
  return session().subscribe(listener);
}
export function startSession() {
  session().start();
}

function activeSession() {
  const current = session();
  current.start();
  return current;
}

// Stable function identities preserve consumer effect dependencies across
// ordinary renders. Accessing the browser controller happens on invocation.
export const sessionActions: Omit<AuthContextValue, keyof SessionSnapshot> = {
  login: (...args) => activeSession().actions.login(...args),
  register: (...args) => activeSession().actions.register(...args),
  logout: () => activeSession().actions.logout(),
  refresh: () => activeSession().actions.refresh(),
  completeAccountLink: (...args) =>
    activeSession().actions.completeAccountLink(...args),
  sendAccountLink: (...args) =>
    activeSession().actions.sendAccountLink(...args),
  googleSignIn: (...args) => activeSession().actions.googleSignIn(...args),
  linkGoogleAccount: (...args) =>
    activeSession().actions.linkGoogleAccount(...args),
  confirmMarketplaceAccess: (...args) =>
    activeSession().actions.confirmMarketplaceAccess(...args),
  refreshUser: () => activeSession().actions.refreshUser(),
  linkGoogle: (...args) => activeSession().actions.linkGoogle(...args),
  unlinkGoogle: (...args) => activeSession().actions.unlinkGoogle(...args),
  changeEmail: (...args) => activeSession().actions.changeEmail(...args),
};
