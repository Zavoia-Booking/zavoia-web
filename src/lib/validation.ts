/**
 * The single mirror of admin-api's `src/constants/validation.ts` and its
 * name/phone decorators.
 *
 * These rules were previously copy-pasted into three separate components, each
 * with a "mirrors admin-api" comment — and they had already drifted: the
 * account password form checked only the length, the register form allowed
 * names up to 50 characters where the backend caps at 32, and its phone check
 * accepted formatting the backend rejects. Every drift produces the same bad
 * outcome: the client accepts input, the backend 400s, and the user gets a
 * generic failure that names nothing.
 *
 * Anything added here must correspond to a real backend rule. When the backend
 * changes, this file is the one place to follow it.
 */

/** admin-api: `@MinLength(8)` on every password DTO. */
export const PASSWORD_MIN_LENGTH = 8;

/**
 * admin-api `PASSWORD_REGEX` (validation.ts:21), plus the length check the
 * DTOs apply alongside it. Any non-alphanumeric counts as the special
 * character, so `#` or `-` work — not just `@$!%*?&`.
 */
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

/** admin-api `TrimmedName` decorator: `@MinLength(2)` / `@MaxLength(32)`. */
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 32;

/**
 * admin-api `PHONE_REGEX` (validation.ts:10) — digits only, no formatting:
 * an international number without a leading zero, or a national one with it.
 */
export const PHONE_REGEX = /^\+?[1-9]\d{7,14}$|^0\d{8,14}$/;

/**
 * Strips what a name may not contain, as the user types.
 *
 * Deliberately `\p{L}` with the `u` flag rather than the `A-Za-zÀ-ÿ` range it
 * replaces: that range stops at U+00FF, which excludes ă (U+0103), ș (U+0219)
 * and ț (U+021B) — so on a Romanian-first product it silently ate the
 * diacritics out of Romanian names as they were typed ("Ștefan" became
 * "tefan", "Mihăiță" became "Mihi"). The backend's PERSON_NAME_PATTERN accepts
 * any Unicode letter; this now matches it, including the curly apostrophe.
 */
export const sanitizeName = (value: string): string =>
  value.replace(/[^\p{L}\s'’-]/gu, "");

/**
 * Drops the spaces, hyphens and parentheses people naturally type into a phone
 * number. The backend accepts none of them, so the choice is to normalize here
 * or to reject input that is perfectly understandable — normalizing is the
 * kinder half of that trade, and what gets sent is what the backend accepts.
 */
export const normalizePhone = (value: string): string =>
  value.replace(/[\s\-()]/g, "");

/** Validates a phone the way the backend will, after normalizing formatting. */
export const isValidPhone = (value: string): boolean =>
  PHONE_REGEX.test(normalizePhone(value));
