"use client";

import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";

export interface MapControlsProps {
  onRecenter?: () => void;
  onLayers?: () => void;
  recenterAria: string;
  layersAria?: string;
  /** A fix is being resolved — the crosshair shows a spinner and ignores taps. */
  busy?: boolean;
}

// Map control stack — recenter / layers. Each button is skipped when its
// handler is absent. Ported from ZvMapControls (docs/map-surface.jsx).
export function MapControls({
  onRecenter,
  onLayers,
  recenterAria,
  layersAria,
  busy = false,
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

  // Positioning is the caller's — this is just the stack.
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
          style={{ ...btn, cursor: busy ? "default" : "pointer" }}
          onClick={busy ? undefined : onRecenter}
          aria-label={recenterAria}
          aria-busy={busy}
        >
          {busy ? <Spinner size={17} color="var(--c-900)" /> : <Icon name="nav" size={17} />}
        </button>
      )}
    </div>
  );
}
