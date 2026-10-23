"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import { SectionTitle } from "@/components/ui/section-title";
import { getListingsBulk } from "@/lib/api/marketplace/public";
import type { ListingLightCard } from "@/lib/api/marketplace/types";
import { getRecentViews, removeRecentViews } from "@/lib/recent-views";
import { RecentlyViewedSkeleton } from "./section-skeletons";
import { SectionFailed } from "./section-failed";
import { useFavoriteToggle } from "./use-favorite-toggle";
import styles from "./recently-viewed.module.css";
import {
  RecentlyViewedCard,
  type RecentlyViewedCardData,
} from "./recently-viewed-card";

interface RecentState {
  ids: number[];
  items: ListingLightCard[] | null;
  loading: boolean;
  failed: boolean;
}
interface RecentEntry {
  key: string;
  state: RecentState;
  updatedAt: number;
  attemptedAt: number;
  lastUsedAt: number;
  request: Promise<void> | null;
}
const INITIAL: RecentState = { ids: [], items: null, loading: false, failed: false };
const MAX_VISIBLE_RECENT = 6;
// Match the home feeds' browser-only freshness/retention convention. Only the
// current trail is retained, never an unbounded collection of history keys.
const FRESH_MS = 60_000;
const RETAIN_MS = 5 * 60_000;
let entry: RecentEntry | null = null;
const listeners = new Set<() => void>();
const serverSnapshot = () => INITIAL;
const snapshot = () => entry?.state ?? INITIAL;
const notify = () => listeners.forEach((listener) => listener());

function loadRecent(target: RecentEntry): void {
  if (target.request) return;
  target.attemptedAt = Date.now();
  target.state = { ...target.state, loading: true };
  notify();
  target.request = getListingsBulk(target.state.ids)
    .then((cards) => {
      // Only a successful response can establish that a listing was removed.
      const returned = new Set(cards.map((card) => card.id));
      removeRecentViews(target.state.ids.filter((id) => !returned.has(id)));
      const ids = target.state.ids.filter((id) => returned.has(id));
      target.key = ids.join(",");
      target.updatedAt = Date.now();
      target.state = { ids, items: cards, loading: false, failed: false };
    })
    .catch(() => {
      target.state = { ...target.state, loading: false, failed: true };
    })
    .finally(() => {
      target.request = null;
      if (entry === target) notify();
    });
}

function syncTrail(): void {
  const ids = getRecentViews();
  if (ids.length < 2) {
    entry = null;
    notify();
    return;
  }
  const key = ids.join(",");
  if (entry?.key !== key) {
    const retained = new Map(entry?.state.items?.map((item) => [item.id, item]));
    const items = ids.flatMap((id) => retained.has(id) ? [retained.get(id)!] : []);
    entry = {
      key, state: { ...INITIAL, ids, items: items.length >= 2 ? items : null }, updatedAt: 0, attemptedAt: 0,
      lastUsedAt: Date.now(), request: null,
    };
    notify();
  }
  if (entry.state.failed && Date.now() - entry.attemptedAt < FRESH_MS) return;
  if (entry.state.items === null || Date.now() - entry.updatedAt >= FRESH_MS) loadRecent(entry);
}

function subscribe(listener: () => void): () => void {
  if (entry && listeners.size === 0 && Date.now() - entry.lastUsedAt >= RETAIN_MS) entry = null;
  listeners.add(listener);
  syncTrail();
  return () => {
    listeners.delete(listener);
    if (entry) entry.lastUsedAt = Date.now();
    // Keep an in-flight request alive during locale/navigation remounts.
  };
}

function retryRecent(): void {
  if (entry) loadRecent(entry);
}

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
// Shows the latest six resolved locations in a compact grid. Hidden
// when fewer than 2 ids resolve. Geolocation is requested once and is purely
// optional — denial/error falls back to the listing's city.
export function RecentlyViewed() {
  const { locale, dict } = useTranslation();
  const { ids, items: listings, loading, failed } = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  // The trail holds locations only, so these hearts save locations.
  const fav = useFavoriteToggle("location");
  // null = not yet resolved (asked & pending, denied, or unavailable).
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Revalidate on return without replacing successful cards with skeletons.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") syncTrail();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
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

  // Local history establishes eligibility after hydration. A successful empty
  // result hides the grid; an initial failure remains recoverable, not "empty".
  if (ids.length < 2 || (listings && listings.length < 2)) return null;
  if (!listings && failed) return <SectionFailed paddingTop={60} onRetry={retryRecent} loading={loading} />;
  const s = dict.homeSections.recentlyViewed;

  const cards: RecentlyViewedCardData[] = (listings ?? []).slice(0, MAX_VISIBLE_RECENT).map((d) => {
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

  return <>
    <section className={`zw-container ${styles.section}`} aria-busy={loading}>
      <SectionTitle title={s.title} />
      <span className="sr-only" role="status">{loading ? s.loading : ""}</span>
      {!listings ? <RecentlyViewedSkeleton count={Math.min(ids.length, MAX_VISIBLE_RECENT)} /> : <div className={styles.grid}>
        {cards.map((b) => (
          <RecentlyViewedCard
            key={b.id}
            b={b}
            favorited={fav.isFavorited(b.id)}
            onFavorite={fav.toggle}
          />
        ))}
      </div>}
    </section>
    {failed && <SectionFailed paddingTop={24} onRetry={retryRecent} loading={loading} />}
  </>;
}
