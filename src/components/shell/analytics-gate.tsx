"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { useConsent } from "@/lib/consent/ConsentProvider";

// GA loads only after explicit consent (GDPR opt-in) — before that no
// gtag.js script, no cookies, no pings of any kind. Accepting mounts it
// immediately, which also fires the initial page_view.

export function AnalyticsGate() {
  const { consent } = useConsent();
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId || consent !== "granted") return null;
  return <GoogleAnalytics gaId={gaId} />;
}
