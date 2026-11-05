"use client";

import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
let interval: number | undefined;

function refresh() {
  for (const listener of listeners) listener();
}

function refreshWhenVisible() {
  if (document.visibilityState === "visible") refresh();
}

/** All mounted consumers share one timer and resume immediately after a hidden tab. */
export function subscribeVenueClock(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    interval = window.setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("pageshow", refresh);
  }
  return () => {
    if (!listeners.delete(listener)) return;
    if (listeners.size === 0) {
      window.clearInterval(interval);
      interval = undefined;
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("pageshow", refresh);
    }
  };
}

/** Minute-precision epoch milliseconds, suitable for new Date(snapshot). */
export const venueClockSnapshot = () => Math.floor(Date.now() / 60_000) * 60_000;
export const serverVenueClockSnapshot = () => null;

export function useVenueClock(): number | null {
  return useSyncExternalStore(subscribeVenueClock, venueClockSnapshot, serverVenueClockSnapshot);
}

function browserTimezoneSnapshot(): string | null {
  try {
    return new Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/** Resolve after hydration; visibility refresh also notices a changed device timezone. */
export function useBrowserTimezone(): string | null {
  return useSyncExternalStore(subscribeVenueClock, browserTimezoneSnapshot, serverVenueClockSnapshot);
}
