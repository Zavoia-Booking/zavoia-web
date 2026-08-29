// Shared /search data-model constants. The mobile app drives BOTH the list and
// the map pins from a single fixed-radius listings fetch (no pagination), and
// only offers a "Search this area" re-anchor once the user has panned far enough
// from the current anchor. These constants keep web in lock-step.

/** Single-call result cap — no pagination; one fetch fills list + map. */
export const SEARCH_LIMIT = 300;

/** Fixed query radius (km) whenever an anchor lat/lng is present. */
export const SEARCH_RADIUS_KM = 20;

/**
 * Floor for the "Search this area" pan threshold (km). A pan shorter than this
 * is never a new area, however far zoomed in the user is.
 */
export const SEARCH_AREA_THRESHOLD_KM = 2;

/**
 * The zoom-aware half of that threshold: the pan must move the viewport centre
 * by this fraction of the visible map width — "most of a screen" at any zoom —
 * clamped between SEARCH_AREA_THRESHOLD_KM and SEARCH_RADIUS_KM. Past the
 * searched radius the offer is always warranted, so the pill never demands a
 * pan beyond the coverage the list actually has.
 */
export const RE_ANCHOR_VIEWPORT_FRACTION = 0.6;

/** Final fallback anchor (Bucharest) when geolocation + IP both fail. */
export const DEFAULT_ANCHOR = { lat: 44.4268, lng: 26.1025 };
