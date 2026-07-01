"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { BookingContext } from "./context";
import { BookingDrawer } from "./BookingDrawer";
import type { BookingApi, OpenBookingPayload } from "./types";

/**
 * Owns the booking-flow open state + handed-over payload and renders the
 * <BookingDrawer/> (the real calendar → slots → book flow). Mounted once in the
 * locale layout, inside I18nProvider + ToastProvider + AuthModalProvider so the
 * drawer can translate, toast and gate behind sign-in. The drawer stays mounted
 * while closed (open=false) so the auth modal can open over it and the flow can
 * resume once authentication flips on.
 *
 * Sign-in gate (Step 3, signed out): `closeForAuth()` hides the drawer (so it
 * doesn't render on top of the /auth page during the same-layout-segment
 * navigation there) and arms a pending-reopen flag; once `status` flips to
 * "authenticated" (the user is back, redirected to this same page), the drawer
 * is reopened with the SAME payload reference so BookingDrawer's reset effect
 * recognizes it and preserves the in-progress step-3 selections.
 */
export function BookingProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<OpenBookingPayload | null>(null);
  const { status } = useAuth();
  // No re-render needed when this flips — only read inside the auth effect.
  const pendingReopenRef = useRef(false);

  const openBooking = useCallback((p: OpenBookingPayload) => {
    pendingReopenRef.current = false;
    setPayload(p);
    setOpen(true);
  }, []);

  const closeBooking = useCallback(() => {
    pendingReopenRef.current = false;
    setOpen(false);
  }, []);

  const closeForAuth = useCallback(() => {
    pendingReopenRef.current = true;
    setOpen(false);
  }, []);

  // Reopen (same payload reference, no reset) once sign-in completes.
  useEffect(() => {
    if (status === "authenticated" && pendingReopenRef.current && payload) {
      pendingReopenRef.current = false;
      setOpen(true);
    }
  }, [status, payload]);

  const api = useMemo<BookingApi>(
    () => ({ openBooking, closeBooking, closeForAuth }),
    [openBooking, closeBooking, closeForAuth],
  );

  return (
    <BookingContext.Provider value={api}>
      {children}
      <BookingDrawer open={open} payload={payload} onClose={closeBooking} />
    </BookingContext.Provider>
  );
}
