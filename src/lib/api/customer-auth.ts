import { apiFetch, ApiError } from "@/lib/api/http";
import type {
  AccountLinkNeededDetails,
  AccountLinkValidation,
  AuthResponse,
  AuthUser,
  ChangeEmailResponse,
  ForgotPasswordResponse,
  GoogleAuthIntent,
  GoogleUnlinkedDetails,
  LoginDTO,
  RegisterDTO,
  ReauthForGoogleLinkResponse,
  ResetPasswordResponse,
  SendAccountLinkResponse,
  VerifyEmailResponse,
} from "@/lib/auth/types";

export { refreshSession } from "@/lib/api/http";

export const ACCOUNT_LINK_NEEDED_CODE = "account_exists_needs_marketplace_access";
export const GOOGLE_UNLINKED_CODE = "account_exists_unlinked_google";

export async function registerCustomer(
  dto: RegisterDTO,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/marketplace/auth/register", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function loginCustomer(dto: LoginDTO): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/marketplace/auth/login", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function logoutCustomer(): Promise<void> {
  try {
    await apiFetch<{ message?: string }>("/marketplace/auth/logout", {
      method: "POST",
      body: JSON.stringify({}),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      // expired token — server can’t verify but we still want to clear local state
      return;
    }
    throw error;
  }
}

export async function getCurrentUser(): Promise<AuthUser> {
  const data = await apiFetch<{ user: AuthUser }>("/marketplace/auth/me", {
    method: "GET",
  });
  return data.user;
}

/**
 * Requests an email link that lets an existing business user enable marketplace
 * access. The backend always responds with a neutral confirmation message to
 * avoid leaking account existence.
 */
export async function sendAccountLink(
  email: string,
  locale?: "en" | "ro",
): Promise<SendAccountLinkResponse> {
  return apiFetch<SendAccountLinkResponse>(
    "/marketplace/auth/send-account-link",
    {
      method: "POST",
      body: JSON.stringify(locale ? { email, locale } : { email }),
    },
  );
}

/**
 * Pre-flight for the emailed-link landing page: validates the token WITHOUT
 * consuming it and returns how the user can confirm account ownership —
 * password, or Google for passwordless accounts. Throws SYSTEM.E06-08 when the
 * token is invalid/used/expired and CUSTOMER_AUTH.E10 when the account already
 * has marketplace access.
 */
export async function validateAccountLink(
  token: string,
): Promise<AccountLinkValidation> {
  return apiFetch<AccountLinkValidation>(
    `/marketplace/auth/verify-account-link/validate?token=${encodeURIComponent(token)}`,
    { method: "GET" },
  );
}

/**
 * Completes the emailed account-link flow: the token proves the email was
 * received, the password proves account ownership. The backend adds the
 * CUSTOMER role and issues tokens (AuthResponse — auto-login). Errors: 401
 * CUSTOMER_AUTH.E38 (wrong password), 400 `google_login_required`
 * (passwordless Google-only account), SYSTEM.E06-08 (bad token).
 */
export async function completeAccountLink(
  token: string,
  password: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/marketplace/auth/verify-account-link", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

/**
 * Verifies an email-verification token (sent in the registration email). The
 * backend marks the email verified and returns the user, but does NOT issue
 * tokens (no auto-login). Token goes in the query string.
 */
export async function verifyEmail(
  token: string,
): Promise<VerifyEmailResponse> {
  return apiFetch<VerifyEmailResponse>(
    `/marketplace/auth/verify-email?token=${encodeURIComponent(token)}`,
    { method: "GET" },
  );
}

/**
 * Requests a password-reset email. The backend always responds with the same
 * neutral message regardless of whether the email exists, to avoid account
 * enumeration — callers must surface that single neutral message.
 */
export async function forgotPassword(
  email: string,
  locale?: "en" | "ro",
): Promise<ForgotPasswordResponse> {
  return apiFetch<ForgotPasswordResponse>(
    "/marketplace/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify(locale ? { email, locale } : { email }),
    },
  );
}

/**
 * Resets the password using a reset token. The token goes in the QUERY string
 * and the new password in the body (matches customer-auth.controller.ts
 * `resetPassword`: `@Body() ResetPasswordDTO { password }` + `@Query('token')`).
 * Does NOT establish a session.
 */
export async function resetPassword(
  token: string,
  password: string,
): Promise<ResetPasswordResponse> {
  return apiFetch<ResetPasswordResponse>(
    `/marketplace/auth/reset-password?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      body: JSON.stringify({ password }),
    },
  );
}

/**
 * Web Google Sign-In / Register (authorization code flow). Sends the ?code=
 * that Google returned to /auth/callback plus the EXACT redirectUri that
 * obtained it; the backend exchanges and verifies it server-side. On success
 * the backend returns the same AuthResponse shape as login/register
 * (auto-login). On a collision it throws an ApiError 409 — either
 * `account_exists_unlinked_google` (CUSTOMER without a linked Google) or
 * `account_exists_needs_marketplace_access` (business user without the
 * CUSTOMER role). The Google-issued code is single-use and expires in
 * minutes, so a retry needs a fresh round-trip through Google.
 */
export async function googleAuth(
  code: string,
  redirectUri: string,
  intent: GoogleAuthIntent,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/marketplace/auth/google/web", {
    method: "POST",
    body: JSON.stringify({ code, redirectUri, intent }),
  });
}

/**
 * Step 2 of confirm-enable-marketplace: exchanges the `tx_id` from the 409
 * `confirm_enable_marketplace` variant for tokens, granting the CUSTOMER role
 * to the Google-linked business account (auto-login). The tx is single-use
 * with a ~10 min TTL — on CUSTOMER_AUTH.E49 the user must sign in with Google
 * again.
 */
export async function confirmMarketplaceAccess(
  txId: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>(
    "/marketplace/auth/google/web/confirm-access",
    {
      method: "POST",
      body: JSON.stringify({ tx_id: txId }),
    },
  );
}

/**
 * Step 1 of verify-then-link: verifies the user owns the existing email account
 * by password and returns a short-lived `proof` token to complete linking.
 */
export async function reauthForGoogleLink(
  email: string,
  password: string,
): Promise<ReauthForGoogleLinkResponse> {
  return apiFetch<ReauthForGoogleLinkResponse>(
    "/marketplace/auth/link/google/re-auth",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
  );
}

/**
 * Step 2 of verify-then-link: exchanges the 409 `tx_id` plus the `proof` from
 * re-auth for tokens. Returns the AuthResponse shape (auto-login).
 *
 * The backend body field is snake_case `tx_id` (see customer-auth.controller.ts
 * `completeGoogleLink`), so we map our camelCase `txId` here.
 */
export async function linkGoogle(
  txId: string,
  proof: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/marketplace/auth/link/google", {
    method: "POST",
    body: JSON.stringify({ tx_id: txId, proof }),
  });
}

/**
 * Links (connects) a Google account to the ALREADY-AUTHENTICATED account using
 * the authorization code from /auth/callback (web twin of the mobile app's
 * /link/google/native). On success the backend issues NEW session tokens — the
 * response has the same AuthResponse shape as googleSignIn and must be adopted
 * the same way. Errors: CUSTOMER_AUTH.E45 (Google email ≠ account email), E26
 * (missing code/redirectUri), E27 (exchange/verify failed).
 */
export async function linkGoogleWeb(
  code: string,
  redirectUri: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/marketplace/auth/link/google/web", {
    method: "POST",
    body: JSON.stringify({ code, redirectUri }),
  });
}

/**
 * Unlinks (disconnects) the linked Google account. Requires the account
 * password. Keeps the current session (no tokens returned). Errors:
 * CUSTOMER_AUTH.E28 (no password provided), E46 (Google not linked), E47
 * (cannot unlink — no password set / only auth method), E48 (incorrect
 * password).
 */
export async function unlinkGoogle(
  password: string,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/marketplace/auth/unlink/google", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

/**
 * Changes the account email. Immediate: the CURRENT session stays valid while
 * OTHER sessions are revoked (`revokedSessionCount`). Errors carry a top-level
 * `code`: "SAME_EMAIL" (400), "CURRENT_EMAIL_MISMATCH" (400), "EMAIL_TAKEN"
 * (409), "USER_NOT_FOUND" (404).
 */
export async function changeEmail(
  currentEmail: string,
  newEmail: string,
): Promise<ChangeEmailResponse> {
  return apiFetch<ChangeEmailResponse>("/marketplace/auth/change-email", {
    method: "POST",
    body: JSON.stringify({ currentEmail, newEmail }),
  });
}

/**
 * Type guard that detects the HTTP 409
 * `account_exists_needs_marketplace_access` error and extracts its `details`.
 * The backend's exception filter serializes the body as
 * `{ statusCode, code, details, ... }`, so the structured payload lives at
 * `ApiError.data.details` while the machine code lives at `ApiError.code`.
 * The backend's snake_case `tx_id` (present on the `confirm_enable_marketplace`
 * variant) is normalized to camelCase `txId`.
 */
export function getAccountLinkNeededDetails(
  error: unknown,
): AccountLinkNeededDetails | null {
  if (!(error instanceof ApiError)) return null;
  if (error.status !== 409) return null;
  if (error.code !== ACCOUNT_LINK_NEEDED_CODE) return null;
  const data = error.data as {
    details?: AccountLinkNeededDetails & { tx_id?: unknown };
  } | null;
  const details = data?.details;
  if (!details || typeof details.email !== "string") return null;
  const txId = typeof details.tx_id === "string" ? details.tx_id : undefined;
  return { ...details, txId };
}

/**
 * Type guard that detects the HTTP 409 `account_exists_unlinked_google` error
 * and extracts the transaction id + email. Mirrors getAccountLinkNeededDetails:
 * the backend serializes the structured payload at `ApiError.data.details`
 * (here `{ suggestedNext, tx_id, email }`) and the machine code at
 * `ApiError.code`. The web endpoint includes the email (the browser never sees
 * an ID token to decode it from); treat it as optional for safety.
 */
export function getGoogleUnlinkedDetails(
  error: unknown,
): GoogleUnlinkedDetails | null {
  if (!(error instanceof ApiError)) return null;
  if (error.status !== 409) return null;
  if (error.code !== GOOGLE_UNLINKED_CODE) return null;
  const data = error.data as {
    details?: { tx_id?: unknown; email?: unknown };
  } | null;
  const txId = data?.details?.tx_id;
  if (typeof txId !== "string" || txId.length === 0) return null;
  const email = data?.details?.email;
  return { txId, email: typeof email === "string" ? email : undefined };
}
