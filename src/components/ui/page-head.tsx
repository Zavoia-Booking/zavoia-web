import type { ReactNode } from "react";
import { Kicker } from "./kicker";

export interface PageHeadProps {
  kicker?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  /** Max width of the title, in px. */
  maxWidth?: number;
}

// Centered content-page header — kicker + big title + sub. Ported verbatim
// from ZwPageHead (docs/web-marketing.jsx:205-222). Presentational only.
export function PageHead({ kicker, title, sub, maxWidth = 720 }: PageHeadProps) {
  return (
    <div
      className="zw-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "clamp(52px, 7vw, 96px) var(--gutter) 0",
      }}
    >
      {kicker && <Kicker style={{ marginBottom: 16 }}>{kicker}</Kicker>}
      <h1
        className="txt-balance"
        style={{
          margin: 0,
          fontSize: "clamp(36px, 4.8vw, 62px)",
          fontWeight: 600,
          letterSpacing: "-0.045em",
          lineHeight: 0.98,
          color: "var(--c-900)",
          maxWidth,
        }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="txt-pretty"
          style={{
            margin: "22px 0 0",
            fontSize: "clamp(15.5px, 1.4vw, 18px)",
            lineHeight: 1.6,
            color: "var(--c-600)",
            maxWidth: 560,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
