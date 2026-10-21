"use client";

import { useState, type MouseEvent } from "react";
import { Icon } from "./icon";
import { Skeleton } from "./skeleton";
import { useTranslation } from "@/i18n/useTranslation";

export interface HeartButtonProps {
  /** undefined is unresolved; null is unavailable after a failed first load. */
  active?: boolean | null;
  onClick?: () => void;
  size?: number;
  floating?: boolean;
}

// Shared favorite affordance. Ported from ZwHeartBtn. Pulses (.zv-heart-pop)
// on click; floating adds a frosted white background. Cancel enclosing card
// handlers and default navigation so selecting a favourite only performs that
// action, including when a consumer places the control inside a link.
export function HeartButton({ active, onClick, size = 34, floating = true }: HeartButtonProps) {
  const [pop, setPop] = useState(false);
  const { dict } = useTranslation();
  const known = typeof active === "boolean";
  const pending = active === undefined;
  const label = known
    ? active ? dict.common.removeSaved : dict.common.save
    : pending ? dict.common.savedStatusLoading : dict.common.savedStatusUnavailable;
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={known ? active : undefined}
      aria-disabled={!known}
      aria-busy={pending}
      title={active === null ? label : undefined}
      tabIndex={known ? 0 : -1}
      onClick={(e: MouseEvent) => {
        // Keep cancellation active while unavailable, including inside a card
        // link. aria-disabled blocks the action without handing it to the link.
        e.preventDefault();
        e.stopPropagation();
        if (!known) return;
        setPop(true);
        setTimeout(() => setPop(false), 600);
        onClick?.();
      }}
      className={known ? "tap" : undefined}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: 0,
        cursor: known ? "pointer" : "default",
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
      {known ? (
        <span aria-hidden="true" className={pop ? "zv-heart-pop" : ""} style={{ display: "inline-flex" }}>
          <Icon
            name={active ? "heart" : "heartO"}
            size={size * 0.5}
            color={active ? "var(--p-500)" : "var(--c-800)"}
          />
        </span>
      ) : (
        <span aria-hidden="true">
          <Skeleton w={size * 0.5} h={size * 0.5} r={4} style={pending ? undefined : { animation: "none" }} />
        </span>
      )}
    </button>
  );
}
