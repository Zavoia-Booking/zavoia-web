"use client";

import { useState } from "react";
import { Icon } from "./icon";

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqListProps {
  items: FaqItem[];
}

// Single-open accordion. Ported verbatim from ZwFaqList
// (docs/web-marketing.jsx:58-96). `open` starts at 0; clicking the open row
// collapses it to -1. The open answer is wrapped in `.zv-fade`.
export function FaqList({ items }: FaqListProps) {
  const [open, setOpen] = useState(0);
  return (
    <div style={{ borderTop: "1px solid rgba(28,28,26,0.08)" }}>
      {items.map((it, i) => {
        const on = open === i;
        return (
          <div key={i} style={{ borderBottom: "1px solid rgba(28,28,26,0.08)" }}>
            <button
              type="button"
              className="tap"
              onClick={() => setOpen(on ? -1 : i)}
              aria-expanded={on}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                background: "transparent",
                border: 0,
                cursor: "pointer",
                padding: "20px 2px",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  fontSize: 16.5,
                  fontWeight: 600,
                  letterSpacing: "-0.018em",
                  color: "var(--c-900)",
                  lineHeight: 1.3,
                }}
              >
                {it.q}
              </span>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  flexShrink: 0,
                  border: "1px solid rgba(28,28,26,0.14)",
                  background: on ? "var(--c-ink)" : "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background-color .2s var(--ease-soft)",
                }}
              >
                <Icon
                  name={on ? "chevU" : "chevD"}
                  size={14}
                  color={on ? "#fff" : "var(--c-700)"}
                />
              </span>
            </button>
            {on && (
              <p
                className="zv-fade txt-pretty"
                style={{
                  margin: "0 0 22px",
                  maxWidth: 640,
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: "var(--c-600)",
                  letterSpacing: "-0.005em",
                }}
              >
                {it.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
