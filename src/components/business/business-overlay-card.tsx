"use client";

import Link from "next/link";
import type { CSSProperties, KeyboardEvent } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Img } from "@/components/ui/image";
import { Icon } from "@/components/ui/icon";
import { HeartButton } from "@/components/ui/heart-button";
import type { BusinessCardData } from "./types";

export interface BusinessOverlayCardProps {
  b: BusinessCardData;
  onClick?: () => void;
  favorited?: boolean | null;
  /** Favorite handler — the heart only renders when provided. */
  onFavorite?: (id: BusinessCardData["id"]) => void;
}

const ROOT_STYLE: CSSProperties = {
  position: "relative",
  borderRadius: "var(--card-r, 18px)",
  overflow: "hidden",
  cursor: "pointer",
  aspectRatio: "4 / 5",
  background: "var(--c-ink)",
  boxShadow: "var(--sh-md)",
  display: "block",
  textDecoration: "none",
};

const ACTION_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "block",
  borderRadius: "inherit",
  color: "inherit",
  textDecoration: "none",
  outlineOffset: -3,
};

// Photo-forward card: full-bleed image, dual gradient scrims, magazine-bold
// name, and a confident rating block (big number + fractional stars).
// Ported from ZwBusinessOverlayCard.
export function BusinessOverlayCard({ b, onClick, favorited, onFavorite }: BusinessOverlayCardProps) {
  const { dict } = useTranslation();
  const locationName = b.locationName?.trim() || b.name;
  const businessName = b.businessName?.trim();
  const showBusinessName = businessName && businessName.toLowerCase() !== locationName.toLowerCase();
  const imageName = showBusinessName ? `${businessName}, ${locationName}` : locationName;
  const cardName = [locationName, showBusinessName ? businessName : null, b.city].filter(Boolean).join(", ");
  const inner = (
    <>
      <div className="zw-zoom-wrap" style={{ position: "absolute", inset: 0 }}>
        <Img
          src={b.image}
          alt={imageName}
          label={b.cat}
          sizes="(max-width: 600px) calc(100vw - 32px), (max-width: 920px) 50vw, 320px"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 110,
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
        style={{ position: "absolute", left: 18, right: 18, bottom: 18, color: "#fff", textAlign: "left" }}
      >
        <div
          className="txt-balance"
          style={{
            fontSize: "clamp(20px, 1.5vw, 25px)",
            fontWeight: 700,
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            textShadow: "0 2px 14px rgba(0,0,0,0.42)",
          }}
        >
          {locationName}
        </div>
        {showBusinessName && (
          <div
            style={{
              marginTop: 7,
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.3,
              color: "rgba(255,255,255,0.90)",
              textShadow: "0 1px 6px rgba(0,0,0,0.40)",
            }}
          >
            {businessName}
          </div>
        )}
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            fontWeight: 500,
            color: "rgba(255,255,255,0.82)",
            letterSpacing: "-0.005em",
            textShadow: "0 1px 6px rgba(0,0,0,0.40)",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%",
          }}
        >
          {b.city && <span>{b.city}</span>}
          {b.city && b.distance && <span style={{ opacity: 0.45 }}>·</span>}
          {b.distance && <span>{b.distance}</span>}
        </div>
        {b.rating != null && (
          <div style={{ marginTop: 13, display: "flex", alignItems: "flex-start", gap: 9 }}>
            <span
              style={{
                fontSize: 31,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-0.038em",
                lineHeight: 0.9,
                fontVariantNumeric: "tabular-nums",
                textShadow: "0 2px 12px rgba(0,0,0,0.38)",
              }}
            >
              {b.rating.toFixed(1)}
            </span>
            <span style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
              <span style={{ display: "inline-flex", gap: 1.5, alignItems: "center" }}>
                {[0, 1, 2, 3, 4].map((i) => {
                  const fill = Math.max(0, Math.min(1, (b.rating || 0) - i));
                  return (
                    <span
                      key={i}
                      style={{ position: "relative", width: 12, height: 12, display: "inline-block" }}
                    >
                      <Icon name="star" size={12} color="rgba(255,255,255,0.32)" />
                      <span
                        style={{ position: "absolute", inset: 0, overflow: "hidden", width: `${fill * 100}%` }}
                      >
                        <Icon name="star" size={12} color="#fff" />
                      </span>
                    </span>
                  );
                })}
              </span>
              {b.reviews != null && (
                <span
                  style={{
                    fontSize: 13,
                    lineHeight: "16px",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.78)",
                    letterSpacing: "-0.005em",
                    textShadow: "0 1px 6px rgba(0,0,0,0.35)",
                  }}
                >
                  {b.reviews} {dict.common.reviews}
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div
      className="zw-hover-lift zw-zoom-parent"
      style={{ ...ROOT_STYLE, cursor: b.href || onClick ? "pointer" : "default" }}
    >
      {b.href ? (
        <Link href={b.href} title={cardName} aria-label={cardName} style={ACTION_STYLE}>
          {inner}
        </Link>
      ) : onClick ? (
        <div
          role="button"
          tabIndex={0}
          aria-label={cardName}
          onClick={onClick}
          onKeyDown={(event: KeyboardEvent) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onClick();
            }
          }}
          style={ACTION_STYLE}
        >
          {inner}
        </div>
      ) : (
        <div style={ACTION_STYLE}>{inner}</div>
      )}
      {onFavorite && (
        <span style={{ position: "absolute", top: 12, right: 12 }}>
          <HeartButton active={favorited} onClick={() => onFavorite(b.id)} size={34} />
        </span>
      )}
    </div>
  );
}
