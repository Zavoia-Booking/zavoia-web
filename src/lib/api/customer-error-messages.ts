import type { Dictionary } from "@/i18n/dictionaries";
import {
  backendCode,
  mapBackendCode,
  transportErrorMessage,
} from "@/lib/api/error-messages";

type CustomerErrorsDict = Dictionary["errors"]["customer"];
type ErrorsDict = Dictionary["errors"];

/**
 * Maps the `/marketplace/customer/*` message codes to localized copy.
 *
 * These endpoints used to throw plain English strings with no `code` field —
 * `CustomException.badRequest('Current password is incorrect')` — which meant
 * `backendCode()` had nothing to match and every domain failure across
 * profile, password, favorites and reviews collapsed into one generic
 * message. The backend now sends codes; this is the other half of that.
 *
 * Keys are FULL namespaced codes, per `backendCode`.
 */
const CODE_TO_KEY: Record<string, keyof CustomerErrorsDict> = {
  // ── Account / profile ──
  "CUSTOMER.E02": "accountMissing",
  // E08: a Google-only account has no password, so "wrong current password"
  // would be a lie — it never had one.
  "CUSTOMER.E08": "passwordGoogleLinked",
  "CUSTOMER.E09": "incorrectPassword",

  // ── Profile image ──
  "CUSTOMER.E06": "imageTooLarge",
  "CUSTOMER.E07": "imageType",

  // ── Favorites ──
  // Business/location missing or delisted all mean the same thing to someone
  // looking at a saved card: the place is gone. E03/E07 (already a favorite)
  // and E04 (favorite not found) are deliberately NOT mapped — they mean the
  // UI already shows what the user wanted, so a red message would be noise.
  "CUSTOMER_FAVORITE.E01": "favoriteGone",
  "CUSTOMER_FAVORITE.E02": "favoriteGone",
  "CUSTOMER_FAVORITE.E05": "favoriteGone",
  "CUSTOMER_FAVORITE.E06": "favoriteGone",

  // ── Reviews ──
  "CUSTOMER_REVIEW.E02": "reviewNotCompleted",
  "CUSTOMER_REVIEW.E04": "reviewNoRating",
  "CUSTOMER_REVIEW.E05": "reviewAlreadyExists",
  "CUSTOMER_REVIEW.E06": "reviewProfessional",
};

/**
 * Codes that mean "the state you wanted is already the state that exists":
 * adding a favorite twice, removing one that is already gone. The optimistic
 * UI is showing the right thing, so these are successes wearing an error's
 * clothes — callers should stay quiet rather than surface anything.
 */
const BENIGN_CODES = new Set([
  "CUSTOMER_FAVORITE.E03",
  "CUSTOMER_FAVORITE.E04",
  "CUSTOMER_FAVORITE.E07",
]);

export function isBenignCustomerError(error: unknown): boolean {
  const code = backendCode(error);
  return code !== null && BENIGN_CODES.has(code);
}

/**
 * The message for a failed customer-area action: transport first (a request
 * that never arrived cannot have been rejected for a wrong password), then
 * the specific code, then the caller's own fallback.
 */
export function customerErrorMessage(
  error: unknown,
  dict: ErrorsDict,
  fallback?: string,
): string {
  const transport = transportErrorMessage(error, dict);
  if (transport) return transport;

  const key = mapBackendCode(error, CODE_TO_KEY);
  if (key) return dict.customer[key];

  return fallback ?? dict.generic;
}
