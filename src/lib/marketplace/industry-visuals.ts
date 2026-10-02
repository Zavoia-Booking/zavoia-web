/**
 * Industry visual registry — one accent colour and one glyph per canonical
 * industry, keyed by the stable API slug.
 *
 * This is a verbatim port of the RN marketplace-app's
 * `features/industry-tags/visuals.ts`, which the admin dashboard also mirrors.
 * The three tables must agree: the same business shows the same colour on the
 * map pin, the result card's dot and the category rail, on every surface.
 *
 * The canonical list is `admin-api/docs/industry-taxonomy.md` — 14 industries,
 * slugs never renamed once shipped.
 *
 * This REPLACES the old `toCat()` keyword heuristic, which mapped industries
 * onto 12 invented category keys: five industries collapsed into `hair`, six of
 * the twelve keys drew the same `sparkle` glyph, and anything unrecognised
 * silently became a hair salon.
 */

import type { IconName } from "@/components/ui/icon";

/** The 14 canonical industry slugs, in taxonomy order. */
export const INDUSTRY_SLUGS = [
  "beauty",
  "spa-wellness",
  "skin-aesthetics",
  "tattoo-piercing",
  "health-medical",
  "fitness-sports",
  "pets",
  "automotive",
  "home-services",
  "professional-services",
  "education-coaching",
  "events-creative",
  "tailoring-repairs",
  "other",
] as const;

export type IndustrySlug = (typeof INDUSTRY_SLUGS)[number];

export interface IndustryVisual {
  icon: IconName;
  /** One distinct colour per industry: icon tint, card dot, map badge. */
  accent: string;
}

/**
 * Hex rather than an oklch token, because these values are handed to Mapbox as
 * paint-expression literals — the GL style parser has no access to CSS custom
 * properties, and resolving them per repaint would mean a getComputedStyle call
 * on every frame of the pin animation.
 */
export const INDUSTRY_VISUALS: Record<IndustrySlug, IndustryVisual> = {
  "beauty": { icon: "scissors", accent: "#B14420" },
  "spa-wellness": { icon: "leaf", accent: "#2E8C8C" },
  "skin-aesthetics": { icon: "droplets", accent: "#C0407A" },
  "tattoo-piercing": { icon: "flower", accent: "#3D3654" },
  "health-medical": { icon: "stethoscope", accent: "#1F8A5B" },
  "fitness-sports": { icon: "dumbbell", accent: "#2F6FE0" },
  "pets": { icon: "paw", accent: "#B0700A" },
  "automotive": { icon: "car", accent: "#41729F" },
  "home-services": { icon: "home", accent: "#5C8324" },
  "professional-services": { icon: "briefcase", accent: "#7A4FB5" },
  "education-coaching": { icon: "graduationCap", accent: "#33499B" },
  "events-creative": { icon: "camera", accent: "#B0359A" },
  "tailoring-repairs": { icon: "flash", accent: "#7E4A26" },
  "other": { icon: "shapes", accent: "#615D59" },
};

/**
 * Legacy rows still present in the database — businesses are attached to them,
 * so they resolve to their canonical equivalent rather than falling to `other`.
 */
const LEGACY_SLUG_ALIASES: Record<string, IndustrySlug> = {
  "baseline-beauty": "beauty",
  "baseline-dental": "health-medical",
  "baseline-health": "health-medical",
  "baseline-other": "other",
};

const SLUG_SET = new Set<string>(INDUSTRY_SLUGS);

/**
 * Canonical English `industry.name` → slug.
 *
 * The cards embedded in search results carry an `IndustryRef` with only an id
 * and a name — no slug — so a card rendered without the taxonomy to hand needs
 * a way back to the registry. Exact names come from the canonical taxonomy doc;
 * an unrecognised name falls to `other` rather than guessing, which is the whole
 * point of retiring the keyword scan.
 */
const NAME_TO_SLUG: Record<string, IndustrySlug> = {
  "beauty": "beauty",
  "spa & wellness": "spa-wellness",
  "skin & aesthetics": "skin-aesthetics",
  "tattoo & piercing": "tattoo-piercing",
  "health & medical": "health-medical",
  "fitness & sports": "fitness-sports",
  "pets": "pets",
  "automotive": "automotive",
  "home services": "home-services",
  "professional services": "professional-services",
  "education & coaching": "education-coaching",
  "events & creative": "events-creative",
  "tailoring & repairs": "tailoring-repairs",
  "other": "other",
  // Dev-fixture industries that predate the canonical seed.
  "health & fitness": "health-medical",
  "dental": "health-medical",
};

/** Registry key for a slug: aliases resolved, unknown/missing → `other`. */
export function resolveIndustrySlug(slug?: string | null): IndustrySlug {
  if (!slug) return "other";
  const aliased = LEGACY_SLUG_ALIASES[slug];
  if (aliased) return aliased;
  return SLUG_SET.has(slug) ? (slug as IndustrySlug) : "other";
}

/**
 * Registry key for an industry reference that may or may not carry a slug.
 *
 * `slugById` is the id → slug lookup built from the industry taxonomy; pass it
 * wherever the taxonomy has been loaded (the search page, the home page) so the
 * mapping is exact. Without it this falls back to the canonical name table.
 */
export function industrySlugOf(
  industry?: { id?: number; name?: string | null; slug?: string | null } | null,
  slugById?: ReadonlyMap<number, string>,
): IndustrySlug {
  if (!industry) return "other";
  if (industry.slug) return resolveIndustrySlug(industry.slug);
  if (industry.id != null && slugById) {
    const byId = slugById.get(industry.id);
    if (byId) return resolveIndustrySlug(byId);
  }
  const byName = industry.name
    ? NAME_TO_SLUG[industry.name.trim().toLowerCase()]
    : undefined;
  return byName ?? "other";
}

export function industryVisual(slug?: string | null): IndustryVisual {
  return INDUSTRY_VISUALS[resolveIndustrySlug(slug)];
}

/** The industry's accent colour, as a literal hex. */
export function industryAccent(slug?: string | null): string {
  return industryVisual(slug).accent;
}

/** The industry's glyph. */
export function industryIcon(slug?: string | null): IconName {
  return industryVisual(slug).icon;
}

/** id → slug lookup for the cards' slug-less `IndustryRef`s. */
export function buildSlugById(
  industries: readonly { id: number; slug: string }[],
): Map<number, string> {
  return new Map(industries.map((i) => [i.id, i.slug]));
}
