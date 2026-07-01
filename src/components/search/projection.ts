/**
 * Pin projection — the real marketplace API has no normalised map coordinates,
 * so we project each LocationCard's latitude/longitude into [0..1] over the
 * CURRENT result set. The stylised map is decorative, not geographic; this just
 * spreads the visible pins across the canvas with a little padding.
 *
 * Locations without coordinates are skipped (no pin) but still render as list
 * rows. An all-same-point set collapses to the centre (0.5, 0.5).
 */

import type { CategoryKey } from "@/components/ui/cat-dot";
import type { LocationCard } from "@/lib/api/marketplace/types";

const PAD = 0.08;
const EPS = 1e-6;

export interface MapPoint {
  /** Normalised horizontal position ∈ [0..1] (0 = left). */
  mapX: number;
  /** Normalised vertical position ∈ [0..1] (0 = top, north). */
  mapY: number;
}

export type ProjectFn = (
  lat: number | null | undefined,
  lng: number | null | undefined,
) => MapPoint | null;

/**
 * Builds a projector closure scoped to the supplied locations' bounding box.
 * Pass the FULL accumulated result set so pins stay consistent after "load more".
 */
export function makeProjector(locations: LocationCard[]): ProjectFn {
  const pts = locations.filter(
    (l) => l.latitude != null && l.longitude != null,
  );
  const lats = pts.map((p) => p.latitude as number);
  const lngs = pts.map((p) => p.longitude as number);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat;
  const spanLng = maxLng - minLng;

  return function project(lat, lng) {
    if (lat == null || lng == null) return null;
    const nx = spanLng < EPS ? 0.5 : (lng - minLng) / spanLng;
    const ny = spanLat < EPS ? 0.5 : (lat - minLat) / spanLat;
    return {
      mapX: PAD + nx * (1 - 2 * PAD),
      // y inverted so north sits at the top of the map.
      mapY: PAD + (1 - ny) * (1 - 2 * PAD),
    };
  };
}

/**
 * Projects a user lat/lng into the same bounding box so the ZvUserDot lands
 * relative to the visible pins. Clamps to [0..1] so an out-of-range user (e.g.
 * far from every result) still renders on-canvas.
 */
export function projectUser(
  project: ProjectFn,
  lat: number | null | undefined,
  lng: number | null | undefined,
): MapPoint | null {
  const p = project(lat, lng);
  if (!p) return null;
  return {
    mapX: Math.min(1, Math.max(0, p.mapX)),
    mapY: Math.min(1, Math.max(0, p.mapY)),
  };
}

import type { IconName } from "@/components/ui/icon";

/**
 * Category → pin icon. Mirrors the prototype's ZV_CATEGORIES icon column so a
 * projected pin shows the same glyph as the category dot. Defaults to "pin".
 */
const CAT_ICON: Record<CategoryKey, IconName> = {
  hair: "scissors",
  color: "sparkle",
  nails: "sparkle",
  skin: "shield",
  massage: "sparkle",
  brow: "sparkle",
  auto: "car",
  dental: "tooth",
  cleaning: "broom",
  fitness: "dumbbell",
  pets: "paw",
  trades: "wrench",
};

export function catIcon(cat: CategoryKey | string): IconName {
  return CAT_ICON[cat as CategoryKey] ?? "pin";
}
