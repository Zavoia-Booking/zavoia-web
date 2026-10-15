"use client";

import { useEffect } from "react";

/** Optional motion only. Content, navigation and native language disclosure
 * remain available when JavaScript is disabled. Nothing starts a browser loop
 * until a pointer actually presses a control.
 */
export function NotFoundEnhancements() {
  useEffect(() => {
    const root = document.getElementById("zavoia-not-found");
    if (!root) return;
    const heading = root.querySelector<HTMLElement>("[data-headline]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cleanup: (() => void)[] = [];

    // Analytic critically damped spring, preserving velocity on interruptions.
    function pressure(element: HTMLElement) {
      let value = 1;
      let velocity = 0;
      let target = 1;
      let frequency = 46;
      let frame = 0;
      let previous = 0;
      const render = () => element.style.setProperty("--press-scale", String(value));
      function snap() {
        cancelAnimationFrame(frame);
        frame = 0;
        value = target = 1;
        velocity = 0;
        render();
      }
      function tick(now: number) {
        const dt = Math.min((now - previous) / 1000, 0.064);
        previous = now;
        const displacement = value - target;
        const coefficient = velocity + frequency * displacement;
        const decay = Math.exp(-frequency * dt);
        value = target + (displacement + coefficient * dt) * decay;
        velocity = (velocity - frequency * coefficient * dt) * decay;
        if (value < 0.975 || value > 1) {
          value = Math.min(1, Math.max(0.975, value));
          velocity = 0;
        }
        if (Math.abs(value - target) < 0.00002 && Math.abs(velocity) < 0.00002 * frequency) {
          value = target;
          velocity = 0;
          frame = 0;
          render();
          return;
        }
        render();
        frame = requestAnimationFrame(tick);
      }
      function set(next: number) {
        if (!frame && value === next && velocity === 0) return;
        if (reduced.matches || root?.dataset.input === "keyboard") {
          snap();
          return;
        }
        target = next;
        frequency = next < 1 ? 72 : 46;
        if (!frame) {
          previous = performance.now();
          frame = requestAnimationFrame(tick);
        }
      }
      const press = (event: PointerEvent) => {
        if (event.button !== 0) return;
        root!.dataset.input = "pointer";
        // Inline value overrides :active, avoiding a jump before the first frame.
        render();
        set(0.98);
      };
      const release = () => set(1);
      render();
      element.addEventListener("pointerdown", press);
      element.addEventListener("pointerleave", release);
      cleanup.push(() => {
        element.removeEventListener("pointerdown", press);
        element.removeEventListener("pointerleave", release);
        snap();
      });
      return { snap, release };
    }

    const controls = [...root.querySelectorAll<HTMLElement>("[data-press]")].map(pressure);
    const finish = () => {
      delete root.dataset.arrival;
      heading?.getAnimations().forEach((animation) => animation.cancel());
      controls.forEach((control) => control.snap());
    };
    const release = () => controls.forEach((control) => control.release());
    const pointer = () => { root.dataset.input = "pointer"; };
    const keyboard = () => {
      root.dataset.input = "keyboard";
      finish();
    };
    const visibility = () => { if (document.hidden) finish(); };
    const preference = () => { if (reduced.matches) finish(); };
    const arrivalDone = (event: AnimationEvent) => {
      if (event.animationName.includes("headline-settle")) delete root.dataset.arrival;
    };

    if (reduced.matches) finish();
    root.addEventListener("pointerdown", pointer);
    document.addEventListener("pointerup", release);
    document.addEventListener("pointercancel", release);
    document.addEventListener("keydown", keyboard, true);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", finish);
    window.addEventListener("resize", finish);
    reduced.addEventListener("change", preference);
    heading?.addEventListener("animationend", arrivalDone);
    return () => {
      finish();
      cleanup.forEach((remove) => remove());
      root.removeEventListener("pointerdown", pointer);
      document.removeEventListener("pointerup", release);
      document.removeEventListener("pointercancel", release);
      document.removeEventListener("keydown", keyboard, true);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", finish);
      window.removeEventListener("resize", finish);
      reduced.removeEventListener("change", preference);
      heading?.removeEventListener("animationend", arrivalDone);
    };
  }, []);

  return null;
}
