"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { getNearbyLocations, searchListings } from "@/lib/api/marketplace/public";
import type { LocationCard } from "@/lib/api/marketplace/types";
import type { BrowserCoords } from "@/lib/geocoding";

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

interface FeedState {
  items: LocationCard[];
  loading: boolean;
  failed: boolean;
  loaded: boolean;
  hasMore: boolean;
}
const INITIAL: FeedState = {
  items: [], loading: false, failed: false, loaded: false, hasMore: false,
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
      request: null, listeners: new Set(),
    };
    feeds.set(key, entry);
  }
  entry.lastUsedAt = Date.now();
  return entry;
}

async function load(key: string, entry: FeedEntry, target: number, refresh: boolean): Promise<void> {
  if (entry.request) return;
  const request = new AbortController();
  entry.request = request;
  entry.attemptedAt = Date.now();
  entry.retryTarget = target;
  publish(entry, { ...entry.state, loading: true });
  // A refresh replaces the whole previously loaded range atomically. Never mix
  // freshly reordered first-page rows with old offset pages or discard cards on failure.
  let offset = refresh ? 0 : entry.offset;
  const items = refresh ? [] : [...entry.state.items];
  const seen = new Set(items.map((item) => item.id));
  let total = offset;
  let exhausted = false;
  try {
    while (offset < target) {
      const params = {
        ...entry.coords, radius: CONFIG[entry.kind].radius, strict: true,
        limit: Math.min(100, target - offset), offset,
      };
      const page = entry.kind === "city"
        ? await searchListings({ ...params, seed: entry.seed }, { signal: request.signal })
          .then((result) => ({ items: result.locations, total: result.total }))
        : await getNearbyLocations(params, { signal: request.signal })
          .then((result) => ({ items: result.data, total: result.total }));
      // Eviction can race a fulfilled fetch or an abort-ignoring transport.
      if (request.signal.aborted || feeds.get(key) !== entry) return;
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
    entry.offset = offset;
    // Appending one page must not extend freshness of older cached pages.
    if (refresh) entry.updatedAt = Date.now();
    publish(entry, { items, loaded: true, loading: false, failed: false, hasMore: !exhausted });
  } catch {
    if (request.signal.aborted || feeds.get(key) !== entry) return;
    publish(entry, { ...entry.state, loading: false, failed: true });
  } finally {
    if (entry.request === request) entry.request = null;
  }
}

function ensure(key: string, entry: FeedEntry): void {
  const now = Date.now();
  if (entry.request || (entry.state.loaded && now - entry.updatedAt < FRESH_MS)) return;
  // A failed request has an explicit retry. Repeated locale changes must not
  // hammer a failing backend; focus/entry may retry after the same short interval.
  if (entry.state.failed && now - entry.attemptedAt < FRESH_MS) return;
  void load(key, entry, Math.max(CONFIG[entry.kind].pageSize, entry.offset), true);
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
    void load(key, entry, entry.offset + CONFIG[kind].pageSize, stale);
  }, [key, kind]);
  const retry = useCallback(() => {
    const entry = key ? feeds.get(key) : undefined;
    if (!key || !entry) return;
    void load(key, entry, entry.retryTarget, !entry.state.loaded || Date.now() - entry.updatedAt >= FRESH_MS);
  }, [key]);

  return { ...state, showMore, retry };
}
