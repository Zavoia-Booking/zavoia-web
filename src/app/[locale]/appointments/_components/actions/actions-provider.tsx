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
import { canLeaveReview, type AppointmentChange } from "./shared";
import { ReportModal } from "./report-modal";

/**
 * Imperative API for opening the appointment action modals. The detail page
 * (Slice 4) consumes this via `useAppointmentActions()`; each opener takes a
 * fetched `AppointmentDetail`.
 */
export interface ApptActionsApi {
  openCancel(appt: AppointmentDetail): void;
  openReschedule(appt: AppointmentDetail): void;
  openReview(appt: AppointmentDetail): void;
  openReport(appt: AppointmentDetail): void;
}

type ActionKind = "cancel" | "reschedule" | "review" | "report";

interface ActiveAction {
  kind: ActionKind;
  appointment: AppointmentDetail;
}

const ApptActionsContext = createContext<ApptActionsApi | null>(null);

/**
 * Owns the active-action state and renders the matching modal over the page.
 *
 * Actions invoke `onChanged()` to refresh the detail. Reviews close immediately
 * after confirmation and refresh in the background. Mirrors the `BookingProvider`
 * idiom: a client component exposing an imperative open API through context.
 */
export function AppointmentActionsProvider({
  children,
  onChanged,
  onReviewSubmitted,
}: {
  children: ReactNode;
  onChanged?: (change?: AppointmentChange) => void | Promise<void>;
  onReviewSubmitted?: (uuid: string) => void;
}) {
  const [active, setActive] = useState<ActiveAction | null>(null);

  const openCancel = useCallback((appt: AppointmentDetail) => {
    setActive({ kind: "cancel", appointment: appt });
  }, []);
  const openReschedule = useCallback((appt: AppointmentDetail) => {
    setActive({ kind: "reschedule", appointment: appt });
  }, []);
  const openReview = useCallback((appt: AppointmentDetail) => {
    if (!canLeaveReview(appt)) return;
    setActive((current) => current?.kind === "review"
      ? current
      : { kind: "review", appointment: appt });
  }, []);

  const openReport = useCallback((appt: AppointmentDetail) => {
    setActive({ kind: "report", appointment: appt });
  }, []);
  const close = useCallback(() => {
    // A late completion must never dismiss a newer action.
    setActive((current) => current === active ? null : current);
  }, [active]);

  const api = useMemo<ApptActionsApi>(
    () => ({ openCancel, openReschedule, openReview, openReport }),
    [openCancel, openReschedule, openReview, openReport],
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
          onSubmitted={onReviewSubmitted}
        />
      )}
      {active?.kind === "report" && (
        <ReportModal appointment={active.appointment} onClose={close} />
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
