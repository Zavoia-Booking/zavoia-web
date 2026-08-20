/**
 * Resolving a slot against the professional the customer actually picked.
 *
 * The slots endpoint computes a day's availability WITHOUT knowing who will
 * serve it, so each item carries conservative figures: the longest duration any
 * capable professional needs (a slot must fit whoever ends up assigned) and the
 * lowest price they charge (the "from" figure the listing advertises). The
 * response also ships `staffPricing` — every professional's exact price and
 * duration for every service in the selection — precisely so the client can
 * re-resolve those figures the moment someone is chosen, with no refetch and no
 * reshuffling of the slot list under the customer.
 *
 * Everything here is pure and works on `HH:mm` wall-clock strings in the
 * location's timezone, matching the API.
 */

import type {
  BookingDaySlots,
  SlotItem,
  TimeSlot,
} from "@/lib/api/marketplace/types";

type StaffPricing = BookingDaySlots["staffPricing"];
/** slot-item index → chosen staffId. */
type StaffPicks = Record<number, number>;

export interface ResolvedSlotItem {
  /** Figures for the chosen professional, or the slot's own while none is. */
  priceAmountMinor: number;
  durationMinutes: number;
  /** Re-chained wall-clock range, so a faster professional shortens the visit. */
  startTime: string;
  endTime: string;
  /**
   * The professionals available for this item don't all charge the same price
   * or take the same time — so we must not pick one on the customer's behalf.
   */
  variesByStaff: boolean;
  staffId: number | null;
}

function toMinutes(clock: string): number {
  const [h, m] = clock.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function toClock(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** The service ids a slot item is priced from — one for a service, many for a bundle. */
function serviceIdsOf(item: SlotItem): number[] {
  if (item.type === "service") {
    return item.serviceId != null ? [item.serviceId] : [];
  }
  return (item.services ?? []).map((s) => s.serviceId);
}

/**
 * Do the professionals available for this item differ in what they charge or
 * how long they take? Two identical-looking professionals are NOT a variance —
 * only a real difference forces a choice.
 */
export function itemVariesByStaff(
  item: SlotItem,
  staffPricing: StaffPricing,
): boolean {
  if (item.availableStaffIds.length < 2) return false;
  const serviceIds = serviceIdsOf(item);
  if (serviceIds.length === 0) return false;

  const combos = new Set<string>();
  for (const staffId of item.availableStaffIds) {
    let price = 0;
    let duration = 0;
    let complete = true;
    for (const serviceId of serviceIds) {
      const entry = staffPricing[serviceId]?.[staffId];
      if (!entry) {
        complete = false;
        break;
      }
      price += entry.price;
      duration += entry.duration;
    }
    // A professional missing from staffPricing tells us nothing — skip rather
    // than inventing a difference that would force a pointless choice.
    if (!complete) continue;
    combos.add(`${price}:${duration}`);
    if (combos.size > 1) return true;
  }
  return false;
}

/** Price + duration of one item for one professional (or the slot's own figures). */
export function staffFiguresForItem(
  item: SlotItem,
  staffId: number | null,
  staffPricing: StaffPricing,
): { priceAmountMinor: number; durationMinutes: number } {
  const fallback = {
    priceAmountMinor: item.priceAmountMinor,
    durationMinutes: item.durationMinutes,
  };
  if (staffId == null) return fallback;

  if (item.type === "service") {
    const entry =
      item.serviceId != null ? staffPricing[item.serviceId]?.[staffId] : undefined;
    return entry
      ? { priceAmountMinor: entry.price, durationMinutes: entry.duration }
      : fallback;
  }

  // A bundle is priced as a package, so only its duration follows the
  // professional — summed across the services they'll chain back-to-back.
  const services = item.services ?? [];
  if (services.length === 0) return fallback;
  let duration = 0;
  let anyKnown = false;
  for (const svc of services) {
    const entry = staffPricing[svc.serviceId]?.[staffId];
    if (entry) {
      duration += entry.duration;
      anyKnown = true;
    } else {
      duration += svc.durationMinutes;
    }
  }
  return {
    priceAmountMinor: item.priceAmountMinor,
    durationMinutes: anyKnown ? duration : item.durationMinutes,
  };
}

/**
 * Re-resolve every item of a slot against the current staff picks, re-chaining
 * the wall-clock ranges so a shorter first service pulls the rest earlier.
 */
export function resolveSlotItems(
  slot: TimeSlot,
  staffPicks: StaffPicks,
  staffPricing: StaffPricing,
): ResolvedSlotItem[] {
  let cursor = toMinutes(slot.startTime);
  return slot.items.map((item, idx) => {
    const staffId = staffPicks[idx] ?? null;
    const { priceAmountMinor, durationMinutes } = staffFiguresForItem(
      item,
      staffId,
      staffPricing,
    );
    const startTime = toClock(cursor);
    cursor += durationMinutes;
    return {
      priceAmountMinor,
      durationMinutes,
      startTime,
      endTime: toClock(cursor),
      variesByStaff: itemVariesByStaff(item, staffPricing),
      staffId,
    };
  });
}

/**
 * True while some item whose professionals differ still has no choice made.
 * Gates "continue" — booking one of those without an explicit pick would be us
 * choosing the customer's price for them.
 */
export function needsStaffChoice(
  slot: TimeSlot | null,
  staffPicks: StaffPicks,
  staffPricing: StaffPricing,
): boolean {
  if (!slot) return false;
  return slot.items.some(
    (item, idx) => staffPicks[idx] == null && itemVariesByStaff(item, staffPricing),
  );
}

/**
 * The spread of a chosen slot given the picks made so far.
 *
 * A slot's own figures are staff-agnostic: the LOWEST price any capable
 * professional charges and the LONGEST time any of them needs. So until every
 * varying item has a professional, the total is a floor with a duration range,
 * not an exact figure — and the footer must say so. Once all picks are in, the
 * bounds collapse and it renders exactly like a resolved price.
 */
export function slotSpread(
  slot: TimeSlot,
  staffPicks: StaffPicks,
  staffPricing: StaffPricing,
): {
  priceMinor: number;
  priceVaries: boolean;
  durationMinMinutes: number;
  durationMaxMinutes: number;
  durationVaries: boolean;
} {
  let priceMinor = 0;
  let priceVaries = false;
  let durationMinMinutes = 0;
  let durationMaxMinutes = 0;
  let durationVaries = false;

  slot.items.forEach((item, idx) => {
    const staffId = staffPicks[idx] ?? null;
    if (staffId != null) {
      const f = staffFiguresForItem(item, staffId, staffPricing);
      priceMinor += f.priceAmountMinor;
      durationMinMinutes += f.durationMinutes;
      durationMaxMinutes += f.durationMinutes;
      return;
    }

    // Nobody picked yet: fold in every candidate's figures to get the real
    // bounds. Falls back to the slot's own (already conservative) numbers when
    // staffPricing has nothing for this item.
    const figures = item.availableStaffIds.map((sid) =>
      staffFiguresForItem(item, sid, staffPricing),
    );
    if (figures.length === 0) {
      priceMinor += item.priceAmountMinor;
      durationMinMinutes += item.durationMinutes;
      durationMaxMinutes += item.durationMinutes;
      return;
    }

    const prices = figures.map((f) => f.priceAmountMinor);
    const durations = figures.map((f) => f.durationMinutes);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    priceMinor += minPrice;
    priceVaries ||= minPrice !== maxPrice;
    durationMinMinutes += minDuration;
    durationMaxMinutes += maxDuration;
    durationVaries ||= minDuration !== maxDuration;
  });

  return {
    priceMinor,
    priceVaries,
    durationMinMinutes,
    durationMaxMinutes,
    durationVaries,
  };
}
