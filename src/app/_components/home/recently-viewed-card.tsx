"use client";

import Link from "next/link";
import { Img, Rating } from "@/components/ui";

export interface RecentlyViewedCardData {
  /** Location id (nav target). */
  id: number;
  name: string;
  image?: string;
  rating?: number;
  reviews?: number;
  /** Pre-formatted distance string (e.g. "2.4 km") when available. */
  distance?: string;
  /** City fallback shown when distance is unavailable. */
  city?: string;
  href: string;
}

// Compact "recently viewed" mini card. Shows ONLY a photo, the business name,
// and a single meta row (rating + "·" + distance/city). No category chip, no
// heart, no open/closed status — ported from docs/web-home.jsx ZwRecentlyViewed.
export function RecentlyViewedCard({ b }: { b: RecentlyViewedCardData }) {
  // Distance preferred; fall back to city; otherwise nothing.
  const meta = b.distance ?? b.city;

  return (
    <Link
      href={b.href}
      className="zw-hover-lift zw-zoom-parent"
      style={{
        display: "block",
        width: 224,
        flexShrink: 0,
        scrollSnapAlign: "start",
        background: "#fff",
        border: "1px solid rgba(28,28,26,0.06)",
        borderRadius: "var(--card-r, 18px)",
        overflow: "hidden",
        boxShadow: "var(--sh-sm)",
        color: "inherit",
        textDecoration: "none",
      }}
    >
      <div
        className="zw-zoom-wrap"
        style={{ aspectRatio: "16 / 10", background: "var(--c-300)" }}
      >
        <Img src={b.image} alt={b.name} style={{ width: "100%", height: "100%" }} />
      </div>
      <div style={{ padding: "11px 14px 13px" }}>
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            letterSpacing: "-0.015em",
            color: "var(--c-900)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {b.name}
        </div>
        {(b.rating != null || meta) && (
          <div
            style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}
          >
            {b.rating != null && (
              <Rating rating={b.rating} reviews={b.reviews} size={12} />
            )}
            {b.rating != null && meta && (
              <span style={{ color: "var(--c-400)", fontSize: 12 }}>·</span>
            )}
            {meta && (
              <span style={{ fontSize: 12, color: "var(--c-600)" }}>{meta}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
