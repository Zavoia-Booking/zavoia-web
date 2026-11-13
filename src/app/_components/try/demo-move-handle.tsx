"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import type { useDraggableControls } from "./use-draggable-controls";
import styles from "./demo.module.css";

export function DemoMoveHandle({ floating }: { floating: ReturnType<typeof useDraggableControls> }) {
  const { dict } = useTranslation();
  const t = dict.tryStudio;
  const [placement, setPlacement] = useState<{ left: number; top: number } | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const close = () => { setPlacement(null); trigger.current?.focus({ preventScroll: true }); };

  useEffect(() => {
    if (!placement) return;
    menu.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setPlacement(null);
    };
    const resize = () => setPlacement(null);
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", resize);
    };
  }, [placement]);

  return (
    <div ref={wrapper} className={styles.moveControl} onBlurCapture={event => {
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setPlacement(null);
    }}>
      <button ref={trigger} type="button" className={styles.dragHandle} data-controls-drag-handle="" aria-label={t.moveControls} aria-describedby="demo-move-hint" aria-haspopup="dialog" aria-expanded={!!placement} title={t.moveControlsHint}
        onKeyDown={event => {
          floating.onKeyDown(event);
          if (event.key === "Escape" && placement) { event.preventDefault(); event.stopPropagation(); close(); }
        }}
        onClick={event => {
          const moved = floating.consumeDragClick();
          if (event.detail > 0 && moved) { setPlacement(null); return; }
          if (placement) { close(); return; }
          const rect = trigger.current?.getBoundingClientRect();
          if (!rect) return;
          setPlacement({ left: Math.max(16, Math.min(rect.x + rect.width / 2 - 94, window.innerWidth - 204)), top: rect.bottom + 8 + 188 <= window.innerHeight - 16 ? rect.bottom + 8 : Math.max(16, rect.top - 196) });
        }}><span className={styles.dragRail} aria-hidden="true" /></button>
      {placement && <div ref={menu} data-position-controls="" role="dialog" aria-label={t.positionControls} className={styles.positionPopover} style={placement} onKeyDown={event => {
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
      }}>
        <p>{t.positionControls}</p>
        <div className={styles.positionDirections}>
          <button type="button" className={styles.positionUp} aria-label={t.moveUp} title={t.moveUp} onClick={() => floating.move(0, -20)}><ArrowUp size={17} /></button>
          <button type="button" className={styles.positionLeft} aria-label={t.moveLeft} title={t.moveLeft} onClick={() => floating.move(-20, 0)}><ArrowLeft size={17} /></button>
          <button type="button" className={styles.positionDown} aria-label={t.moveDown} title={t.moveDown} onClick={() => floating.move(0, 20)}><ArrowDown size={17} /></button>
          <button type="button" className={styles.positionRight} aria-label={t.moveRight} title={t.moveRight} onClick={() => floating.move(20, 0)}><ArrowRight size={17} /></button>
        </div>
        <button type="button" className={styles.positionReset} onClick={() => { floating.reset(); close(); }}><RotateCcw size={14} />{t.resetPosition}</button>
      </div>}
    </div>
  );
}
