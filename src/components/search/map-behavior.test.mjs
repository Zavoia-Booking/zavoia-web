import assert from "node:assert/strict";
import test from "node:test";
import { choosePinHit, searchAreaOffered, usableFitArea, viewportRadiusKm } from "./map-behavior.ts";

test("short phone map strips cannot force a globe-scale results fit", () => {
  // EN 390×568: main 442px, mid sheet 313.62px, rail 64px, 32px fit padding.
  assert.equal(usableFitArea(390, 442, { left: 32, right: 32, top: 96, bottom: 345.62 }), null);
  // The same protection applies when localized chrome entirely covers the map.
  assert.equal(usableFitArea(320, 442, { left: 32, right: 32, top: 96, bottom: 350 }), null);
});

test("results fit requires two badge pitches on both axes, preserving normal layouts", () => {
  assert.equal(usableFitArea(200, 159.99, { left: 32, right: 32, top: 32, bottom: 32 }), null);
  assert.equal(usableFitArea(159.99, 200, { left: 32, right: 32, top: 32, bottom: 32 }), null);
  assert.deepEqual(usableFitArea(160, 160, { left: 32, right: 32, top: 32, bottom: 32 }), { left: 32, right: 128, top: 32, bottom: 128 });
  assert.notEqual(usableFitArea(390, 718, { left: 32, right: 32, top: 96, bottom: 350 }), null);
  assert.notEqual(usableFitArea(1440, 930, { left: 472, right: 32, top: 96, bottom: 48 }), null);
  assert.equal(usableFitArea(NaN, 930, { left: 32, right: 32, top: 32, bottom: 32 }), null);
});

const viewport = {
  distanceKm: 0, visibleWidthKm: 10, zoom: 11, anchorZoom: 11,
  radiusKm: 20, offered: false, gestureActive: false,
};

test("area search responds to a full zoom level even without panning", () => {
  assert.equal(searchAreaOffered({ ...viewport, zoom: 10.01 }), false);
  assert.equal(searchAreaOffered({ ...viewport, zoom: 10 }), true);
  assert.equal(searchAreaOffered({ ...viewport, zoom: 12 }), true);
});

test("area offer waits for release and follows the current viewport width", () => {
  assert.equal(searchAreaOffered({ ...viewport, distanceKm: 3.49 }), false);
  assert.equal(searchAreaOffered({ ...viewport, distanceKm: 3.5, gestureActive: true }), false);
  assert.equal(searchAreaOffered({ ...viewport, distanceKm: 3.5 }), true);
});

test("hysteresis keeps an earned offer stable and hides on return during a drag", () => {
  assert.equal(searchAreaOffered({ ...viewport, offered: true, distanceKm: 2.2, gestureActive: true }), true);
  assert.equal(searchAreaOffered({ ...viewport, offered: true, distanceKm: 2, gestureActive: true }), false);
  assert.equal(searchAreaOffered({ ...viewport, offered: true, zoom: 11.7 }), true);
  assert.equal(searchAreaOffered({ ...viewport, offered: true, zoom: 11.5 }), false);
});

test("pan threshold has a 100m jitter floor and uses the loaded radius as its cap", () => {
  assert.equal(searchAreaOffered({ ...viewport, visibleWidthKm: 0.1, distanceKm: 0.09 }), false);
  assert.equal(searchAreaOffered({ ...viewport, visibleWidthKm: 0.1, distanceKm: 0.1 }), true);
  assert.equal(searchAreaOffered({ ...viewport, visibleWidthKm: 200, radiusKm: 40, distanceKm: 39 }), false);
  assert.equal(searchAreaOffered({ ...viewport, visibleWidthKm: 200, radiusKm: 40, distanceKm: 40 }), true);
});

test("a new area query covers half the viewport width within the API limits", () => {
  for (const width of [undefined, NaN, Infinity, -10, 0, 20, 40]) assert.equal(viewportRadiusKm(width), 20);
  assert.equal(viewportRadiusKm(61), 31);
  assert.equal(viewportRadiusKm(100), 50);
  assert.equal(viewportRadiusKm(200), 50);
});

const pins = new Map([
  [1, { lat: 44, lng: 26 }],
  [2, { lat: 44.001, lng: 26 }],
  [3, { lat: 44.002, lng: 26 }],
]);
const hit = (id, t) => ({ properties: { id, t } });

test("overlapping hover/click targets favor the visible badge over a closer dot", () => {
  assert.equal(choosePinHit([hit(1, 0), hit(2, 1)], pins.get(1), pins), 2);
  assert.equal(choosePinHit([hit(2, 1), hit(1, 0)], pins.get(1), pins), 2);
});

test("hit choice is stable in feature order, picks nearest badge and ignores stale features", () => {
  assert.equal(choosePinHit([hit(999, 1), hit(3, 1), hit(1, 1)], pins.get(1), pins), 1);
  assert.equal(choosePinHit([hit(1, 0), hit(3, 0)], pins.get(3), pins), 3);
  assert.equal(choosePinHit([hit(999, 1)], pins.get(1), pins), null);
  assert.equal(choosePinHit([], pins.get(1), pins), null);
});
