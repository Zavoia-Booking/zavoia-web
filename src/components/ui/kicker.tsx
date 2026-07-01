import type { CSSProperties, ReactNode } from "react";

export interface KickerProps {
  children?: ReactNode;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

// Mono uppercase eyebrow — the brand's section voice. Ported from ZwKicker.
export function Kicker({ children, color = "var(--p-600)", className, style }: KickerProps) {
  return (
    <div
      className={className}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11.5,
        fontWeight: 600,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
