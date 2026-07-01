import { apiFetch, ApiError } from "@/lib/api/http";
import type {
  AccountLinkNeededDetails,
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
  VerifyAccountLinkResponse,
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
 * Confirms an account link from a 409 confirmationToken. The backend adds the
 * CUSTOMER role and issues tokens — same response shape as login/register
 * (AuthResponse), i.e. it auto-logs-in.
 */
export async function confirmAccountLink(
  confirmationToken: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/marketplace/auth/confirm-account-link", {
    method: "POST",
    body: JSON.stringify({ confirmationToken }),
  });
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
 * Verifies an account-link email token. The backend adds the CUSTOMER role and
 * returns the user, but does NOT issue tokens (no auto-login).
 */
export async function verifyAccountLink(
  token: string,
): Promise<VerifyAccountLinkResponse> {
  return apiFetch<VerifyAccountLinkResponse>(
    `/marketplace/auth/verify-account-link?token=${encodeURIComponent(token)}`,
    { method: "GET" },
  );
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
 * Native Google Sign-In / Register. Sends the Google ID token (a JWT obtained
 * from GIS) and the user's intent. On success the backend returns the same
 * AuthResponse shape as login/register (auto-login). On a collision it throws
 * an ApiError 409 — either `account_exists_unlinked_google` (CUSTOMER without a
 * linked Google) or `account_exists_needs_marketplace_access` (business user
 * without the CUSTOMER role).
 */
export async function googleAuth(
  idToken: string,
  intent: GoogleAuthIntent,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/marketplace/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken, intent }),
  });
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
 * Links (connects) a Google account to the ALREADY-AUTHENTICATED account from a
 * GIS ID token. On success the backend issues NEW session tokens — the response
 * has the same AuthResponse shape as googleSignIn and must be adopted the same
 * way. Errors: CUSTOMER_AUTH.E45 (Google email ≠ account email), E26 (missing
 * idToken), E27 (verify failed).
 */
export async function linkGoogleNative(
  idToken: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/marketplace/auth/link/google/native", {
    method: "POST",
    body: JSON.stringify({ idToken }),
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
 */
export function getAccountLinkNeededDetails(
  error: unknown,
): AccountLinkNeededDetails | null {
  if (!(error instanceof ApiError)) return null;
  if (error.status !== 409) return null;
  if (error.code !== ACCOUNT_LINK_NEEDED_CODE) return null;
  const data = error.data as { details?: AccountLinkNeededDetails } | null;
  const details = data?.details;
  if (!details || typeof details.email !== "string") return null;
  return details;
}

/**
 * Type guard that detects the HTTP 409 `account_exists_unlinked_google` error
 * and extracts the transaction id. Mirrors getAccountLinkNeededDetails: the
 * backend serializes the structured payload at `ApiError.data.details` (here
 * `{ suggestedNext, tx_id }`) and the machine code at `ApiError.code`. The
 * backend does NOT include the email — callers decode it from the ID token.
 */
export function getGoogleUnlinkedDetails(
  error: unknown,
): GoogleUnlinkedDetails | null {
  if (!(error instanceof ApiError)) return null;
  if (error.status !== 409) return null;
  if (error.code !== GOOGLE_UNLINKED_CODE) return null;
  const data = error.data as { details?: { tx_id?: unknown } } | null;
  const txId = data?.details?.tx_id;
  if (typeof txId !== "string" || txId.length === 0) return null;
  return { txId };
}
