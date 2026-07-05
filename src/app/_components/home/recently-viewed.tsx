"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import { SectionTitle } from "@/components/ui/section-title";
import { getListingsBulk } from "@/lib/api/marketplace/public";
import type { ListingLightCard } from "@/lib/api/marketplace/types";
import { getRecentViews, removeRecentViews } from "@/lib/recent-views";
import {
  RecentlyViewedCard,
  type RecentlyViewedCardData,
} from "./recently-viewed-card";

// Haversine distance in km between two {lat,lng} points.
function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371; // Earth radius (km)
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Reads the recently-viewed LOCATION-id trail from localStorage (written by
// the business-detail slice) and hydrates it with ONE bulk light-card call
// (max 10 ids, extras ignored server-side) instead of N detail fetches.
// Shows a compact rail of name + rating + distance/city mini cards. Hidden
// when fewer than 2 ids resolve. Geolocation is requested once and is purely
// optional — denial/error falls back to the listing's city.
export function RecentlyViewed() {
  const { locale, dict } = useTranslation();
  const [listings, setListings] = useState<ListingLightCard[] | null>(null);
  // null = not yet resolved (asked & pending, denied, or unavailable).
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch the recently-viewed listings.
  useEffect(() => {
    // Already capped at 10 (MAX_RECENT) on read; the bulk endpoint accepts 10.
    const ids = getRecentViews();
    // Fewer than 2 ids → leave `listings` null so the section stays hidden.
    if (ids.length < 2) return;

    let cancelled = false;
    getListingsBulk(ids)
      .then((cards) => {
        // Self-heal the trail: ids the backend didn't return are delisted /
        // hidden / deleted — drop them so future visits stop requesting them
        // (an all-stale trail then skips the API call entirely). Runs even if
        // unmounted; only the setState below is unmount-guarded.
        const returned = new Set(cards.map((c) => c.id));
        removeRecentViews(ids.filter((id) => !returned.has(id)));
        if (!cancelled) setListings(cards);
      })
      .catch(() => {
        /* network/server failure → keep the section hidden; do NOT prune —
           a transient outage must not wipe the trail */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Ask for geolocation once. Optional — never blocks render; on
  // denial/error/unavailable we keep `coords` null and fall back to city.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        /* denied / unavailable → keep city fallback */
      },
      { timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Hide until resolved, and hide if fewer than 2 listings survived fetching.
  if (!listings || listings.length < 2) return null;
  const s = dict.homeSections.recentlyViewed;

  const cards: RecentlyViewedCardData[] = listings.map((d) => {
    const distance =
      coords && d.latitude != null && d.longitude != null
        ? `${haversineKm(coords, { lat: d.latitude, lng: d.longitude }).toFixed(1)} km`
        : undefined;
    return {
      id: d.id,
      name: d.name,
      image: d.image ?? undefined,
      // Defensive Number(): numeric columns can arrive as strings at runtime.
      rating: d.averageRating != null ? Number(d.averageRating) : undefined,
      reviews: d.totalReviews,
      distance,
      city: d.city ?? undefined,
      // The business route resolves a location slug OR a numeric location id.
      href: localeHref(locale, "business", d.slug ?? String(d.id)),
    };
  });

  return (
    <section className="zw-container" style={{ paddingTop: 60 }}>
      <SectionTitle kicker={s.kicker} title={s.title} />
      <div className="zw-scroll-x" style={{ gap: 14, paddingBottom: 6 }}>
        {cards.map((b) => (
          <RecentlyViewedCard key={b.id} b={b} />
        ))}
      </div>
    </section>
  );
}
