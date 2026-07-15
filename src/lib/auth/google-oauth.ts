import { isLocale, type Locale } from "@/i18n/locales";
import { GOOGLE_CLIENT_ID } from "@/lib/env";

/**
 * Google OAuth authorization-code redirect flow (same mechanism as the
 * admin-dashboard). The button navigates the page to Google's OAuth screen;
 * Google redirects back to the locale-less /auth/callback route with ?code=,
 * and the callback page posts the code to the backend, which exchanges it
 * server-side (the client secret never reaches the browser).
 *
 * The flow context (intent/locale/post-auth redirect) rides in sessionStorage —
 * a full-page redirect stays in the same tab, so it survives the round trip.
 * The random `state` is round-tripped through Google and must match on return
 * (CSRF guard + stale-reload detection).
 */

export type GoogleOAuthIntent = "login" | "register" | "link";

export type GoogleOAuthContext = {
  state: string;
  intent: GoogleOAuthIntent;
  locale: Locale;
  /** In-app post-auth target; re-validated by the callback page. */
  redirect: string | null;
};

const STORAGE_KEY = "googleOAuth";
const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

/**
 * Canonical redirect URI as registered in Google Cloud Console under
 * "Authorized redirect URIs" — always locale-less (the proxy rewrites it into
 * the default-locale route). The token exchange must send the EXACT same
 * value, so both the redirect and the API call derive it from this helper.
 */
export function googleOAuthRedirectUri(): string {
  return `${window.location.origin}/auth/callback`;
}

/**
 * Stashes the flow context and navigates to Google's OAuth screen. Call from
 * a click handler. `prompt=select_account` forces the account picker so a
 * user with one Google session isn't silently signed in with the wrong
 * account.
 */
export function beginGoogleOAuth(options: {
  intent: GoogleOAuthIntent;
  locale: Locale;
  redirect?: string | null;
}): void {
  const state = crypto.randomUUID();
  const context: GoogleOAuthContext = {
    state,
    intent: options.intent,
    locale: options.locale,
    redirect: options.redirect ?? null,
  };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  } catch {
    // Storage unavailable — the callback will reject on state mismatch and
    // show its "try again" screen instead of half-working.
  }
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: googleOAuthRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    state,
  });
  window.location.assign(`${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`);
}

/**
 * Reads AND clears the stored flow context, validating it against the
 * round-tripped `state`. Returns null when absent or mismatched (stale
 * reload of the callback URL, storage cleared, forged state).
 */
export function consumeGoogleOAuthContext(
  state: string | null,
): GoogleOAuthContext | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw || !state) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<GoogleOAuthContext>;
    if (parsed.state !== state) return null;
    if (
      parsed.intent !== "login" &&
      parsed.intent !== "register" &&
      parsed.intent !== "link"
    ) {
      return null;
    }
    if (!isLocale(parsed.locale ?? "")) return null;
    return {
      state: parsed.state,
      intent: parsed.intent,
      locale: parsed.locale as Locale,
      redirect: typeof parsed.redirect === "string" ? parsed.redirect : null,
    };
  } catch {
    return null;
  }
}
