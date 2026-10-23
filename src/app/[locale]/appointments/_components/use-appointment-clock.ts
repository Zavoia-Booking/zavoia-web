"use client";

import { useEffect, useState } from "react";

/** Keep time-sensitive appointment labels and action windows current. */
export function useAppointmentClock(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const update = () => {
      if (document.visibilityState !== "hidden") setNow(new Date());
    };
    const timer = window.setInterval(update, intervalMs);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [intervalMs]);

  return now;
}
