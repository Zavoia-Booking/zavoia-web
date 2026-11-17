"use client";

import { useCallback, useEffect, useRef, type PointerEvent, type RefObject } from "react";
import { SHEET_SETTLE_EASE, SHEET_SETTLE_MS } from "./sheet-motion";
import { useDrawerViewport } from "./use-drawer-viewport";
import { useSheetTouchGesture } from "./use-sheet-touch-gesture";
import styles from "./drawer-handle.module.css";

type Props = {
  contentRef: RefObject<HTMLElement | null>;
  overlayRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  /** Stop pending work when dismissal commits, before its release animation. */
  onDismissStart?: () => void;
  /** Keep viewport tracking mounted while a pending action blocks dismissal. */
  disabled?: boolean;
  label: string;
};

type Drag = { offset: number; distance: number; threshold: number };
type Gesture = Drag & {
  id: number;
  x: number;
  y: number;
  moved: boolean;
  rejected: boolean;
  samples: { y: number; time: number }[];
};
type SavedProperty = { value: string; priority: string };

const motionOff = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const translateY = (element: HTMLElement) => {
  const value = getComputedStyle(element).transform;
  return value === "none" ? 0 : new DOMMatrixReadOnly(value).m42;
};

/** The visible handle and shared, scroll-aware touch behavior for the whole drawer. */
export function DrawerHandle({ contentRef, overlayRef, onClose, onDismissStart, disabled = false, label }: Props) {
  const handleRef = useRef<HTMLButtonElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const contentDrag = useRef<Drag | null>(null);
  const animations = useRef<Animation[]>([]);
  const saved = useRef(new Map<HTMLElement, Map<string, SavedProperty>>());
  const suppressClick = useRef(false);
  const dismissing = useRef(false);
  const finishDismissal = useRef<(() => void) | null>(null);

  useDrawerViewport({ contentRef, overlayRef });

  const remember = useCallback((element: HTMLElement, properties: string[]) => {
    let snapshot = saved.current.get(element);
    if (!snapshot) { snapshot = new Map(); saved.current.set(element, snapshot); }
    for (const property of properties) {
      if (!snapshot.has(property)) snapshot.set(property, {
        value: element.style.getPropertyValue(property),
        priority: element.style.getPropertyPriority(property),
      });
    }
  }, []);
  const stopAnimations = useCallback(() => {
    const running = animations.current;
    animations.current = [];
    running.forEach(animation => animation.cancel());
  }, []);
  const restore = useCallback(() => {
    for (const [element, properties] of saved.current) {
      for (const [property, previous] of properties) {
        if (previous.value) element.style.setProperty(property, previous.value, previous.priority);
        else element.style.removeProperty(property);
      }
      element.removeAttribute("data-drawer-dragging");
      // Restoring the entrance class must not replay it after a cancelled pull.
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
      const pointer = gesture.current;
      gesture.current = null;
      contentDrag.current = null;
      if (pointer && handleRef.current?.hasPointerCapture(pointer.id)) handleRef.current.releasePointerCapture(pointer.id);
      // Booking may already have invalidated pending work. A committed close
      // must finish rather than reopening a partially cancelled session.
      if (finishDismissal.current) { finishDismissal.current(); return; }
      suppressClick.current = false;
      stopAnimations();
      restore();
    };
    mobile.addEventListener("change", reset);
    return () => mobile.removeEventListener("change", reset);
  }, [restore, stopAnimations]);

  useEffect(() => () => { stopAnimations(); restore(); }, [restore, stopAnimations]);

  useEffect(() => {
    if (!disabled || dismissing.current) return;
    const pointer = gesture.current;
    gesture.current = null;
    contentDrag.current = null;
    if (pointer && handleRef.current?.hasPointerCapture(pointer.id)) handleRef.current.releasePointerCapture(pointer.id);
    suppressClick.current = false;
    stopAnimations();
    restore();
  }, [disabled, restore, stopAnimations]);

  const prepare = (element: HTMLElement): Drag => {
    const offset = Math.max(0, translateY(element));
    // Measure before dismissing an open keyboard changes the paper's height.
    const threshold = Math.min(140, Math.max(72, element.getBoundingClientRect().height * .2));
    stopAnimations();
    remember(element, ["animation", "transition", "transform", "will-change", "pointer-events"]);
    element.style.animation = "none";
    element.style.transition = "none";
    element.style.transform = `translateY(${offset}px)`;
    element.style.willChange = "transform";
    element.dataset.drawerDragging = "true";
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && element.contains(focused)
      && focused.matches('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) {
      element.focus({ preventScroll: true });
    }
    return { offset, distance: offset, threshold };
  };

  const settle = (element: HTMLElement, distance: number, close: boolean) => {
    stopAnimations();
    if (close) {
      dismissing.current = true;
      element.style.pointerEvents = "none";
      onDismissStart?.();
    }
    const overlay = close ? overlayRef.current : null;
    if (overlay) {
      remember(overlay, ["animation", "background-color"]);
      const backgroundColor = getComputedStyle(overlay).backgroundColor;
      overlay.style.setProperty("animation", "none");
      // The paper can be nested in the overlay; fade only its backdrop paint.
      if (!motionOff()) animations.current.push(overlay.animate(
        [{ backgroundColor }, { backgroundColor: "transparent" }],
        { duration: SHEET_SETTLE_MS, easing: SHEET_SETTLE_EASE, fill: "forwards" },
      ));
    }
    const finish = () => {
      if (close) {
        if (!finishDismissal.current) return;
        finishDismissal.current = null;
        stopAnimations();
        if (overlay) { overlay.style.setProperty("animation", "none"); overlay.style.setProperty("background-color", "transparent"); }
        element.style.transform = "translateY(100%)";
        // The gesture has already animated the exit; don't replay CSS exit.
        onClose();
      } else {
        stopAnimations();
        restore();
      }
    };
    if (close) finishDismissal.current = finish;
    if (motionOff()) { finish(); return; }
    const animation = element.animate(
      [{ transform: `translateY(${distance}px)` }, { transform: close ? "translateY(100%)" : "translateY(0)" }],
      { duration: SHEET_SETTLE_MS, easing: SHEET_SETTLE_EASE, fill: "forwards" },
    );
    animations.current.push(animation);
    animation.finished.then(finish, () => {});
  };

  useSheetTouchGesture({
    contentRef,
    exclude: target => !!target.closest("[data-drawer-handle]"),
    enabled: () => !disabled && !dismissing.current && !gesture.current,
    onStart: () => {
      const element = contentRef.current;
      if (!element) return false;
      contentDrag.current = prepare(element);
    },
    onMove: point => {
      const active = contentDrag.current;
      const element = contentRef.current;
      if (!active || !element) return;
      active.distance = Math.max(0, active.offset + point.deltaY);
      element.style.transform = `translateY(${active.distance}px)`;
    },
    onEnd: point => {
      const active = contentDrag.current;
      const element = contentRef.current;
      contentDrag.current = null;
      if (!active || !element) return;
      const close = !disabled && !point.cancelled && (point.deltaY >= active.threshold || (point.deltaY >= 24 && point.velocity >= .55));
      settle(element, active.distance, close);
    },
  });

  const down = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled || !event.isPrimary || event.button !== 0 || dismissing.current || contentDrag.current
      || !window.matchMedia("(max-width: 920px)").matches) return;
    const element = contentRef.current;
    if (!element) return;
    const offset = Math.max(0, translateY(element));
    stopAnimations();
    if (saved.current.has(element)) element.style.transform = `translateY(${offset}px)`;
    suppressClick.current = false;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, offset, distance: offset, threshold: 0, moved: false, rejected: false, samples: [{ y: event.clientY, time: event.timeStamp }] };
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
      Object.assign(active, prepare(element));
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
    const travel = Math.max(0, event.clientY - active.y);
    const close = !disabled && !cancelled && (travel >= active.threshold || (travel >= 24 && velocity >= .55));
    settle(element, active.distance, close);
  };

  return <button ref={handleRef} type="button" className={styles.handle} data-drawer-handle aria-label={label} disabled={disabled}
    onPointerDown={down} onPointerMove={move} onPointerUp={event => release(event)}
    onPointerCancel={event => release(event, true)} onLostPointerCapture={event => release(event, true)}
    onKeyDown={event => {
      if (event.key === "Enter" || event.key === " ") suppressClick.current = false;
    }}
    onClick={event => {
      if (disabled || dismissing.current || suppressClick.current) { event.preventDefault(); suppressClick.current = false; return; }
      suppressClick.current = false;
      onClose();
    }}><span aria-hidden="true" /></button>;
}
