import assert from "node:assert/strict";
import test from "node:test";
import { zonedWallTimeToUtcISO } from "./tz.ts";

// These are unambiguous wall times, including the available 02:30 slots before
// Bucharest's spring and autumn clock changes. Both the displayed time and the
// booking/rescheduling payload must refer to the same instant.
const cases = [
  ["2026-03-29", "02:30", "Europe/Bucharest", "2026-03-29T00:30:00.000Z"],
  ["2026-10-25", "02:30", "Europe/Bucharest", "2026-10-24T23:30:00.000Z"],
  ["2026-03-29", "09:00", "Europe/Bucharest", "2026-03-29T06:00:00.000Z"],
  ["2026-10-25", "09:00", "Europe/Bucharest", "2026-10-25T07:00:00.000Z"],
  ["2026-10-26", "02:30", "Europe/Bucharest", "2026-10-26T00:30:00.000Z"],
  ["2026-03-29", "00:00", "Europe/Bucharest", "2026-03-28T22:00:00.000Z"],
  ["2026-10-25", "00:00", "UTC", "2026-10-25T00:00:00.000Z"],
  ["2026-03-08", "03:30", "America/New_York", "2026-03-08T07:30:00.000Z"],
  ["2026-11-01", "02:30", "America/New_York", "2026-11-01T07:30:00.000Z"],
  ["2026-10-25", "09:00", "Asia/Kolkata", "2026-10-25T03:30:00.000Z"],
  ["2026-10-04", "03:00", "Australia/Lord_Howe", "2026-10-03T16:00:00.000Z"],
];

for (const [date, time, timeZone, expected] of cases) {
  test(`${date} ${time} in ${timeZone} preserves the offered slot`, () => {
    const actual = zonedWallTimeToUtcISO(date, time, timeZone);
    assert.equal(actual, expected);
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date(actual)).map(({ type, value }) => [type, value]));
    assert.equal(`${parts.year}-${parts.month}-${parts.day}`, date);
    assert.equal(`${parts.hour}:${parts.minute}`, time);
  });
}

test("the existing choice within Bucharest's repeated hour is unchanged", () => {
  // The current HH:mm API cannot identify which occurrence was offered. This
  // regression fixes valid early-hour slots without silently choosing a new
  // repeated-hour policy; an explicit instant in that API is separate work.
  assert.equal(zonedWallTimeToUtcISO("2026-10-25", "03:30", "Europe/Bucharest"),
    "2026-10-25T01:30:00.000Z");
});
