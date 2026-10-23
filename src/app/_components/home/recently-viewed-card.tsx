"use client";

import Link from "next/link";
import { HeartButton, Img, Rating } from "@/components/ui";
import styles from "./recently-viewed.module.css";

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
// and a single meta row (rating + "·" + distance/city). No category chip or
// open/closed status — ported from docs/web-home.jsx ZwRecentlyViewed. Like the
// app's Recently visited, it carries a save heart, as a sibling of the link.
export function RecentlyViewedCard({
  b,
  favorited,
  onFavorite,
}: {
  b: RecentlyViewedCardData;
  favorited?: boolean | null;
  onFavorite?: (id: number) => void;
}) {
  // Distance preferred; fall back to city; otherwise nothing.
  const meta = b.distance ?? b.city;

  return (
    <div className={styles.item}>
      <Link
        href={b.href}
        title={b.name}
        className={`${styles.card} ${styles.link}`}
      >
        <div className={styles.media}>
          <Img src={b.image} alt={b.name} sizes="(max-width: 471px) calc(100vw - 32px), (max-width: 719px) 50vw, (max-width: 1255px) 33vw, 224px" style={{ width: "100%", height: "100%" }} />
        </div>
        <div className={styles.body}>
          <div className={styles.name}>{b.name}</div>
          <div className={styles.meta}>
            {b.rating != null && (
              <Rating rating={b.rating} reviews={b.reviews} size={12} />
            )}
            {b.rating != null && meta && (
              <span className={styles.separator}>·</span>
            )}
            {meta && (
              <span title={meta} className={styles.location}>{meta}</span>
            )}
          </div>
        </div>
      </Link>
      {onFavorite && (
        <span className={styles.heart}>
          <HeartButton active={favorited} onClick={() => onFavorite(b.id)} size={34} />
        </span>
      )}
    </div>
  );
}
