"use client";

import Link from "next/link";
import type { CSSProperties, KeyboardEvent } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Img } from "@/components/ui/image";
import { Icon } from "@/components/ui/icon";
import type { BusinessCardData } from "./types";

export interface BusinessFeedCardProps {
  b: BusinessCardData;
  onClick?: () => void;
}

const ROOT_STYLE: CSSProperties = {
  display: "flex",
  height: 168,
  background: "#fff",
  border: "1px solid rgba(28,28,26,0.06)",
  borderRadius: "var(--card-r, 18px)",
  overflow: "hidden",
  boxShadow: "var(--sh-sm)",
  cursor: "pointer",
  textDecoration: "none",
};

// Two-zone ticket: photo-left with name overlay, dashed divider, then a
// content zone (category small-caps, 2-line blurb, rating, mono meta line).
// Ported from ZwBusinessFeedCard.
export function BusinessFeedCard({ b, onClick }: BusinessFeedCardProps) {
  const { dict } = useTranslation();
  const is247 = b.status === "24-7" || b.status === "24/7";
  const isOpen = b.status === "open" || is247;

  const inner = (
    <>
      <div
        className="zw-zoom-wrap"
        style={{ width: 150, flexShrink: 0, position: "relative", background: "var(--c-300)" }}
      >
        <Img
          src={b.image}
          alt={b.name}
          label={b.cat}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 70,
            background: "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0) 100%)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.42) 60%, rgba(0,0,0,0.88) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            bottom: 11,
            fontSize: 14,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "-0.018em",
            lineHeight: 1.15,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textShadow: "0 2px 12px rgba(0,0,0,0.42)",
          }}
        >
          {b.name}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: "13px 16px 0",
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px dashed rgba(28,28,26,0.08)",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 700,
            color: `var(--cat-${b.cat})`,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: `var(--cat-${b.cat})`,
              flexShrink: 0,
            }}
          />
          {b.catLabel}
        </span>
        {b.blurb && (
          <div
            style={{
              marginTop: 9,
              fontSize: 15,
              fontWeight: 500,
              color: "var(--c-900)",
              letterSpacing: "-0.015em",
              lineHeight: 1.25,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {b.blurb}
          </div>
        )}
        {b.rating != null && (
          <div
            style={{
              marginTop: 5,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--c-900)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <Icon name="star" size={11} color="var(--p-500)" />
            {b.rating.toFixed(1)}
            {b.reviews != null && (
              <span style={{ color: "var(--c-500)", fontWeight: 500 }}>({b.reviews})</span>
            )}
          </div>
        )}
        <div
          style={{
            marginTop: "auto",
            marginBottom: 13,
            paddingTop: 9,
            borderTop: "1px solid rgba(28,28,26,0.06)",
            fontFamily: "var(--font-mono)",
            fontVariantNumeric: "tabular-nums",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--c-700)",
            letterSpacing: "0.005em",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {b.distance && <span>{b.distance}</span>}
          {b.distance && (
            <span
              aria-hidden="true"
              style={{
                width: 3,
                height: 3,
                borderRadius: "50%",
                background: "var(--c-400)",
                flexShrink: 0,
              }}
            />
          )}
          {isOpen ? (
            <span style={{ color: "var(--s-success-600)" }}>
              {(is247 ? dict.common.open247 : dict.common.open).toUpperCase()}
            </span>
          ) : (
            <span style={{ color: "var(--c-500)" }}>{dict.common.closed.toUpperCase()}</span>
          )}
        </div>
      </div>
    </>
  );

  if (b.href) {
    return (
      <Link href={b.href} className="zw-hover-lift zw-zoom-parent" style={ROOT_STYLE}>
        {inner}
      </Link>
    );
  }
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === "Enter") onClick?.();
      }}
      className="zw-hover-lift zw-zoom-parent"
      style={ROOT_STYLE}
    >
      {inner}
    </div>
  );
}
