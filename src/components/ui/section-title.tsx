"use client";

import type { CSSProperties, ReactNode } from "react";
import { Icon } from "./icon";
import { Kicker } from "./kicker";

export interface SectionTitleProps {
  kicker?: ReactNode;
  title: ReactNode;
  action?: ReactNode;
  onAction?: () => void;
  className?: string;
  style?: CSSProperties;
}

// Editorial section header. Ported from ZwSectionTitle. Marked 'use client'
// because the optional action attaches an onClick handler.
export function SectionTitle({
  kicker,
  title,
  action,
  onAction,
  className,
  style,
}: SectionTitleProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 22,
        ...style,
      }}
    >
      <div>
        {kicker && <Kicker style={{ marginBottom: 8 }}>{kicker}</Kicker>}
        <h2
          className="txt-balance"
          style={{
            margin: 0,
            fontSize: "clamp(22px, 2.4vw, 30px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.06,
            color: "var(--c-900)",
          }}
        >
          {title}
        </h2>
      </div>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="tap"
          style={{
            background: "transparent",
            border: 0,
            cursor: "pointer",
            padding: "4px 0",
            color: "var(--c-700)",
            fontSize: 14,
            fontWeight: 600,
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {action}
          <Icon name="chevR" size={14} color="var(--c-700)" />
        </button>
      )}
    </div>
  );
}
