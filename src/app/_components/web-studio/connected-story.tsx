"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { Locale } from "@/i18n/locales";
import styles from "./connected-story.module.css";

/** Content is visible on the server; motion is an optional, one-time enhancement. */
export function ConnectedStory({ children, locale }: { children: ReactNode; locale: Locale }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = ref.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!list || reduced.matches || !window.IntersectionObserver || list.closest("[data-locale-navigation]")) return;

    const animations: Animation[] = [];
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (reduced.matches || list.closest("[data-locale-navigation]")) continue;
        animations.push(entry.target.animate([
          { opacity: .65, transform: "translateY(10px)" },
          { opacity: 1, transform: "translateY(0)" },
        ], { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" }));
      }
    }, { threshold: .2 });

    list.querySelectorAll<SVGSVGElement>("[data-connected-scene]").forEach(scene => {
      if (scene.getBoundingClientRect().top >= window.innerHeight) observer.observe(scene);
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

  return <div ref={ref} className={styles.composition}>{children}</div>;
}
