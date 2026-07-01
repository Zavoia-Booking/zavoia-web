"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppointmentDetail } from "@/lib/api/marketplace/types";
import { CancelModal } from "./cancel-modal";
import { RescheduleModal } from "./reschedule-modal";
import { ReviewModal } from "./review-modal";

/**
 * Imperative API for opening the appointment action modals. The detail page
 * (Slice 4) consumes this via `useAppointmentActions()`; each opener takes a
 * fetched `AppointmentDetail`.
 */
export interface ApptActionsApi {
  openCancel(appt: AppointmentDetail): void;
  openReschedule(appt: AppointmentDetail): void;
  openReview(appt: AppointmentDetail): void;
}

type ActionKind = "cancel" | "reschedule" | "review";

interface ActiveAction {
  kind: ActionKind;
  appointment: AppointmentDetail;
}

const ApptActionsContext = createContext<ApptActionsApi | null>(null);

/**
 * Owns the active-action state and renders the matching modal over the page.
 *
 * After ANY successful action it invokes `onChanged()` (Slice 4 passes a
 * refetch) and then closes the modal. Mirrors the `BookingProvider` idiom:
 * a client component that exposes an imperative open API through context.
 * NOTE: not mounted anywhere yet — Slice 4 mounts it around the detail page.
 */
export function AppointmentActionsProvider({
  children,
  onChanged,
}: {
  children: ReactNode;
  onChanged?: () => void | Promise<void>;
}) {
  const [active, setActive] = useState<ActiveAction | null>(null);

  const openCancel = useCallback((appt: AppointmentDetail) => {
    setActive({ kind: "cancel", appointment: appt });
  }, []);
  const openReschedule = useCallback((appt: AppointmentDetail) => {
    setActive({ kind: "reschedule", appointment: appt });
  }, []);
  const openReview = useCallback((appt: AppointmentDetail) => {
    setActive({ kind: "review", appointment: appt });
  }, []);

  const close = useCallback(() => setActive(null), []);

  const api = useMemo<ApptActionsApi>(
    () => ({ openCancel, openReschedule, openReview }),
    [openCancel, openReschedule, openReview],
  );

  return (
    <ApptActionsContext.Provider value={api}>
      {children}
      {active?.kind === "cancel" && (
        <CancelModal
          appointment={active.appointment}
          onClose={close}
          onChanged={onChanged}
        />
      )}
      {active?.kind === "reschedule" && (
        <RescheduleModal
          appointment={active.appointment}
          onClose={close}
          onChanged={onChanged}
        />
      )}
      {active?.kind === "review" && (
        <ReviewModal
          appointment={active.appointment}
          onClose={close}
          onChanged={onChanged}
        />
      )}
    </ApptActionsContext.Provider>
  );
}

/**
 * Access the appointment-actions API. Throws if used outside the provider
 * (mirrors `useBooking`'s contract — the detail page must mount the provider).
 */
export function useAppointmentActions(): ApptActionsApi {
  const ctx = useContext(ApptActionsContext);
  if (!ctx) {
    throw new Error(
      "useAppointmentActions must be used within an <AppointmentActionsProvider>",
    );
  }
  return ctx;
}
