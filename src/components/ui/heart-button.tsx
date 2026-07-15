"use client";

import { useState, type MouseEvent } from "react";
import { Icon } from "./icon";

export interface HeartButtonProps {
  active?: boolean;
  onClick?: () => void;
  size?: number;
  floating?: boolean;
}

// Shared favorite affordance. Ported from ZwHeartBtn. Pulses (.zv-heart-pop)
// on click; floating adds a frosted white background. Cards render inside a
// <Link>, so the click must also preventDefault — stopPropagation alone does
// not cancel the anchor's navigation.
export function HeartButton({ active, onClick, size = 34, floating = true }: HeartButtonProps) {
  const [pop, setPop] = useState(false);
  return (
    <button
      type="button"
      aria-label={active ? "Remove from saved" : "Save"}
      aria-pressed={active}
      onClick={(e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setPop(true);
        setTimeout(() => setPop(false), 600);
        onClick?.();
      }}
      className="tap"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: 0,
        cursor: "pointer",
        background: floating ? "rgba(255,255,255,0.92)" : "transparent",
        backdropFilter: floating ? "blur(10px)" : "none",
        WebkitBackdropFilter: floating ? "blur(10px)" : "none",
        boxShadow: floating ? "0 1px 4px rgba(28,28,26,0.12)" : "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span className={pop ? "zv-heart-pop" : ""} style={{ display: "inline-flex" }}>
        <Icon
          name={active ? "heart" : "heartO"}
          size={size * 0.5}
          color={active ? "var(--p-500)" : "var(--c-800)"}
        />
      </span>
    </button>
  );
}
