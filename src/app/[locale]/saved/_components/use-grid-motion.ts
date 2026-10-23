"use client";

import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";

// The Web Animations API cannot read CSS variables: this is --ease-out, and
// the durations stay inside the motion grammar's 0.15–0.3s state range.
const EASE_OUT = "cubic-bezier(.2, .7, .3, 1)";
const EXIT_MS = 180;
const ENTER_MS = 240;
const MOVE_MS = 280;
// An entering card waits for the slide to clear its slot, so it never
// fades in over a neighbour that is still passing through.
const ENTER_DELAY_MS = 120;

type Point = { x: number; y: number };

const ENTER_FRAMES: Keyframe[] = [
  { opacity: 0, transform: "scale(0.96)" },
  { opacity: 1, transform: "none" },
];

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * One card at a time: a removed card fades out before it leaves, the rest of
 * the grid closes the gap instead of jumping, and a restored card settles back
 * into place. Bulk changes (a filter switch, a refresh) render at once.
 * Positions are layout offsets within the grid, so scrolling between changes
 * cannot skew them. Reduced motion skips every animation.
 *
 * `appear` settles in a grid that replaces the empty state (undoing the last
 * removal); a grid's first render otherwise stays in place.
 */
export function useGridMotion(
  keys: readonly string[],
  {
    appear = false,
    fallbackFocus,
  }: {
    appear?: boolean;
    /** Takes keyboard focus when the last card is removed. */
    fallbackFocus?: RefObject<HTMLElement | null>;
  } = {},
) {
  const grid = useRef<HTMLElement | null>(null);
  const positions = useRef(new Map<string, Point>());
  const observer = useRef<ResizeObserver | null>(null);
  const focusIndex = useRef<number | null>(null);

  const measure = useCallback(() => {
    const next = new Map<string, Point>();
    for (const child of grid.current?.children ?? []) {
      const card = child as HTMLElement;
      if (card.dataset.key) {
        next.set(card.dataset.key, { x: card.offsetLeft, y: card.offsetTop });
      }
    }
    positions.current = next;
  }, []);

  // A resize moves every card without anything to animate: record it quietly.
  const ref = useCallback(
    (node: HTMLElement | null) => {
      observer.current?.disconnect();
      observer.current = null;
      grid.current = node;
      if (!node) return;
      observer.current = new ResizeObserver(measure);
      observer.current.observe(node);
    },
    [measure],
  );

  useLayoutEffect(() => {
    const previous = positions.current;
    measure();
    const node = grid.current;
    const index = focusIndex.current;
    focusIndex.current = null;
    if (!node) {
      if (index !== null) fallbackFocus?.current?.focus({ preventScroll: true });
      return;
    }
    // Removing from the keyboard keeps focus in the grid, on the card that
    // took the removed one's place, or on the fallback once none is left.
    if (index !== null) {
      const cards = node.children;
      cards[Math.min(index, cards.length - 1)]
        ?.querySelector<HTMLElement>("[data-primary]")
        ?.focus({ preventScroll: true });
    }
    if (reducedMotion()) return;
    if (!previous.size) {
      if (appear) {
        for (const child of node.children) {
          child.animate(ENTER_FRAMES, { duration: ENTER_MS, easing: EASE_OUT });
        }
      }
      return;
    }
    const current = positions.current;
    let changed = 0;
    for (const key of current.keys()) if (!previous.has(key)) changed += 1;
    for (const key of previous.keys()) if (!current.has(key)) changed += 1;
    if (changed !== 1) return;
    for (const child of node.children) {
      const card = child as HTMLElement;
      const key = card.dataset.key;
      const to = key ? current.get(key) : undefined;
      if (!key || !to) continue;
      const from = previous.get(key);
      // A card that changes rows settles in place rather than sweeping
      // diagonally across the grid; cards within a row slide the short way.
      if (!from || from.y !== to.y) {
        card.animate(ENTER_FRAMES, {
          duration: ENTER_MS,
          delay: ENTER_DELAY_MS,
          easing: EASE_OUT,
          fill: "backwards",
        });
      } else if (from.x !== to.x) {
        card.animate(
          [{ transform: `translateX(${from.x - to.x}px)` }, { transform: "none" }],
          { duration: MOVE_MS, easing: EASE_OUT },
        );
      }
    }
  }, [keys, measure, appear, fallbackFocus]);

  /** Fades a card out, then commits its removal; restores it if refused. */
  const leave = useCallback((key: string, commit: () => boolean) => {
    const cards = [...(grid.current?.children ?? [])] as HTMLElement[];
    const card = cards.find((child) => child.dataset.key === key);
    if (card?.dataset.leaving !== undefined) return;
    const hadFocus = !!card?.contains(document.activeElement);
    const finish = () => {
      if (hadFocus && card) focusIndex.current = cards.indexOf(card);
      if (commit()) return true;
      focusIndex.current = null;
      return false;
    };
    if (!card || reducedMotion()) {
      finish();
      return;
    }
    card.dataset.leaving = "";
    const exit = card.animate(
      [
        { opacity: 1, transform: "none" },
        { opacity: 0, transform: "scale(0.96)" },
      ],
      { duration: EXIT_MS, easing: EASE_OUT, fill: "forwards" },
    );
    exit.finished.then(
      () => {
        if (finish()) return;
        delete card.dataset.leaving;
        exit.cancel();
      },
      () => {
        delete card.dataset.leaving;
      },
    );
  }, []);

  return { ref, leave };
}
