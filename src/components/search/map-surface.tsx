"use client";

import type { ReactNode } from "react";
import { MapBackground } from "./map-background";
import { Pin, type PinData } from "./pin";
import { UserDot } from "./user-dot";
import { MapControls } from "./map-controls";
import type { MapPoint } from "./projection";

export interface MapSurfaceProps {
  /** Already-projected pins (locations with coordinates only). */
  pins: PinData[];
  selectedId: number | null;
  viewedIds?: Set<number>;
  onSelect?: (id: number) => void;
  onHover?: (id: number | null) => void;
  onRecenter?: () => void;
  /** Re-keys the pins so they re-drop when the result set changes. */
  wave?: string;
  userPos?: MapPoint | null;
  recenterAria: string;
  children?: ReactNode;
}

// Composes the decorative background + projected pins + user dot + controls.
// Ported from ZvMap (docs/map-surface.jsx). Pins are keyed on `wave` so they
// re-drop on each new result set.
export function MapSurface({
  pins,
  selectedId,
  viewedIds,
  onSelect,
  onHover,
  onRecenter,
  wave = "",
  userPos,
  recenterAria,
  children,
}: MapSurfaceProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "#EEEAE0",
      }}
    >
      <MapBackground />

      {pins.map((p, i) => {
        const isSelected = p.id === selectedId;
        const isViewed = !isSelected && (viewedIds?.has(p.id) ?? false);
        const state = isSelected
          ? "selected"
          : isViewed
            ? "viewed"
            : "default";
        return (
          <Pin
            key={`${wave}:${p.id}`}
            p={p}
            state={state}
            dropIndex={wave ? i : null}
            onClick={() => onSelect?.(p.id)}
            onEnter={onHover ? () => onHover(p.id) : undefined}
            onLeave={onHover ? () => onHover(null) : undefined}
            z={isSelected ? 5 : 2}
          />
        );
      })}

      {userPos && <UserDot x={userPos.mapX} y={userPos.mapY} />}

      <div
        style={{
          position: "absolute",
          right: 0,
          top: 56,
          bottom: 0,
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <MapControls onRecenter={onRecenter} recenterAria={recenterAria} />
        </div>
      </div>

      {children}
    </div>
  );
}
