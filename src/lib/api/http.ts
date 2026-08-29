import { API_URL } from "@/lib/env";
import { CSRF_COOKIE_NAME, clearCookie, readCookie } from "@/lib/auth/cookies";
import { getJwtExpiryMs } from "@/lib/auth/jwt";
import type { RefreshResponse } from "@/lib/auth/types";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/locales";

export type TokenStore = {
  get: () => string | null;
  set: (token: string | null) => void;
  clear: () => void;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  data?: unknown;
  /** Seconds to wait before retrying, from a 429's `Retry-After` header. */
  retryAfterSeconds?: number;
  constructor(message: string, status: number, code?: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

/**
 * Transport-level failure codes. They live in the same `.code` slot as the
 * backend's message codes but can never collide with one: backend codes are
 * either dotted (`CUSTOMER_AUTH.E38`) or contain an underscore
 * (`EMAIL_TAKEN`), and these are single bare words.
 *
 * A transport failure carries `status: 0` — no response ever arrived, so
 * there is no status line, no body, and nothing to map to a domain message.
 */
export const NETWORK_ERROR_CODE = "NETWORK";
export const TIMEOUT_ERROR_CODE = "TIMEOUT";

/**
 * How long a BROWSER request may hang before we give up on it.
 *
 * Server-side fetches are deliberately left without a timeout or a signal:
 * they run inside Next's own request lifecycle and carry `next: { tags }`
 * cache hints, so attaching an AbortSignal there would change caching and ISR
 * behaviour to fix a problem that only exists in a browser — nobody is
 * staring at a stuck button during a prerender.
 */
const DEFAULT_TIMEOUT_MS = 15_000;

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError";
}

/**
 * `fetch`, with the two failures it can produce that never reach `parseError`
 * turned into ApiErrors: a dead network (fetch rejects with a TypeError, no
 * response at all) and our own timeout.
 *
 * A caller's own abort passes through untouched, so `AbortController`-based
 * stale-response guards keep working and are never reported as a timeout.
 */
async function guardedFetch(
  url: string,
  init: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const callerSignal = init.signal ?? null;

  if (typeof window === "undefined") {
    try {
      return await fetch(url, init);
    } catch (e) {
      if (isAbortError(e)) throw e;
      throw new ApiError("Network request failed", 0, NETWORK_ERROR_CODE);
    }
  }

  // `abort` fires once, at the moment of aborting: a listener attached after
  // that never runs. A caller aborted during the `await ensureFreshToken`
  // that precedes this would otherwise be ignored and the request would run
  // to completion or to the timeout.
  if (callerSignal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const forwardAbort = () => controller.abort();
  callerSignal?.addEventListener("abort", forwardAbort);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    if (isAbortError(e)) {
      if (timedOut) {
        throw new ApiError("Request timed out", 0, TIMEOUT_ERROR_CODE);
      }
      throw e; // the caller cancelled on purpose
    }
    throw new ApiError("Network request failed", 0, NETWORK_ERROR_CODE);
  } finally {
    clearTimeout(timer);
    callerSignal?.removeEventListener("abort", forwardAbort);
  }
}

/**
 * `Retry-After` is either a delay in seconds or an HTTP date; both forms are
 * legal and the backend's rate limiter sends the first. The parsed value is
 * what lets the UI count down instead of saying a bare "try again later".
 */
function parseRetryAfter(response: Response): number | undefined {
  const raw = response.headers.get("retry-after");
  if (!raw) return undefined;
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
  const when = Date.parse(raw);
  if (Number.isNaN(when)) return undefined;
  return Math.max(0, Math.ceil((when - Date.now()) / 1000));
}

const REFRESH_PATH = "/marketplace/auth/refresh";
const LOGOUT_PATH = "/marketplace/auth/logout";
const LOGIN_PATH = "/marketplace/auth/login";
const REGISTER_PATH = "/marketplace/auth/register";
const PRE_FLIGHT_REFRESH_THRESHOLD_MS = 30_000;

let tokenStore: TokenStore | null = null;
let onLogout: (() => void) | null = null;
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

export function setTokenStore(store: TokenStore): void {
  tokenStore = store;
}

export function setOnLogout(callback: () => void): void {
  onLogout = callback;
}

function shouldSkipRefreshLogic(path: string): boolean {
  return (
    path.startsWith(REFRESH_PATH) ||
    path.startsWith(LOGOUT_PATH) ||
    path.startsWith(LOGIN_PATH) ||
    path.startsWith(REGISTER_PATH)
  );
}

function needsCsrfHeader(path: string): boolean {
  return path.startsWith(REFRESH_PATH) || path.startsWith(LOGOUT_PATH);
}

// Matches a backend message code like "CUSTOMER_AUTH.E38".
const BACKEND_CODE_RE = /^[A-Z_]+\.[A-Z0-9]+$/i;

const LOCALE_HEADER = "x-locale";

/**
 * The UI language the user is currently browsing in, sent to the backend on
 * EVERY request as the `x-locale` header so transactional emails (verification,
 * password reset, account link, …) come back in the language the user was
 * looking at — the backend treats it as a fallback wherever a request body has
 * no explicit `locale`. Reads `<html lang>` (set by the [locale] layout, which
 * tracks the active dictionary even though the default locale is unprefixed in
 * the URL) and falls back to the pathname prefix. Returns null server-side —
 * there is no active document to read from.
 */
function getActiveLocale(): Locale | null {
  if (typeof document === "undefined") return null;
  const lang = document.documentElement.lang;
  if (isLocale(lang)) return lang;
  const segment = window.location.pathname.split("/")[1] ?? "";
  return isLocale(segment) ? segment : DEFAULT_LOCALE;
}

async function parseError(response: Response): Promise<ApiError> {
  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // body empty or non-JSON
  }
  const body = data as
    | { message?: string | string[]; code?: string }
    | null;
  // The backend serializes `message` as an ARRAY of message codes for generic
  // errors (e.g. ["CUSTOMER_AUTH.E38"]); normalize to the first string so an
  // array is never stored as ApiError.message and rendered raw by React.
  const rawMessage = body?.message;
  const firstMessage = Array.isArray(rawMessage)
    ? rawMessage.find((m): m is string => typeof m === "string")
    : rawMessage;
  const message = firstMessage ?? response.statusText ?? "Request failed";
  // 409 conflict errors carry a top-level `code`; other errors don't, so when
  // the first message element looks like a backend code, expose it as `.code`
  // too — downstream mapping keys off `.code`. `data` stays the full raw body,
  // so getAccountLinkNeededDetails / getGoogleUnlinkedDetails still read
  // error.data.code + error.data.details unchanged.
  const code =
    body?.code ??
    (typeof firstMessage === "string" && BACKEND_CODE_RE.test(firstMessage)
      ? firstMessage
      : undefined);
  const error = new ApiError(message, response.status, code, data);
  if (response.status === 429) {
    error.retryAfterSeconds = parseRetryAfter(response);
  }
  return error;
}

function isExpiredTokenError(error: ApiError, response: Response): boolean {
  if (error.code === "token_expired") return true;
  const www = response.headers.get("www-authenticate");
  if (
    www &&
    /error="invalid_token"/i.test(www) &&
    /expired/i.test(www)
  ) {
    return true;
  }
  if (typeof error.message === "string" && /expired/i.test(error.message)) {
    return true;
  }
  return false;
}

function buildHeaders(
  path: string,
  init: RequestInit,
  accessToken: string | null,
): Headers {
  const headers = new Headers(init.headers ?? {});
  if (
    init.body !== undefined &&
    init.body !== null &&
    !headers.has("Content-Type") &&
    typeof init.body === "string"
  ) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (!headers.has(LOCALE_HEADER)) {
    const locale = getActiveLocale();
    if (locale) headers.set(LOCALE_HEADER, locale);
  }
  if (needsCsrfHeader(path) && !headers.has("x-csrf-token")) {
    const csrf = readCookie(CSRF_COOKIE_NAME);
    if (csrf) headers.set("x-csrf-token", csrf);
  }
  return headers;
}

function waitForRefresh(): Promise<string> {
  return new Promise((resolve, reject) => {
    refreshQueue.push((token) => {
      if (!token) reject(new ApiError("Session refresh failed", 401));
      else resolve(token);
    });
  });
}

async function ensureRefreshInFlight(): Promise<string> {
  if (!isRefreshing) {
    isRefreshing = true;
    void (async () => {
      try {
        const token = await performRefresh();
        const queue = refreshQueue;
        refreshQueue = [];
        queue.forEach((cb) => cb(token));
      } catch {
        const queue = refreshQueue;
        refreshQueue = [];
        queue.forEach((cb) => cb(null));
        clearCookie(CSRF_COOKIE_NAME);
        tokenStore?.clear();
        onLogout?.();
      } finally {
        isRefreshing = false;
      }
    })();
  }
  return waitForRefresh();
}

async function performRefresh(): Promise<string> {
  const csrf = readCookie(CSRF_COOKIE_NAME);
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });
  if (csrf) headers.set("x-csrf-token", csrf);

  const response = await guardedFetch(`${API_URL}${REFRESH_PATH}`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw error;
  }

  const data = (await response.json()) as RefreshResponse;
  tokenStore?.set(data.accessToken);
  return data.accessToken;
}

async function ensureFreshToken(path: string): Promise<void> {
  if (shouldSkipRefreshLogic(path)) return;
  const token = tokenStore?.get();
  if (!token) return;
  const expiry = getJwtExpiryMs(token);
  if (!expiry) return;
  if (expiry - Date.now() < PRE_FLIGHT_REFRESH_THRESHOLD_MS) {
    try {
      await ensureRefreshInFlight();
    } catch {
      // swallow; the actual call will surface a 401 if needed
    }
  }
}

/**
 * A tagged / revalidated response is stored in a cache SHARED by every visitor.
 * Some public endpoints are optional-auth — `getListing` populates
 * `isFavorited` when a token is present — so caching a token-bearing response
 * would serve one user's state to everyone. Server-side there is no token
 * store, which is what makes the listing pages cacheable at all; this strips
 * the cache hints if that ever stops being true.
 */
function stripCacheHints(init: RequestInit): RequestInit {
  if (!("next" in init) && !("cache" in init)) return init;
  const rest: Record<string, unknown> = { ...init };
  delete rest.next;
  delete rest.cache;
  return rest as RequestInit;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  await ensureFreshToken(path);

  const accessToken = tokenStore?.get() ?? null;
  const headers = buildHeaders(path, init, accessToken);
  const safeInit = accessToken ? stripCacheHints(init) : init;

  const response = await guardedFetch(`${API_URL}${path}`, {
    ...safeInit,
    headers,
    credentials: "include",
  });

  if (response.ok) {
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  const error = await parseError(response);

  if (
    response.status === 401 &&
    !shouldSkipRefreshLogic(path) &&
    isExpiredTokenError(error, response)
  ) {
    try {
      const newToken = await ensureRefreshInFlight();
      const retryHeaders = new Headers(init.headers ?? {});
      if (
        init.body !== undefined &&
        init.body !== null &&
        !retryHeaders.has("Content-Type") &&
        typeof init.body === "string"
      ) {
        retryHeaders.set("Content-Type", "application/json");
      }
      if (!retryHeaders.has("Accept")) {
        retryHeaders.set("Accept", "application/json");
      }
      if (!retryHeaders.has(LOCALE_HEADER)) {
        const locale = getActiveLocale();
        if (locale) retryHeaders.set(LOCALE_HEADER, locale);
      }
      retryHeaders.set("Authorization", `Bearer ${newToken}`);
      const retryResponse = await guardedFetch(`${API_URL}${path}`, {
        // Reached only with a token in hand — never cache this response.
        ...stripCacheHints(init),
        headers: retryHeaders,
        credentials: "include",
      });
      if (retryResponse.ok) {
        if (retryResponse.status === 204) return undefined as T;
        return (await retryResponse.json()) as T;
      }
      throw await parseError(retryResponse);
    } catch (refreshError) {
      throw refreshError;
    }
  }

  throw error;
}

export async function refreshSession(): Promise<string> {
  return ensureRefreshInFlight();
}
