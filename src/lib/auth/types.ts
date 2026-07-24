export type AuthUser = {
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  /**
   * Google account subject id, or null when no Google account is linked. Only
   * GET /marketplace/auth/me guarantees this field, so it is optional — derive
   * `isGoogleLinked = !!googleSub` and treat `undefined` as "unknown yet".
   */
  googleSub?: string | null;
  /**
   * Whether the account has a password set. Only GET /marketplace/auth/me
   * guarantees this field; `undefined` means "unknown yet".
   */
  hasPassword?: boolean;
};

/**
 * Response of POST /marketplace/auth/change-email. The change is immediate; the
 * CURRENT session stays valid while OTHER sessions are revoked
 * (`revokedSessionCount`).
 */
export type ChangeEmailResponse = {
  success: boolean;
  email: string;
  revokedSessionCount: number;
};

export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

/**
 * Best-effort identity used to render optimistic chrome (header avatar
 * initials) while the initial session check is in flight. Cached display name
 * from the previous session; empty strings when the cache is cold.
 */
export type OptimisticUser = Pick<AuthUser, "firstName" | "lastName">;

export type RegisterDTO = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  /**
   * UI language at registration time — persisted on the User row so ALL future
   * transactional emails (verification, reset, …) are sent in it. The backend
   * falls back to the x-locale header apiFetch sends, but the explicit field
   * keeps the persisted preference independent of transport concerns.
   */
  locale?: "en" | "ro";
};

export type LoginDTO = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  csrfToken: string;
  message?: string;
  /** Present on Google auth: true when a brand-new account was created. */
  isNewUser?: boolean;
};

/** Intent passed to the web Google auth endpoint. */
export type GoogleAuthIntent = "login" | "register";

export type RefreshResponse = {
  accessToken: string;
  csrfToken: string;
};

/**
 * Details carried in the `data.details` of the HTTP 409
 * `account_exists_needs_marketplace_access` ApiError. Returned by the backend
 * when an email already belongs to a business OWNER/TEAM_MEMBER that does not
 * yet have a CUSTOMER (marketplace) role. Two variants, keyed by
 * `suggestedNext`:
 *
 * - `enable_marketplace_access` — identity NOT yet proven for this account;
 *   access is enabled only through the emailed link plus a password (or
 *   Google) confirmation. No instant token.
 * - `confirm_enable_marketplace` — the Google sign-in matched the account's
 *   LINKED Google identity, so ownership is already proven; the user just has
 *   to explicitly opt in. Carries `txId` (single-use, ~10 min TTL) consumed
 *   by POST /marketplace/auth/google/web/confirm-access.
 *
 * The name/role fields are present only on paths where the backend has
 * already verified identity (login, Google); register proves nothing, so
 * there they are omitted.
 */
export type AccountLinkNeededDetails = {
  suggestedNext: "enable_marketplace_access" | "confirm_enable_marketplace";
  /** Only on `confirm_enable_marketplace`: tx for the confirm endpoint. */
  txId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  existingRoles?: {
    owner: boolean;
    teamMember: boolean;
  };
};

/**
 * Response of GET /marketplace/auth/verify-account-link/validate. Pre-flight
 * for the emailed-link landing page: says nothing has been consumed yet and
 * tells the page how the user can confirm account ownership — password, or
 * Google for passwordless accounts.
 */
export type AccountLinkValidation = {
  email: string;
  hasPassword: boolean;
  googleLinked: boolean;
};

export type SendAccountLinkResponse = {
  message: string;
};

/**
 * Response of GET /marketplace/auth/verify-email. The backend marks the email
 * verified and returns the user, but does NOT issue tokens (no auto-login) — so
 * there is no session to adopt; the user signs in afterwards.
 *
 * NOTE: the backend currently spells the success flag `suceess` (a typo in
 * customer-auth.service.ts:368). We mirror it as an optional field so the type
 * is accurate, but the UI relies on the HTTP success (no throw) rather than
 * this flag.
 */
export type VerifyEmailResponse = {
  message: string;
  /** Backend typo for `success`; present on the real payload. */
  suceess?: boolean;
  user: AuthUser & { emailVerified: boolean };
};

/**
 * Response of POST /marketplace/auth/forgot-password. The backend always
 * returns the same neutral message regardless of whether the email exists, to
 * avoid account enumeration.
 */
export type ForgotPasswordResponse = {
  message: string;
};

/**
 * Response of POST /marketplace/auth/reset-password?token=... (token in the
 * query string, new password in the body). Does NOT establish a session.
 */
export type ResetPasswordResponse = {
  message: string;
};

/**
 * Details carried in the `data.details` of the HTTP 409
 * `account_exists_unlinked_google` ApiError. Returned by POST
 * /marketplace/auth/google/web when an email already belongs to a CUSTOMER
 * whose Google account is NOT yet linked.
 */
export type GoogleUnlinkedDetails = {
  /** Transaction id that ties the re-auth + link steps to this attempt. */
  txId: string;
  /** Account email, needed for the re-auth step. Optional for safety. */
  email?: string;
};

/**
 * Response of POST /marketplace/auth/link/google/re-auth. The `proof` is a
 * short-lived (~10 min) token consumed by POST /marketplace/auth/link/google.
 */
export type ReauthForGoogleLinkResponse = {
  proof: string;
};

export type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  /**
   * True until the initial session check settles: covers both the
   * pre-hydration frame ("idle") and the hinted /refresh + /me round-trip.
   * Chrome (header, mobile tabs) renders a neutral or optimistic account
   * corner while this is true instead of flashing the logged-out UI.
   * login()/register() do NOT re-enter this state.
   */
  initializing: boolean;
  /**
   * Non-null only while `initializing` AND a session hint (CSRF cookie)
   * exists: the previous session's cached display name, or empty strings when
   * the cache is cold. Never authoritative — cleared as soon as the real
   * session resolves (either way).
   */
  optimisticUser: OptimisticUser | null;
  error: string | null;
  login: (dto: LoginDTO) => Promise<void>;
  register: (dto: RegisterDTO) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  /**
   * Complete the emailed account-link flow: exchanges the emailed token plus
   * the account password for tokens and establishes the session (auto-login).
   * Re-throws the ApiError on failure (wrong password, expired token,
   * `google_login_required`) so the page can branch on status/code.
   */
  completeAccountLink: (token: string, password: string) => Promise<void>;
  /**
   * Request an email link to enable marketplace access. Does not change the
   * session. Returns the backend confirmation message.
   */
  sendAccountLink: (
    email: string,
    locale?: "en" | "ro",
  ) => Promise<string>;
  /**
   * Sign in / register with the Google OAuth authorization code returned to
   * /auth/callback. On a 200 it establishes the session (identical post-state
   * to login). On a 409 it re-THROWS the ApiError so the UI can branch on the
   * collision code (`account_exists_unlinked_google` or
   * `account_exists_needs_marketplace_access`).
   */
  googleSignIn: (code: string, intent: GoogleAuthIntent) => Promise<void>;
  /**
   * Complete the verify-then-link flow: exchanges a tx_id + re-auth proof for
   * tokens and establishes the session (auto-login).
   */
  linkGoogleAccount: (txId: string, proof: string) => Promise<void>;
  /**
   * Complete the confirm-enable-marketplace flow: exchanges the tx_id from
   * the `confirm_enable_marketplace` 409 for tokens, granting the CUSTOMER
   * role to the Google-linked business account (auto-login). Re-throws the
   * ApiError on failure (expired/consumed tx) so the UI can offer a retry.
   */
  confirmMarketplaceAccess: (txId: string) => Promise<void>;
  /**
   * Re-fetch GET /marketplace/auth/me and reflect it into `user`. Needed so the
   * account page has authoritative `googleSub` / `hasPassword` even when the
   * login response that established this session omitted them.
   */
  refreshUser: () => Promise<void>;
  /**
   * Link (connect) a Google account to the authenticated account using the
   * OAuth authorization code returned to /auth/callback. Adopts the NEW
   * session tokens the backend returns (exactly like googleSignIn) and
   * reflects the updated user (now carrying `googleSub`). Re-throws the
   * ApiError on failure so callers can map codes.
   */
  linkGoogle: (code: string) => Promise<void>;
  /**
   * Unlink (disconnect) the linked Google account. Requires the account
   * password. Keeps the current session and clears `googleSub` in-memory.
   * Re-throws the ApiError on failure so callers can map codes.
   */
  unlinkGoogle: (password: string) => Promise<void>;
  /**
   * Change the account email. Immediate; keeps the CURRENT session while the
   * backend revokes OTHER sessions. Updates `user.email` in-memory and returns
   * the result so the UI can surface `revokedSessionCount`. Re-throws the
   * ApiError on failure so callers can map codes.
   */
  changeEmail: (
    currentEmail: string,
    newEmail: string,
  ) => Promise<ChangeEmailResponse>;
};
