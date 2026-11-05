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

export type Weekday = (typeof DAYS)[number];

/** Stable display order for the published weekly schedule. */
export const WEEKDAYS: readonly Weekday[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

type VenueSchedule = Pick<LocationCard, "open247" | "workingHours"> & { timezone?: string | null };

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

/** The venue's weekday and wall-clock minute, never the visitor's timezone when supplied. */
export function venueClock(now: Date, timezone?: string | null): { day: Weekday; minutes: number } | null {
  if (!Number.isFinite(now.getTime())) return null;
  if (timezone == null) {
    return { day: DAYS[now.getDay()], minutes: now.getHours() * 60 + now.getMinutes() };
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
      ? { day: DAYS[day], minutes: hour * 60 + minute }
      : null;
  } catch {
    return null;
  }
}

export type NormalizedWorkingHoursDay =
  | { kind: "unknown" }
  | { kind: "closed" }
  | {
    kind: "open";
    open: string;
    close: string;
    openMinutes: number;
    closeMinutes: number;
    overnight: boolean;
  };

export type OpeningInterval = Extract<NormalizedWorkingHoursDay, { kind: "open" }>;

const formatMinutes = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** One defensive interpretation shared by the timetable, status and next opening. */
export function parseWorkingHoursDay(day?: WorkingHoursDay | null): NormalizedWorkingHoursDay {
  if (day?.isOpen === false) return { kind: "closed" };
  if (day?.isOpen !== true) return { kind: "unknown" };
  const open = toMinutes(day.open);
  const close = toMinutes(day.close);
  // Equal endpoints are ambiguous; the explicit open247 flag owns all-day hours.
  return open != null && close != null && open !== close
    ? { kind: "open", open: formatMinutes(open), close: formatMinutes(close), openMinutes: open, closeMinutes: close, overnight: close < open }
    : { kind: "unknown" };
}

export interface CurrentOpening {
  /** The weekday on which this interval starts, including yesterday's overnight hours. */
  day: Weekday;
  startedPreviousDay: boolean;
  hours: OpeningInterval;
}

function openingAt(loc: VenueSchedule, clock: NonNullable<ReturnType<typeof venueClock>>): CurrentOpening | null {
  const current = parseWorkingHoursDay(loc.workingHours?.[clock.day]);
  if (current.kind === "open" && clock.minutes >= current.openMinutes &&
      (current.overnight || clock.minutes < current.closeMinutes)) {
    return { day: clock.day, startedPreviousDay: false, hours: current };
  }
  const previousDay = DAYS[(DAYS.indexOf(clock.day) + 6) % 7];
  const previous = parseWorkingHoursDay(loc.workingHours?.[previousDay]);
  if (previous.kind === "open" && previous.overnight && clock.minutes < previous.closeMinutes) {
    return { day: previousDay, startedPreviousDay: true, hours: previous };
  }
  return null;
}

/** Metadata for explaining an active overnight interval without changing its published day. */
export function currentOpening(loc: VenueSchedule, now: Date = new Date()): CurrentOpening | null {
  if (loc.open247 || !loc.workingHours) return null;
  const clock = venueClock(now, loc.timezone);
  return clock ? openingAt(loc, clock) : null;
}

/** Overnight hours belong to the day they start, including after midnight. */
export function openStatus(
  loc: VenueSchedule,
  now: Date = new Date(),
): OpenStatus {
  if (loc.open247) return { status: "24-7" };
  const wh = loc.workingHours;
  if (!wh) return {}; // unknown hours → no pill
  const clock = venueClock(now, loc.timezone);
  if (!clock) return {};
  const active = openingAt(loc, clock);
  if (active) return { status: "open", closesAt: active.hours.close };
  if (parseWorkingHoursDay(wh[clock.day]).kind === "unknown") return {};
  return { status: "closed" };
}

export interface NextOpening {
  /** Days after the venue's today: 0 is later today, 1 tomorrow, up to 7. */
  inDays: number;
  /** The `workingHours` key of that day, e.g. "monday". */
  day: Weekday;
  opensAt: string;
}

/** When a venue that is closed now opens again, looking one week ahead. */
export function nextOpening(
  loc: VenueSchedule,
  now: Date = new Date(),
): NextOpening | null {
  const wh = loc.workingHours;
  if (loc.open247 || !wh) return null;
  const clock = venueClock(now, loc.timezone);
  if (!clock) return null;
  for (let inDays = 0; inDays <= 7; inDays++) {
    const day = DAYS[(DAYS.indexOf(clock.day) + inDays) % 7];
    const hours = parseWorkingHoursDay(wh[day]);
    if (hours.kind !== "open" || (inDays === 0 && clock.minutes >= hours.openMinutes)) continue;
    return { inDays, day, opensAt: hours.open };
  }
  return null;
}
