"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from "react";

/**
 * The mobile results sheet — an Apple/Airbnb-style drawer over the map.
 *
 * It replaces the list↔map toggle, which forced a choice the map view never
 * needed to force: you saw results OR you saw where they are, never both.
 * Three snaps, the same as the RN app's drawer:
 *
 *   down  the header alone peeks above the bottom — the map is fully usable
 *   mid   about half the screen — browse and glance at the map together
 *   top   the list, pinned just below the page's own chrome
 *
 * Dragging is confined to the header. Handing the whole surface to the drag
 * would mean arbitrating between "the sheet is moving" and "the list is
 * scrolling" on every touch, and getting that wrong strands people mid-list;
 * a grab area they can see is honest about what moves.
 */

export type SheetPosition = "down" | "mid" | "top";

/** Snap animation. Matches --ease-out, the app's standard settle. */
const SNAP_MS = 320;
const SNAP_EASE = "cubic-bezier(.2, .7, .3, 1)";
/** A flick faster than this decides the direction regardless of where it ended. */
const FLICK_VELOCITY = 0.5; // px per ms
/** `mid` sits this far down the sheet's travel. */
const MID_FRACTION = 0.46;

export interface BottomSheetHandle {
  snapTo: (position: SheetPosition) => void;
  position: () => SheetPosition;
}

export interface BottomSheetProps {
  /** Distance from the top of the container at the `top` snap. */
  topOffset?: number;
  /** Where the sheet rests on mount. */
  initialPosition?: SheetPosition;
  onPositionChange?: (position: SheetPosition) => void;
  /** The always-visible grab area — also the sheet's drag surface. */
  header: ReactNode;
  /** Scrollable body, revealed as the sheet rises. */
  children: ReactNode;
  /** Accessible name for the drag handle. */
  handleAria: string;
  ref?: Ref<BottomSheetHandle>;
}

/**
 * How far the sheet has risen, published to the container as CSS custom
 * properties so anything floating over the map can ride the same motion
 * WITHOUT a React render per frame — `--zv-sheet-raise` is 0 at the peek and 1
 * at the top, and `--zv-sheet-t` carries the sheet's own transition (or `none`
 * mid-drag) so a follower stays in lock-step through both the drag and the snap.
 */
const RAISE_VAR = "--zv-sheet-raise";
const TRANSITION_VAR = "--zv-sheet-t";

export function BottomSheet({
  topOffset = 12,
  initialPosition = "mid",
  onPositionChange,
  header,
  children,
  handleAria,
  ref,
}: BottomSheetProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const [containerH, setContainerH] = useState(0);
  const [peekH, setPeekH] = useState(0);
  const [position, setPosition] = useState<SheetPosition>(initialPosition);
  const [drag, setDrag] = useState<number | null>(null);

  // Measured, not assumed: the header carries a live result count whose text
  // can wrap, and a peek that guesses wrong either clips the count or leaves a
  // strip of empty sheet under it.
  useEffect(() => {
    const root = rootRef.current;
    const head = headerRef.current;
    if (!root || !head) return;
    const parent = root.parentElement;
    if (!parent) return;
    const measure = () => {
      setContainerH(parent.getBoundingClientRect().height);
      setPeekH(head.getBoundingClientRect().height);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(parent);
    ro.observe(head);
    return () => ro.disconnect();
  }, []);

  const snapY = useCallback(
    (p: SheetPosition): number => {
      if (containerH === 0) return 0;
      const down = Math.max(topOffset, containerH - peekH);
      if (p === "down") return down;
      if (p === "top") return topOffset;
      return Math.min(down, topOffset + (down - topOffset) * MID_FRACTION);
    },
    [containerH, peekH, topOffset],
  );

  const setAndReport = useCallback(
    (p: SheetPosition) => {
      setPosition((prev) => {
        if (prev !== p) onPositionChange?.(p);
        return p;
      });
    },
    [onPositionChange],
  );

  useImperativeHandle(
    ref,
    () => ({ snapTo: setAndReport, position: () => position }),
    [setAndReport, position],
  );

  // ── Drag ────────────────────────────────────────────────────────────────
  const gesture = useRef<{
    startY: number;
    baseY: number;
    lastY: number;
    lastT: number;
    velocity: number;
  } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (containerH === 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = {
      startY: e.clientY,
      baseY: snapY(position),
      lastY: e.clientY,
      lastT: e.timeStamp,
      velocity: 0,
    };
    setDrag(snapY(position));
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g) return;
    const dt = e.timeStamp - g.lastT;
    if (dt > 0) g.velocity = (e.clientY - g.lastY) / dt;
    g.lastY = e.clientY;
    g.lastT = e.timeStamp;
    const down = Math.max(topOffset, containerH - peekH);
    // Clamped, with no rubber-band past the ends: the sheet has nothing to show
    // beyond them, so travel there would only be decoration.
    setDrag(Math.min(down, Math.max(topOffset, g.baseY + (e.clientY - g.startY))));
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g) return;
    gesture.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const y = drag ?? snapY(position);
    setDrag(null);

    const order: SheetPosition[] = ["top", "mid", "down"];
    // A flick moves one step in the direction it was thrown, whatever the
    // finger ended over — the gesture people expect from every other sheet.
    if (Math.abs(g.velocity) > FLICK_VELOCITY) {
      const i = order.indexOf(position);
      const next = order[Math.min(order.length - 1, Math.max(0, i + (g.velocity > 0 ? 1 : -1)))];
      setAndReport(next);
      return;
    }
    let best: SheetPosition = position;
    let bestD = Infinity;
    for (const p of order) {
      const d = Math.abs(snapY(p) - y);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    setAndReport(best);
  };

  const y = drag ?? snapY(position);
  const dragging = drag != null;

  // Published on the PARENT, so siblings of the sheet (the pin card) can read
  // it — the sheet's own element is transformed and would drag them with it.
  const down = Math.max(topOffset, containerH - peekH);
  const raise = down > topOffset ? (down - y) / (down - topOffset) : 0;
  const transition = dragging
    ? "none"
    : `opacity ${SNAP_MS}ms ${SNAP_EASE}, transform ${SNAP_MS}ms ${SNAP_EASE}`;
  useLayoutEffect(() => {
    const parent = rootRef.current?.parentElement;
    if (!parent) return;
    parent.style.setProperty(RAISE_VAR, String(Math.min(1, Math.max(0, raise))));
    parent.style.setProperty(TRANSITION_VAR, transition);
  }, [raise, transition]);

  return (
    <div
      ref={rootRef}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: "100%",
        transform: `translateY(${y}px)`,
        transition: dragging ? "none" : `transform ${SNAP_MS}ms ${SNAP_EASE}`,
        zIndex: 42,
        display: "flex",
        flexDirection: "column",
        background: "var(--c-canvas)",
        borderRadius: "20px 20px 0 0",
        boxShadow: "var(--sh-up)",
        // The sheet only owns the part of the screen it actually covers, so the
        // map underneath stays draggable where the sheet is not.
        pointerEvents: containerH === 0 ? "none" : "auto",
        // A measurement pass before the container is known would flash the
        // sheet at the top of the screen.
        visibility: containerH === 0 ? "hidden" : "visible",
      }}
    >
      <div
        ref={headerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ touchAction: "none", cursor: dragging ? "grabbing" : "grab" }}
      >
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
          <span
            role="separator"
            aria-label={handleAria}
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "var(--c-mist)",
              display: "block",
            }}
          />
        </div>
        {header}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}
