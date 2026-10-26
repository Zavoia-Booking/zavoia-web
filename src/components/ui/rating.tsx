"use client";

import type { CSSProperties } from "react";
import { Icon } from "./icon";
import { useTranslation } from "@/i18n/useTranslation";
import { format, formatCount } from "@/i18n/format";

export interface StarsProps {
  value?: number;
  size?: number;
  color?: string;
  empty?: string;
  gap?: number;
}

// 5-star rating, supports halves. Ported from docs/icons.jsx (ZStars).
export function Stars({
  value = 0,
  size = 14,
  color = "var(--p-500)",
  empty = "var(--c-300)",
  gap = 1,
}: StarsProps) {
  const { dict, locale } = useTranslation();
  const label = format(dict.locationPage.ratingLabel, {
    rating: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value),
  });
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = value >= i;
    const half = !filled && value >= i - 0.5;
    stars.push(
      <Icon
        key={i}
        name={half ? "starHalf" : filled ? "star" : "starO"}
        size={size}
        color={filled || half ? color : empty}
      />,
    );
  }
  return <span role="img" aria-label={label} style={{ display: "inline-flex", gap, alignItems: "center" }}>{stars}</span>;
}

export interface RatingProps {
  rating: number;
  reviews?: number;
  size?: number;
  color?: string;
}

// Compact star + numeric rating + optional review count. Ported from
// docs/web-components.jsx (ZwRating). Uses the i18n hook so it stays
// consistent with the shared dictionary (review-count is numeric).
export function Rating({ rating, reviews, size = 13, color = "var(--c-900)" }: RatingProps) {
  const { dict, locale } = useTranslation();
  const formattedRating = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(rating);
  const formattedReviews = reviews != null ? new Intl.NumberFormat(locale).format(reviews) : null;
  const reviewLabel = reviews != null ? formatCount(reviews, locale, {
    one: dict.business.reviewsCountOne,
    few: dict.business.reviewsCount,
    other: dict.business.reviewsCountMany,
  }) : null;
  const label = format(dict.locationPage.ratingLabel, { rating: formattedRating });
  const tnum: CSSProperties = { fontVariantNumeric: "tabular-nums" };
  return (
    <span
      role="img"
      aria-label={reviewLabel !== null ? `${label}, ${reviewLabel}` : label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: size,
        color,
        fontWeight: 600,
        letterSpacing: "-0.005em",
      }}
    >
      <Icon name="star" size={size - 1} color="var(--p-500)" />
      <span style={tnum}>{formattedRating}</span>
      {reviews != null && (
        <span style={{ color: "var(--c-600)", fontWeight: 400, ...tnum }}>({formattedReviews})</span>
      )}
    </span>
  );
}
