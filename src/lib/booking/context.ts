"use client";

import { createContext } from "react";
import type { BookingApi } from "./types";

/**
 * Booking context. Null when no <BookingProvider> is mounted; `useBooking()`
 * substitutes a safe no-op API in that case so call sites never crash in
 * isolation.
 */
export const BookingContext = createContext<BookingApi | null>(null);
