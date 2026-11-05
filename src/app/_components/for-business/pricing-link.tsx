"use client";

import type { MouseEvent, ReactNode } from "react";

/** A native fragment link with smooth scrolling only for ordinary activation. */
export function PricingLink({ children, className }: { children: ReactNode; className?: string }) {
  function scrollToPlans(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const plans = document.getElementById("plans");
    if (!plans) return;
    event.preventDefault();

    if (window.location.hash !== "#plans") {
      const oldURL = window.location.href;
      window.history.pushState(window.history.state, "", "#plans");
      // The shared language controls subscribe to fragment changes.
      window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL, newURL: window.location.href }));
    }

    plans.focus({ preventScroll: true });
    plans.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "start",
    });
  }

  return <a href="#plans" className={className} onClick={scrollToPlans}>{children}</a>;
}
