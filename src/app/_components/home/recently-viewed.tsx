"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import { SectionTitle } from "@/components/ui/section-title";
import { getListingsBulk } from "@/lib/api/marketplace/public";
import { ApiError } from "@/lib/api/http";
import type { ListingLightCard } from "@/lib/api/marketplace/types";
import { getRecentViews, removeRecentViews } from "@/lib/recent-views";
import { getBrowserLocationIfAllowed } from "@/lib/geocoding";
import { RecentlyViewedSkeleton } from "./section-skeletons";
import { useDiscoveryFeed } from "./discovery-feedback";
import { HomeRequestTimeoutError, withHomeDeadline } from "./request-deadline";
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
  failureId: number;
  failureKind?: "initial" | "refresh" | "retry";
  retryAt: number;
}
interface RecentEntry {
  key: string;
  state: RecentState;
  updatedAt: number;
  attemptedAt: number;
  lastUsedAt: number;
  request: Promise<void> | null;
  controller: AbortController | null;
  explicitFailures: number;
  retryTimer: ReturnType<typeof setTimeout> | null;
}
const INITIAL: RecentState = { ids: [], items: null, loading: false, failed: false, failureId: 0, retryAt: 0 };
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

function loadRecent(
  target: RecentEntry,
  kind: "initial" | "refresh" | "retry" = target.state.items === null ? "initial" : "refresh",
): Promise<void> {
  if (target.request) return target.request;
  if (kind === "retry" && Date.now() < target.state.retryAt) return Promise.resolve();
  const controller = new AbortController();
  target.controller = controller;
  target.attemptedAt = Date.now();
  target.state = { ...target.state, loading: true };
  notify();
  target.request = withHomeDeadline((signal) => getListingsBulk(target.state.ids, { signal }), { controller })
    .then((cards) => {
      if (entry !== target || target.controller !== controller || controller.signal.aborted) return;
      // Only a successful response can establish that a listing was removed.
      const returned = new Set(cards.map((card) => card.id));
      removeRecentViews(target.state.ids.filter((id) => !returned.has(id)));
      const ids = target.state.ids.filter((id) => returned.has(id));
      target.key = ids.join(",");
      target.updatedAt = Date.now();
      target.explicitFailures = 0;
      if (target.retryTimer) clearTimeout(target.retryTimer);
      target.retryTimer = null;
      target.state = { ...target.state, ids, items: cards, loading: false, failed: false, retryAt: 0 };
    })
    .catch((error: unknown) => {
      if (entry !== target || target.controller !== controller
        || (controller.signal.aborted && !(error instanceof HomeRequestTimeoutError))) return;
      let retryAt = target.state.retryAt;
      if (kind === "retry") {
        target.explicitFailures++;
        retryAt = Date.now() + Math.min(60_000, 15_000 * 2 ** (target.explicitFailures - 1));
        if (target.retryTimer) clearTimeout(target.retryTimer);
        target.retryTimer = setTimeout(() => {
          target.retryTimer = null;
          if (entry === target && target.state.retryAt === retryAt) {
            target.state = { ...target.state, retryAt: 0 };
            notify();
          }
        }, retryAt - Date.now());
      }
      console.error("Home discovery request failed", {
        feed: "recent",
        endpoint: "/marketplace/public/listings/bulk",
        status: error instanceof ApiError ? error.status : error instanceof HomeRequestTimeoutError ? 0 : null,
        reason: error instanceof HomeRequestTimeoutError ? "timeout" : "request_failed",
        attempt: kind,
      });
      target.state = {
        ...target.state, loading: false, failed: true,
        failureId: target.state.failureId + 1, failureKind: kind, retryAt,
      };
    })
    .finally(() => {
      if (target.controller === controller) {
        target.request = null;
        target.controller = null;
      }
      if (entry === target) notify();
    });
  return target.request;
}

function releaseRecent(target: RecentEntry | null): void {
  target?.controller?.abort();
  if (target?.retryTimer) clearTimeout(target.retryTimer);
}

function syncTrail(): void {
  const ids = getRecentViews();
  if (ids.length < 2) {
    releaseRecent(entry);
    entry = null;
    notify();
    return;
  }
  const key = ids.join(",");
  if (entry?.key !== key) {
    const retained = new Map(entry?.state.items?.map((item) => [item.id, item]));
    const items = ids.flatMap((id) => retained.has(id) ? [retained.get(id)!] : []);
    releaseRecent(entry);
    entry = {
      key, state: { ...INITIAL, ids, items: items.length >= 2 ? items : null }, updatedAt: 0, attemptedAt: 0,
      lastUsedAt: Date.now(), request: null, controller: null, explicitFailures: 0, retryTimer: null,
    };
    notify();
  }
  if (Date.now() < entry.state.retryAt || (entry.state.failed && Date.now() - entry.attemptedAt < FRESH_MS)) return;
  if (entry.state.items === null || Date.now() - entry.updatedAt >= FRESH_MS) void loadRecent(entry);
}

function subscribe(listener: () => void): () => void {
  if (entry && listeners.size === 0 && Date.now() - entry.lastUsedAt >= RETAIN_MS) {
    releaseRecent(entry);
    entry = null;
  }
  listeners.add(listener);
  syncTrail();
  return () => {
    listeners.delete(listener);
    if (entry) entry.lastUsedAt = Date.now();
    // Keep an in-flight request alive during locale/navigation remounts.
  };
}

function retryRecent(): Promise<void> {
  return entry ? loadRecent(entry, "retry") : Promise.resolve();
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
// Shows the latest six resolved locations in a compact grid, with native
// horizontal scrolling on mobile. Hidden
// when fewer than 2 ids resolve. Geolocation is requested once and is purely
// optional — denial/error falls back to the listing's city.
export function RecentlyViewed() {
  const { locale, dict } = useTranslation();
  const { ids, items: listings, loading, failed, failureId, failureKind, retryAt } = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const eligible = ids.length >= 2 && (listings === null || listings.length >= 2);
  useDiscoveryFeed("recent", {
    pending: eligible && loading,
    failed: eligible && failed,
    count: eligible ? listings?.length ?? 0 : 0,
    retry: retryRecent,
    failureId,
    failureKind,
    retryAt,
  });
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

  // Distances only when location is already allowed: home never shows the
  // browser's location dialog (the map asks). Optional — never blocks render;
  // otherwise `coords` stays null and the cards fall back to the city.
  useEffect(() => {
    let cancelled = false;
    void getBrowserLocationIfAllowed().then((position) => {
      if (!cancelled && position) setCoords(position);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Local history establishes eligibility after hydration. A successful empty
  // result hides the grid; the discovery notice owns initial-failure recovery.
  if (!eligible || (!listings && failed)) return null;
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

  return (
    <section className={`zw-container ${styles.section}`} aria-busy={loading}>
      <SectionTitle title={s.title} />
      <span className="sr-only" role="status">{loading ? s.loading : ""}</span>
      {!listings ? <RecentlyViewedSkeleton count={Math.min(ids.length, MAX_VISIBLE_RECENT)} /> : <div className={styles.grid} data-locale-scroll="home-recent">
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
  );
}
