import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };

function harness() {
  let now = 1_000_000;
  let sequence = 0;
  const timers = new Map();
  const load = (file, dependencies = {}, exposed = "") => {
    const exports = {};
    const source = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(source + exposed, {
      exports, AbortController, DOMException,
      Date: class extends Date { static now() { return now; } },
      setTimeout(callback, delay) {
        const id = ++sequence;
        timers.set(id, { at: now + delay, callback });
        return id;
      },
      clearTimeout(id) { timers.delete(id); },
      console: { error() {} },
      require(path) {
        if (path in dependencies) return dependencies[path];
        throw new Error(`Unexpected dependency: ${path}`);
      },
    }, { filename: file });
    return exports;
  };
  const deadline = load("./request-deadline.ts");
  return {
    deadline, load, timers,
    async advance(ms) {
      const end = now + ms;
      while (true) {
        const next = [...timers].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        const [id, timer] = next;
        now = timer.at;
        timers.delete(id);
        timer.callback();
        await flush();
      }
      now = end;
      await flush();
    },
  };
}

test("deadline settles an abort-ignoring request, ignores its late result, and releases its timer", async () => {
  const h = harness();
  const controller = new AbortController();
  let complete;
  let outcome = "pending";
  const request = h.deadline.withHomeDeadline(() => new Promise((resolve) => { complete = resolve; }), { controller });
  const observed = request.then(() => { outcome = "success"; }, (error) => {
    assert.ok(error instanceof h.deadline.HomeRequestTimeoutError);
    outcome = "timeout";
  });
  await h.advance(14_999);
  assert.equal(outcome, "pending");
  await h.advance(1);
  await observed;
  assert.equal(outcome, "timeout");
  assert.equal(controller.signal.aborted, true);
  assert.equal(h.timers.size, 0);
  complete("late data");
  await flush();
  assert.equal(outcome, "timeout");
});

test("caller cancellation settles immediately even when the request ignores its signal", async () => {
  const h = harness();
  const controller = new AbortController();
  const request = h.deadline.withHomeDeadline(() => new Promise(() => {}), { controller });
  const rejected = assert.rejects(request, { name: "AbortError" });
  controller.abort();
  await rejected;
  assert.equal(h.timers.size, 0);
});

test("successful, rejected, and synchronously throwing requests all clear their deadlines", async () => {
  const h = harness();
  const controller = new AbortController();
  assert.equal(await h.deadline.withHomeDeadline(async () => "cards", { controller }), "cards");
  assert.equal(controller.signal.aborted, false);
  const failure = new Error("request failed");
  await assert.rejects(h.deadline.withHomeDeadline(async () => { throw failure; }), (error) => error === failure);
  await assert.rejects(h.deadline.withHomeDeadline(() => { throw failure; }), (error) => error === failure);
  assert.equal(h.timers.size, 0);
});

test("a hung feed releases its loading lock; a later retry can succeed without late results overwriting it", async () => {
  const h = harness();
  let calls = 0;
  let completeLate;
  const feed = h.load("./use-home-feed.ts", {
    react: {},
    "@/lib/api/marketplace/public": {
      searchListings() {
        calls++;
        return calls === 1
          ? new Promise((resolve) => { completeLate = resolve; })
          : Promise.resolve({ locations: [{ id: 2 }], total: 1 });
      },
    },
    "@/lib/api/http": { ApiError: class extends Error {} },
    "./request-deadline": h.deadline,
  }, "\nexports.audit = { getOrCreate, load };\n").audit;
  const entry = feed.getOrCreate("city:1:1", "city", { lat: 1, lng: 1 });
  const first = feed.load("city:1:1", entry, 10, true, "initial");
  assert.equal(feed.load("city:1:1", entry, 10, true, "retry"), first);
  await h.advance(15_000);
  await first;
  assert.equal(entry.state.loading, false);
  assert.equal(entry.state.failed, true);
  assert.equal(entry.requestPromise, null);
  await feed.load("city:1:1", entry, 10, true, "retry");
  assert.equal(entry.state.failed, false);
  assert.deepEqual(Array.from(entry.state.items, (item) => item.id), [2]);
  completeLate({ locations: [{ id: 1 }], total: 1 });
  await flush();
  assert.deepEqual(Array.from(entry.state.items, (item) => item.id), [2]);
  assert.equal(h.timers.size, 0);
});

test("failed explicit feed actions share an escalating cooldown that resets after success", async () => {
  const h = harness();
  let succeed = false;
  let calls = 0;
  const feed = h.load("./use-home-feed.ts", {
    react: {},
    "@/lib/api/marketplace/public": {
      searchListings() {
        calls++;
        return succeed ? Promise.resolve({ locations: [{ id: 1 }], total: 1 }) : Promise.reject(new Error("offline"));
      },
    },
    "@/lib/api/http": { ApiError: class extends Error {} },
    "./request-deadline": h.deadline,
  }, "\nexports.audit = { getOrCreate, load };\n").audit;
  const entry = feed.getOrCreate("city:1:1", "city", { lat: 1, lng: 1 });
  for (const delay of [15_000, 30_000, 60_000]) {
    await feed.load("city:1:1", entry, 10, true, "retry");
    const before = calls;
    await feed.load("city:1:1", entry, 10, true, "more");
    assert.equal(calls, before, "Show more cannot bypass the retry cooldown");
    await h.advance(delay - 1);
    assert.ok(entry.state.retryAt > 0);
    await h.advance(1);
    assert.equal(entry.state.retryAt, 0);
  }
  succeed = true;
  await feed.load("city:1:1", entry, 10, true, "retry");
  succeed = false;
  await feed.load("city:1:1", entry, 10, true, "more");
  await h.advance(15_000);
  assert.equal(entry.state.retryAt, 0, "a successful request resets the backoff");
});

function loadHomeLocation(h, geocoding) {
  return h.load("./use-home-coords.ts", {
    react: {},
    "@/lib/geocoding": geocoding,
    "./request-deadline": h.deadline,
  }, "\nexports.audit = { resolve, snapshot };\n").audit;
}

test("home location never asks: without permission it starts the IP estimate at once and settles even if that never responds", async () => {
  const h = harness();
  let ipCalls = 0;
  let positionRequests = 0;
  const geo = loadHomeLocation(h, {
    isLocationAllowed: async () => false,
    getBrowserLocation: () => { positionRequests++; return new Promise(() => {}); },
    ipLocate: () => { ipCalls++; return new Promise(() => {}); },
  });
  const resolving = geo.resolve();
  await flush();
  assert.equal(ipCalls, 1, "the IP estimate starts without waiting");
  assert.equal(positionRequests, 0, "no position request, so no browser dialog");
  assert.equal(geo.snapshot().resolving, true);
  await h.advance(8_000);
  await resolving;
  assert.equal(geo.snapshot().resolving, false);
  assert.equal(geo.snapshot().coords, null);
  assert.equal(geo.snapshot().approximate, false);
  assert.equal(h.timers.size, 0);
});

test("home location uses an already-allowed position and skips the IP estimate", async () => {
  const h = harness();
  let ipCalls = 0;
  const geo = loadHomeLocation(h, {
    isLocationAllowed: async () => true,
    getBrowserLocation: async () => ({ lat: 46.77, lng: 23.6 }),
    reverseGeocode: async () => ({ city: "Cluj-Napoca", countryCode: "RO" }),
    ipLocate: () => { ipCalls++; return new Promise(() => {}); },
  });
  await geo.resolve();
  assert.equal(ipCalls, 0);
  assert.equal(geo.snapshot().coords.lat, 46.77);
  assert.equal(geo.snapshot().city, "Cluj-Napoca");
  assert.equal(geo.snapshot().approximate, false);
  assert.equal(geo.snapshot().resolving, false);
  assert.equal(h.timers.size, 0);
});

test("home location falls back to the IP estimate when an allowed position never arrives", async () => {
  const h = harness();
  let ipCalls = 0;
  const geo = loadHomeLocation(h, {
    isLocationAllowed: async () => true,
    getBrowserLocation: () => new Promise(() => {}),
    ipLocate: async () => { ipCalls++; return { lat: 44.43, lng: 26.1, city: "Bucharest", countryCode: "RO" }; },
  });
  const resolving = geo.resolve();
  await flush();
  await h.advance(7_999);
  assert.equal(ipCalls, 0);
  assert.equal(geo.snapshot().resolving, true);
  await h.advance(1);
  await resolving;
  assert.equal(ipCalls, 1);
  assert.equal(geo.snapshot().city, "Bucharest");
  assert.equal(geo.snapshot().approximate, true, "an IP estimate is marked for the map links");
  assert.equal(geo.snapshot().resolving, false);
  assert.equal(h.timers.size, 0);
});
