"use client";

import type { ReactNode } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import type { Locale } from "@/i18n/locales";
import { useConsent } from "@/lib/consent/ConsentProvider";
import type { PlanId } from "@/lib/marketing/pricing";

/** Keep registration a normal link; measure intent only after analytics consent. */
export function PricingSignupLink({
  href, plan, locale, className, children,
}: {
  href: string;
  plan: PlanId;
  locale: Locale;
  className?: string;
  children: ReactNode;
}) {
  const { consent } = useConsent();

  return (
    <a
      href={href}
      className={className}
      onClick={() => {
        if (consent !== "granted" || !process.env.NEXT_PUBLIC_GA_ID || !Array.isArray(window.dataLayer)) return;
        sendGAEvent("event", "pricing_plan_click", {
          plan,
          language: locale,
          source: "pricing",
        });
      }}
    >
      {children}
    </a>
  );
}
