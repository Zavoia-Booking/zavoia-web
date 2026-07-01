/**
 * Recent search history — small, dependency-free localStorage helpers for the
 * web search overlay. Mirrors the RN marketplace-app's recents:
 *   - recent SEARCHES ("What"): cap 6, dedupe by `id`, newest first
 *   - recent LOCATIONS ("Where"): cap 5, dedupe by `id`, newest first
 *
 * SSR-safe: every access is guarded by `typeof window` and wrapped in try/catch
 * so a disabled / full / quota'd localStorage never throws into a render. Plain
 * functions, no React.
 */

import type { CityResult } from "@/lib/geocoding";

// ── Recent searches ("What") ────────────────────────────────────────────────

/** localStorage key for the recent-searches list. */
export const RECENT_SEARCHES_KEY = "zw-recent-searches";

/** Maximum number of recent searches kept. */
export const MAX_RECENT_SEARCHES = 6;

/**
 * A recorded "What" query. `id` is a canonical key (see `recentSearchId`) so the
 * same query dedupes regardless of insertion order. `label` is a human-readable
 * caption for the chip/row.
 */
export interface RecentSearch {
  id: string;
  label: string;
  search?: string;
  industry?: string;
  tagIds?: number[];
  /** Optional "Where" caption for the subtitle line. */
  whereLabel?: string;
  /** Optional "When" caption for the subtitle line. */
  whenLabel?: string;
}

/**
 * Build the canonical dedupe id for a search from its parts. The same query
 * (same text, industry and tag set) always yields the same id.
 */
export function recentSearchId(parts: {
  search?: string;
  industry?: string;
  tagIds?: number[];
}): string {
  const search = parts.search?.trim().toLowerCase() ?? "";
  const industry = parts.industry ?? "";
  const tagIds = (parts.tagIds ?? []).slice().sort((a, b) => a - b).join(",");
  return `${search}|${industry}|${tagIds}`;
}

/** Read the recent-searches list (most-recent first). */
export function getRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is RecentSearch =>
        !!v &&
        typeof v === "object" &&
        typeof (v as RecentSearch).id === "string" &&
        typeof (v as RecentSearch).label === "string",
    );
  } catch {
    return [];
  }
}

/**
 * Record a search at the front of the list, de-duplicating by `id` and capping
 * to `MAX_RECENT_SEARCHES`. No-op on the server or when storage is unavailable.
 */
export function pushRecentSearch(entry: RecentSearch): void {
  if (typeof window === "undefined") return;
  if (!entry || typeof entry.id !== "string") return;
  try {
    const next = [
      entry,
      ...getRecentSearches().filter((e) => e.id !== entry.id),
    ].slice(0, MAX_RECENT_SEARCHES);
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // Storage disabled / quota exceeded — silently skip recording.
  }
}

/**
 * Empty the recent-searches list. No-op on the server or when storage is
 * unavailable.
 */
export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Storage disabled — silently skip clearing.
  }
}

// ── Recent locations ("Where") ──────────────────────────────────────────────

/** localStorage key for the recent-locations list. */
export const RECENT_LOCATIONS_KEY = "zw-recent-locations";

/** Maximum number of recent locations kept. */
export const MAX_RECENT_LOCATIONS = 5;

/** Read the recent-locations list (most-recent first). */
export function getRecentLocations(): CityResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_LOCATIONS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is CityResult =>
        !!v &&
        typeof v === "object" &&
        typeof (v as CityResult).id === "string" &&
        typeof (v as CityResult).label === "string" &&
        Number.isFinite((v as CityResult).lat) &&
        Number.isFinite((v as CityResult).lng),
    );
  } catch {
    return [];
  }
}

/**
 * Record a location at the front of the list, de-duplicating by `id` and capping
 * to `MAX_RECENT_LOCATIONS`. No-op on the server or when storage is unavailable.
 */
export function pushRecentLocation(city: CityResult): void {
  if (typeof window === "undefined") return;
  if (!city || typeof city.id !== "string") return;
  try {
    const next = [
      city,
      ...getRecentLocations().filter((c) => c.id !== city.id),
    ].slice(0, MAX_RECENT_LOCATIONS);
    window.localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(next));
  } catch {
    // Storage disabled / quota exceeded — silently skip recording.
  }
}
