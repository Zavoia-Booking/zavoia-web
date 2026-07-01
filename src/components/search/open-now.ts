/**
 * Best-effort "open now" check, used by the "open now" filter. Delegates to
 * `openStatus` so the open/closed logic lives in one place. open247 → true;
 * open within today's hours → true; otherwise (closed / unknown hours) → false.
 */

import { openStatus } from "@/lib/marketplace/working-hours";
import type { LocationCard } from "@/lib/api/marketplace/types";

export function isOpenNow(loc: LocationCard, now: Date = new Date()): boolean {
  const s = openStatus(loc, now).status;
  return s === "open" || s === "24-7";
}
