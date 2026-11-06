"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { Locale } from "@/i18n/locales";
import styles from "./setup-section.module.css";

/** Screens remain visible without JS and settle once, with no hover movement. */
export function SetupReveal({ locale, children }: { locale: Locale; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const composition = ref.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!composition || reduced.matches || !window.IntersectionObserver || composition.closest("[data-locale-navigation]")) return;

    const animations: Animation[] = [];
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (reduced.matches || composition.closest("[data-locale-navigation]")) continue;
        animations.push(entry.target.animate([
          { opacity: .7, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ], { duration: 400, easing: "cubic-bezier(.22,1,.36,1)" }));
      }
    }, { threshold: .15 });
    composition.querySelectorAll("[data-setup-visual]").forEach(screen => {
      if (screen.getBoundingClientRect().top >= window.innerHeight) observer.observe(screen);
    });
    const stop = () => {
      if (!reduced.matches) return;
      observer.disconnect();
      animations.forEach(animation => animation.cancel());
    };
    reduced.addEventListener("change", stop);
    return () => {
      observer.disconnect();
      reduced.removeEventListener("change", stop);
      animations.forEach(animation => animation.cancel());
    };
  }, [locale]);

  return <div className={styles.composition} ref={ref}>{children}</div>;
}
