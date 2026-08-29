"use client";

import { Icon } from "@/components/ui/icon";
import type { CategoryKey } from "@/components/ui/cat-dot";
import { catIcon } from "./projection";

export type PinState = "default" | "selected" | "viewed";

export interface PinGlyphProps {
  /** Category key (drives the icon + colour). */
  cat: CategoryKey | string;
  state?: PinState;
  /** When set, the plate plays the staggered drop-in animation. */
  dropIndex?: number | null;
}

// The pin plate itself — the presentational glyph rendered inside each
// react-map-gl <Marker> on /search. The category
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

