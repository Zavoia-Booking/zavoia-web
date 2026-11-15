"use client";

import { useConsent } from "@/lib/consent/ConsentProvider";

/** Reopens Zavoia's cookie banner from a business website, which has no Zavoia footer. */
export function FooterCookieSettings({ label }: { label: string }) {
  const { openSettings } = useConsent();
  return (
    <button type="button" className="mc-foot-cookie" onClick={openSettings}>
      {label}
    </button>
  );
}
