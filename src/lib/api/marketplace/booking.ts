/**
 * Marketplace PUBLIC availability endpoints (`/marketplace/public/booking/*`).
 *
 * Auth: public (no auth).
 * Envelope: WRAPPED `{ message, data }` — both functions unwrap and return `data`.
 *
 * NOTE: the live customer-booking.service.ts returns a richer shape than the
 * marketplace-booking-api.md sample (e.g. `items` instead of `services`, plus
 * `staffDirectory` / `staffPricing` / `nextAvailableDate`). The types follow the
 * SERVICE source of truth (see types.ts BookingCalendar / BookingDaySlots).
 */

import { apiFetch } from "@/lib/api/http";
import type {
  BookingCalendar,
  BookingDaySlots,
  Envelope,
  GetBookingCalendarBody,
  GetBookingSlotsBody,
} from "./types";

/** POST /marketplace/public/booking/calendar — WRAPPED; returns data (BookingCalendar). */
export async function getBookingCalendar(
  body: GetBookingCalendarBody,
): Promise<BookingCalendar> {
  const res = await apiFetch<Envelope<BookingCalendar>>(
    "/marketplace/public/booking/calendar",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  return res.data;
}

/** POST /marketplace/public/booking/slots — WRAPPED; returns data (BookingDaySlots). */
export async function getBookingSlots(
  body: GetBookingSlotsBody,
): Promise<BookingDaySlots> {
  const res = await apiFetch<Envelope<BookingDaySlots>>(
    "/marketplace/public/booking/slots",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  return res.data;
}
