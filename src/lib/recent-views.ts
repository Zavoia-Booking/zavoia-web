/**
 * Recently-viewed trail — a small, dependency-free localStorage helper shared
 * by the home "Recently viewed" rail and (in a later slice) the business-detail
 * page, which records a view on mount via `pushRecentView(locationId)`.
 *
 * The trail is an ordered array of LOCATION ids (most-recent first), capped at
 * `MAX_RECENT`. All access is wrapped in try/catch so a disabled/full/quota'd
 * localStorage never throws into a render.
 */

/** localStorage key for the recently-viewed location-id trail. */
export const RECENT_VIEWS_KEY = "zw-recent-views";

/** Maximum number of ids kept in the trail. */
export const MAX_RECENT = 12;

/** Read the recently-viewed LOCATION-id trail (most-recent first). */
export function getRecentViews(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_VIEWS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v) => (typeof v === "number" ? v : Number(v)))
      .filter((n) => Number.isFinite(n));
  } catch {
    return [];
  }
}

/**
 * Record a location view at the front of the trail, de-duplicating and capping
 * to `MAX_RECENT`. No-op on the server or when storage is unavailable.
 */
export function pushRecentView(locationId: number): void {
  if (typeof window === "undefined") return;
  if (!Number.isFinite(locationId)) return;
  try {
    const next = [locationId, ...getRecentViews().filter((id) => id !== locationId)].slice(
      0,
      MAX_RECENT,
    );
    window.localStorage.setItem(RECENT_VIEWS_KEY, JSON.stringify(next));
  } catch {
    // Storage disabled / quota exceeded — silently skip recording.
  }
}
