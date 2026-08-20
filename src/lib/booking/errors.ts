import { ApiError } from "@/lib/api/http";

/**
 * Permanent booking blocks — the CUSTOMER_BOOKING.* error family thrown by the
 * availability endpoints (calendar / slots) and the booking submit when the
 * request references marketplace state that no longer exists: venue delisted,
 * service removed from the location, no capable staff, or a pinned
 * professional who no longer performs the service. Retrying can never succeed,
 * so callers should replace the retry UI with an honest, named message.
 */
export type BookingBlockKind =
  | "business"
  | "booking-off"
  | "location"
  | "service"
  | "no-staff"
  | "staff-pin";

export interface BookingBlock {
  kind: BookingBlockKind;
  /** The offending service id when the backend names one (E05/E06/E08). */
  serviceId: number | null;
}

const CODE_TO_KIND: Record<string, BookingBlockKind> = {
  "CUSTOMER_BOOKING.E01": "business", // business not found
  "CUSTOMER_BOOKING.E02": "business", // business off marketplace
  // Kept separate from E01/E02: the venue is perfectly present on the
  // marketplace and simply doesn't take online bookings, so it must NOT read
  // like a delisted listing (or like our platform is broken).
  "CUSTOMER_BOOKING.E14": "booking-off", // online booking disabled by the business
  "CUSTOMER_BOOKING.E03": "location", // location not found
  "CUSTOMER_BOOKING.E04": "location", // location off marketplace
  "CUSTOMER_BOOKING.E05": "service", // service not found
  "CUSTOMER_BOOKING.E06": "service", // service not offered at this location
  "CUSTOMER_BOOKING.E07": "no-staff", // nobody performs the service here
  "CUSTOMER_BOOKING.E13": "no-staff", // nobody can perform all bundle services
  "CUSTOMER_BOOKING.E08": "staff-pin", // pinned professional can't perform it
};

/**
 * Classify an availability/booking error into a permanent BookingBlock, or
 * null for transient failures (network, 5xx, unknown codes) where a plain
 * retry UI remains the right answer.
 */
export function classifyBookingBlock(e: unknown): BookingBlock | null {
  if (!(e instanceof ApiError) || !e.code) return null;
  const kind = CODE_TO_KIND[e.code];
  if (!kind) return null;
  const details = (e.data as { details?: { serviceId?: unknown } } | null)
    ?.details;
  const serviceId =
    typeof details?.serviceId === "number" ? details.serviceId : null;
  return { kind, serviceId };
}
