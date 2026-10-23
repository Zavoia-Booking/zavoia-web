import assert from "node:assert/strict";
import test from "node:test";
import { formatMoney, formatServiceSpread, formatSelectionSpread, sumServiceSpreads } from "./money-time.ts";

const commonOverride = {
  priceAmountMinor: 12000,
  duration: 60,
  priceFromMinor: 15000,
  priceVariesByStaff: false,
  durationMinMinutes: 45,
  durationMaxMinutes: 45,
  durationVariesByStaff: false,
};

test("one professional or identical staff overrides use actual figures without a From label", () => {
  assert.deepEqual(formatServiceSpread(commonOverride, "RON", "en"), {
    price: formatMoney(15000, "RON", "en"), duration: "45m", priceVaries: false,
  });
  assert.deepEqual(sumServiceSpreads([commonOverride]), {
    priceMinor: 15000,
    priceVaries: false,
    durationMinMinutes: 45,
    durationMaxMinutes: 45,
    durationVaries: false,
  });
});

test("fixed packages and staff-specific services without spread fields retain their exact figures", () => {
  assert.deepEqual(formatServiceSpread({ priceAmountMinor: 4500, duration: 90 }, "EUR", "ro"), {
    price: formatMoney(4500, "EUR", "ro"), duration: "1h 30m", priceVaries: false,
  });
});

test("zero-price staff overrides are not replaced with the location base", () => {
  assert.equal(formatServiceSpread({ ...commonOverride, priceFromMinor: 0 }, "GBP", "en").price, formatMoney(0, "GBP", "en"));
  assert.equal(sumServiceSpreads([{ ...commonOverride, priceFromMinor: 0 }]).priceMinor, 0);
});

test("mixed selection sums each actual staff minimum and preserves duration ranges", () => {
  const varying = {
    priceAmountMinor: 10000, priceFromMinor: 8000, priceVariesByStaff: true,
    duration: 60, durationMinMinutes: 30, durationMaxMinutes: 60, durationVariesByStaff: true,
  };
  const packageItem = { priceAmountMinor: 5000, duration: 30 };
  const total = sumServiceSpreads([commonOverride, varying, packageItem]);
  assert.deepEqual(total, {
    priceMinor: 28000, priceVaries: true,
    durationMinMinutes: 105, durationMaxMinutes: 135, durationVaries: true,
  });
  assert.deepEqual(formatSelectionSpread(total, "RON", "en"), {
    duration: "1h 45m – 2h 15m", price: formatMoney(28000, "RON", "en"), priceVaries: true,
  });
});

test("a fixed-price package may still have varying staff durations", () => {
  const packageItem = {
    priceAmountMinor: 22000, duration: 120,
    durationMinMinutes: 90, durationMaxMinutes: 120, durationVariesByStaff: true,
  };
  const rendered = formatServiceSpread(packageItem, "RON", "en");
  assert.equal(rendered.duration, "1h 30m – 2h");
  assert.equal(rendered.priceVaries, false);
  assert.equal(sumServiceSpreads([packageItem]).durationMinMinutes, 90);
});
