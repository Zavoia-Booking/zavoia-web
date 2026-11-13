import { APPLE_REDIRECT_URI, APPLE_SERVICES_ID } from "@/lib/env";

/**
 * Sign in with Apple on the web, popup mode (docs/sign-in-with-apple-plan.md
 * in admin-api, section 6). Apple JS opens a popup on appleid.apple.com and
 * resolves `AppleID.auth.signIn()` in this page with the authorization code
 * and identity token, so no cross-site form POST ever has to reach our
 * SameSite=lax cookies. The registered Return URL (/auth/apple/callback) must
 * still match `redirectURI`, and the API checks it again on the exchange.
 *
 * POPUP BLOCKERS: `signIn()` must run synchronously inside the click handler.
 * Everything asynchronous (loading Apple JS, hashing the nonce) happens
 * BEFORE the click, in `prepareAppleAttempt()`; `startAppleSignIn()` never
 * awaits anything before calling `signIn()`.
 *
 * Nonce: the raw value (32 random bytes, hex) goes to our API; Apple gets
 * sha256-hex(raw) and embeds it in the identity token, which the API checks.
 */

const APPLE_JS_URL =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";

/** Longest name the API accepts (AppleCredentialDTO MaxLength). Longer → name step. */
const MAX_NAME_LENGTH = 100;

type AppleInitConfig = {
  clientId: string;
  scope: string;
  redirectURI: string;
  state: string;
  nonce: string;
  usePopup: boolean;
};

type AppleSignInResponse = {
  authorization?: { code?: string; id_token?: string; state?: string };
  user?: {
    email?: string;
    name?: { firstName?: string; lastName?: string };
  };
};

type AppleIdAuth = {
  init: (config: AppleInitConfig) => void;
  signIn: () => Promise<AppleSignInResponse>;
};

declare global {
  interface Window {
    AppleID?: { auth?: AppleIdAuth };
  }
}

/** Both public values are required; without them no Apple UI is rendered. */
export function isAppleSignInConfigured(): boolean {
  return Boolean(APPLE_SERVICES_ID && APPLE_REDIRECT_URI);
}

export type AppleSignInFailure = "unavailable" | "failed";

/** A client-side Apple failure (script blocked, popup error, state mismatch). */
export class AppleSignInError extends Error {
  readonly reason: AppleSignInFailure;
  constructor(reason: AppleSignInFailure) {
    super(`apple_signin_${reason}`);
    this.name = "AppleSignInError";
    this.reason = reason;
  }
}

/** What the API needs from one Apple authorization (`platform: 'web'`). */
export type AppleWebCredential = {
  authorizationCode: string;
  identityToken: string;
  /** The RAW nonce; Apple only ever saw its sha256. */
  nonce: string;
  redirectUri: string;
  firstName?: string;
  lastName?: string;
};

/** Ready-to-use inputs for exactly one attempt. Never reuse one. */
export type PreparedAppleAttempt = {
  state: string;
  rawNonce: string;
  hashedNonce: string;
};

let scriptPromise: Promise<AppleIdAuth> | null = null;

function loadAppleJs(): Promise<AppleIdAuth> {
  const ready = window.AppleID?.auth;
  if (ready) return Promise.resolve(ready);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<AppleIdAuth>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = APPLE_JS_URL;
    script.async = true;
    script.onload = () => {
      const auth = window.AppleID?.auth;
      if (auth) resolve(auth);
      else reject(new AppleSignInError("unavailable"));
    };
    script.onerror = () => reject(new AppleSignInError("unavailable"));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    // A blocked or failed load can be retried on the next attempt.
    scriptPromise = null;
    throw error;
  });
  return scriptPromise;
}

function randomHex(bytes: number): string {
  const values = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(values, (value) => value.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

/**
 * Loads Apple JS and creates a fresh state + nonce pair. Call on mount and
 * again after every attempt, so the click itself has nothing to wait for.
 */
export async function prepareAppleAttempt(): Promise<PreparedAppleAttempt> {
  if (!isAppleSignInConfigured()) throw new AppleSignInError("unavailable");
  await loadAppleJs();
  const rawNonce = randomHex(32);
  let hashedNonce: string;
  try {
    hashedNonce = await sha256Hex(rawNonce);
  } catch {
    // crypto.subtle exists only in secure contexts.
    throw new AppleSignInError("unavailable");
  }
  return { state: randomHex(16), rawNonce, hashedNonce };
}

// Closing the popup or pressing Cancel is a choice, not an error.
const CANCEL_ERRORS = new Set(["popup_closed_by_user", "user_cancelled_authorize"]);

function isCancellation(error: unknown): boolean {
  const code =
    typeof error === "string"
      ? error
      : error && typeof error === "object" && "error" in error
        ? (error as { error?: unknown }).error
        : null;
  return typeof code === "string" && CANCEL_ERRORS.has(code);
}

function cleanName(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= MAX_NAME_LENGTH ? trimmed : undefined;
}

/**
 * Opens Apple's popup. MUST be called synchronously from a click handler with
 * an attempt from `prepareAppleAttempt()`. Resolves to the credential, or to
 * null when the person closed or cancelled the popup. Rejects with
 * AppleSignInError for every other failure, including a state mismatch.
 */
export function startAppleSignIn(
  attempt: PreparedAppleAttempt,
): Promise<AppleWebCredential | null> {
  const auth = window.AppleID?.auth;
  if (!auth) return Promise.reject(new AppleSignInError("unavailable"));

  let request: Promise<AppleSignInResponse>;
  try {
    auth.init({
      clientId: APPLE_SERVICES_ID,
      scope: "name email",
      redirectURI: APPLE_REDIRECT_URI,
      state: attempt.state,
      nonce: attempt.hashedNonce,
      usePopup: true,
    });
    request = auth.signIn();
  } catch {
    return Promise.reject(new AppleSignInError("failed"));
  }

  return Promise.resolve(request).then(
    (response) => {
      const authorization = response?.authorization;
      if (
        !authorization?.code ||
        !authorization.id_token ||
        authorization.state !== attempt.state
      ) {
        throw new AppleSignInError("failed");
      }
      return {
        authorizationCode: authorization.code,
        identityToken: authorization.id_token,
        nonce: attempt.rawNonce,
        redirectUri: APPLE_REDIRECT_URI,
        firstName: cleanName(response.user?.name?.firstName),
        lastName: cleanName(response.user?.name?.lastName),
      };
    },
    (error: unknown) => {
      if (isCancellation(error)) return null;
      throw new AppleSignInError("failed");
    },
  );
}
