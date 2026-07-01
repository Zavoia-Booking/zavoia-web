// Shared /search data-model constants. The mobile app drives BOTH the list and
// the map pins from a single fixed-radius listings fetch (no pagination), and
// only offers a "Search this area" re-anchor once the user has panned far enough
// from the current anchor. These constants keep web in lock-step.

/** Single-call result cap — no pagination; one fetch fills list + map. */
export const SEARCH_LIMIT = 300;

/** Fixed query radius (km) whenever an anchor lat/lng is present. */
export const SEARCH_RADIUS_KM = 20;

/** Min pan distance (km) from the anchor before the "Search this area" pill shows. */
export const SEARCH_AREA_THRESHOLD_KM = 2;

/** Final fallback anchor (Bucharest) when geolocation + IP both fail. */
export const DEFAULT_ANCHOR = { lat: 44.4268, lng: 26.1025 };
