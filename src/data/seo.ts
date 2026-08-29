import { LOCALES, type Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import type { Industry } from "@/lib/api/marketplace/types";

type LocalizedText = Record<Locale, string>;

type CityEntry = {
  id: string;
  slug: LocalizedText;
  name: LocalizedText;
};

/**
 * Cities Zavoia targets with landing pages.
 *
 * Unlike the industry taxonomy below, this list has no backend equivalent —
 * locations carry a free-text city that the search endpoint canonicalises, but
 * there is no city table to enumerate. Which cities get a page is a marketing
 * decision, so it stays declared here on purpose.
 */
export const CITY_ENTRIES: readonly CityEntry[] = [
  {
    id: "bucharest",
    slug: { ro: "bucuresti", en: "bucharest" },
    name: { ro: "București", en: "Bucharest" },
  },
  {
    id: "cluj",
    slug: { ro: "cluj-napoca", en: "cluj-napoca" },
    name: { ro: "Cluj-Napoca", en: "Cluj-Napoca" },
  },
  {
    id: "timisoara",
    slug: { ro: "timisoara", en: "timisoara" },
    name: { ro: "Timișoara", en: "Timisoara" },
  },
  {
    id: "iasi",
    slug: { ro: "iasi", en: "iasi" },
    name: { ro: "Iași", en: "Iasi" },
  },
  {
    id: "constanta",
    slug: { ro: "constanta", en: "constanta" },
    name: { ro: "Constanța", en: "Constanta" },
  },
  {
    id: "brasov",
    slug: { ro: "brasov", en: "brasov" },
    name: { ro: "Brașov", en: "Brasov" },
  },
  {
    id: "craiova",
    slug: { ro: "craiova", en: "craiova" },
    name: { ro: "Craiova", en: "Craiova" },
  },
  {
    id: "galati",
    slug: { ro: "galati", en: "galati" },
    name: { ro: "Galați", en: "Galati" },
  },
  {
    id: "ploiesti",
    slug: { ro: "ploiesti", en: "ploiesti" },
    name: { ro: "Ploiești", en: "Ploiesti" },
  },
  {
    id: "oradea",
    slug: { ro: "oradea", en: "oradea" },
    name: { ro: "Oradea", en: "Oradea" },
  },
  {
    id: "sibiu",
    slug: { ro: "sibiu", en: "sibiu" },
    name: { ro: "Sibiu", en: "Sibiu" },
  },
  {
    id: "arad",
    slug: { ro: "arad", en: "arad" },
    name: { ro: "Arad", en: "Arad" },
  },
  {
    id: "pitesti",
    slug: { ro: "pitesti", en: "pitesti" },
    name: { ro: "Pitești", en: "Pitesti" },
  },
];

export type CityView = { id: string; slug: string; name: string };

/**
 * One category-page axis: a backend industry, or one of its tags.
 *
 * Both levels get a page because they answer different queries — "beauty in
 * Cluj" and "barbershop in Cluj" are not the same search — and both resolve
 * against the SAME taxonomy the rest of the app uses, so a slug can never drift
 * from what the search endpoint accepts.
 */
export type TaxonomyView = {
  /** Stable identity across locales: the backend slug. */
  id: string;
  /** Locale-specific URL segment (see `localizedSlug`). */
  slug: string;
  /** Display name in the active locale. */
  name: string;
} & (
  | { kind: "industry"; industrySlug: string; tagId?: undefined }
  | { kind: "tag"; industrySlug: string; tagId: number }
);

/**
 * Romanian URL segment for a taxonomy entry, derived from its `nameRo`.
 *
 * The backend stores ONE canonical slug (English) plus a Romanian display name,
 * so the Romanian segment has to be derived. Diacritics are folded the same way
 * admin-api's own slug helper folds them, which is what keeps "Frizerie" and
 * "frizerie" resolving to one URL.
 *
 * Caveat worth knowing: this makes the RO segment a function of `nameRo`, so
 * editing that column changes a live URL. Renames therefore need a redirect
 * entry in LEGACY_INDUSTRY_SLUGS below, exactly like the pre-taxonomy slugs do.
 */
export function slugifyRo(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Romanian comma-below letters normalise to s/t already; ș/ț with cedilla
    // are separate codepoints in older data, so fold them explicitly.
    .replace(/[șş]/gi, "s")
    .replace(/[țţ]/gi, "t")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function localizedSlug(
  locale: Locale,
  entry: { slug: string; name: string; nameRo?: string | null },
): string {
  if (locale !== "ro") return entry.slug;
  const ro = entry.nameRo ? slugifyRo(entry.nameRo) : "";
  return ro || entry.slug;
}

/**
 * Flattens the API taxonomy into the category-page axis for one locale:
 * every industry, followed by each of its tags.
 */
export function listTaxonomy(
  industries: Industry[],
  locale: Locale,
): TaxonomyView[] {
  const out: TaxonomyView[] = [];
  for (const industry of industries) {
    out.push({
      kind: "industry",
      id: industry.slug,
      slug: localizedSlug(locale, industry),
      name: locale === "ro" && industry.nameRo ? industry.nameRo : industry.name,
      industrySlug: industry.slug,
    });
    for (const tag of industry.tags) {
      out.push({
        kind: "tag",
        id: tag.slug,
        slug: localizedSlug(locale, tag),
        name: locale === "ro" && tag.nameRo ? tag.nameRo : tag.name,
        industrySlug: industry.slug,
        tagId: tag.id,
      });
    }
  }
  return out;
}

/** Industry-level entries only — the set advertised in the sitemap. */
export function listIndustryTaxonomy(
  industries: Industry[],
  locale: Locale,
): TaxonomyView[] {
  return listTaxonomy(industries, locale).filter((t) => t.kind === "industry");
}

export function listCities(locale: Locale): CityView[] {
  return CITY_ENTRIES.map((c) => ({
    id: c.id,
    slug: c.slug[locale],
    name: c.name[locale],
  }));
}

export function findCity(locale: Locale, slug: string): CityView | undefined {
  const entry = CITY_ENTRIES.find((c) => c.slug[locale] === slug);
  if (!entry) return undefined;
  return { id: entry.id, slug: entry.slug[locale], name: entry.name[locale] };
}

/**
 * URL segments used by the hand-maintained taxonomy this module replaced,
 * mapped to the backend slug that now owns each page. They are still indexed,
 * so `/[city]/[industry]` 301s them rather than 404ing.
 *
 * Keyed by the OLD segment in either locale; the value is the backend slug,
 * which `findTaxonomy` then resolves to the current locale's segment.
 */
const LEGACY_INDUSTRY_SLUGS: Record<string, string> = {
  // en
  barbers: "barbershop",
  "nail-salons": "nail-salon",
  "hair-salons": "hair-salon",
  "beauty-salons": "beauty-salon",
  massage: "massage-studio",
  spa: "day-spa",
  "tattoo-studios": "tattoo-studio",
  // ro
  frizerii: "barbershop",
  "saloane-unghii": "nail-salon",
  coafor: "hair-salon",
  "saloane-infrumusetare": "beauty-salon",
  masaj: "massage-studio",
  tatuaje: "tattoo-studio",
};

/**
 * Resolves a URL segment against the live taxonomy.
 *
 * Returns the entry when the segment is current, or a `redirectTo` slug when it
 * is one of the pre-taxonomy segments above — the page then issues a permanent
 * redirect instead of rendering a duplicate under two URLs.
 */
export function findTaxonomy(
  industries: Industry[],
  locale: Locale,
  slug: string,
): { entry?: TaxonomyView; redirectTo?: string } {
  const all = listTaxonomy(industries, locale);
  const entry = all.find((t) => t.slug === slug);
  if (entry) return { entry };

  const canonical = LEGACY_INDUSTRY_SLUGS[slug];
  if (canonical) {
    const target = all.find((t) => t.id === canonical);
    if (target) return { redirectTo: target.slug };
  }
  return {};
}

/** hreflang map for one city × taxonomy pair, keyed by their stable ids. */
export function getCategoryAlternates(
  industries: Industry[],
  cityId: string,
  taxonomyId: string,
): Record<Locale, string> {
  const city = CITY_ENTRIES.find((c) => c.id === cityId);
  if (!city) return {} as Record<Locale, string>;

  const entries = Object.fromEntries(
    LOCALES.map((locale) => {
      const match = listTaxonomy(industries, locale).find(
        (t) => t.id === taxonomyId,
      );
      return [
        locale,
        match ? localeHref(locale, city.slug[locale], match.slug) : null,
      ];
    }).filter(([, href]) => href != null),
  ) as Record<Locale, string>;

  return entries;
}
