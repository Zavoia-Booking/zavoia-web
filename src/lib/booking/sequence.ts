import type { BookingDaySlots, ServiceSelection, TimeSlot } from "@/lib/api/marketplace/types";

/** Pin every original unit, retaining selection order and bundle boundaries. */
export function exactSlotSelection(slot: TimeSlot, picks: Record<number, number>): ServiceSelection[] {
  return slot.items.map((item, index) => ({
    ...(item.type === "bundle" ? { bundleId: item.bundleId } : { serviceId: item.serviceId }),
    teamMemberId: picks[index] ?? item.defaultStaffId ?? item.availableStaffIds[0],
  }));
}

/** A pinned quote must describe the same ordered units at the chosen start. */
export function findExactSlot(
  response: BookingDaySlots,
  date: string,
  startTime: string,
  selections: ServiceSelection[],
): TimeSlot | undefined {
  if (response.date !== date) return undefined;
  return response.slots.find((slot) => slot.startTime === startTime &&
    slot.items.length === selections.length && slot.items.every((item, index) => {
      const selection = selections[index];
      return selection.teamMemberId != null && item.availableStaffIds.includes(selection.teamMemberId) &&
        (item.type === "bundle"
          ? selection.bundleId === item.bundleId && selection.serviceId == null
          : selection.serviceId === item.serviceId && selection.bundleId == null);
    }));
}
