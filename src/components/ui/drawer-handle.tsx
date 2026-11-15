"use client";

import { useCallback, useEffect, useRef, type PointerEvent, type RefObject } from "react";
import { SHEET_SETTLE_EASE, SHEET_SETTLE_MS } from "./sheet-motion";
import styles from "./drawer-handle.module.css";

type Props = {
  contentRef: RefObject<HTMLElement | null>;
  overlayRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  /** Stop pending work as a dismissal starts, before the release animation. */
  onDismissStart?: () => void;
  label: string;
};

type Gesture = {
  id: number;
  x: number;
  y: number;
  offset: number;
  distance: number;
  moved: boolean;
  rejected: boolean;
  samples: { y: number; time: number }[];
};

const motionOff = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const translateY = (element: HTMLElement) => {
  const value = getComputedStyle(element).transform;
  return value === "none" ? 0 : new DOMMatrixReadOnly(value).m42;
};

/** A dedicated gesture surface, leaving the drawer's content free to scroll. */
export function DrawerHandle({ contentRef, overlayRef, onClose, onDismissStart, label }: Props) {
  const gesture = useRef<Gesture | null>(null);
  const animations = useRef<Animation[]>([]);
  const saved = useRef(new Map<HTMLElement, string>());
  const suppressClick = useRef(false);
  const dismissing = useRef(false);

  const remember = (element: HTMLElement) => {
    if (!saved.current.has(element)) saved.current.set(element, element.style.cssText);
  };
  const stopAnimations = useCallback(() => {
    const running = animations.current;
    animations.current = [];
    running.forEach(animation => animation.cancel());
  }, []);
  const restore = useCallback(() => {
    for (const [element, inlineStyle] of saved.current) {
      element.style.cssText = inlineStyle;
      delete element.dataset.drawerDragging;
      // Restoring CSS must not replay a drawer's entrance after a short drag.
      element.getAnimations().forEach(animation => {
        if (animation instanceof CSSAnimation) animation.finish();
      });
    }
    saved.current.clear();
  }, []);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 920px)");
    const reset = () => {
      if (mobile.matches) return;
      gesture.current = null;
      dismissing.current = false;
      suppressClick.current = false;
      stopAnimations();
      restore();
    };
    mobile.addEventListener("change", reset);
    return () => mobile.removeEventListener("change", reset);
  }, [restore, stopAnimations]);

  useEffect(() => {
    const running = animations;
    const original = saved;
    return () => {
      running.current.forEach(animation => animation.cancel());
      for (const [element, inlineStyle] of original.current) {
        element.style.cssText = inlineStyle;
        delete element.dataset.drawerDragging;
      }
    };
  }, []);

  const settle = (element: HTMLElement, distance: number, close: boolean) => {
    stopAnimations();
    if (close) {
      dismissing.current = true;
      element.style.pointerEvents = "none";
      onDismissStart?.();
    }
    const overlay = close ? overlayRef.current : null;
    if (overlay) {
      remember(overlay);
      const backgroundColor = getComputedStyle(overlay).backgroundColor;
      overlay.style.setProperty("animation", "none");
      // Some drawers live inside their overlay. Fade only the backdrop paint
      // so the paper stays opaque while it follows the release movement.
      if (!motionOff()) animations.current.push(overlay.animate(
        [{ backgroundColor }, { backgroundColor: "transparent" }],
        { duration: SHEET_SETTLE_MS, easing: SHEET_SETTLE_EASE, fill: "forwards" },
      ));
    }
    const finish = () => {
      if (close) {
        // The gesture already animated the exit. Radix can now unmount without
        // replaying its normal close animation or delaying focus restoration.
        if (overlay) { overlay.style.setProperty("animation", "none"); overlay.style.setProperty("background-color", "transparent"); }
        element.style.transform = "translateY(100%)";
        onClose();
      } else {
        stopAnimations();
        restore();
      }
    };
    if (motionOff()) { finish(); return; }
    const animation = element.animate(
      [{ transform: `translateY(${distance}px)` }, { transform: close ? "translateY(100%)" : "translateY(0)" }],
      { duration: SHEET_SETTLE_MS, easing: SHEET_SETTLE_EASE, fill: "forwards" },
    );
    animations.current.push(animation);
    animation.finished.then(finish, () => {});
  };

  const down = (event: PointerEvent<HTMLButtonElement>) => {
    if (!event.isPrimary || event.button !== 0 || dismissing.current || !window.matchMedia("(max-width: 920px)").matches) return;
    const element = contentRef.current;
    if (!element) return;
    const offset = Math.max(0, translateY(element));
    stopAnimations();
    if (saved.current.has(element)) element.style.transform = `translateY(${offset}px)`;
    suppressClick.current = false;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, offset, distance: offset, moved: false, rejected: false, samples: [{ y: event.clientY, time: event.timeStamp }] };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const active = gesture.current;
    const element = contentRef.current;
    if (!active || active.id !== event.pointerId || active.rejected || !element) return;
    const dx = event.clientX - active.x;
    const dy = event.clientY - active.y;
    if (!active.moved) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      suppressClick.current = true;
      if (Math.abs(dx) > Math.abs(dy) || dy < 0) { active.rejected = true; return; }
      active.moved = true;
      active.offset = Math.max(0, translateY(element));
      remember(element);
      element.style.animation = "none";
      element.style.transition = "none";
      element.style.willChange = "transform";
      element.dataset.drawerDragging = "true";
    }
    active.distance = Math.max(0, active.offset + dy);
    active.samples.push({ y: event.clientY, time: event.timeStamp });
    active.samples = active.samples.filter(sample => event.timeStamp - sample.time <= 100);
    element.style.transform = `translateY(${active.distance}px)`;
  };
  const release = (event: PointerEvent<HTMLButtonElement>, cancelled = false) => {
    const active = gesture.current;
    if (!active || active.id !== event.pointerId) return;
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const element = contentRef.current;
    if (!element) return;
    if (!active.moved) {
      if (saved.current.has(element)) settle(element, active.distance, false);
      return;
    }
    const recent = active.samples.filter(sample => event.timeStamp - sample.time <= 100);
    const first = recent[0];
    const velocity = first ? (event.clientY - first.y) / Math.max(1, event.timeStamp - first.time) : 0;
    const threshold = Math.min(140, Math.max(72, element.getBoundingClientRect().height * .2));
    const travel = Math.max(0, event.clientY - active.y);
    const close = !cancelled && (travel >= threshold || (travel >= 24 && velocity >= .55));
    settle(element, active.distance, close);
  };

  return <button type="button" className={styles.handle} data-drawer-handle aria-label={label}
    onPointerDown={down} onPointerMove={move} onPointerUp={event => release(event)}
    onPointerCancel={event => release(event, true)} onLostPointerCapture={event => release(event, true)}
    onKeyDown={event => {
      if (event.key === "Enter" || event.key === " ") suppressClick.current = false;
    }}
    onClick={event => {
      if (dismissing.current || suppressClick.current) { event.preventDefault(); suppressClick.current = false; return; }
      suppressClick.current = false;
      onClose();
    }}><span aria-hidden="true" /></button>;
}
