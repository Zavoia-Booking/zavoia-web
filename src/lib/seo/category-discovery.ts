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
 * Only advertise city/category pages supported by searchable inventory.
 * The sitemap feed's category metadata shares the public search index. Missing
 * metadata is not evidence of inventory, and a visitor's location or a country
 * fallback must never supply that evidence.
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
  const eligible = new Map<string, Set<string>>();

  for (const location of locations) {
    const category = location.category;
    if (!category?.city) continue;
    const cityId = cityByAlias.get(slugifyRo(category.city));
    if (!cityId) continue;

    const entries = eligible.get(cityId) ?? new Set<string>();
    const industry = category.industryId == null
      ? undefined
      : industryById.get(category.industryId);
    if (industry) entries.add(industry);
    for (const tagId of category.tagIds ?? []) {
      const tag = tagById.get(tagId);
      if (tag) entries.add(tag);
    }
    if (entries.size) eligible.set(cityId, entries);
  }

  // Configured city order and stable taxonomy identities keep navigation
  // independent of API result order and the locale's translated labels.
  return CITY_ENTRIES.flatMap((city) => {
    const entries = [...(eligible.get(city.id) ?? [])]
      .flatMap((id) => {
        const entry = taxonomyById.get(id);
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

