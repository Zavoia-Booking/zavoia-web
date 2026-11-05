import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { serverVenueClockSnapshot, subscribeVenueClock, useBrowserTimezone, useVenueClock, venueClockSnapshot } from "./use-venue-clock.ts";

test("venue clock and visitor timezone have hydration-safe unknown server snapshots", () => {
  function Snapshot() {
    const now = useVenueClock();
    const timezone = useBrowserTimezone();
    return createElement("span", null, `${now ?? "unknown"}/${timezone ?? "unknown"}`);
  }
  assert.equal(serverVenueClockSnapshot(), null);
  assert.equal(renderToString(createElement(Snapshot)), "<span>unknown/unknown</span>");
});

test("consumers share one timer, refresh on tab return, and release browser listeners", (t) => {
  const windowEvents = new Map();
  const documentEvents = new Map();
  const timers = [];
  const cleared = [];
  let epoch = Date.parse("2026-10-29T08:15:44Z");
  t.mock.method(Date, "now", () => epoch);
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  globalThis.window = {
    setInterval(callback, delay) { timers.push({ callback, delay }); return timers.length; },
    clearInterval(id) { cleared.push(id); },
    addEventListener(name, listener) { windowEvents.set(name, listener); },
    removeEventListener(name, listener) { if (windowEvents.get(name) === listener) windowEvents.delete(name); },
  };
  globalThis.document = {
    visibilityState: "visible",
    addEventListener(name, listener) { documentEvents.set(name, listener); },
    removeEventListener(name, listener) { if (documentEvents.get(name) === listener) documentEvents.delete(name); },
  };
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
  });

  let first = 0;
  let second = 0;
  const stopFirst = subscribeVenueClock(() => { first++; });
  const stopSecond = subscribeVenueClock(() => { second++; });
  t.after(stopFirst);
  t.after(stopSecond);
  assert.equal(timers.length, 1);
  assert.equal(timers[0].delay, 30_000);
  assert.equal(venueClockSnapshot(), Date.parse("2026-10-29T08:15:00Z"));
  epoch = Date.parse("2026-10-29T09:00:01Z");
  timers[0].callback();
  assert.equal(first, 1);
  assert.equal(second, 1);
  assert.equal(venueClockSnapshot(), Date.parse("2026-10-29T09:00:00Z"));

  document.visibilityState = "hidden";
  documentEvents.get("visibilitychange")();
  assert.equal(first, 1);
  document.visibilityState = "visible";
  documentEvents.get("visibilitychange")();
  windowEvents.get("pageshow")();
  assert.equal(first, 3);
  assert.equal(second, 3);

  stopFirst();
  assert.equal(cleared.length, 0);
  stopSecond();
  assert.deepEqual(cleared, [1]);
  assert.equal(windowEvents.size, 0);
  assert.equal(documentEvents.size, 0);
});
