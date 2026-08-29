"use client";

import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "./icon";

export interface ChipProps {
  active?: boolean;
  onClick?: () => void;
  icon?: IconName;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Accessible name, when the visible label alone doesn't carry the state. */
  ariaLabel?: string;
  /** Set when the chip toggles something, so its state is announced. */
  ariaPressed?: boolean;
}

export function Chip({
  active = false,
  onClick,
  icon,
  children,
  className,
  style,
  ariaLabel,
  ariaPressed,
}: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={["tap", className].filter(Boolean).join(" ")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        borderRadius: 999,
        cursor: "pointer",
        fontSize: 13.5,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        background: active ? "var(--c-ink)" : "#fff",
        color: active ? "#fff" : "var(--c-800)",
        border: active ? "1px solid var(--c-ink)" : "1px solid rgba(28,28,26,0.12)",
        whiteSpace: "nowrap",
        flexShrink: 0,
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={14} color={active ? "#fff" : "var(--c-700)"} />}
      {children}
    </button>
  );
}
