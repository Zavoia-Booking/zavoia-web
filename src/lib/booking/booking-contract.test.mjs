import assert from "node:assert/strict";
import test from "node:test";
import { itemVariesByStaff, needsStaffChoice, resolveSlotItems, slotSpread, staffFiguresForItem } from "./staff-resolution.ts";
import { exactSlotSelection, findExactSlot } from "./sequence.ts";
import { addWallDays } from "./tz.ts";

const service = { type: "service", serviceId: 1, priceAmountMinor: 10000, durationMinutes: 30, availableStaffIds: [7, 8], defaultStaffId: 7 };
const bundle = { type: "bundle", bundleId: 2, priceAmountMinor: 6000, durationMinutes: 60, availableStaffIds: [7, 8], defaultStaffId: 7,
  services: [{ serviceId: 1, durationMinutes: 30 }, { serviceId: 3, durationMinutes: 30 }] };
const legacy = { 1: { 7: { price: 3000, duration: 10 }, 8: { price: 3000, duration: 40 } } };

for (const reverse of [false, true]) {
  test(`standalone override and containing bundle stay independent, reverse=${reverse}`, () => {
    const items = reverse ? [bundle, service] : [service, bundle];
    const slot = { startTime: "09:00", items };
    const scoped = items.map((item, itemIndex) => ({ itemIndex, type: item.type, serviceId: item.serviceId, bundleId: item.bundleId,
      staff: { 7: { price: item.type === "service" ? 10000 : 6000, duration: item.type === "service" ? 20 : 60 },
        8: { price: item.type === "service" ? 15000 : 6000, duration: item.type === "service" ? 40 : 60 } } }));
    const figures = resolveSlotItems(slot, { 0: 7, 1: 7 }, legacy, scoped);
    assert.equal(figures.reduce((sum, item) => sum + item.priceAmountMinor, 0), 16000);
    assert.equal(figures.reduce((sum, item) => sum + item.durationMinutes, 0), 80);
    assert.equal(slotSpread(slot, { 0: 7, 1: 7 }, legacy, scoped).priceMinor, 16000);
    const serviceIndex = reverse ? 1 : 0;
    assert.equal(itemVariesByStaff(service, legacy, scoped, serviceIndex), true);
    assert.equal(needsStaffChoice(slot, {}, legacy, scoped), true);
    assert.equal(needsStaffChoice(slot, { [serviceIndex]: 7 }, legacy, scoped), false);
  });
}

test("bundle never inherits standalone staff price or duration, including legacy responses", () => {
  assert.deepEqual(staffFiguresForItem(bundle, 7, legacy), { priceAmountMinor: 6000, durationMinutes: 60 });
  assert.equal(itemVariesByStaff(bundle, legacy), false);
});

test("selection index distinguishes repeated standalone selections and zero overrides", () => {
  const scoped = [0, 1].map((itemIndex) => ({ itemIndex, type: "service", serviceId: 1,
    staff: { 7: { price: itemIndex === 0 ? 0 : 12000, duration: 15 } } }));
  const result = resolveSlotItems({ startTime: "09:00", items: [service, service] }, { 0: 7, 1: 7 }, legacy, scoped);
  assert.deepEqual(result.map((item) => item.priceAmountMinor), [0, 12000]);
  assert.deepEqual(result.map((item) => item.startTime), ["09:00", "09:15"]);
});

test("exact sequence preserves ordered units and rejects a moved second professional", () => {
  const slot = { startTime: "09:00", items: [service, bundle] };
  const selections = exactSlotSelection(slot, { 0: 8, 1: 7 });
  assert.deepEqual(selections, [{ serviceId: 1, teamMemberId: 8 }, { bundleId: 2, teamMemberId: 7 }]);
  const day = { date: "2026-10-26", slots: [slot] };
  assert.equal(findExactSlot(day, day.date, "09:00", selections), slot);
  assert.equal(findExactSlot({ ...day, slots: [] }, day.date, "09:00", selections), undefined);
  assert.equal(findExactSlot(day, "2026-10-27", "09:00", selections), undefined);
  assert.equal(findExactSlot(day, day.date, "09:00", [...selections].reverse()), undefined);
  assert.equal(findExactSlot({ ...day, slots: [{ ...slot, items: [service, { ...bundle, availableStaffIds: [8] }] }] }, day.date, "09:00", selections), undefined);
});

test("calendar paging preserves wall dates across month, year and DST boundaries", () => {
  assert.equal(addWallDays("2026-10-31", 1), "2026-11-01");
  assert.equal(addWallDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addWallDays("2026-03-28", 2), "2026-03-30");
});
