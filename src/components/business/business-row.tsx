"use client";

import Link from "next/link";
import type { CSSProperties, KeyboardEvent } from "react";
import { Img } from "@/components/ui/image";
import { CatDot } from "@/components/ui/cat-dot";
import { Rating } from "@/components/ui/rating";
import { StatusPill } from "@/components/ui/status-pill";
import { HeartButton } from "@/components/ui/heart-button";
import type { BusinessCardData } from "./types";

export interface BusinessRowProps {
  b: BusinessCardData;
  onClick?: () => void;
  selected?: boolean;
  favorited?: boolean;
  onFavorite?: (id: BusinessCardData["id"]) => void;
  onHover?: () => void;
  onLeave?: () => void;
}

// Compact horizontal row for results panels / lists. Ported from
// ZwBusinessRow. Uses CatDot / Rating / StatusPill / HeartButton(floating=false).
export function BusinessRow({
  b,
  onClick,
  selected = false,
  favorited,
  onFavorite,
  onHover,
  onLeave,
}: BusinessRowProps) {
  const rootStyle: CSSProperties = {
    display: "flex",
    gap: 14,
    padding: 12,
    borderRadius: 16,
    cursor: "pointer",
    background: selected ? "var(--c-100)" : "transparent",
    border: selected ? "1px solid rgba(28,28,26,0.10)" : "1px solid transparent",
    transition:
      "background-color .18s var(--ease-soft), border-color .18s var(--ease-soft)",
    textDecoration: "none",
  };

  const inner = (
    <>
      <div
        className="zw-zoom-wrap"
        style={{
          width: 116,
          height: 96,
          borderRadius: 12,
          overflow: "hidden",
          background: "var(--c-300)",
          flexShrink: 0,
          position: "relative",
        }}
      >
        <Img src={b.image} alt={b.name} label={b.cat} style={{ width: "100%", height: "100%" }} />
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          paddingTop: 2,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 15.5,
              fontWeight: 600,
              letterSpacing: "-0.015em",
              color: "var(--c-900)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {b.name}
          </span>
          <HeartButton
            active={favorited}
            onClick={() => onFavorite?.(b.id)}
            size={28}
            floating={false}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12.5,
            color: "var(--c-600)",
          }}
        >
          <CatDot cat={b.cat} size={5} />
          {b.catLabel && <span>{b.catLabel}</span>}
          {b.catLabel && b.distance && <span style={{ color: "var(--c-400)" }}>·</span>}
          {b.distance && <span>{b.distance}</span>}
        </div>
        {b.rating != null && <Rating rating={b.rating} reviews={b.reviews} size={12.5} />}
        {b.status && (
          <div style={{ marginTop: "auto" }}>
            <StatusPill status={b.status} closesAt={b.closesAt} dense />
          </div>
        )}
      </div>
    </>
  );

  if (b.href) {
    return (
      <Link
        href={b.href}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        className="zw-zoom-parent"
        style={rootStyle}
      >
        {inner}
      </Link>
    );
  }
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === "Enter") onClick?.();
      }}
      className="zw-zoom-parent"
      style={rootStyle}
    >
      {inner}
    </div>
  );
}
