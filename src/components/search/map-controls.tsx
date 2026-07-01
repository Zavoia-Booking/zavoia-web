"use client";

import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/icon";

export interface MapControlsProps {
  onRecenter?: () => void;
  onLayers?: () => void;
  recenterAria: string;
  layersAria?: string;
}

// Map control stack — recenter / layers. Each button is skipped when its
// handler is absent. Ported from ZvMapControls (docs/map-surface.jsx).
export function MapControls({
  onRecenter,
  onLayers,
  recenterAria,
  layersAria,
}: MapControlsProps) {
  const btn: CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: 0,
    background: "#fff",
    color: "var(--c-900)",
    boxShadow:
      "0 2px 8px rgba(28,28,26,0.16), 0 0 0 1px rgba(28,28,26,0.04)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  if (!onLayers && !onRecenter) return null;

  return (
    <div
      style={{
        position: "absolute",
        right: 12,
        zIndex: 25,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {onLayers && (
        <button
          type="button"
          className="tap"
          style={btn}
          onClick={onLayers}
          aria-label={layersAria}
        >
          <Icon name="layers" size={18} />
        </button>
      )}
      {onRecenter && (
        <button
          type="button"
          className="tap"
          style={btn}
          onClick={onRecenter}
          aria-label={recenterAria}
        >
          <Icon name="nav" size={17} />
        </button>
      )}
    </div>
  );
}
