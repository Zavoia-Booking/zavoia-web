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
 * drawer can translate, toast and gate behind sign-in.
 *
 * `mounted` (whether <BookingDrawer/> is in the tree at all) is deliberately
 * separate from `open` (visibility): a genuine close (`closeBooking` — the X
 * button, backdrop click, Escape) fully unmounts, discarding every piece of
 * flow state and any in-flight calendar/slots request so a late response from
 * one business's booking session can never land on the next one opened after
 * it. The sign-in detour does NOT unmount, because its whole point is the
 * opposite — see below.
 *
 * Sign-in gate (Step 3, signed out): `closeForAuth()` hides the drawer (so it
 * doesn't render on top of the /auth page during the same-layout-segment
 * navigation there) and arms a pending-reopen flag; once `status` flips to
 * "authenticated" (the user is back, redirected to this same page), the drawer
 * is reopened with the SAME payload reference so BookingDrawer's reset effect
 * recognizes it and preserves the in-progress step-3 selections. That only
 * works if the component instance (and its state) survived the detour, so
 * `mounted` stays true across `closeForAuth` / the auto-reopen.
 */
export function BookingProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [payload, setPayload] = useState<OpenBookingPayload | null>(null);
  const { status } = useAuth();
  // No re-render needed when this flips — only read inside the auth effect.
  const pendingReopenRef = useRef(false);

  const openBooking = useCallback((p: OpenBookingPayload) => {
    pendingReopenRef.current = false;
    setPayload(p);
    setMounted(true);
    setOpen(true);
  }, []);

  const closeBooking = useCallback(() => {
    pendingReopenRef.current = false;
    setOpen(false);
    setMounted(false);
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
      {mounted && (
        <BookingDrawer open={open} payload={payload} onClose={closeBooking} />
      )}
    </BookingContext.Provider>
  );
}
