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
 * A transport failure carries `status: 0` — no complete response arrived,
 * so there is no usable payload to map to a domain message.
 */
export const NETWORK_ERROR_CODE = "NETWORK";
export const TIMEOUT_ERROR_CODE = "TIMEOUT";

/**
 * Browser deadline for one exchange, including response-body consumption.
 * Server-side fetches keep their existing lifecycle and cache hints; this
 * wrapper does not add a timeout or signal to those requests.
 */
const DEFAULT_TIMEOUT_MS = 15_000;

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError";
}

/**
 * Keep cancellation active until the response has been consumed. A fetch
 * failure before headers and our own deadline become transport ApiErrors;
 * parsing errors and HTTP ApiErrors retain their existing meaning.
 *
 * A caller's own abort passes through untouched, so `AbortController`-based
 * stale-response guards keep working and are never reported as a timeout.
 */
async function guardedFetch<T>(
  url: string,
  init: RequestInit,
  consume: (response: Response) => Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const callerSignal = init.signal ?? null;
  const fetchResponse = async (requestInit: RequestInit): Promise<Response> => {
    try {
      return await fetch(url, requestInit);
    } catch (e) {
      if (isAbortError(e)) throw e;
      throw new ApiError("Network request failed", 0, NETWORK_ERROR_CODE);
    }
  };

  if (typeof window === "undefined") {
    return consume(await fetchResponse(init));
  }

  // `abort` fires once, at the moment of aborting: a listener attached after
  // that never runs. A caller aborted during the `await ensureFreshToken`
  // that precedes this would otherwise be ignored and the request would run
  // to completion or to the timeout.
  if (callerSignal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const controller = new AbortController();
  let abortCause: "caller" | "timeout" | null = null;
  const abort = (cause: "caller" | "timeout") => {
    // Body rejection may arrive after another cancellation source fires.
    // Preserve whichever cancellation actually started the abort.
    if (abortCause !== null) return;
    abortCause = cause;
    controller.abort();
  };
  const timer = setTimeout(() => abort("timeout"), timeoutMs);
  const forwardAbort = () => abort("caller");
  callerSignal?.addEventListener("abort", forwardAbort);

  try {
    const response = await fetchResponse({ ...init, signal: controller.signal });
    return await consume(response);
  } catch (e) {
    if (isAbortError(e) && abortCause === "timeout") {
      throw new ApiError("Request timed out", 0, TIMEOUT_ERROR_CODE);
    }
    throw e;
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
let refreshGeneration = 0;
let refreshPromise: Promise<string> | null = null;
let refreshController: AbortController | null = null;

/** A logout or a different session invalidates every older refresh result. */
export function invalidateSessionRefresh(): void {
  refreshGeneration += 1;
  refreshController?.abort();
  refreshController = null;
  refreshPromise = null;
}

function assertSessionGeneration(generation: number): void {
  if (generation !== refreshGeneration) {
    throw new ApiError("Session changed", 401, "SESSION_CHANGED");
  }
}

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
  } catch (error) {
    // Empty/non-JSON error bodies still use HTTP metadata. Cancellation and
    // interrupted body reads must reach the transport guard instead.
    if (!(error instanceof SyntaxError)) throw error;
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

type ParsedResponse<T> =
  | { response: Response; data: T }
  | { response: Response; error: ApiError };

async function readResponse<T>(response: Response): Promise<ParsedResponse<T>> {
  if (!response.ok) return { response, error: await parseError(response) };
  const data = response.status === 204 ? undefined as T : await response.json() as T;
  return { response, data };
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

/** Only backend-confirmed rejected credentials end a session. CSRF mismatch,
 * rate limiting and infrastructure/network failures are retryable. */
export function isTerminalRefreshError(error: unknown): boolean {
  return error instanceof ApiError && (
    (error.status === 401 && (
      error.code === "refresh_token_expired" ||
      error.code === "refresh_token_invalid"
    )) || (error.status === 400 && error.code === "CUSTOMER_AUTH.E20")
  );
}

/**
 * These controller routes are read-only and explicitly permit anonymous use.
 * Keep both method and shape constrained: a future public-prefix mutation is
 * not implicitly safe to replay outside its initiating session.
 */
function permitsAnonymousDiscovery(path: string, init: RequestInit): boolean {
  if (new Headers(init.headers).has("Authorization")) return false;
  const pathname = path.split("?")[0];
  const method = (init.method ?? "GET").toUpperCase();
  if (method === "POST")
    return pathname === "/marketplace/public/nearby-locations";
  if (method !== "GET") return false;
  return /^\/marketplace\/public\/(?:industries|venue-tags|brands|sitemap|listings(?:\/bulk)?|(?:brand|website|listing|professional)\/[^/]+|listing\/[^/]+\/reviews|listing\/[^/]+\/team-member\/[^/]+|team-member\/[^/]+(?:\/(?:reviews|booking-context))?)$/.test(pathname);
}

async function serializedRefresh(signal: AbortSignal): Promise<string> {
  // Rotation changes the shared HttpOnly cookie. Read CSRF only after this
  // tab owns the same-origin lock, after the previous response set its cookies.
  // Unsupported/insecure contexts retain per-tab deduplication; no token is
  // persisted to storage or sent over BroadcastChannel.
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request(
      "zavoia.marketplace.refresh",
      { signal },
      () => performRefresh(signal),
    );
  }
  return performRefresh(signal);
}

function ensureRefreshInFlight(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  const generation = refreshGeneration;
  const controller = new AbortController();
  refreshController = controller;
  const request = serializedRefresh(controller.signal)
    .then((token) => {
      assertSessionGeneration(generation);
      tokenStore?.set(token);
      return token;
    })
    .catch((error: unknown) => {
      // A discarded refresh must never clear a newer login's token/cookie.
      assertSessionGeneration(generation);
      if (isTerminalRefreshError(error)) {
        clearCookie(CSRF_COOKIE_NAME);
        tokenStore?.clear();
        onLogout?.();
      }
      throw error;
    })
    .finally(() => {
      if (generation === refreshGeneration) {
        refreshPromise = null;
        refreshController = null;
      }
    });
  refreshPromise = request;
  return request;
}

async function performRefresh(signal: AbortSignal): Promise<string> {
  const csrf = readCookie(CSRF_COOKIE_NAME);
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });
  if (csrf) headers.set("x-csrf-token", csrf);

  const result = await guardedFetch(`${API_URL}${REFRESH_PATH}`, {
    signal,
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({}),
  }, readResponse<RefreshResponse>);

  if ("error" in result) throw result.error;
  return result.data.accessToken;
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
    } catch (error) {
      // A proactive refresh can fail while the current token is still valid.
      // Keep that request usable, but never send an expired/replaced token.
      if (tokenStore?.get() === token && expiry > Date.now() &&
          !isTerminalRefreshError(error)) return;
      throw error;
    }
  }
}

/**
 * A tagged / revalidated response is stored in a cache SHARED by every visitor.
 * A token-bearing response may carry one user's state, so caching it could
 * serve that state to everyone. Server-side there is no token
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
  const generation = refreshGeneration;
  let anonymousFallback = false;
  try {
    await ensureFreshToken(path);
    assertSessionGeneration(generation);
  } catch (error) {
    // A dead session must not block browsing. This continuation carries neither
    // a token nor cookies, and is restricted to audited read-only endpoints.
    // If another login already supplied a token, discard the older operation.
    if (!permitsAnonymousDiscovery(path, init) ||
        (generation !== refreshGeneration && tokenStore?.get())) {
      assertSessionGeneration(generation);
      throw error;
    }
    anonymousFallback = true;
  }

  const accessToken = anonymousFallback ? null : tokenStore?.get() ?? null;
  const headers = buildHeaders(path, init, accessToken);
  const safeInit = accessToken ? stripCacheHints(init) : init;

  const result = await guardedFetch(`${API_URL}${path}`, {
    ...safeInit,
    headers,
    credentials: anonymousFallback ? "omit" : "include",
  }, readResponse<T>);

  if ("data" in result) return result.data;
  const { response, error } = result;

  if (
    response.status === 401 &&
    !anonymousFallback &&
    !shouldSkipRefreshLogic(path) &&
    isExpiredTokenError(error, response)
  ) {
    try {
      assertSessionGeneration(generation);
      const newToken = await ensureRefreshInFlight();
      assertSessionGeneration(generation);
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
      const retryResult = await guardedFetch(`${API_URL}${path}`, {
        // Reached only with a token in hand — never cache this response.
        ...stripCacheHints(init),
        headers: retryHeaders,
        credentials: "include",
      }, readResponse<T>);
      if ("data" in retryResult) return retryResult.data;
      throw retryResult.error;
    } catch (refreshError) {
      throw refreshError;
    }
  }

  throw error;
}

export async function refreshSession(): Promise<string> {
  return ensureRefreshInFlight();
}
