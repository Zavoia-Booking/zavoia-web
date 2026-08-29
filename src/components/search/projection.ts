/**
 * Category → pin icon mapping for the map's <PinGlyph>.
 *
 * This module used to also project latitude/longitude into normalised [0..1]
 * canvas coordinates for the decorative prototype map. MapboxSurface places
 * markers by real coordinates, so only the icon lookup survives.
 */

import type { CategoryKey } from "@/components/ui/cat-dot";
import type { IconName } from "@/components/ui/icon";

/**
 * Category → glyph, so a pin shows the same icon as its category dot.
 * Defaults to "pin".
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
