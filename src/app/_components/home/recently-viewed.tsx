"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import { SectionTitle } from "@/components/ui/section-title";
import { getListing } from "@/lib/api/marketplace/public";
import type { ListingDetail } from "@/lib/api/marketplace/types";
import { getRecentViews } from "@/lib/recent-views";
import {
  RecentlyViewedCard,
  type RecentlyViewedCardData,
} from "./recently-viewed-card";

const MAX = 6;

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
// the business-detail slice). Fetches each listing in parallel (try/catch per
// id) and shows a compact rail of name + rating + distance/city mini cards.
// Hidden when fewer than 2 ids resolve. Geolocation is requested once and is
// purely optional — denial/error falls back to the listing's city.
export function RecentlyViewed() {
  const { locale, dict } = useTranslation();
  const [listings, setListings] = useState<ListingDetail[] | null>(null);
  // null = not yet resolved (asked & pending, denied, or unavailable).
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch the recently-viewed listings.
  useEffect(() => {
    const ids = getRecentViews().slice(0, MAX);
    // Fewer than 2 ids → leave `listings` null so the section stays hidden.
    if (ids.length < 2) return;

    let cancelled = false;
    // The trail stores LOCATION ids; the backend resolves id-or-slug, so the
    // numeric id is stringified for the slug-typed fetch.
    Promise.all(ids.map((id) => getListing(String(id)).catch(() => null))).then(
      (results) => {
        if (cancelled) return;
        setListings(results.filter((d): d is ListingDetail => d !== null));
      },
    );
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
    const { latitude, longitude } = d.location;
    const distance =
      coords && latitude != null && longitude != null
        ? `${haversineKm(coords, { lat: latitude, lng: longitude }).toFixed(1)} km`
        : undefined;
    return {
      id: d.locationId,
      name: d.name,
      image: d.featuredImage ?? d.logo ?? undefined,
      rating: d.averageRating ?? undefined,
      reviews: d.totalReviews,
      distance,
      city: d.location.city ?? undefined,
      href: localeHref(locale, "business", d.slug),
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
