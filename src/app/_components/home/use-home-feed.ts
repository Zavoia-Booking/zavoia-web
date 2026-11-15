"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { getNearbyLocations, searchListings } from "@/lib/api/marketplace/public";
import { ApiError } from "@/lib/api/http";
import type { LocationCard } from "@/lib/api/marketplace/types";
import type { BrowserCoords } from "@/lib/geocoding";
import { HomeRequestTimeoutError, withHomeDeadline } from "./request-deadline";

// Discovery cards include availability hints. Revalidate after a minute on
// entry/focus or pagination; this is a tab-local UX cache, not booking authority.
const FRESH_MS = 60_000;
const RETAIN_MS = 5 * 60_000;
const MAX_IDLE_FEEDS = 4;
const CONFIG = {
  city: { pageSize: 10, radius: 50 },
  nearby: { pageSize: 6, radius: 20 },
} as const;
type FeedKind = keyof typeof CONFIG;
type FailureKind = "initial" | "refresh" | "more" | "retry";

interface FeedState {
  items: LocationCard[];
  loading: boolean;
  failed: boolean;
  loaded: boolean;
  hasMore: boolean;
  failureId: number;
  failureKind?: FailureKind;
  availabilityStale: boolean;
  retryAt: number;
}
const INITIAL: FeedState = {
  items: [], loading: false, failed: false, loaded: false, hasMore: false,
  failureId: 0, availabilityStale: false, retryAt: 0,
};
interface FeedEntry {
  kind: FeedKind;
  coords: BrowserCoords;
  seed: string | undefined;
  state: FeedState;
  // Count fetched rows, not de-duplicated UI cards, when advancing the offset.
  offset: number;
  updatedAt: number;
  attemptedAt: number;
  lastUsedAt: number;
  retryTarget: number;
  request: AbortController | null;
  requestPromise: Promise<void> | null;
  explicitFailures: number;
  retryTimer: ReturnType<typeof setTimeout> | null;
  listeners: Set<() => void>;
}

// Never populated on the server: creation and requests happen only in browser
// subscriptions/events. These endpoints return public bilingual rows, not a
// customer's favorites; those remain in the existing authenticated flow.
const feeds = new Map<string, FeedEntry>();
const serverSnapshot = () => INITIAL;

function publish(entry: FeedEntry, state: FeedState): void {
  entry.state = state;
  entry.listeners.forEach((listener) => listener());
}

function prune(): void {
  const idle = [...feeds.entries()]
    .filter(([, entry]) => entry.listeners.size === 0)
    .sort((a, b) => b[1].lastUsedAt - a[1].lastUsedAt);
  idle.forEach(([key, entry], index) => {
    if (index < MAX_IDLE_FEEDS && Date.now() - entry.lastUsedAt < RETAIN_MS) return;
    entry.request?.abort();
    if (entry.retryTimer) clearTimeout(entry.retryTimer);
    feeds.delete(key);
  });
}

function getOrCreate(key: string, kind: FeedKind, coords: BrowserCoords): FeedEntry {
  let entry = feeds.get(key);
  if (!entry) {
    entry = {
      kind, coords: { ...coords },
      seed: kind === "city" ? Math.random().toString(36).slice(2, 12) || "zv" : undefined,
      state: INITIAL, offset: 0, updatedAt: 0, attemptedAt: 0,
      lastUsedAt: Date.now(), retryTarget: CONFIG[kind].pageSize,
      request: null, requestPromise: null, explicitFailures: 0, retryTimer: null, listeners: new Set(),
    };
    feeds.set(key, entry);
  }
  entry.lastUsedAt = Date.now();
  return entry;
}

function load(key: string, entry: FeedEntry, target: number, refresh: boolean, kind: FailureKind): Promise<void> {
  if (entry.requestPromise) return entry.requestPromise;
  if ((kind === "more" || kind === "retry") && Date.now() < entry.state.retryAt) return Promise.resolve();
  const request = new AbortController();
  entry.request = request;
  entry.attemptedAt = Date.now();
  entry.retryTarget = target;
  publish(entry, {
    ...entry.state,
    loading: true,
    availabilityStale: entry.state.availabilityStale || (refresh && entry.state.loaded),
  });
  const task = withHomeDeadline(async (signal) => {
    // A refresh replaces the whole previously loaded range atomically. Never mix
    // freshly reordered first-page rows with old offset pages or discard cards on failure.
    let offset = refresh ? 0 : entry.offset;
    const items = refresh ? [] : [...entry.state.items];
    const seen = new Set(items.map((item) => item.id));
    let total = offset;
    let exhausted = false;
    while (offset < target) {
      const params = {
        ...entry.coords, radius: CONFIG[entry.kind].radius, strict: true,
        limit: Math.min(100, target - offset), offset,
      };
      const page = entry.kind === "city"
        ? await searchListings({ ...params, seed: entry.seed }, { signal })
          .then((result) => ({ items: result.locations, total: result.total }))
        : await getNearbyLocations(params, { signal })
          .then((result) => ({ items: result.data, total: result.total }));
      // Eviction can race a fulfilled fetch or an abort-ignoring transport.
      if (signal.aborted || feeds.get(key) !== entry) throw new DOMException("Aborted", "AbortError");
      total = page.total;
      for (const item of page.items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          items.push(item);
        }
      }
      offset += page.items.length;
      exhausted = page.items.length === 0 || offset >= total;
      if (exhausted) break;
    }
    return { items, offset, exhausted };
  }, { controller: request }).then(({ items, offset, exhausted }) => {
    if (request.signal.aborted || feeds.get(key) !== entry || entry.request !== request) return;
    entry.offset = offset;
    entry.explicitFailures = 0;
    if (entry.retryTimer) clearTimeout(entry.retryTimer);
    entry.retryTimer = null;
    // Appending one page must not extend freshness of older cached pages.
    if (refresh) entry.updatedAt = Date.now();
    publish(entry, {
      ...entry.state, items, loaded: true, loading: false, failed: false,
      hasMore: !exhausted, availabilityStale: refresh ? false : entry.state.availabilityStale, retryAt: 0,
    });
  }).catch((error: unknown) => {
    if (feeds.get(key) !== entry || entry.request !== request
      || (request.signal.aborted && !(error instanceof HomeRequestTimeoutError))) return;
    let retryAt = entry.state.retryAt;
    if (kind === "more" || kind === "retry") {
      entry.explicitFailures++;
      retryAt = Date.now() + Math.min(60_000, 15_000 * 2 ** (entry.explicitFailures - 1));
      if (entry.retryTimer) clearTimeout(entry.retryTimer);
      entry.retryTimer = setTimeout(() => {
        entry.retryTimer = null;
        if (feeds.get(key) === entry && entry.state.retryAt === retryAt) {
          publish(entry, { ...entry.state, retryAt: 0 });
        }
      }, retryAt - Date.now());
    }
    console.error("Home discovery request failed", {
      feed: entry.kind,
      endpoint: entry.kind === "city" ? "/marketplace/public/listings" : "/marketplace/public/nearby-locations",
      status: error instanceof ApiError ? error.status : error instanceof HomeRequestTimeoutError ? 0 : null,
      reason: error instanceof HomeRequestTimeoutError ? "timeout" : "request_failed",
      attempt: kind,
    });
    publish(entry, {
      ...entry.state, loading: false, failed: true,
      failureId: entry.state.failureId + 1, failureKind: kind, retryAt,
    });
  }).finally(() => {
    if (entry.request === request) {
      entry.request = null;
      entry.requestPromise = null;
    }
  });
  entry.requestPromise = task;
  return task;
}

function ensure(key: string, entry: FeedEntry): void {
  const now = Date.now();
  if (entry.request || now < entry.state.retryAt || (entry.state.loaded && now - entry.updatedAt < FRESH_MS)) return;
  // A failed request has an explicit retry. Repeated locale changes must not
  // hammer a failing backend; focus/entry may retry after the same short interval.
  if (entry.state.failed && now - entry.attemptedAt < FRESH_MS) return;
  void load(key, entry, Math.max(CONFIG[entry.kind].pageSize, entry.offset), true, entry.state.loaded ? "refresh" : "initial");
}

/** Locale-independent results and pagination, shared across locale remounts. */
export function useHomeFeed(kind: FeedKind, coords: BrowserCoords | null) {
  const lat = coords?.lat;
  const lng = coords?.lng;
  const key = lat == null || lng == null ? null : `${kind}:${lat}:${lng}`;
  const subscribe = useCallback((listener: () => void) => {
    if (!key || lat == null || lng == null) return () => {};
    prune();
    const entry = getOrCreate(key, kind, { lat, lng });
    entry.listeners.add(listener);
    return () => {
      entry.listeners.delete(listener);
      entry.lastUsedAt = Date.now();
      // Keep an in-flight request during a locale remount; abort only eviction.
      prune();
    };
  }, [key, kind, lat, lng]);
  const snapshot = useCallback(() => key ? feeds.get(key)?.state ?? INITIAL : INITIAL, [key]);
  const state = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  useEffect(() => {
    if (!key) return;
    const refresh = () => {
      const entry = feeds.get(key);
      if (entry && document.visibilityState === "visible") ensure(key, entry);
    };
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [key]);

  const showMore = useCallback(() => {
    const entry = key ? feeds.get(key) : undefined;
    if (!key || !entry || !entry.state.hasMore) return;
    const stale = Date.now() - entry.updatedAt >= FRESH_MS;
    void load(key, entry, entry.offset + CONFIG[kind].pageSize, stale, "more");
  }, [key, kind]);
  const retry = useCallback((): Promise<void> => {
    const entry = key ? feeds.get(key) : undefined;
    if (!key || !entry) return Promise.resolve();
    return load(key, entry, entry.retryTarget, !entry.state.loaded || Date.now() - entry.updatedAt >= FRESH_MS, "retry");
  }, [key]);

  // Stale discovery cards remain useful after a failed refresh. Their cached
  // booking hints are not current availability and must not survive that refresh.
  const items = state.availabilityStale
    ? state.items.map((item) => ({ ...item, nextAvailableDate: undefined, nextAvailableAt: undefined }))
    : state.items;
  return { ...state, items, showMore, retry };
}
