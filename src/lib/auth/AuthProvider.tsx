"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  setOnLogout,
  setTokenStore,
} from "@/lib/api/http";
import {
  CSRF_COOKIE_NAME,
  clearCookie,
  readCookie,
} from "@/lib/auth/cookies";
import { googleOAuthRedirectUri } from "@/lib/auth/google-oauth";
import { getJwtExpiryMs } from "@/lib/auth/jwt";
import type {
  AuthContextValue,
  AuthResponse,
  AuthStatus,
  AuthUser,
  GoogleAuthIntent,
  LoginDTO,
  OptimisticUser,
  RegisterDTO,
} from "@/lib/auth/types";

export const AuthContext = createContext<AuthContextValue | null>(null);

const PROACTIVE_REFRESH_LEAD_MS = 60_000;

// Last-known display name, persisted so the header can render the correct
// avatar initials during the initial session check instead of flashing the
// logged-out icon. Cosmetic only — never used for authorization decisions.
const LAST_DISPLAY_NAME_KEY = "zv.auth.lastDisplayName:v1";

function readCachedDisplayName(): OptimisticUser | null {
  try {
    const raw = window.localStorage.getItem(LAST_DISPLAY_NAME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OptimisticUser>;
    return {
      firstName: typeof parsed.firstName === "string" ? parsed.firstName : "",
      lastName: typeof parsed.lastName === "string" ? parsed.lastName : "",
    };
  } catch {
    return null;
  }
}

function writeCachedDisplayName(user: OptimisticUser): void {
  try {
    window.localStorage.setItem(
      LAST_DISPLAY_NAME_KEY,
      JSON.stringify({ firstName: user.firstName, lastName: user.lastName }),
    );
  } catch {
    // best-effort: storage may be unavailable (private mode, quota)
  }
}

function clearCachedDisplayName(): void {
  try {
    window.localStorage.removeItem(LAST_DISPLAY_NAME_KEY);
  } catch {
    // best-effort
  }
}

type Props = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: Props) {
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [optimisticUser, setOptimisticUser] = useState<OptimisticUser | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  // "Initial session check still in flight": the pre-hydration frame ("idle")
  // or the hinted /refresh + /me round-trip (optimisticUser set). login() and
  // register() also pass through "loading" but never set optimisticUser, so
  // they don't re-enter this state.
  const initializing = status === "idle" || optimisticUser !== null;

  const accessTokenRef = useRef<string | null>(null);
  const proactiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const scheduleRef = useRef<(token: string) => void>(() => {});
  const handleUnauthenticatedRef = useRef<() => void>(() => {});

  const clearProactiveTimer = useCallback(() => {
    if (proactiveTimerRef.current) {
      clearTimeout(proactiveTimerRef.current);
      proactiveTimerRef.current = null;
    }
  }, []);

  const handleUnauthenticated = useCallback(() => {
    accessTokenRef.current = null;
    setUser(null);
    setStatus("unauthenticated");
    clearProactiveTimer();
    clearCookie(CSRF_COOKIE_NAME);
    clearCachedDisplayName();
  }, [clearProactiveTimer]);

  const scheduleProactiveRefresh = useCallback(
    (token: string) => {
      clearProactiveTimer();
      const expiryMs = getJwtExpiryMs(token);
      if (!expiryMs) return;
      const delay = expiryMs - Date.now() - PROACTIVE_REFRESH_LEAD_MS;
      if (delay <= 0) return;
      proactiveTimerRef.current = setTimeout(() => {
        refreshSession()
          .then((newToken) => scheduleRef.current(newToken))
          .catch(() => handleUnauthenticatedRef.current());
      }, delay);
    },
    [clearProactiveTimer],
  );

  useEffect(() => {
    scheduleRef.current = scheduleProactiveRefresh;
    handleUnauthenticatedRef.current = handleUnauthenticated;
  }, [scheduleProactiveRefresh, handleUnauthenticated]);

  const setAccessToken = useCallback(
    (token: string | null) => {
      accessTokenRef.current = token;
      if (token) {
        scheduleProactiveRefresh(token);
      } else {
        clearProactiveTimer();
      }
    },
    [scheduleProactiveRefresh, clearProactiveTimer],
  );

  // One-time wiring of the http module to this provider.
  useEffect(() => {
    setTokenStore({
      get: () => accessTokenRef.current,
      set: (token) => setAccessToken(token),
      clear: () => setAccessToken(null),
    });
    setOnLogout(() => {
      handleUnauthenticated();
    });
    if (typeof BroadcastChannel !== "undefined") {
      broadcastChannelRef.current = new BroadcastChannel("auth");
      broadcastChannelRef.current.onmessage = (event) => {
        if (event.data?.type === "logout") {
          handleUnauthenticated();
        }
      };
    }
    return () => {
      broadcastChannelRef.current?.close();
      broadcastChannelRef.current = null;
      clearProactiveTimer();
    };
  }, [setAccessToken, handleUnauthenticated, clearProactiveTimer]);

  // Initial hydration: cheap-check the readable CSRF cookie. If absent, the
  // user has no session — skip the network call entirely. If present, attempt
  // /refresh + /me. Synchronous setState here is intentional: we are reading
  // a client-only value (document.cookie) on first mount and reflecting it
  // into state. There is no derivable equivalent during render in SSR.
  useEffect(() => {
    const hasSessionHint = Boolean(readCookie(CSRF_COOKIE_NAME));
    if (!hasSessionHint) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("unauthenticated");
      return;
    }
    // A session almost certainly exists: surface the cached display name so
    // chrome can render the authenticated corner optimistically while the
    // round-trip below confirms it.
    setOptimisticUser(
      readCachedDisplayName() ?? { firstName: "", lastName: "" },
    );
    setStatus("loading");
    let cancelled = false;
    (async () => {
      try {
        await refreshSession();
        const me = await getCurrentUser();
        if (cancelled) return;
        setUser(me);
        setStatus("authenticated");
        setError(null);
      } catch {
        if (cancelled) return;
        handleUnauthenticated();
      } finally {
        if (!cancelled) setOptimisticUser(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handleUnauthenticated]);

  // Keep the optimistic-chrome cache in sync with the live identity so the
  // next refresh renders the correct initials before /me resolves.
  useEffect(() => {
    if (user) {
      writeCachedDisplayName(user);
    }
  }, [user]);

  // Single internal session-establishment path shared by login(), register()
  // and completeAccountLink(): store the access token (which schedules proactive
  // refresh), resolve the user, flip status to authenticated, and broadcast the
  // login to other tabs. Keeping this in one place guarantees identical
  // post-auth state across every entry point.
  const adoptSession = useCallback(
    async (response: AuthResponse) => {
      setAccessToken(response.accessToken);
      const me = await getCurrentUser().catch(() => response.user);
      setUser(me);
      setStatus("authenticated");
      broadcastChannelRef.current?.postMessage({ type: "login" });
    },
    [setAccessToken],
  );

  const login = useCallback(
    async (dto: LoginDTO) => {
      setError(null);
      setStatus("loading");
      try {
        const response = await loginCustomer(dto);
        await adoptSession(response);
      } catch (e) {
        const message =
          e instanceof ApiError ? e.message : "Unable to sign in";
        setError(message);
        setStatus("unauthenticated");
        throw e;
      }
    },
    [adoptSession],
  );

  const register = useCallback(
    async (dto: RegisterDTO) => {
      setError(null);
      setStatus("loading");
      try {
        const response = await registerCustomer(dto);
        await adoptSession(response);
      } catch (e) {
        const message =
          e instanceof ApiError ? e.message : "Unable to register";
        setError(message);
        setStatus("unauthenticated");
        throw e;
      }
    },
    [adoptSession],
  );

  // Completes the emailed account-link flow (token + password) and adopts the
  // returned session. Unlike login(), status is NOT flipped around the call:
  // the page owns its own pending/error UI and a wrong password must not kick
  // the whole app into a transient loading/unauthenticated churn. Re-throws so
  // the page can branch on status 401 / code `google_login_required`.
  const completeAccountLink = useCallback(
    async (token: string, password: string) => {
      setError(null);
      try {
        const response = await completeAccountLinkApi(token, password);
        await adoptSession(response);
      } catch (e) {
        if (e instanceof ApiError) {
          setError(e.message);
        }
        throw e;
      }
    },
    [adoptSession],
  );

  // Google sign-in / register: exchanges the OAuth authorization code from
  // /auth/callback (paired with the exact redirectUri that obtained it). On a
  // 200 we adopt the session like login(); on any error (notably the 409
  // collisions) we reset status and RE-THROW the original ApiError so the UI
  // can branch on the code without it being swallowed into a generic message.
  const googleSignIn = useCallback(
    async (code: string, intent: GoogleAuthIntent) => {
      setError(null);
      setStatus("loading");
      try {
        const response = await googleAuthApi(
          code,
          googleOAuthRedirectUri(),
          intent,
        );
        await adoptSession(response);
      } catch (e) {
        setStatus("unauthenticated");
        if (e instanceof ApiError) {
          setError(e.message);
        }
        throw e;
      }
    },
    [adoptSession],
  );

  // Completes confirm-enable-marketplace: exchanges the tx_id from the
  // `confirm_enable_marketplace` 409 for tokens (the Google sign-in moments
  // ago already proved ownership) and establishes the session (auto-login).
  const confirmMarketplaceAccess = useCallback(
    async (txId: string) => {
      setError(null);
      setStatus("loading");
      try {
        const response = await confirmMarketplaceAccessApi(txId);
        await adoptSession(response);
      } catch (e) {
        const message =
          e instanceof ApiError
            ? e.message
            : "Unable to enable marketplace access";
        setError(message);
        setStatus("unauthenticated");
        throw e;
      }
    },
    [adoptSession],
  );

  // Completes verify-then-link: the proof-producing re-auth call is made by the
  // UI; here we exchange tx_id + proof for tokens and establish the session via
  // the shared adoptSession path (auto-login).
  const linkGoogleAccount = useCallback(
    async (txId: string, proof: string) => {
      setError(null);
      setStatus("loading");
      try {
        const response = await linkGoogleApi(txId, proof);
        await adoptSession(response);
      } catch (e) {
        const message =
          e instanceof ApiError ? e.message : "Unable to link Google account";
        setError(message);
        setStatus("unauthenticated");
        throw e;
      }
    },
    [adoptSession],
  );

  // Link (connect) a Google account to the ALREADY-authenticated account using
  // the OAuth code from /auth/callback. The backend returns NEW session
  // tokens, so we adopt them via the shared adoptSession path (identical to
  // googleSignIn). adoptSession re-fetches /me, so `user` ends up carrying the
  // fresh googleSub. We re-THROW the ApiError so the UI can map the collision
  // codes (e.g. E45) instead of swallowing them.
  const linkGoogle = useCallback(
    async (code: string) => {
      try {
        const response = await linkGoogleWebApi(code, googleOAuthRedirectUri());
        await adoptSession(response);
      } catch (e) {
        if (e instanceof ApiError) {
          setError(e.message);
        }
        throw e;
      }
    },
    [adoptSession],
  );

  // Unlink (disconnect) Google. Keeps the CURRENT session (no token change) and
  // just clears googleSub in-memory, mirroring the native app's
  // setUser({...user, googleSub: null}). Re-throws so the UI can map codes.
  const unlinkGoogle = useCallback(async (password: string) => {
    try {
      await unlinkGoogleApi(password);
      setUser((prev) => (prev ? { ...prev, googleSub: null } : prev));
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      }
      throw e;
    }
  }, []);

  // Change email. Keeps the CURRENT session; reflects the returned email into
  // the in-memory user and returns the result (revokedSessionCount) to the UI.
  // Re-throws so the UI can map codes (SAME_EMAIL, CURRENT_EMAIL_MISMATCH, …).
  const changeEmail = useCallback(
    async (currentEmail: string, newEmail: string) => {
      try {
        const result = await changeEmailApi(currentEmail, newEmail);
        setUser((prev) => (prev ? { ...prev, email: result.email } : prev));
        return result;
      } catch (e) {
        if (e instanceof ApiError) {
          setError(e.message);
        }
        throw e;
      }
    },
    [],
  );

  // Re-fetch /me and reflect it into `user` WITHOUT touching status/tokens.
  // Used by the account page so googleSub/hasPassword are authoritative even if
  // the login response that established this session omitted them.
  const refreshUser = useCallback(async () => {
    const me = await getCurrentUser();
    setUser(me);
  }, []);

  // Fire-and-collect: requests an email link. Does NOT touch session state, so
  // we deliberately do not flip status here. Returns the backend message.
  const sendAccountLink = useCallback(
    async (email: string, locale?: "en" | "ro") => {
      const result = await sendAccountLinkApi(email, locale);
      return result.message;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutCustomer();
    } catch {
      // best-effort; we still clear local state below
    }
    handleUnauthenticated();
    broadcastChannelRef.current?.postMessage({ type: "logout" });
  }, [handleUnauthenticated]);

  const refresh = useCallback(async () => {
    try {
      await refreshSession();
      const me = await getCurrentUser();
      setUser(me);
      setStatus("authenticated");
    } catch {
      handleUnauthenticated();
    }
  }, [handleUnauthenticated]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      initializing,
      optimisticUser,
      error,
      login,
      register,
      logout,
      refresh,
      completeAccountLink,
      sendAccountLink,
      googleSignIn,
      linkGoogleAccount,
      confirmMarketplaceAccess,
      refreshUser,
      linkGoogle,
      unlinkGoogle,
      changeEmail,
    }),
    [
      status,
      user,
      initializing,
      optimisticUser,
      error,
      login,
      register,
      logout,
      refresh,
      completeAccountLink,
      sendAccountLink,
      googleSignIn,
      linkGoogleAccount,
      confirmMarketplaceAccess,
      refreshUser,
      linkGoogle,
      unlinkGoogle,
      changeEmail,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
