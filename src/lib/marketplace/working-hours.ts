/**
 * Derive opening status from a venue's schedule and, when supplied, timezone.
 * Older discovery payloads omit timezone; only those retain local-clock behavior.
 * Unknown hours or an invalid supplied timezone cannot establish a status.
 */

import type { LocationCard, WorkingHoursDay } from "@/lib/api/marketplace/types";

const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function toMinutes(hhmm: unknown): number | null {
  if (typeof hhmm !== "string") return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export interface OpenStatus {
  status?: "open" | "closed" | "24-7";
  closesAt?: string;
}

function venueClock(now: Date, timezone?: string | null) {
  if (!Number.isFinite(now.getTime())) return null;
  if (timezone == null) {
    return { day: now.getDay(), minutes: now.getHours() * 60 + now.getMinutes() };
  }
  if (!timezone.trim()) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone.trim(),
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const weekday = parts.find((part) => part.type === "weekday")?.value.toLowerCase();
    const day = DAYS.findIndex((value) => value === weekday);
    const hour = Number(parts.find((part) => part.type === "hour")?.value);
    const minute = Number(parts.find((part) => part.type === "minute")?.value);
    return day >= 0 && Number.isFinite(hour) && Number.isFinite(minute)
      ? { day, minutes: hour * 60 + minute }
      : null;
  } catch {
    return null;
  }
}

function interval(day?: WorkingHoursDay) {
  if (!day?.isOpen) return null;
  const open = toMinutes(day.open);
  const close = toMinutes(day.close);
  // Equal endpoints are ambiguous; the explicit open247 flag owns all-day hours.
  return open != null && close != null && open !== close ? { open, close } : null;
}

/** Overnight hours belong to the day they start, including after midnight. */
export function openStatus(
  loc: Pick<LocationCard, "open247" | "workingHours"> & { timezone?: string | null },
  now: Date = new Date(),
): OpenStatus {
  if (loc.open247) return { status: "24-7" };
  const wh = loc.workingHours;
  if (!wh) return {}; // unknown hours → no pill
  const clock = venueClock(now, loc.timezone);
  if (!clock) return {};
  const today = wh[DAYS[clock.day]];
  const current = interval(today);
  if (current && clock.minutes >= current.open &&
      (current.close < current.open || clock.minutes < current.close)) {
    return { status: "open", closesAt: today!.close };
  }
  const yesterday = wh[DAYS[(clock.day + 6) % 7]];
  const previous = interval(yesterday);
  if (previous && previous.close < previous.open && clock.minutes < previous.close) {
    return { status: "open", closesAt: yesterday!.close };
  }
  if (!today || (today.isOpen && !current)) return {};
  return { status: "closed" };
}
