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

export type RegisterDTO = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
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

/** Intent passed to the native Google auth endpoint. */
export type GoogleAuthIntent = "login" | "register";

export type RefreshResponse = {
  accessToken: string;
  csrfToken: string;
};

/**
 * Details carried in the `data.details` of the HTTP 409
 * `account_exists_needs_marketplace_access` ApiError. Returned by the backend
 * when an email already belongs to a business OWNER/TEAM_MEMBER that does not
 * yet have a CUSTOMER (marketplace) role.
 */
export type AccountLinkNeededDetails = {
  suggestedNext: "enable_marketplace_access";
  email: string;
  firstName: string;
  lastName: string;
  existingRoles: {
    owner: boolean;
    teamMember: boolean;
  };
  /** In-memory token (~10 min TTL) used to confirm the link via API. */
  confirmationToken: string;
};

/**
 * Response shape of GET /marketplace/auth/verify-account-link. The backend adds
 * the CUSTOMER role and returns the user, but does NOT issue tokens — i.e. it
 * does not auto-login. The user must sign in afterwards.
 */
export type VerifyAccountLinkResponse = {
  message: string;
  user: AuthUser;
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
 * /marketplace/auth/google when an email already belongs to a CUSTOMER whose
 * Google account is NOT yet linked. The backend does NOT include the email
 * here — the UI decodes it from the Google ID token instead.
 */
export type GoogleUnlinkedDetails = {
  /** Transaction id that ties the re-auth + link steps to this attempt. */
  txId: string;
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
  error: string | null;
  login: (dto: LoginDTO) => Promise<void>;
  register: (dto: RegisterDTO) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  /**
   * Confirm an account-link from a 409 confirmationToken. Performs the API call
   * AND establishes the session, leaving the user authenticated (identical
   * post-state to a normal login).
   */
  confirmAccountLink: (confirmationToken: string) => Promise<void>;
  /**
   * Request an email link to enable marketplace access. Does not change the
   * session. Returns the backend confirmation message.
   */
  sendAccountLink: (
    email: string,
    locale?: "en" | "ro",
  ) => Promise<string>;
  /**
   * Sign in / register with a Google ID token (from GIS). On a 200 it
   * establishes the session (identical post-state to login). On a 409 it
   * re-THROWS the ApiError so the UI can branch on the collision code
   * (`account_exists_unlinked_google` or `account_exists_needs_marketplace_access`).
   */
  googleSignIn: (idToken: string, intent: GoogleAuthIntent) => Promise<void>;
  /**
   * Complete the verify-then-link flow: exchanges a tx_id + re-auth proof for
   * tokens and establishes the session (auto-login).
   */
  linkGoogleAccount: (txId: string, proof: string) => Promise<void>;
  /**
   * Re-fetch GET /marketplace/auth/me and reflect it into `user`. Needed so the
   * account page has authoritative `googleSub` / `hasPassword` even when the
   * login response that established this session omitted them.
   */
  refreshUser: () => Promise<void>;
  /**
   * Link (connect) a Google account to the authenticated account using a Google
   * ID token (from GIS). Adopts the NEW session tokens the backend returns
   * (exactly like googleSignIn) and reflects the updated user (now carrying
   * `googleSub`). Re-throws the ApiError on failure so callers can map codes.
   */
  linkGoogle: (idToken: string) => Promise<void>;
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
