import type { Dictionary } from "@/i18n/dictionaries";
import { ApiError } from "@/lib/api/http";

type AuthErrorsDict = Dictionary["auth"]["errors"];

/**
 * Maps a backend auth message code (as carried on ApiError.code / .message) to
 * a friendly, localized string using the provided `auth.errors` dictionary.
 *
 * The backend returns generic auth failures as message codes like
 * "CUSTOMER_AUTH.E38" (see parseError in http.ts, which normalizes the array
 * form and also copies a code-looking first message into ApiError.code). We map
 * only codes whose meaning is confidently known; anything unknown falls back to
 * the dictionary's `generic` message so a raw "SOMETHING.E##" code never reaches
 * the UI.
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
};

export function authErrorMessage(
  error: unknown,
  dict: AuthErrorsDict,
): string {
  const code = extractCode(error);
  if (code) {
    const key = CODE_TO_KEY[code.toUpperCase()];
    if (key) return dict[key];
  }
  return dict.generic;
}

/**
 * Pulls the backend code from an ApiError. Prefers `.code` (populated by
 * parseError), falling back to `.message` when it itself looks like a raw code.
 * Two code shapes are recognized: the dotted CUSTOMER_AUTH.E## form and the
 * plain UPPER_SNAKE form (e.g. change-email's EMAIL_TAKEN / SAME_EMAIL).
 */
function extractCode(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  if (error.code && isCodeShaped(error.code)) return error.code;
  if (typeof error.message === "string" && isCodeShaped(error.message))
    return error.message;
  return null;
}

function isCodeShaped(value: string): boolean {
  return BACKEND_CODE_RE.test(value) || PLAIN_CODE_RE.test(value);
}

const BACKEND_CODE_RE = /^[A-Z_]+\.[A-Z0-9]+$/i;
// Plain snake-case codes with no dot: change-email's UPPER_SNAKE codes and
// 409 conflicts' lowercase codes (e.g. `email_already_registered`). Requires
// an underscore so ordinary words/messages don't get misread as codes.
const PLAIN_CODE_RE = /^[A-Z]+(_[A-Z]+)+$/i;
