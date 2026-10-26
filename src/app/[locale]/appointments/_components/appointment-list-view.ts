"use client";

import { getAuthenticatedSessionId, subscribeSession } from "@/lib/auth/session-store";

export type AppointmentFilter = "all" | "upcoming" | "past" | "cancelled" | "no_show";

export interface AppointmentListView {
  filter: AppointmentFilter;
  historyCount: number;
  scrollY: number;
}

const DEFAULT_VIEW: AppointmentListView = {
  filter: "all", historyCount: 0, scrollY: 0,
};
let saved: { session: number; view: AppointmentListView } | null = null;
let observing = false;

/** Only navigation preferences live here, never appointment/customer records. */
export function readAppointmentListView(): AppointmentListView {
  if (typeof window === "undefined") return DEFAULT_VIEW;
  if (!observing) {
    observing = true;
    subscribeSession(() => {
      if (saved?.session !== getAuthenticatedSessionId()) saved = null;
    });
  }
  const session = getAuthenticatedSessionId();
  return saved?.session === session ? saved.view : DEFAULT_VIEW;
}

export function saveAppointmentListView(view: AppointmentListView) {
  const session = getAuthenticatedSessionId();
  if (session !== null) saved = { session, view };
}
