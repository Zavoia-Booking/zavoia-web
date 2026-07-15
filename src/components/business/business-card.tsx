"use client";

import Link from "next/link";
import type { CSSProperties, KeyboardEvent } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Img } from "@/components/ui/image";
import { CatDot } from "@/components/ui/cat-dot";
import { Rating } from "@/components/ui/rating";
import { HeartButton } from "@/components/ui/heart-button";
import type { BusinessCardData } from "./types";

export interface BusinessCardProps {
  b: BusinessCardData;
  onClick?: () => void;
  favorited?: boolean;
  /** Favorite handler — the heart only renders when provided (signed-in). */
  onFavorite?: (id: BusinessCardData["id"]) => void;
}

const ROOT_STYLE: CSSProperties = {
  background: "#fff",
  border: "1px solid rgba(28,28,26,0.06)",
  borderRadius: "var(--card-r, 18px)",
  overflow: "hidden",
  cursor: "pointer",
  boxShadow: "var(--sh-sm)",
  display: "flex",
  flexDirection: "column",
  textDecoration: "none",
};

// Web grid card — faithful desktop port of the mobile editorial card.
// Shows business-level data only. Ported from ZwBusinessCard.
export function BusinessCard({ b, onClick, favorited, onFavorite }: BusinessCardProps) {
  const isOpen = b.status === "open" || b.status === "24-7" || b.status === "24/7";
  const is247 = b.status === "24-7" || b.status === "24/7";
  const { dict } = useTranslation();

  const inner = (
    <>
      <div
        className="zw-zoom-wrap"
        style={{ position: "relative", aspectRatio: "16 / 10", background: "var(--c-300)" }}
      >
        <Img src={b.image} alt={b.name} label={b.cat} style={{ width: "100%", height: "100%" }} />
        <span
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            background: "rgba(255,255,255,0.94)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            padding: "5px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            color: "var(--c-800)",
            letterSpacing: "-0.005em",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <CatDot cat={b.cat} />
          {b.catLabel}
        </span>
        {onFavorite && (
          <span style={{ position: "absolute", top: 10, right: 10 }}>
            <HeartButton active={favorited} onClick={() => onFavorite(b.id)} size={36} />
          </span>
        )}
      </div>
      <div style={{ padding: "15px 17px 17px", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "-0.022em",
              color: "var(--c-900)",
              lineHeight: 1.15,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
            }}
          >
            {b.name}
          </span>
          {b.rating != null && <Rating rating={b.rating} reviews={b.reviews} size={13.5} />}
        </div>
        {b.blurb && (
          <p
            className="txt-pretty"
            style={{
              margin: "6px 0 0",
              fontSize: 13.5,
              color: "var(--c-700)",
              letterSpacing: "-0.005em",
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {b.blurb}
          </p>
        )}
        <div
          style={{
            marginTop: 9,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontSize: 12.5,
            color: "var(--c-600)",
            letterSpacing: "-0.005em",
            whiteSpace: "nowrap",
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
            <span style={{ color: "var(--s-success-600)", fontWeight: 600 }}>
              {is247 ? dict.common.open247 : dict.common.open}
            </span>
          ) : (
            <span style={{ color: "var(--c-500)", fontWeight: 600 }}>{dict.common.closed}</span>
          )}
        </div>
      </div>
    </>
  );

  if (b.href) {
    return (
      <Link href={b.href} className="zw-hover-lift" style={ROOT_STYLE}>
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
      className="zw-hover-lift"
      style={ROOT_STYLE}
    >
      {inner}
    </div>
  );
}
