import { industryAccent, type IndustrySlug } from "@/lib/marketplace/industry-visuals";

/**
 * The category a card is coloured by: a canonical industry slug.
 *
 * This used to be a set of 12 invented keys (hair, color, nails, …) that no
 * backend ever spoke; it is now the industry taxonomy's own slug, so a card, a
 * map pin and a rail chip for the same business always agree.
 */
export type CategoryKey = IndustrySlug;

export interface CatDotProps {
  cat: CategoryKey | string;
  size?: number;
  ring?: boolean;
}

// Colored category dot. The colour comes from the industry registry — the same
// literal the map hands to Mapbox — rather than a CSS custom property, so there
// is one table to keep in step with the app and the dashboard.
export function CatDot({ cat, size = 6, ring = false }: CatDotProps) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: industryAccent(cat),
        display: "inline-block",
        flexShrink: 0,
        boxShadow: ring ? "0 0 0 2px var(--c-canvas)" : "none",
      }}
    />
  );
}
