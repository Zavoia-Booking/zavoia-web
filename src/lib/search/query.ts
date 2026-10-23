import type { SearchListingsParams } from "@/lib/api/marketplace/types";
import type { MapFilters } from "./filters";
import { SEARCH_LIMIT, SEARCH_RADIUS_KM, SEARCH_MAX_RADIUS_KM } from "@/components/search/constants";

export function numberParam(value: string | null): number | undefined {
  if (value == null || value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

/** Area searches may widen coverage; arbitrary URLs cannot exceed the app's cap. */
export function searchRadius(value: string | null): number {
  return Math.min(SEARCH_MAX_RADIUS_KM, Math.max(SEARCH_RADIUS_KM, numberParam(value) ?? SEARCH_RADIUS_KM));
}

export type SearchQuery = SearchListingsParams & { mapZoom?: number };

export function deriveSearchParams(params: Pick<URLSearchParams, "get">): SearchQuery {
  const lat = numberParam(params.get("lat"));
  const lng = numberParam(params.get("lng"));
  const hasPoint = lat != null && lng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const tags = params.get("tagIds")?.split(",").map(value => Number(value.trim()))
    .filter(value => Number.isInteger(value) && value > 0);
  const zoom = numberParam(params.get("mapZoom"));
  return {
    search: params.get("search") || undefined,
    industrySlug: params.get("industry") || undefined,
    tagIds: tags?.length ? [...new Set(tags)] : undefined,
    city: params.get("city") || undefined,
    date: params.get("date") || undefined,
    lat: hasPoint ? lat : undefined,
    lng: hasPoint ? lng : undefined,
    radius: hasPoint ? searchRadius(params.get("radius")) : undefined,
    mapZoom: zoom != null && zoom >= 0 && zoom <= 22 ? zoom : undefined,
    offset: 0,
    limit: SEARCH_LIMIT,
  };
}

export function searchRequestKey(params: SearchListingsParams): string {
  return JSON.stringify([
    params.search, params.industrySlug, params.tagIds,
    params.city, params.date, params.lat, params.lng, params.radius,
  ]);
}

/** A city label describes a selected point; only a city-only query filters by it. */
export function toSearchListingsParams(query: SearchQuery): SearchListingsParams {
  return {
    search: query.search,
    industrySlug: query.industrySlug,
    tagIds: query.tagIds,
    city: query.lat != null && query.lng != null ? undefined : query.city,
    date: query.date,
    lat: query.lat,
    lng: query.lng,
    radius: query.radius,
    offset: 0,
    limit: SEARCH_LIMIT,
    strict: true,
  };
}

/** Switching industries must discard the previous industry's service selection. */
export function patchSearchParams(current: URLSearchParams, patch: Record<string, string | null>): URLSearchParams {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(patch)) {
    if (value == null || value === "") next.delete(key);
    else next.set(key, value);
  }
  if ("industry" in patch && !("tagIds" in patch)) next.delete("tagIds");
  next.delete("offset");
  return next;
}

/** Business summaries have no opening-hours, distance or venue-feature contract. */
export function hasLocationRefinements(filters: MapFilters): boolean {
  return filters.minRating != null || filters.maxDistanceKm != null || filters.openNow || filters.open247
    || filters.amenityTagIds.length > 0 || filters.paymentMethodTagIds.length > 0 || filters.languageTagIds.length > 0;
}
