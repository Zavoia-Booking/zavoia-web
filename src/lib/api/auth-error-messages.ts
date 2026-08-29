import type { Dictionary } from "@/i18n/dictionaries";
import { backendCode, transportErrorMessage } from "@/lib/api/error-messages";

type AuthErrorsDict = Dictionary["auth"]["errors"];
type ErrorsDict = Dictionary["errors"];

/**
 * Maps a backend auth message code to a friendly, localized string.
 *
 * The backend returns generic auth failures as message codes like
 * "CUSTOMER_AUTH.E38" (see parseError in http.ts, which normalizes the array
 * form and also copies a code-looking first message into ApiError.code). We map
 * only codes whose meaning is confidently known; anything unknown falls back to
 * the dictionary's `generic` message so a raw "SOMETHING.E##" code never reaches
 * the UI.
 *
 * Keys are always the FULL namespaced code — see `backendCode`.
 */
const CODE_TO_KEY: Record<string, keyof AuthErrorsDict> = {
  // Returned for BOTH a wrong password AND a Google-only account with no
  // password — intentionally generic, so the message must not distinguish them.
  "CUSTOMER_AUTH.E38": "invalidCredentials",

  // ── Register ──
  // E14: the email already has a marketplace account. The 409 body carries
  // both forms (message code E14 + top-level `email_already_registered`);
  // either one lands here.
  "CUSTOMER_AUTH.E14": "emailAlreadyRegistered",
  EMAIL_ALREADY_REGISTERED: "emailAlreadyRegistered",

  // ── Google link/unlink (account settings) ──
  // E45: the linked Google account's email doesn't match the account email.
  "CUSTOMER_AUTH.E45": "googleEmailMismatch",
  // E46: attempted to unlink but no Google account is linked.
  "CUSTOMER_AUTH.E46": "googleNotLinked",
  // E47: can't unlink — no password set / Google is the only auth method.
  "CUSTOMER_AUTH.E47": "googleUnlinkNoPassword",
  // E48: wrong account password supplied when unlinking.
  "CUSTOMER_AUTH.E48": "incorrectPassword",

  // ── Token validation (password reset & other emailed links) ──
  // Thrown by the backend's TokenService.validateToken: E06 = token not
  // found (invalid), E07 = already used, E08 = expired. Worded generically
  // ("this link") since the same codes cover every emailed-token flow.
  "SYSTEM.E06": "resetLinkInvalid",
  "SYSTEM.E07": "resetLinkInvalid",
  "SYSTEM.E08": "resetLinkExpired",

  // ── Change email ──
  // The backend surfaces these as a top-level `code` (not the CUSTOMER_AUTH.E##
  // form), which parseError copies onto ApiError.code as well.
  EMAIL_TAKEN: "emailTaken",
  CURRENT_EMAIL_MISMATCH: "currentEmailMismatch",
  SAME_EMAIL: "sameEmail",
  // 404 from email-change.service.ts — the account behind this session no
  // longer exists, so re-entering the password can never help.
  USER_NOT_FOUND: "userNotFound",
};

/**
 * The message to show for a failed auth action.
 *
 * `shared` is required rather than optional on purpose: a transport failure
 * ("you're offline") must win over any domain message, and making the caller
 * pass it means no auth call site can quietly skip that check. Order is
 * transport → known code → generic.
 */
export function authErrorMessage(
  error: unknown,
  dict: AuthErrorsDict,
  shared: ErrorsDict,
): string {
  const transport = transportErrorMessage(error, shared);
  if (transport) return transport;

  const code = backendCode(error);
  if (code) {
    const key = CODE_TO_KEY[code];
    if (key) return dict[key];
  }
  return dict.generic;
}
