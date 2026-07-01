import { API_URL } from "@/lib/env";
import { CSRF_COOKIE_NAME, clearCookie, readCookie } from "@/lib/auth/cookies";
import { getJwtExpiryMs } from "@/lib/auth/jwt";
import type { RefreshResponse } from "@/lib/auth/types";

export type TokenStore = {
  get: () => string | null;
  set: (token: string | null) => void;
  clear: () => void;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  data?: unknown;
  constructor(message: string, status: number, code?: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
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
  return new ApiError(message, response.status, code, data);
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

  const response = await fetch(`${API_URL}${REFRESH_PATH}`, {
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

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  await ensureFreshToken(path);

  const accessToken = tokenStore?.get() ?? null;
  const headers = buildHeaders(path, init, accessToken);

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
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
      retryHeaders.set("Authorization", `Bearer ${newToken}`);
      const retryResponse = await fetch(`${API_URL}${path}`, {
        ...init,
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
