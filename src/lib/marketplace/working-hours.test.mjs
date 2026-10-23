import assert from "node:assert/strict";
import test from "node:test";
import { openStatus } from "./working-hours.ts";

const hours = (open, close) => ({ isOpen: true, open, close });
const closed = { isOpen: false, open: "00:00", close: "00:00" };
const venue = (workingHours, timezone = "Europe/Bucharest") => ({ open247: false, timezone, workingHours });

test("venue timezone determines both weekday and clock across midnight", () => {
  const instant = new Date("2026-10-18T23:30:00Z");
  const schedule = { monday: hours("02:00", "04:00"), sunday: closed };
  assert.deepEqual(openStatus(venue(schedule), instant), { status: "open", closesAt: "04:00" });
  assert.deepEqual(openStatus(venue(schedule, "America/Los_Angeles"), instant), { status: "closed" });
});

test("venue hours follow DST changes and remain closed at the exact closing minute", () => {
  const schedule = venue({ sunday: hours("09:00", "19:00") });
  assert.equal(openStatus(schedule, new Date("2026-10-18T06:00:00Z")).status, "open");
  assert.equal(openStatus(schedule, new Date("2026-10-25T06:00:00Z")).status, "closed");
  assert.equal(openStatus(schedule, new Date("2026-10-25T07:00:00Z")).status, "open");
  assert.equal(openStatus(schedule, new Date("2026-10-25T17:00:00Z")).status, "closed");
});

test("overnight hours continue from the previous day even when today is closed", () => {
  const schedule = venue({ friday: closed, saturday: hours("22:00", "02:00"), sunday: closed }, "UTC");
  assert.deepEqual(openStatus(schedule, new Date("2026-10-18T01:00:00Z")), { status: "open", closesAt: "02:00" });
  assert.equal(openStatus(schedule, new Date("2026-10-18T02:00:00Z")).status, "closed");
  assert.equal(openStatus(schedule, new Date("2026-10-17T01:00:00Z")).status, "closed");
  assert.equal(openStatus(schedule, new Date("2026-10-17T22:00:00Z")).status, "open");
});

test("overnight carry handles the Sunday-to-Monday week boundary", () => {
  assert.deepEqual(openStatus(venue({ sunday: hours("20:00", "03:00") }, "UTC"), new Date("2026-10-19T01:00:00Z")), {
    status: "open", closesAt: "03:00",
  });
});

test("an unpublished day stays unknown unless yesterday's overnight hours still apply", () => {
  const instant = new Date("2026-10-19T12:00:00Z");
  assert.deepEqual(openStatus(venue({}, "UTC"), instant), {});
  assert.deepEqual(openStatus(venue({ sunday: hours("20:00", "03:00") }, "UTC"), instant), {});
  assert.deepEqual(openStatus(venue({ monday: closed }, "UTC"), instant), { status: "closed" });
});

test("malformed hours and supplied invalid timezones remain unknown", () => {
  const now = new Date("2026-10-19T12:00:00Z");
  for (const timezone of ["Invalid/Zone", " "]) {
    assert.deepEqual(openStatus(venue({ monday: hours("09:00", "19:00") }, timezone), now), {});
  }
  for (const [open, close] of [["25:00", "19:00"], ["09:00", "19:60"], [null, "19:00"], ["09:00", "09:00"]]) {
    assert.deepEqual(openStatus(venue({ monday: hours(open, close) }, "UTC"), now), {});
  }
  assert.deepEqual(openStatus(venue(null), now), {});
  assert.deepEqual(openStatus(venue({ monday: hours("09:00", "19:00") }), new Date(NaN)), {});
});

test("explicit all-day availability and legacy callers keep their supported behavior", () => {
  assert.deepEqual(openStatus({ open247: true, workingHours: null, timezone: "UTC" }), { status: "24-7" });
  const localMonday = new Date(2026, 9, 19, 10, 0);
  assert.deepEqual(openStatus({ open247: false, workingHours: { monday: hours("09:00", "19:00") } }, localMonday), {
    status: "open", closesAt: "19:00",
  });
});
