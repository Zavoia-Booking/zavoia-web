/**
 * Map filters — the refinement layer that runs on the loaded result set.
 *
 * Ported from the mobile marketplace-app (`features/search/filters.ts`) so both
 * clients narrow an identical result set in an identical way. Deliberately
 * separate from the API query (text, industry, tag, date, geo), which is
 * resolved server-side: nothing here ever becomes a request param, it only
 * narrows and orders what the search already returned.
 *
 * The one web-specific difference is persistence. Mobile holds these in a
 * store; the web serialises them into the URL (see `parseFilters` /
 * `filtersToParams` below) so a filtered search stays shareable and survives a
 * reload — the same reason the query itself lives in the URL there.
 */

import type { LocationCard } from "@/lib/api/marketplace/types";
import { openStatus } from "@/lib/marketplace/working-hours";

export type SortKey = "closest" | "rating" | "newest";

/** The 3 venue-tag groups. Keys match the card fields, so matching stays generic. */
export const TAG_GROUPS = [
  { key: "amenityTagIds", dict: "amenities" },
  { key: "paymentMethodTagIds", dict: "paymentMethods" },
  { key: "languageTagIds", dict: "languages" },
] as const;

export type TagGroupKey = (typeof TAG_GROUPS)[number]["key"];
export type TagDictKey = (typeof TAG_GROUPS)[number]["dict"];

export interface MapFilters {
  sort: SortKey;
  /** Minimum average rating, e.g. 4.5. Null = any. */
  minRating: number | null;
  /** Distance cap in km. Null = any. */
  maxDistanceKm: number | null;
  openNow: boolean;
  open247: boolean;
  /** Selected venue tags per group — a place must carry ALL of them. */
  amenityTagIds: number[];
  paymentMethodTagIds: number[];
  languageTagIds: number[];
}

export const EMPTY_FILTERS: MapFilters = {
  sort: "closest",
  minRating: null,
  maxDistanceKm: null,
  openNow: false,
  open247: false,
  amenityTagIds: [],
  paymentMethodTagIds: [],
  languageTagIds: [],
};

export const RATING_STEPS = [4.0, 4.5, 4.8] as const;
export const DISTANCE_STEPS = [1, 2, 5] as const;

export const SORT_KEYS: readonly SortKey[] = ["closest", "rating", "newest"];

function isSortKey(value: string): value is SortKey {
  return (SORT_KEYS as readonly string[]).includes(value);
}

/** Add or remove one tag id from a group, returning the filters left behind. */
export function toggleTag(
  f: MapFilters,
  group: TagGroupKey,
  id: number,
): MapFilters {
  const current = f[group];
  return {
    ...f,
    [group]: current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id],
  };
}

export function countActiveFilters(f: MapFilters): number {
  return (
    (f.sort !== EMPTY_FILTERS.sort ? 1 : 0) +
    (f.minRating != null ? 1 : 0) +
    (f.maxDistanceKm != null ? 1 : 0) +
    (f.openNow ? 1 : 0) +
    (f.open247 ? 1 : 0) +
    TAG_GROUPS.reduce((n, g) => n + f[g.key].length, 0)
  );
}

/**
 * Time-aware open check. Delegates to `openStatus`, which compares the actual
 * clock and handles days that run past midnight, so a 09:00–18:00 salon is not
 * reported open at 3am.
 */
export function isOpenNow(
  listing: Pick<LocationCard, "open247" | "workingHours">,
  now: Date = new Date(),
): boolean {
  const s = openStatus(listing, now).status;
  return s === "open" || s === "24-7";
}

type DistanceFn = (listing: LocationCard) => number | undefined;

function addedAt(listing: LocationCard): number {
  const t = listing.createdAt ? Date.parse(listing.createdAt) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Filter and order in one pass. This is the single stage between the search
 * response and BOTH consumers (result list + map pins) — filtering only one of
 * them leaves the map showing pins for places the list excluded.
 */
export function applyMapFilters(
  listings: LocationCard[],
  f: MapFilters,
  distanceFor: DistanceFn,
  now: Date = new Date(),
): LocationCard[] {
  const kept = listings.filter((l) => {
    if (f.minRating != null && (l.averageRating ?? 0) < f.minRating) return false;
    if (f.maxDistanceKm != null) {
      const d = distanceFor(l);
      if (d == null || d > f.maxDistanceKm) return false;
    }
    if (f.open247 && !l.open247) return false;
    if (f.openNow && !isOpenNow(l, now)) return false;
    // Within a group every picked tag must be present: "wifi + parking", not either.
    for (const g of TAG_GROUPS) {
      const wanted = f[g.key];
      if (wanted.length === 0) continue;
      const has = l[g.key] ?? [];
      if (!wanted.every((id) => has.includes(id))) return false;
    }
    return true;
  });

  return kept.slice().sort((a, b) => {
    if (f.sort === "rating") {
      const diff = (b.averageRating ?? -1) - (a.averageRating ?? -1);
      if (diff !== 0) return diff;
    }
    if (f.sort === "newest") {
      const diff = addedAt(b) - addedAt(a);
      if (diff !== 0) return diff;
    }
    return (
      (distanceFor(a) ?? Number.POSITIVE_INFINITY) -
      (distanceFor(b) ?? Number.POSITIVE_INFINITY)
    );
  });
}

// ── URL serialisation (web only) ────────────────────────────────────────────

/**
 * Filters ⇄ URL. Only non-default values are written, so a default search stays
 * on a clean `/search?...` and an old link missing these params still parses.
 */
export const FILTER_PARAM_KEYS = [
  "sort",
  "minRating",
  "maxKm",
  "openNow",
  "open247",
  "amenities",
  "payments",
  "languages",
] as const;

const GROUP_PARAM: Record<TagGroupKey, string> = {
  amenityTagIds: "amenities",
  paymentMethodTagIds: "payments",
  languageTagIds: "languages",
};

function csvNums(raw: string | null): number[] {
  if (!raw) return [];
  const out = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  return [...new Set(out)];
}

export function parseFilters(sp: URLSearchParams): MapFilters {
  const sortRaw = sp.get("sort") ?? "";
  const minRating = Number(sp.get("minRating"));
  const maxKm = Number(sp.get("maxKm"));
  return {
    sort: isSortKey(sortRaw) ? sortRaw : EMPTY_FILTERS.sort,
    minRating: Number.isFinite(minRating) && minRating > 0 ? minRating : null,
    maxDistanceKm: Number.isFinite(maxKm) && maxKm > 0 ? maxKm : null,
    openNow: sp.get("openNow") === "1",
    open247: sp.get("open247") === "1",
    amenityTagIds: csvNums(sp.get("amenities")),
    paymentMethodTagIds: csvNums(sp.get("payments")),
    languageTagIds: csvNums(sp.get("languages")),
  };
}

/**
 * The patch that writes `f` into the URL. Every key the filters own is present,
 * with `null` for defaults, so applying it also CLEARS params the new set
 * doesn't use (a reset must not leave stale params behind).
 */
export function filtersToParams(f: MapFilters): Record<string, string | null> {
  const patch: Record<string, string | null> = {
    sort: f.sort === EMPTY_FILTERS.sort ? null : f.sort,
    minRating: f.minRating != null ? String(f.minRating) : null,
    maxKm: f.maxDistanceKm != null ? String(f.maxDistanceKm) : null,
    openNow: f.openNow ? "1" : null,
    open247: f.open247 ? "1" : null,
  };
  for (const g of TAG_GROUPS) {
    const ids = f[g.key];
    patch[GROUP_PARAM[g.key]] = ids.length ? ids.join(",") : null;
  }
  return patch;
}
