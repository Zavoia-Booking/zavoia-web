// Shared /search data-model constants. List and pins use one listings fetch;
// an explicit area search expands its radius to cover the current viewport.

/** Single-call result cap — no pagination; one fetch fills list + map. */
export const SEARCH_LIMIT = 300;

export {
  DEFAULT_ZOOM,
  PLACE_ZOOM,
  RECENTER_ZOOM,
  SEARCH_RADIUS_KM,
  MAX_SEARCH_RADIUS_KM,
  SEARCH_MAX_RADIUS_KM,
  SEARCH_AREA_THRESHOLD_KM,
  RE_ANCHOR_VIEWPORT_FRACTION,
  RE_ANCHOR_ZOOM_DELTA,
  RE_ANCHOR_HIDE_RATIO,
} from "./map-behavior";

/** Final fallback anchor (Bucharest) when geolocation + IP both fail. */
export const DEFAULT_ANCHOR = { lat: 44.4268, lng: 26.1025 };
