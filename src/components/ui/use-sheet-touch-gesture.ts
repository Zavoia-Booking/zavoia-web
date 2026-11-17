"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

export type SheetTouchPoint = {
  deltaY: number;
  velocity: number;
  clientY: number;
  timeStamp: number;
};

type Options = {
  contentRef: RefObject<HTMLElement | null>;
  exclude?: (target: Element) => boolean;
  enabled?: () => boolean;
  onStart: (point: SheetTouchPoint) => boolean | void;
  onMove: (point: SheetTouchPoint) => void;
  onEnd: (point: SheetTouchPoint & { cancelled: boolean }) => void;
};

type Sample = { clientY: number; timeStamp: number };
type Gesture = {
  id: number;
  startX: number;
  startY: number;
  target: Element;
  scrollers: HTMLElement[];
  claimed: boolean;
  samples: Sample[];
  point: SheetTouchPoint;
};

const EXCLUDED = 'input, textarea, select, [role="slider"], [role="spinbutton"], [data-sheet-no-drag]';

function scrollAncestors(target: Element, content: HTMLElement) {
  const scrollers: HTMLElement[] = [];
  for (let node: Element | null = target; node; node = node.parentElement) {
    if (node instanceof HTMLElement && node.scrollHeight > node.clientHeight + 1
      && /^(auto|scroll|overlay)$/.test(getComputedStyle(node).overflowY)) scrollers.push(node);
    if (node === content) break;
  }
  return scrollers;
}

/**
 * Let native scrolling own a gesture unless a downward pull starts at its top.
 * Unlike the handle, content keeps its normal touch-action and tap behavior.
 */
export function useSheetTouchGesture(options: Options) {
  const { contentRef } = options;
  const latest = useRef(options);
  useLayoutEffect(() => { latest.current = options; });

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const mobile = window.matchMedia("(max-width: 920px)");
    let gesture: Gesture | null = null;
    let suppressClickUntil = 0;
    const clearClick = () => { suppressClickUntil = 0; };
    const allowed = () => mobile.matches
      && !content.inert && content.dataset.state !== "closed"
      && Math.abs((window.visualViewport?.scale ?? 1) - 1) < .05
      && latest.current.enabled?.() !== false;
    const selected = () => {
      const selection = window.getSelection();
      return !!selection && !selection.isCollapsed
        && (content.contains(selection.anchorNode) || content.contains(selection.focusNode));
    };
    const connected = (target: Element) => target.isConnected && content.contains(target);
    const atTop = (active: Gesture) => active.scrollers.every(node => node.scrollTop <= 1);
    const sample = (active: Gesture, clientY: number, timeStamp: number): SheetTouchPoint => {
      active.samples.push({ clientY, timeStamp });
      active.samples = active.samples.filter(item => timeStamp >= item.timeStamp && timeStamp - item.timeStamp <= 100);
      const first = active.samples[0];
      const elapsed = first ? timeStamp - first.timeStamp : 0;
      active.point = {
        deltaY: Math.max(0, clientY - active.startY),
        velocity: elapsed > 0 ? (clientY - first.clientY) / elapsed : 0,
        clientY,
        timeStamp,
      };
      return active.point;
    };
    const end = (point: SheetTouchPoint, cancelled: boolean) => {
      const active = gesture;
      gesture = null;
      if (!active?.claimed) return;
      suppressClickUntil = performance.now() + 500;
      latest.current.onEnd({ ...point, cancelled });
    };
    const cancel = () => {
      if (gesture) end({ ...gesture.point, velocity: 0 }, true);
    };

    const start = (event: TouchEvent) => {
      cancel();
      clearClick();
      if (event.touches.length !== 1 || !allowed() || selected()) return;
      const target = event.target instanceof Element ? event.target
        : event.target instanceof Node ? event.target.parentElement : null;
      if (!target || !connected(target) || target.closest(EXCLUDED)
        || (target instanceof HTMLElement && target.isContentEditable)
        || target.closest<HTMLElement>("[contenteditable]")?.isContentEditable
        || latest.current.exclude?.(target)) return;
      const scrollers = scrollAncestors(target, content);
      // Once native content scrolling starts, leave that complete gesture to it.
      if (scrollers.some(node => node.scrollTop > 1)) return;
      const touch = event.touches[0];
      gesture = {
        id: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        target,
        scrollers,
        claimed: false,
        samples: [{ clientY: touch.clientY, timeStamp: event.timeStamp }],
        point: { deltaY: 0, velocity: 0, clientY: touch.clientY, timeStamp: event.timeStamp },
      };
    };
    const move = (event: TouchEvent) => {
      const active = gesture;
      if (!active) return;
      if (event.touches.length !== 1 || !allowed() || !connected(active.target)) { cancel(); return; }
      const touch = Array.from(event.touches).find(item => item.identifier === active.id);
      if (!touch) { cancel(); return; }
      const point = sample(active, touch.clientY, event.timeStamp);
      if (!active.claimed) {
        const dx = touch.clientX - active.startX;
        const dy = touch.clientY - active.startY;
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (dy <= 0 || dy <= Math.abs(dx) || !atTop(active) || selected() || !event.cancelable) {
          gesture = null;
          return;
        }
        if (latest.current.onStart(point) === false) { gesture = null; return; }
        active.claimed = true;
        suppressClickUntil = Infinity;
      }
      if (!event.cancelable) { cancel(); return; }
      event.preventDefault();
      latest.current.onMove(point);
    };
    const release = (event: TouchEvent) => {
      const active = gesture;
      if (!active) return;
      const touch = Array.from(event.changedTouches).find(item => item.identifier === active.id);
      if (!touch) return;
      if (active.claimed && event.cancelable) event.preventDefault();
      end(sample(active, touch.clientY, event.timeStamp), !connected(active.target));
    };
    const click = (event: MouseEvent) => {
      if (performance.now() >= suppressClickUntil) return;
      clearClick();
      event.preventDefault();
      event.stopPropagation();
    };
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== "touch") clearClick();
    };
    const visibility = () => { if (document.hidden) cancel(); };
    const breakpoint = () => { if (!mobile.matches) cancel(); };
    const mutations = new MutationObserver(() => {
      if (gesture && !connected(gesture.target)) cancel();
    });

    content.addEventListener("touchstart", start, { capture: true, passive: true });
    content.addEventListener("touchmove", move, { capture: true, passive: false });
    content.addEventListener("touchend", release, { capture: true, passive: false });
    content.addEventListener("touchcancel", cancel, { capture: true, passive: true });
    content.addEventListener("click", click, true);
    content.addEventListener("pointerdown", pointer, true);
    content.addEventListener("contextmenu", cancel, true);
    window.addEventListener("keydown", clearClick, true);
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", visibility);
    mobile.addEventListener("change", breakpoint);
    mutations.observe(content, { childList: true, subtree: true });
    return () => {
      mutations.disconnect();
      content.removeEventListener("touchstart", start, true);
      content.removeEventListener("touchmove", move, true);
      content.removeEventListener("touchend", release, true);
      content.removeEventListener("touchcancel", cancel, true);
      content.removeEventListener("click", click, true);
      content.removeEventListener("pointerdown", pointer, true);
      content.removeEventListener("contextmenu", cancel, true);
      window.removeEventListener("keydown", clearClick, true);
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", visibility);
      mobile.removeEventListener("change", breakpoint);
      // The consumer owns animation/style teardown when its surface unmounts.
      gesture = null;
    };
  }, [contentRef]);
}
