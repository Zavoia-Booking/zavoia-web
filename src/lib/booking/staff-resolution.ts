/** Resolve each original booking selection against its chosen professional.
 * Bundle prices and default-service durations remain independent of standalone
 * service overrides. All times are venue-local HH:mm values. */

import type {
  BookingDaySlots,
  ItemStaffPricing,
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

/** Locate only this selection's figures, including its original position. */
function selectionPricing(
  item: SlotItem,
  itemStaffPricing: ItemStaffPricing[] | undefined,
  itemIndex: number | undefined,
) {
  if (itemIndex == null) return undefined;
  return itemStaffPricing?.find((entry) =>
    entry.itemIndex === itemIndex && entry.type === item.type &&
    (item.type === "bundle"
      ? entry.bundleId === item.bundleId
      : entry.serviceId === item.serviceId),
  )?.staff;
}

/** Price and duration of a whole selected unit for one professional. */
export function staffFiguresForItem(
  item: SlotItem,
  staffId: number | null,
  staffPricing: StaffPricing,
  itemStaffPricing?: ItemStaffPricing[],
  itemIndex?: number,
): { priceAmountMinor: number; durationMinutes: number } {
  const fallback = {
    priceAmountMinor: item.priceAmountMinor,
    durationMinutes: item.durationMinutes,
  };
  // Bundles always retain their own total and sum of default service durations.
  if (staffId == null || item.type === "bundle") return fallback;
  const scoped = selectionPricing(item, itemStaffPricing, itemIndex);
  const entry = scoped
    ? scoped[staffId]
    : item.serviceId != null ? staffPricing[item.serviceId]?.[staffId] : undefined;
  return entry
    ? { priceAmountMinor: entry.price, durationMinutes: entry.duration }
    : fallback;
}

/** Only a real standalone-service price/duration difference forces a choice. */
export function itemVariesByStaff(
  item: SlotItem,
  staffPricing: StaffPricing,
  itemStaffPricing?: ItemStaffPricing[],
  itemIndex?: number,
): boolean {
  if (item.type === "bundle" || item.availableStaffIds.length < 2) return false;
  const scoped = selectionPricing(item, itemStaffPricing, itemIndex);
  const combos = new Set<string>();
  for (const staffId of item.availableStaffIds) {
    const entry = scoped
      ? scoped[staffId]
      : item.serviceId != null ? staffPricing[item.serviceId]?.[staffId] : undefined;
    if (!entry) continue;
    combos.add(`${entry.price}:${entry.duration}`);
    if (combos.size > 1) return true;
  }
  return false;
}

/**
 * Re-resolve every item of a slot against the current staff picks, re-chaining
 * the wall-clock ranges so a shorter first service pulls the rest earlier.
 */
export function resolveSlotItems(
  slot: TimeSlot,
  staffPicks: StaffPicks,
  staffPricing: StaffPricing,
  itemStaffPricing?: ItemStaffPricing[],
): ResolvedSlotItem[] {
  let cursor = toMinutes(slot.startTime);
  return slot.items.map((item, idx) => {
    const staffId = staffPicks[idx] ?? null;
    const { priceAmountMinor, durationMinutes } = staffFiguresForItem(
      item,
      staffId,
      staffPricing,
      itemStaffPricing,
      idx,
    );
    const startTime = toClock(cursor);
    cursor += durationMinutes;
    return {
      priceAmountMinor,
      durationMinutes,
      startTime,
      endTime: toClock(cursor),
      variesByStaff: itemVariesByStaff(item, staffPricing, itemStaffPricing, idx),
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
  itemStaffPricing?: ItemStaffPricing[],
): boolean {
  if (!slot) return false;
  return slot.items.some(
    (item, idx) => staffPicks[idx] == null && itemVariesByStaff(item, staffPricing, itemStaffPricing, idx),
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
  itemStaffPricing?: ItemStaffPricing[],
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
      const f = staffFiguresForItem(item, staffId, staffPricing, itemStaffPricing, idx);
      priceMinor += f.priceAmountMinor;
      durationMinMinutes += f.durationMinutes;
      durationMaxMinutes += f.durationMinutes;
      return;
    }

    // Nobody picked yet: fold in every candidate's figures to get the real
    // bounds. Falls back to the slot's own (already conservative) numbers when
    // staffPricing has nothing for this item.
    const figures = item.availableStaffIds.map((sid) =>
      staffFiguresForItem(item, sid, staffPricing, itemStaffPricing, idx),
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
