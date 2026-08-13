import {
  SECTION_META,
  SECTION_TYPES,
} from "@/features/website/components/builder/sectionCatalog";
import {
  BRAND_ACCENT_CATALOG,
  FONT_CATALOG,
} from "@/features/website/components/builder/theme";
import type { SectionEntry, SectionType } from "@/features/website/types";

/**
 * The shuffle model for /try.
 *
 * A "look" is one point in the product's real option space: a variant per
 * section, a brand accent, and a display face — 47 styles across 12 sections,
 * 30 accents and 14 faces, all read from the same registries the builder and
 * the catalogue use. Nothing here is decorative: every look the shuffle lands
 * on is a site a business could actually publish.
 *
 * Section ORDER never changes. Only the styles and the theme do, so a visitor
 * watching one section stays anchored to it while it transforms — the point is
 * "look what this section can be", not "look, the page moved".
 */

export interface Look {
  /** variant id per section, keyed by section type */
  variants: Record<SectionType, string>;
  /** brand accent hex */
  accent: string;
  /** display face key */
  fontKey: string;
}

/** The three dimensions a visitor can freeze between shuffles. */
export type LockKey = "layout" | "colour" | "type";
export type Locks = Record<LockKey, boolean>;

export const NO_LOCKS: Locks = { layout: false, colour: false, type: false };

/**
 * The look the page opens on. Chosen, not random: a QR scan gets one first
 * impression and it should be the product at its best. Every subsequent
 * shuffle is genuinely random.
 */
export const OPENING_LOOK: Look = {
  variants: {
    announcement: "hairline",
    nav: "default",
    hero: "cinematic",
    marquee: "scroll",
    about: "manifesto",
    services: "feature",
    locations: "showcase",
    gallery: "bento",
    team: "portraits",
    testimonials: "wall",
    faq: "grid",
    footer: "directory",
  },
  accent: "#C2552F",
  fontKey: "playfair",
};

const BASE36 = "0123456789abcdefghijklmnopqrstuvwxyz";

function pickDifferent<T>(pool: readonly T[], current: T | undefined): T {
  if (pool.length === 0) throw new Error("shuffle: empty pool");
  if (pool.length === 1) return pool[0];
  let next = current;
  // Guarantee visible change: a shuffle that lands on what you already had
  // reads as a broken button, not as chance.
  while (next === current) {
    next = pool[Math.floor(Math.random() * pool.length)];
  }
  return next as T;
}

/** Re-roll every unlocked dimension of `from`, guaranteeing each one changes. */
export function shuffleLook(from: Look, locks: Locks): Look {
  const variants = { ...from.variants };
  if (!locks.layout) {
    for (const type of SECTION_TYPES) {
      const ids = SECTION_META[type].variants.map((v) => v.id);
      variants[type] = pickDifferent(ids, from.variants[type]);
    }
  }
  return {
    variants,
    accent: locks.colour
      ? from.accent
      : pickDifferent(
          BRAND_ACCENT_CATALOG.map((a) => a.hex),
          from.accent,
        ),
    fontKey: locks.type
      ? from.fontKey
      : pickDifferent(
          FONT_CATALOG.map((f) => f.key),
          from.fontKey,
        ),
  };
}

/**
 * Compact URL encoding: one base36 digit per section variant (in SECTION_TYPES
 * order), then the accent index, then the face index — 14 characters. Lets a
 * visitor share the look they landed on, and lets a printed QR code carry a
 * specific opening look per campaign.
 */
export function encodeLook(look: Look): string {
  const chars = SECTION_TYPES.map((type) => {
    const i = SECTION_META[type].variants.findIndex(
      (v) => v.id === look.variants[type],
    );
    return BASE36[Math.max(0, i)];
  });
  const accent = BRAND_ACCENT_CATALOG.findIndex((a) => a.hex === look.accent);
  const font = FONT_CATALOG.findIndex((f) => f.key === look.fontKey);
  return [
    ...chars,
    BASE36[Math.max(0, accent)],
    BASE36[Math.max(0, font)],
  ].join("");
}

/** Parse an encoded look; anything malformed or out of range returns null. */
export function decodeLook(code: string): Look | null {
  const clean = code.trim().toLowerCase();
  if (clean.length !== SECTION_TYPES.length + 2) return null;

  const variants = {} as Record<SectionType, string>;
  for (const [i, type] of SECTION_TYPES.entries()) {
    const index = BASE36.indexOf(clean[i]);
    const pool = SECTION_META[type].variants;
    if (index < 0 || index >= pool.length) return null;
    variants[type] = pool[index].id;
  }

  const accentIndex = BASE36.indexOf(clean[SECTION_TYPES.length]);
  const fontIndex = BASE36.indexOf(clean[SECTION_TYPES.length + 1]);
  if (accentIndex < 0 || accentIndex >= BRAND_ACCENT_CATALOG.length) return null;
  if (fontIndex < 0 || fontIndex >= FONT_CATALOG.length) return null;

  return {
    variants,
    accent: BRAND_ACCENT_CATALOG[accentIndex].hex,
    fontKey: FONT_CATALOG[fontIndex].key,
  };
}

/** The look as a page layout the microsite renderer can consume. */
export function layoutFor(look: Look): SectionEntry[] {
  return SECTION_TYPES.map((type) => ({
    type,
    variant: look.variants[type],
    visible: true,
    config: { ...SECTION_META[type].defaultConfig },
  }));
}

/** Human-readable names for the dock readout, so a shuffle is legible. */
export function accentName(hex: string): string {
  return BRAND_ACCENT_CATALOG.find((a) => a.hex === hex)?.name ?? "";
}

export function fontName(key: string): string {
  return FONT_CATALOG.find((f) => f.key === key)?.name ?? "";
}

/** Total reachable combinations — a real number, computed from the registries. */
export const COMBINATION_COUNT = SECTION_TYPES.reduce(
  (total, type) => total * SECTION_META[type].variants.length,
  BRAND_ACCENT_CATALOG.length * FONT_CATALOG.length,
);
