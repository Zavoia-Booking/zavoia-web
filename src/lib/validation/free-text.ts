/** Plain-text content policy, mirrored by admin-api's IsPlainText validator.
 * This rejects markup; it does not replace output escaping or parameterized queries.
 * Keep ordinary punctuation, Romanian diacritics, tabs and line breaks intact.
 */
export const SUPPORT_MESSAGE_MAX_LENGTH = 9500;
export const REVIEW_COMMENT_MAX_LENGTH = 2000;

const TAG_START = /<\s*(?:\/\s*)?[a-z]/i;
const MARKUP = /<\s*(?:\/\s*)?(?:script|iframe)\b|<!--|<!doctype\b|\b(?:javascript|vbscript)\s*:|\bon[a-z]+\s*=/i;
// Tab, LF and CR are valid in multiline text. Other ASCII controls are not.
const UNSUPPORTED_CONTROLS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export type PlainTextError = "required" | "tooLong" | "unsafe";
type PlainTextCopy = Record<PlainTextError, string>;

export function validatePlainText(
  value: string,
  { required = false, maxLength }: { required?: boolean; maxLength: number },
): PlainTextError | null {
  // Search once for an opening tag and once for its closing delimiter. A single
  // regex with [^>]* would rescan each unfinished tag in a long pasted value.
  const tag = TAG_START.exec(value);
  const hasTag = tag !== null && value.indexOf(">", tag.index + tag[0].length) !== -1;
  if (hasTag || MARKUP.test(value) || UNSUPPORTED_CONTROLS.test(value)) return "unsafe";
  if (required && !value.trim()) return "required";
  if (value.length > maxLength) return "tooLong";
  return null;
}

export function plainTextErrorMessage(
  reason: PlainTextError | null,
  copy: PlainTextCopy,
  maxLength: number,
  locale = "en",
): string | null {
  if (!reason) return null;
  return copy[reason].replace("{max}", new Intl.NumberFormat(locale).format(maxLength));
}

/** Nest's DTO errors arrive in message[], including prefixes for nested fields. */
export function getPlainTextApiError(error: unknown): PlainTextError | null {
  if (!error || typeof error !== "object") return null;
  const candidate = error as { code?: unknown; message?: unknown; data?: unknown };
  const data = candidate.data && typeof candidate.data === "object"
    ? candidate.data as { message?: unknown } : null;
  const messages = [candidate.code, candidate.message,
    ...(Array.isArray(data?.message) ? data.message : [data?.message])];
  for (const [code, reason] of [
    ["VALIDATION.PLAIN_TEXT_UNSAFE", "unsafe"],
    ["VALIDATION.PLAIN_TEXT_REQUIRED", "required"],
    ["VALIDATION.PLAIN_TEXT_TOO_LONG", "tooLong"],
  ] as const) {
    if (messages.some((message) => typeof message === "string" &&
      (message === code || message.endsWith(`.${code}`)))) return reason;
  }
  return null;
}
