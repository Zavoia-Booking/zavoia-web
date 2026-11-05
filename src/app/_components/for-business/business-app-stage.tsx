"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { Locale } from "@/i18n/locales";

/** Enhance the server-rendered, fully visible phones with one finite entrance. */
export function BusinessAppStage({ children, className, locale }: { children: ReactNode; className: string; locale: Locale }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = ref.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!stage || reduced.matches || !window.IntersectionObserver || stage.closest("[data-locale-navigation]")) return;

    const animations: Animation[] = [];
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (reduced.matches) continue;
        const device = entry.target as HTMLElement;
        animations.push(device.animate([
          { opacity: .65, transform: "translateY(18px)" },
          { opacity: 1, transform: "translateY(0)" },
        ], {
          duration: 480,
          delay: Number(device.dataset.appDevice) * 80,
          easing: "cubic-bezier(.2,.7,.3,1)",
          fill: "backwards",
        }));
      }
    }, { threshold: .12 });

    stage.querySelectorAll<HTMLElement>("[data-app-device]").forEach((device) => {
      // A direct anchor visit or hydration must not make visible content disappear.
      if (device.getBoundingClientRect().top >= window.innerHeight) observer.observe(device);
    });

    const stop = () => {
      if (!reduced.matches) return;
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
    };
    reduced.addEventListener("change", stop);
    return () => {
      observer.disconnect();
      reduced.removeEventListener("change", stop);
      animations.forEach((animation) => animation.cancel());
    };
  }, [locale]);

  return <div ref={ref} className={className}>{children}</div>;
}
