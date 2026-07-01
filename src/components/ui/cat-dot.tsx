export type CategoryKey =
  | "hair"
  | "color"
  | "nails"
  | "skin"
  | "massage"
  | "brow"
  | "auto"
  | "dental"
  | "cleaning"
  | "fitness"
  | "pets"
  | "trades";

export interface CatDotProps {
  cat: CategoryKey | string;
  size?: number;
  ring?: boolean;
}

// Colored category dot. The color comes from a per-category CSS var
// (e.g. --cat-hair) defined in globals.css. Ported from ZwCatDot.
export function CatDot({ cat, size = 6, ring = false }: CatDotProps) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: `var(--cat-${cat})`,
        display: "inline-block",
        flexShrink: 0,
        boxShadow: ring ? "0 0 0 2px var(--c-canvas)" : "none",
      }}
    />
  );
}
