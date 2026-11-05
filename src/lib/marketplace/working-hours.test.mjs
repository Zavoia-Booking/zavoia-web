import assert from "node:assert/strict";
import test from "node:test";
import { currentOpening, nextOpening, openStatus, parseWorkingHoursDay, venueClock } from "./working-hours.ts";

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

test("the displayed day model distinguishes unpublished, invalid and explicitly closed schedules", () => {
  for (const day of [undefined, null, {}, hours("09:00", "09:00"), hours("24:00", "19:00"), hours("09:00", "19:60")]) {
    assert.deepEqual(parseWorkingHoursDay(day), { kind: "unknown" });
  }
  assert.deepEqual(parseWorkingHoursDay({ isOpen: false, open: "invalid", close: "invalid" }), { kind: "closed" });
  assert.deepEqual(parseWorkingHoursDay(hours(" 9:00 ", "19:00")), {
    kind: "open", open: "09:00", close: "19:00", openMinutes: 540, closeMinutes: 1140, overnight: false,
  });
  assert.deepEqual(parseWorkingHoursDay(hours("22:30", "2:00")), {
    kind: "open", open: "22:30", close: "02:00", openMinutes: 1350, closeMinutes: 120, overnight: true,
  });
});

test("active interval metadata identifies yesterday without relabelling today's published schedule", () => {
  const schedule = venue({ saturday: hours("22:00", "2:00"), sunday: closed }, "UTC");
  const sunday = new Date("2026-10-18T01:00:00Z");
  assert.deepEqual(currentOpening(schedule, sunday), {
    day: "saturday", startedPreviousDay: true,
    hours: { kind: "open", open: "22:00", close: "02:00", openMinutes: 1320, closeMinutes: 120, overnight: true },
  });
  assert.deepEqual(openStatus(schedule, sunday), { status: "open", closesAt: "02:00" });
  assert.deepEqual(parseWorkingHoursDay(schedule.workingHours.sunday), { kind: "closed" });
  assert.equal(currentOpening(schedule, new Date("2026-10-18T02:00:00Z")), null);
  assert.equal(currentOpening(schedule, new Date("2026-10-17T23:00:00Z"))?.startedPreviousDay, false);
});

test("next opening uses the same validated and padded times as the timetable", () => {
  const schedule = venue({ monday: hours("9:00", "19:00"), tuesday: hours("08:00", "08:00"), wednesday: hours("8:30", "18:00") }, "UTC");
  assert.deepEqual(nextOpening(schedule, new Date("2026-10-19T08:00:00Z")), { inDays: 0, day: "monday", opensAt: "09:00" });
  assert.deepEqual(nextOpening(schedule, new Date("2026-10-19T09:00:00Z")), { inDays: 2, day: "wednesday", opensAt: "08:30" });
  assert.deepEqual(nextOpening(venue({ monday: hours("09:00", "19:00") }, "UTC"), new Date("2026-10-19T20:00:00Z")), {
    inDays: 7, day: "monday", opensAt: "09:00",
  });
  assert.equal(nextOpening(venue({ monday: hours("09:00", "09:00") }, "UTC"), new Date("2026-10-19T08:00:00Z")), null);
  assert.equal(nextOpening({ ...schedule, open247: true }), null);
});

test("the shared venue clock returns a named weekday in the supplied venue timezone", () => {
  const instant = new Date("2026-10-18T23:30:00Z");
  assert.deepEqual(venueClock(instant, "Europe/Bucharest"), { day: "monday", minutes: 150 });
  assert.deepEqual(venueClock(instant, "America/Los_Angeles"), { day: "sunday", minutes: 990 });
  assert.equal(venueClock(instant, "Invalid/Zone"), null);
});
