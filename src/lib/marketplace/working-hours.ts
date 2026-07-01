/**
 * Best-effort open/closed status from a LocationCard's workingHours/open247.
 * The API does not return a live open/closed flag, so this is a client-side
 * approximation against the visitor's local clock (the location's timezone is
 * NOT applied — same known limitation as the old isOpenNow). When working hours
 * are absent we return no status (the row shows no pill).
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

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  return h * 60 + min;
}

export interface OpenStatus {
  status?: "open" | "closed" | "24-7";
  closesAt?: string;
}

/** Best-effort open/closed from workingHours/open247 against the visitor's local
 *  clock (location timezone NOT applied — same known limitation as isOpenNow).
 *  Accepts any object carrying the two fields it reads, so listing-detail
 *  locations (which aren't full LocationCards) can reuse it too. */
export function openStatus(
  loc: Pick<LocationCard, "open247" | "workingHours">,
  now: Date = new Date(),
): OpenStatus {
  if (loc.open247) return { status: "24-7" };
  const wh = loc.workingHours;
  if (!wh) return {}; // unknown hours → no pill
  const today: WorkingHoursDay | undefined = wh[DAYS[now.getDay()]];
  if (!today || !today.isOpen) return { status: "closed" };
  const open = toMinutes(today.open);
  const close = toMinutes(today.close);
  if (open == null || close == null) return { status: "closed" };
  const cur = now.getHours() * 60 + now.getMinutes();
  if (cur >= open && cur < close) return { status: "open", closesAt: today.close };
  return { status: "closed" };
}
