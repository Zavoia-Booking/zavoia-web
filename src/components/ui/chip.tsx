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
}

export function Chip({ active = false, onClick, icon, children, className, style }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
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
