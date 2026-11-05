import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = ts.transpileModule(readFileSync(new URL("./http.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };

function observe(promise) {
  const result = { state: "pending", value: undefined, error: undefined };
  result.done = promise.then(
    (value) => { result.state = "fulfilled"; result.value = value; },
    (error) => { result.state = "rejected"; result.error = error; },
  );
  return result;
}

function harness(fetchResponse, { browser = true } = {}) {
  let now = Date.UTC(2026, 9, 26, 12);
  let timerId = 0;
  let token = "current-token";
  let logoutCount = 0;
  const clearedCookies = [];
  const timers = new Map();
  const calls = [];
  const exports = {};
  const clockDate = class extends Date { static now() { return now; } };
  vm.runInNewContext(source, {
    exports,
    Date: clockDate,
    AbortController,
    DOMException,
    Headers,
    SyntaxError,
    ...(browser ? { window: { location: { pathname: "/ro/help" } }, document: { documentElement: { lang: "ro" } } } : {}),
    setTimeout(callback, delay) {
      const id = ++timerId;
      timers.set(id, { at: now + delay, callback });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    fetch(url, init) {
      const call = { url, init };
      calls.push(call);
      return fetchResponse(call, calls.length);
    },
    require(path) {
      if (path === "@/lib/env") return { API_URL: "https://api.example.invalid" };
      if (path === "@/lib/auth/cookies") return {
        CSRF_COOKIE_NAME: "customerCsrfToken",
        readCookie: () => "fixture-csrf",
        clearCookie: (name) => clearedCookies.push(name),
      };
      if (path === "@/lib/auth/jwt") return { getJwtExpiryMs: () => now + 120_000 };
      if (path === "@/i18n/locales") return { DEFAULT_LOCALE: "en", isLocale: (value) => value === "en" || value === "ro" };
      throw new Error(`Unexpected dependency: ${path}`);
    },
  }, { filename: "api/http.ts" });
  exports.setTokenStore({ get: () => token, set: (next) => { token = next; }, clear: () => { token = null; } });
  exports.setOnLogout(() => { logoutCount++; });
  return {
    http: exports, calls, timers, clearedCookies,
    get token() { return token; },
    get logoutCount() { return logoutCount; },
    get now() { return now; },
    async advance(ms) {
      const target = now + ms;
      while (true) {
        const next = [...timers].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        const [id, timer] = next;
        now = timer.at;
        timers.delete(id);
        timer.callback();
        await flush();
      }
      now = target;
      await flush();
    },
  };
}

// A real Response/ReadableStream keeps headers and body completion separate.
// Like fetch, its body rejects when the request's signal aborts.
function streamingResponse(signal, status = 200, deferAbort = false) {
  let controller;
  let closed = false;
  const fail = (error) => {
    if (closed) return;
    closed = true;
    signal?.removeEventListener("abort", abort);
    controller.error(error);
  };
  const abort = () => { if (!deferAbort) fail(new DOMException("Aborted", "AbortError")); };
  const stream = new ReadableStream({
    start(value) {
      controller = value;
      controller.enqueue(new TextEncoder().encode("{"));
      if (signal?.aborted) abort();
      else signal?.addEventListener("abort", abort, { once: true });
    },
  });
  return {
    response: new Response(stream, { status, headers: { "Content-Type": "application/json" } }),
    fail,
    finish(value = { ok: true }) {
      if (closed) return;
      closed = true;
      signal?.removeEventListener("abort", abort);
      controller.enqueue(new TextEncoder().encode(JSON.stringify(value).slice(1)));
      controller.close();
    },
  };
}

function assertTransportFailure(result, h, code) {
  assert.equal(result.state, "rejected", "the full response must settle when its deadline expires");
  assert.ok(result.error instanceof h.http.ApiError);
  assert.equal(result.error.status, 0);
  assert.equal(result.error.code, code);
}

test("the existing browser deadline still aborts a response waiting for headers", async () => {
  const h = harness(({ init }) => new Promise((resolve, reject) => {
    init.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
  }));
  const result = observe(h.http.apiFetch("/marketplace/customer/profile"));
  await flush();
  await h.advance(14_999);
  assert.equal(result.state, "pending");
  await h.advance(1);
  assertTransportFailure(result, h, h.http.TIMEOUT_ERROR_CODE);
  assert.equal(h.timers.size, 0);
});

for (const status of [200, 503]) {
  test(`the browser deadline includes a stalled ${status} response body`, async (t) => {
    let body;
    const h = harness(({ init }) => {
      body = streamingResponse(init.signal, status);
      return Promise.resolve(body.response);
    });
    t.after(() => body?.finish());
    const result = observe(h.http.apiFetch("/marketplace/customer/profile"));
    await flush();
    assert.equal(body.response.body.locked, true, "the actual response parser must be awaiting the body");
    await h.advance(14_999);
    assert.equal(result.state, "pending");
    await h.advance(1);
    assertTransportFailure(result, h, h.http.TIMEOUT_ERROR_CODE);
    assert.equal(h.timers.size, 0);
    assert.equal(h.calls.length, 1, "a timeout must not automatically replay the request");
  });

  test(`caller cancellation remains AbortError while reading a ${status} body`, async (t) => {
    let body;
    const h = harness(({ init }) => {
      body = streamingResponse(init.signal, status);
      return Promise.resolve(body.response);
    });
    t.after(() => body?.finish());
    const caller = new AbortController();
    const result = observe(h.http.apiFetch("/marketplace/customer/profile", { signal: caller.signal }));
    await flush();
    caller.abort();
    await flush();
    assert.equal(result.state, "rejected", "caller abort must still reach an unfinished response body");
    assert.equal(result.error.name, "AbortError");
    assert.equal(result.error instanceof h.http.ApiError, false);
    assert.equal(h.timers.size, 0);
  });
}

for (const firstCause of ["caller", "timeout"]) {
  test(`delayed body rejection preserves ${firstCause} as the first cancellation cause`, async (t) => {
    let body;
    const h = harness(({ init }) => {
      body = streamingResponse(init.signal, 503, true);
      return Promise.resolve(body.response);
    });
    t.after(() => body?.finish());
    const caller = new AbortController();
    const result = observe(h.http.apiFetch("/marketplace/customer/profile", { signal: caller.signal }));
    await flush();
    if (firstCause === "caller") caller.abort();
    await h.advance(15_000);
    if (firstCause === "timeout") caller.abort();
    body.fail(new DOMException("Aborted", "AbortError"));
    await flush();
    if (firstCause === "timeout") assertTransportFailure(result, h, h.http.TIMEOUT_ERROR_CODE);
    else {
      assert.equal(result.state, "rejected");
      assert.equal(result.error.name, "AbortError");
      assert.equal(result.error instanceof h.http.ApiError, false);
    }
    assert.equal(h.timers.size, 0);
  });
}

test("an interrupted HTTP error body is not replaced by a generic status error", async () => {
  let body;
  const h = harness(({ init }) => {
    body = streamingResponse(init.signal, 503);
    return Promise.resolve(body.response);
  });
  const result = observe(h.http.apiFetch("/marketplace/customer/profile"));
  await flush();
  const failure = new TypeError("Response stream interrupted");
  body.fail(failure);
  await flush();
  assert.equal(result.state, "rejected");
  assert.equal(result.error, failure);
  assert.equal(h.timers.size, 0);
});

test("an already-cancelled caller sends no request", async () => {
  const h = harness(() => { throw new Error("unexpected fetch"); });
  const caller = new AbortController();
  caller.abort();
  await assert.rejects(h.http.apiFetch("/marketplace/customer/profile", { signal: caller.signal }), { name: "AbortError" });
  assert.equal(h.calls.length, 0);
  assert.equal(h.timers.size, 0);
});

test("a refresh body timeout releases single-flight without ending a recoverable session", async (t) => {
  let body;
  const h = harness(({ init }, count) => {
    if (count > 1) return Promise.resolve(Response.json({ accessToken: "fresh-token" }));
    body = streamingResponse(init.signal);
    return Promise.resolve(body.response);
  });
  t.after(() => body?.finish());
  const first = observe(h.http.refreshSession());
  const second = observe(h.http.refreshSession());
  await flush();
  assert.equal(h.calls.length, 1);
  await h.advance(15_000);
  assertTransportFailure(first, h, h.http.TIMEOUT_ERROR_CODE);
  assertTransportFailure(second, h, h.http.TIMEOUT_ERROR_CODE);
  assert.equal(h.token, "current-token");
  assert.equal(h.logoutCount, 0);
  assert.deepEqual(h.clearedCookies, []);
  assert.equal(await h.http.refreshSession(), "fresh-token");
  assert.equal(h.calls.length, 2);
  assert.equal(h.token, "fresh-token");
  assert.equal(h.timers.size, 0);
});

test("204, structured errors, and Retry-After keep their existing response contracts", async () => {
  const payload = { message: ["CUSTOMER_AUTH.E38"], code: "ACCOUNT_CONFLICT", details: { reason: "fixture" } };
  const h = harness(({ url }) => {
    if (url.endsWith("/empty")) return Promise.resolve(new Response(null, { status: 204 }));
    if (url.endsWith("/conflict")) return Promise.resolve(Response.json(payload, { status: 409 }));
    if (url.endsWith("/rate-seconds")) return Promise.resolve(Response.json({ message: ["AUTH.E39"] }, { status: 429, headers: { "Retry-After": "7" } }));
    if (url.endsWith("/rate-date")) return Promise.resolve(Response.json({}, { status: 429, headers: { "Retry-After": new Date(h.now + 9_000).toUTCString() } }));
    return Promise.resolve(new Response("not JSON", { status: 503, statusText: "Service Unavailable" }));
  });
  assert.equal(await h.http.apiFetch("/empty"), undefined);
  await assert.rejects(h.http.apiFetch("/conflict"), (error) => {
    assert.equal(error.status, 409);
    assert.equal(error.code, "ACCOUNT_CONFLICT");
    assert.equal(error.message, "CUSTOMER_AUTH.E38");
    assert.deepEqual(error.data, payload);
    return true;
  });
  await assert.rejects(h.http.apiFetch("/rate-seconds"), (error) => error.code === "AUTH.E39" && error.retryAfterSeconds === 7);
  await assert.rejects(h.http.apiFetch("/rate-date"), (error) => error.status === 429 && error.retryAfterSeconds === 9);
  await assert.rejects(h.http.apiFetch("/invalid-error-body"), (error) => error.status === 503 && error.message === "Service Unavailable" && error.data === null);
  assert.equal(h.timers.size, 0);
});

test("a completed successful body releases its timer and preserves invalid-JSON failures", async () => {
  const h = harness(({ url }) => Promise.resolve(url.endsWith("/invalid") ? new Response("not JSON") : Response.json({ ok: true })));
  const caller = new AbortController();
  assert.deepEqual(await h.http.apiFetch("/valid", { signal: caller.signal }), { ok: true });
  assert.equal(h.timers.size, 0);
  caller.abort();
  await h.advance(15_000);
  await assert.rejects(h.http.apiFetch("/invalid"), { name: "SyntaxError" });
  assert.equal(h.timers.size, 0);
});

test("concurrent expired-token responses share refresh and preserve the original retry payload", async (t) => {
  let refreshBody;
  const h = harness(({ url, init }) => {
    if (url.endsWith("/auth/refresh")) {
      refreshBody = streamingResponse(init.signal);
      return Promise.resolve(refreshBody.response);
    }
    if (init.headers.get("Authorization") === "Bearer current-token") {
      return Promise.resolve(Response.json({ code: "token_expired", message: "Expired" }, { status: 401 }));
    }
    return Promise.resolve(Response.json({ ok: true }));
  });
  t.after(() => refreshBody?.finish({ accessToken: "fresh-token" }));
  const body = JSON.stringify({ listingId: 901 });
  const booking = h.http.apiFetch("/marketplace/appointments/book", { method: "POST", headers: { "idempotency-key": "fixture-booking" }, body });
  const profile = h.http.apiFetch("/marketplace/customer/profile");
  await flush();
  assert.equal(h.calls.filter(({ url }) => url.endsWith("/auth/refresh")).length, 1);
  refreshBody.finish({ accessToken: "fresh-token" });
  assert.deepEqual(await Promise.all([booking, profile]), [{ ok: true }, { ok: true }]);
  const retries = h.calls.filter(({ init }) => init.headers.get("Authorization") === "Bearer fresh-token");
  assert.equal(retries.length, 2);
  const bookingRetry = retries.find(({ init }) => init.method === "POST");
  assert.equal(bookingRetry.init.body, body);
  assert.equal(bookingRetry.init.headers.get("idempotency-key"), "fixture-booking");
  assert.equal(bookingRetry.init.headers.get("x-locale"), "ro");
  assert.equal(h.calls.length, 5);
  assert.equal(h.timers.size, 0);
});

test("server requests retain their cache options without a new deadline or abort signal", async () => {
  const h = harness(() => Promise.resolve(Response.json({ ok: true })), { browser: false });
  // Server rendering has no browser token store in production.
  h.http.setTokenStore({ get: () => null, set: () => {}, clear: () => {} });
  const next = { tags: ["fixture-public"], revalidate: 600 };
  assert.deepEqual(await h.http.apiFetch("/marketplace/public/industries", { next }), { ok: true });
  assert.equal(h.calls[0].init.next, next);
  assert.equal(h.calls[0].init.signal, undefined);
  assert.equal(h.timers.size, 0);
});
