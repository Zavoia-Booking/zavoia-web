import type { ReactNode } from "react";
import { Icon } from "./icon";

export interface CheckRowProps {
  children?: ReactNode;
  /** Render for a dark background (ink panels): light check + text. */
  dark?: boolean;
  /** Font size of the label text. */
  size?: number;
}

// Feature bullet with the brand check. Ported verbatim from ZwCheckRow
// (docs/web-marketing.jsx:37-53). Presentational only — no state.
export function CheckRow({ children, dark = false, size = 15 }: CheckRowProps) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          flexShrink: 0,
          marginTop: 1,
          background: dark ? "rgba(255,255,255,0.14)" : "var(--p-100)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="check" size={11} color={dark ? "#fff" : "var(--p-600)"} />
      </span>
      <span
        style={{
          fontSize: size,
          lineHeight: 1.45,
          letterSpacing: "-0.01em",
          color: dark ? "rgba(255,255,255,0.85)" : "var(--c-700)",
        }}
      >
        {children}
      </span>
    </div>
  );
}
