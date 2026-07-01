/**
 * Appointments view-model helpers — pure, side-effect-free.
 *
 * This module ports the receipt/ticket helper logic from the prototype
 * `docs/web-appointments.jsx` (lines 18–87) and the detail stamp from
 * `docs/web-appointment-detail.jsx` (lines 102–109) onto the LIVE marketplace
 * API shape (`AppointmentListItem` / `AppointmentDetail`).
 *
 * Differences from the prototype, on purpose:
 * - No frozen `window.ZV_TODAY` clock — every helper takes the real `Date` (an
 *   optional `now` arg, defaulting to `new Date()`), so callers stay testable.
 * - Money is NEVER symbol-assumed. The prototype's `zwSchedPrice` is dropped;
 *   `formatApptPrice` delegates to `formatMoney(minorUnits, currencyIso, locale)`.
 * - i18n is intentionally NOT done here. Time-until / stamp helpers return
 *   STRUCTURED descriptors; the consuming component maps them to dictionary
 *   strings (`appointments.timeUntil.*`, `appointments.stamps.*`, …).
 * - Runtime-string gotcha: numeric API fields can arrive as numeric strings,
 *   so `formatApptPrice` coerces with `Number(...)` before any comparison.
 *
 * Everything here is pure: no React, no JSX, no module-level state.
 */

import type { AppointmentStatus } from "@/lib/api/marketplace/types";
import { formatMoney } from "@/lib/format/money-time";

/** When an appointment sits relative to "now". `now` = live (in progress). */
export type Tense = "now" | "today" | "future" | "past";

/** Visual tone for the detail status pill. */
export type StatusTone =
  | "live"
  | "success"
  | "info"
  | "neutral"
  | "pending"
  | "warning"
  | "error";

/**
 * Structured "time until" descriptor for the list chip. The component picks the
 * matching `appointments.timeUntil.*` string (and singular/plural variants).
 */
export type TimeUntil =
  | { kind: "live" }
  | { kind: "pending" } // "Awaiting"
  | { kind: "soon"; variant: "starting" } // diff <= 0
  | { kind: "soon"; variant: "minutes"; value: number }
  | { kind: "today"; variant: "hours"; value: number }
  | { kind: "future"; variant: "tomorrow" }
  | { kind: "future"; variant: "days" | "weeks" | "months"; value: number };

/** Structured dashed-stamp descriptor for the list ticket. */
export type ApptStamp = {
  key: "cancelled" | "noShow" | "pending" | "live";
  color: string;
  pulse?: boolean;
};

/** Status dot colour for the list (CSS custom-property strings). */
export const STATUS_DOT_COLOR: Record<AppointmentStatus, string> = {
  confirmed: "var(--s-info-600)",
  pending: "var(--c-900)",
  completed: "var(--s-success-600)",
  cancelled: "var(--s-warning-600)",
  no_show: "var(--s-error-600)",
};

/**
 * Stored status → detail-pill tone. The `live` tone is NOT stored here; it is
 * derived from tense via `apptStatusTone`.
 */
export const STATUS_TONE: Record<AppointmentStatus, StatusTone> = {
  pending: "pending",
  confirmed: "success",
  completed: "neutral",
  cancelled: "warning",
  no_show: "error",
};

/**
 * Classify an appointment's position in time.
 * - `"now"`  → confirmed AND `now` is within [scheduledAt, endsAt].
 * - `"today"`→ same calendar day as `now` AND still in the future.
 * - `"future"`→ scheduled after `now`.
 * - `"past"` → otherwise.
 */
export function deriveTense(
  scheduledAt: string,
  endsAt: string,
  status: AppointmentStatus,
  now: Date = new Date(),
): Tense {
  const start = new Date(scheduledAt);
  const end = new Date(endsAt);
  const t = now.getTime();

  if (status === "confirmed" && t >= start.getTime() && t <= end.getTime()) {
    return "now";
  }

  const sameDay =
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate();

  if (sameDay && start.getTime() > t) return "today";
  if (start.getTime() > t) return "future";
  return "past";
}

/**
 * Build the list time-until chip descriptor. Returns `null` when no chip should
 * show (non-confirmed, non-pending appointments). i18n is left to the caller.
 *
 * Ported from `docs/web-appointments.jsx:48–62`, using the real `Date`.
 */
export function timeUntil(
  scheduledAt: string,
  status: AppointmentStatus,
  tense: Tense,
  now: Date = new Date(),
): TimeUntil | null {
  if (tense === "now") return { kind: "live" };
  // Past appointments never show a countdown chip — a confirmed-but-past
  // appointment (backend hasn't transitioned it to completed yet) would
  // otherwise compute diff <= 0 and wrongly read "Starting".
  if (tense === "past") return null;
  if (status === "pending") return { kind: "pending" };
  if (status !== "confirmed") return null;

  const diff = Math.round(
    (new Date(scheduledAt).getTime() - now.getTime()) / 60000,
  );

  if (diff <= 0) return { kind: "soon", variant: "starting" };
  if (diff < 60) return { kind: "soon", variant: "minutes", value: diff };
  if (diff < 1440) {
    return { kind: "today", variant: "hours", value: Math.floor(diff / 60) };
  }

  const days = Math.floor(diff / 1440);
  if (days === 1) return { kind: "future", variant: "tomorrow" };
  if (days < 7) return { kind: "future", variant: "days", value: days };
  if (days < 30) {
    return { kind: "future", variant: "weeks", value: Math.floor(days / 7) };
  }
  return { kind: "future", variant: "months", value: Math.floor(days / 30) };
}

/**
 * Rotated dashed "stamp" for the list ticket, or `null` when none applies.
 * Ported from `docs/web-appointments.jsx:81–87`.
 */
export function apptStamp(
  status: AppointmentStatus,
  tense: Tense,
): ApptStamp | null {
  if (status === "cancelled") {
    return { key: "cancelled", color: "var(--s-warning-600)" };
  }
  if (status === "no_show") {
    return { key: "noShow", color: "var(--s-error-600)" };
  }
  if (status === "pending") {
    return { key: "pending", color: "var(--c-900)" };
  }
  if (tense === "now") {
    return { key: "live", color: "var(--s-success-600)", pulse: true };
  }
  return null;
}

/**
 * Date-pill parts for the timeline rail. `dow`/`mon` are 3-letter UPPERCASE,
 * `day` is the day-of-month number. Localized via `toLocaleDateString`.
 */
export function apptDateParts(
  iso: string,
  locale: string,
): { dow: string; day: number; mon: string } {
  const d = new Date(iso);
  const dow = d.toLocaleDateString(locale, { weekday: "short" }).toUpperCase();
  const mon = d.toLocaleDateString(locale, { month: "short" }).toUpperCase();
  return { dow, day: d.getDate(), mon };
}

/** Local clock time as `HH:mm` (24-hour). */
export function apptTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

/**
 * Format an appointment price. `price` is integer minor units (but can arrive
 * as a numeric STRING at runtime, so coerce). Zero → `freeLabel`; otherwise
 * delegate to `formatMoney` so the currency symbol comes from `Intl`.
 */
export function formatApptPrice(
  price: number,
  currency: string,
  locale: string,
  freeLabel: string,
): string {
  const minor = Number(price);
  if (minor === 0) return freeLabel;
  return formatMoney(minor, currency, locale);
}

/**
 * Tone for the detail status pill. `"live"` when in progress, otherwise the
 * stored status tone.
 */
export function apptStatusTone(
  status: AppointmentStatus,
  tense: Tense,
): StatusTone {
  if (tense === "now") return "live";
  return STATUS_TONE[status];
}
