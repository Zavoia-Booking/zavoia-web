/** Shared camera/search policy, kept independent of Mapbox and the browser. */
export const DEFAULT_ZOOM = 11;
export const PLACE_ZOOM = 12;
export const RECENTER_ZOOM = 13;
export const SEARCH_RADIUS_KM = 20;
export const MAX_SEARCH_RADIUS_KM = 50;
export const SEARCH_MAX_RADIUS_KM = MAX_SEARCH_RADIUS_KM;
export const SEARCH_AREA_THRESHOLD_KM = 0.1;
export const RE_ANCHOR_VIEWPORT_FRACTION = 0.35;
export const RE_ANCHOR_ZOOM_DELTA = 1;
export const RE_ANCHOR_HIDE_RATIO = 0.6;
/** A 42px badge plus breathing room, shared with map decluttering. */
export const MIN_BADGE_GAP = 48;
/** A fit needs room for at least two badge pitches on each axis. */
export const MIN_FIT_SPAN_PX = 2 * MIN_BADGE_GAP;

export function usableFitArea(
  width: number,
  height: number,
  padding: { left: number; right: number; top: number; bottom: number },
): { left: number; right: number; top: number; bottom: number } | null {
  if (![width, height, ...Object.values(padding)].every(value => Number.isFinite(value) && value >= 0)) return null;
  const area = { left: padding.left, right: width - padding.right, top: padding.top, bottom: height - padding.bottom };
  // A subpixel strip is technically positive, but fitting a city's results
  // into it would force Mapbox out to globe scale on short phone screens.
  if (area.right - area.left < MIN_FIT_SPAN_PX || area.bottom - area.top < MIN_FIT_SPAN_PX) return null;
  return area;
}

export function viewportRadiusKm(visibleWidthKm?: number): number {
  if (visibleWidthKm == null || !Number.isFinite(visibleWidthKm)) return SEARCH_RADIUS_KM;
  return Math.min(MAX_SEARCH_RADIUS_KM, Math.max(SEARCH_RADIUS_KM, Math.round(visibleWidthKm / 2)));
}

export function searchAreaOffered({
  distanceKm, visibleWidthKm, zoom, anchorZoom, radiusKm = SEARCH_RADIUS_KM,
  offered, gestureActive,
}: {
  distanceKm: number;
  visibleWidthKm?: number;
  zoom: number;
  anchorZoom: number;
  radiusKm?: number;
  offered: boolean;
  gestureActive: boolean;
}): boolean {
  const threshold = Math.min(radiusKm, Math.max(
    SEARCH_AREA_THRESHOLD_KM,
    (visibleWidthKm ?? Infinity) * RE_ANCHOR_VIEWPORT_FRACTION,
  ));
  const ratio = offered ? RE_ANCHOR_HIDE_RATIO : 1;
  const beyond = distanceKm >= threshold * ratio
    || Math.abs(zoom - anchorZoom) >= RE_ANCHOR_ZOOM_DELTA * ratio;
  // Returning to the searched viewport hides immediately, including mid-drag.
  // A new offer waits until the visitor has released the map.
  return beyond && (offered || !gestureActive);
}

export interface PinHit {
  properties?: { id?: unknown; t?: unknown } | null;
}

/** Both hover and activation resolve overlapping pointer targets identically. */
export function choosePinHit(
  features: readonly PinHit[],
  point: { lat: number; lng: number },
  pins: ReadonlyMap<number, { lat: number; lng: number }>,
): number | null {
  const candidates = features.flatMap((feature) => {
    const id = Number(feature.properties?.id);
    const pin = pins.get(id);
    return pin ? [{ id, pin, badge: Number(feature.properties?.t) >= 0.5 }] : [];
  });
  const hasBadge = candidates.some((candidate) => candidate.badge);
  const longitudeScale = Math.cos(point.lat * Math.PI / 180);
  let bestId: number | null = null;
  let bestDistance = Infinity;
  for (const candidate of candidates) {
    if (hasBadge && !candidate.badge) continue;
    const distance = (candidate.pin.lat - point.lat) ** 2
      + ((candidate.pin.lng - point.lng) * longitudeScale) ** 2;
    if (distance < bestDistance || (distance === bestDistance && (bestId == null || candidate.id < bestId))) {
      bestDistance = distance;
      bestId = candidate.id;
    }
  }
  return bestId;
}
