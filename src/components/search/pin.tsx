"use client";

import { Icon } from "@/components/ui/icon";
import type { CategoryKey } from "@/components/ui/cat-dot";
import { catIcon } from "./projection";

export type PinState = "default" | "selected" | "viewed";

export interface PinData {
  id: number;
  name: string;
  cat: CategoryKey | string;
  mapX: number;
  mapY: number;
}

export interface PinProps {
  p: PinData;
  state?: PinState;
  onClick?: () => void;
  onEnter?: () => void;
  onLeave?: () => void;
  z?: number;
  /** When set, the inner plate plays the staggered drop-in animation. */
  dropIndex?: number | null;
}

export interface PinGlyphProps {
  /** Category key (drives the icon + colour). */
  cat: CategoryKey | string;
  state?: PinState;
  /** When set, the plate plays the staggered drop-in animation. */
  dropIndex?: number | null;
}

// The pin plate itself — the shared presentational glyph used by BOTH the old
// absolutely-positioned <Pin> and the new react-map-gl markers. The category
// COLOUR is the cue: default = white plate + coloured icon, selected = coloured
// plate + white icon (scaled, glow ring), viewed = dimmed/desaturated.
// Ported 1:1 from ZvPin (docs/map-surface.jsx).
export function PinGlyph({ cat, state = "default", dropIndex = null }: PinGlyphProps) {
  const isSelected = state === "selected";
  const color = `var(--cat-${cat})`;

  return (
    <span
      className={dropIndex != null ? "zv-pin-drop" : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: "50%",
        animationDelay:
          dropIndex != null ? `${Math.min(dropIndex * 35, 600)}ms` : undefined,
        background: isSelected ? color : "#fff",
        color: isSelected ? "#fff" : color,
        border: isSelected ? 0 : "2px solid rgba(28,28,26,0.06)",
        boxShadow: isSelected
          ? `0 0 0 3px rgba(255,255,255,0.92), 0 0 18px color-mix(in oklch, ${color} 55%, transparent), 0 6px 16px rgba(28,28,26,0.28)`
          : "0 2px 6px rgba(28,28,26,0.12)",
        transition:
          "background-color .25s var(--ease-soft), color .25s var(--ease-soft), border-color .25s var(--ease-soft), box-shadow .3s var(--ease-soft)",
      }}
    >
      <Icon name={catIcon(cat)} size={14} />
    </span>
  );
}

// Map pin — ported 1:1 from ZvPin (docs/map-surface.jsx). Positioned absolutely
// by normalised mapX/mapY ∈ [0..1]. Wraps the shared <PinGlyph> in a button so
// the selected scale/opacity transforms live on the interactive element.
export function Pin({
  p,
  state = "default",
  onClick,
  onEnter,
  onLeave,
  z = 1,
  dropIndex = null,
}: PinProps) {
  const isSelected = state === "selected";
  const isViewed = state === "viewed";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="tap"
      aria-label={p.name}
      style={{
        position: "absolute",
        left: `${p.mapX * 100}%`,
        top: `${p.mapY * 100}%`,
        transform: `translate(-50%, -50%) scale(${isSelected ? 1.45 : 1})`,
        cursor: "pointer",
        transition: "transform .35s var(--ease-spring), opacity .2s linear",
        zIndex: isSelected ? 5 : z,
        opacity: isViewed ? 0.55 : 1,
        filter: isViewed ? "saturate(0.5)" : "none",
        padding: 0,
        border: 0,
        background: "transparent",
      }}
    >
      <PinGlyph cat={p.cat} state={state} dropIndex={dropIndex} />
    </button>
  );
}
