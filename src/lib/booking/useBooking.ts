"use client";

import { useContext } from "react";
import { BookingContext } from "./context";
import type { BookingApi } from "./types";

// No-op fallback used when no <BookingProvider> is mounted, so a stray Book CTA
// never throws (mirrors the I18n / toast fallbacks elsewhere in this app).
const NOOP: BookingApi = {
  openBooking: () => {},
  closeBooking: () => {},
  closeForAuth: () => {},
};

/** Access the booking API. Safe to call outside a provider (returns no-ops). */
export function useBooking(): BookingApi {
  return useContext(BookingContext) ?? NOOP;
}
