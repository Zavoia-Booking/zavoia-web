import { CITY_ENTRIES, listTaxonomy, slugifyRo, type CityView, type TaxonomyView } from "@/data/seo";
import type { Locale } from "@/i18n/locales";
import type { Industry, MarketplaceSitemap } from "@/lib/api/marketplace/types";

export type CategoryDiscoveryGroup = CityView & {
  entries: TaxonomyView[];
};

function compareEntries(a: TaxonomyView, b: TaxonomyView): number {
  if (a.kind !== b.kind) return a.kind === "industry" ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * A city × category page is indexed, linked and listed in the sitemap from this
 * many listings. With one, it would only repeat that business's own page.
 */
export const MIN_LISTINGS_TO_INDEX = 2;

/**
 * Only advertise city/category pages supported by searchable inventory: at
 * least MIN_LISTINGS_TO_INDEX locations. The sitemap feed's category metadata
 * shares the public search index. Missing metadata is not evidence of
 * inventory, and a visitor's location or a country fallback must never supply
 * that evidence.
 */
export function getCategoryDiscoveryGroups(
  locations: MarketplaceSitemap["locations"],
  industries: Industry[],
  locale: Locale,
): CategoryDiscoveryGroup[] {
  const taxonomy = listTaxonomy(industries, locale);
  const taxonomyById = new Map(taxonomy.map((entry) => [entry.id, entry]));
  const industryById = new Map(industries.map((industry) => [industry.id, industry.slug]));
  const tagById = new Map(taxonomy.flatMap((entry) =>
    entry.kind === "tag" ? [[entry.tagId, entry.id] as const] : [],
  ));
  const cityByAlias = new Map(CITY_ENTRIES.flatMap((city) =>
    [city.id, ...Object.values(city.name), ...Object.values(city.slug)]
      .map((alias) => [slugifyRo(alias), city.id] as const),
  ));
  // City → taxonomy entry → number of locations listing it.
  const counts = new Map<string, Map<string, number>>();

  for (const location of locations) {
    const category = location.category;
    if (!category?.city) continue;
    const cityId = cityByAlias.get(slugifyRo(category.city));
    if (!cityId) continue;

    // A set, so a location counts once per entry.
    const entries = new Set<string>();
    const industry = category.industryId == null
      ? undefined
      : industryById.get(category.industryId);
    if (industry) entries.add(industry);
    for (const tagId of category.tagIds ?? []) {
      const tag = tagById.get(tagId);
      if (tag) entries.add(tag);
    }
    if (!entries.size) continue;
    const cityCounts = counts.get(cityId) ?? new Map<string, number>();
    for (const id of entries) cityCounts.set(id, (cityCounts.get(id) ?? 0) + 1);
    counts.set(cityId, cityCounts);
  }

  // Configured city order and stable taxonomy identities keep navigation
  // independent of API result order and the locale's translated labels.
  return CITY_ENTRIES.flatMap((city) => {
    const entries = [...(counts.get(city.id) ?? [])]
      .flatMap(([id, count]) => {
        const entry = count >= MIN_LISTINGS_TO_INDEX ? taxonomyById.get(id) : undefined;
        return entry ? [entry] : [];
      })
      .sort(compareEntries);
    return entries.length ? [{
      id: city.id,
      name: city.name[locale],
      slug: city.slug[locale],
      entries,
    }] : [];
  });
}

