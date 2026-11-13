"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type RefObject } from "react";

type Position = { x: number; y: number };
type Gesture = { id: number; handle: HTMLElement; x: number; y: number; origin: Position; width: number; height: number; moved: boolean };

// Move only the control surfaces during a gesture, without re-rendering the website on every pointer move.
export function useDraggableControls(panel: RefObject<HTMLDivElement | null>, launcher: RefObject<HTMLDivElement | null>) {
  const [position, setPosition] = useState<Position | null>(null);
  const latest = useRef<Position>({ x: 16, y: 16 });
  const gesture = useRef<Gesture | null>(null);
  const frame = useRef(0);
  const dragged = useRef(false);

  const paint = (next: Position) => {
    latest.current = next;
    for (const node of [panel.current, launcher.current]) {
      node?.style.setProperty("--controls-x", `${next.x}px`);
      node?.style.setProperty("--controls-y", `${next.y}px`);
    }
  };
  const constrain = (next: Position, width: number, height: number): Position => {
    const gutterX = Math.max(0, Math.min(16, (window.innerWidth - width) / 2));
    const gutterY = Math.max(0, Math.min(16, (window.innerHeight - height) / 2));
    return {
      x: Math.max(gutterX, Math.min(next.x, window.innerWidth - width - gutterX)),
      y: Math.max(gutterY, Math.min(next.y, window.innerHeight - height - gutterY)),
    };
  };
  const finish = () => {
    const current = gesture.current;
    if (!current) return;
    gesture.current = null;
    cancelAnimationFrame(frame.current);
    dragged.current = current.moved;
    if (current.moved) {
      paint(latest.current);
      setPosition(latest.current);
    }
    current.handle.removeAttribute("data-dragging");
    if (current.handle.hasPointerCapture(current.id)) current.handle.releasePointerCapture(current.id);
  };
  const endGesture = (event: PointerEvent<HTMLElement>) => {
    if (gesture.current?.id === event.pointerId) finish();
  };

  useEffect(() => {
    // Resizing can change the desktop/compact interaction model during an active gesture.
    const cancel = () => {
      const current = gesture.current;
      if (!current) return;
      gesture.current = null;
      cancelAnimationFrame(frame.current);
      current.handle.removeAttribute("data-dragging");
      if (current.handle.hasPointerCapture(current.id)) current.handle.releasePointerCapture(current.id);
      if (current.moved) {
        for (const node of [panel.current, launcher.current]) {
          node?.style.setProperty("--controls-x", `${latest.current.x}px`);
          node?.style.setProperty("--controls-y", `${latest.current.y}px`);
        }
        setPosition(latest.current);
      }
    };
    window.addEventListener("resize", cancel);
    window.addEventListener("blur", cancel);
    return () => {
      window.removeEventListener("resize", cancel);
      window.removeEventListener("blur", cancel);
      cancelAnimationFrame(frame.current);
      const current = gesture.current;
      gesture.current = null;
      if (current?.handle.hasPointerCapture(current.id)) current.handle.releasePointerCapture(current.id);
    };
  }, [panel, launcher]);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (gesture.current || event.button !== 0 || !event.isPrimary) return;
    const target = event.target as HTMLElement;
    if (target.closest("[data-position-controls]")) return;
    if (target.closest("a, button") && !target.closest("[data-controls-drag-handle]")) return;
    const surface = event.currentTarget.closest<HTMLElement>("[data-try-controls], [data-try-launcher]");
    if (!surface || surface.getAnimations().some(animation => animation.playState === "running")) return;
    dragged.current = false;
    // CSS touch-action handles panning; preserve native touch focus and tap behavior.
    if (event.pointerType === "mouse") event.preventDefault();
    const rect = surface.getBoundingClientRect();
    const handle = target.closest<HTMLElement>("[data-controls-drag-handle]") ?? event.currentTarget;
    gesture.current = { id: event.pointerId, handle, x: event.clientX, y: event.clientY, origin: { x: rect.x, y: rect.y }, width: rect.width, height: rect.height, moved: false };
    latest.current = { x: rect.x, y: rect.y };
    handle.setAttribute("data-dragging", "true");
    try {
      handle.setPointerCapture(event.pointerId);
    } catch {
      // In embedded contexts without capture, in-bounds dragging remains available.
    }
  };
  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - current.x, event.clientY - current.y) > 3) current.moved = true;
    if (!current.moved) return;
    latest.current = constrain({ x: current.origin.x + event.clientX - current.x, y: current.origin.y + event.clientY - current.y }, current.width, current.height);
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => paint(latest.current));
  };
  const reset = () => {
    for (const node of [panel.current, launcher.current]) {
      node?.style.removeProperty("--controls-x");
      node?.style.removeProperty("--controls-y");
    }
    setPosition(null);
  };
  const move = (dx: number, dy: number) => {
    const surface = panel.current?.dataset.state === "open" ? panel.current : launcher.current;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    paint(constrain({ x: rect.x + dx, y: rect.y + dy }, rect.width, rect.height));
    setPosition(latest.current);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Home") { event.preventDefault(); reset(); return; }
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const step = event.shiftKey ? 60 : 20;
    move(event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0, event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0);
  };

  return {
    style: (position ? { "--controls-x": `${position.x}px`, "--controls-y": `${position.y}px` } : {}) as CSSProperties,
    dragHandlers: { onPointerDown, onPointerMove, onPointerUp: endGesture, onPointerCancel: endGesture, onLostPointerCapture: endGesture },
    onKeyDown,
    reset,
    move,
    consumeDragClick: () => { const moved = dragged.current; dragged.current = false; return moved; },
    stop: finish,
  };
}
