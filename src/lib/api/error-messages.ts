import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/dictionaries";
import {
  ApiError,
  NETWORK_ERROR_CODE,
  TIMEOUT_ERROR_CODE,
} from "@/lib/api/http";

type ErrorsDict = Dictionary["errors"];

// Backend message codes come in exactly two shapes: dotted and namespaced
// ("CUSTOMER_AUTH.E38", "MARKETPLACE_BOOKING.E10"), or plain UPPER_SNAKE
// ("EMAIL_TAKEN", "email_already_registered"). Both require either a dot or an
// underscore, which is what keeps the bare transport codes (NETWORK, TIMEOUT)
// out of every domain mapper for free.
const DOTTED_CODE_RE = /^[A-Z_]+\.[A-Z0-9]+$/i;
const SNAKE_CODE_RE = /^[A-Z]+(_[A-Z]+)+$/i;

function isCodeShaped(value: string): boolean {
  return DOTTED_CODE_RE.test(value) || SNAKE_CODE_RE.test(value);
}

/**
 * The single way to read a backend message code off an error — always the
 * WHOLE code, never a suffix.
 *
 * This exists because suffixes are ambiguous across namespaces:
 * `APPOINTMENTS.E08` means "rescheduling is switched off" while
 * `MARKETPLACE_BOOKING.E08` means "too soon". A mapper keyed on `"E08"` looks
 * plausible, compiles, and silently never matches anything — which is exactly
 * what happened in the booking drawer. Every mapper in the app keys off this
 * function so that failure mode cannot be written again.
 *
 * Prefers `ApiError.code` (populated by `parseError`, from either a top-level
 * `code` or a code-shaped `message[0]`) and falls back to `.message` when the
 * message is itself a raw code.
 */
export function backendCode(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  if (error.code && isCodeShaped(error.code)) return error.code.toUpperCase();
  if (typeof error.message === "string" && isCodeShaped(error.message)) {
    return error.message.toUpperCase();
  }
  return null;
}

/**
 * Look `error` up in a map of FULL backend codes. A thin wrapper over
 * `backendCode`, but it keeps call sites from re-implementing the lookup (and
 * from being tempted to slice the namespace off).
 */
export function mapBackendCode<T>(
  error: unknown,
  table: Record<string, T>,
): T | null {
  const code = backendCode(error);
  if (!code) return null;
  return table[code] ?? null;
}

/** The network is unreachable — no response ever arrived. */
export function isOfflineError(error: unknown): boolean {
  return error instanceof ApiError && error.code === NETWORK_ERROR_CODE;
}

/** Our own client-side timeout fired; the request never came back. */
export function isTimeoutError(error: unknown): boolean {
  return error instanceof ApiError && error.code === TIMEOUT_ERROR_CODE;
}

/** The backend answered, but with a failure that is ours to fix, not the user's. */
export function isServerError(error: unknown): boolean {
  return error instanceof ApiError && error.status >= 500;
}

export function isRateLimited(error: unknown): boolean {
  return error instanceof ApiError && error.status === 429;
}

/** A 401 that outlived the refresh-and-retry path: the session is really gone. */
export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

/**
 * A localized message for the failures that mean the same thing everywhere in
 * the app — no connection, timed out, rate limited, backend down.
 *
 * Returns `null` when the error is a domain failure the caller is better
 * placed to explain (a wrong password, a taken slot), so call sites read:
 * transport message first, their own specific message second, generic last.
 * That ordering matters: "you're offline" beats "incorrect password" when the
 * request never reached the server to check the password at all.
 */
export function transportErrorMessage(
  error: unknown,
  dict: ErrorsDict,
): string | null {
  if (isOfflineError(error)) return dict.offline;
  if (isTimeoutError(error)) return dict.timeout;
  if (isRateLimited(error)) {
    const seconds = error instanceof ApiError ? error.retryAfterSeconds : undefined;
    return seconds && seconds > 0
      ? format(dict.rateLimit, { seconds: String(seconds) })
      : dict.rateLimitNoTime;
  }
  if (isServerError(error)) return dict.server;
  return null;
}

/**
 * The message to show for a failed action: what the transport says if it has
 * something to say, else the caller's own domain-specific message, else the
 * shared generic.
 *
 * `specific` is whatever a domain mapper produced (or `null` when it didn't
 * recognize the code) — it is deliberately the second choice, not the first.
 */
export function errorMessage(
  error: unknown,
  dict: ErrorsDict,
  specific?: string | null,
): string {
  return transportErrorMessage(error, dict) ?? specific ?? dict.generic;
}
