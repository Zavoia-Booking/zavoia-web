import { CITY_ENTRIES, listTaxonomy, slugifyRo } from "@/data/seo";
import { LOCALES, type Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import type { Industry, ListingDetail, LocationCard } from "@/lib/api/marketplace/types";

type LocationIdentity = Pick<ListingDetail, "industry" | "location">;

export type LocationCategoryTarget = {
  href: string;
  cityName: string;
  cityAliases: string[];
  industryId: number;
  industrySlug: string;
};

const countryNames = LOCALES.map((locale) => new Intl.DisplayNames([locale], { type: "region" }));

/** Match the location's declared geography, never the visitor or a default city. */
export function getLocationCategoryTarget(
  listing: LocationIdentity,
  industries: Industry[],
  locale: Locale,
): LocationCategoryTarget | null {
  const country = listing.location.addressComponents?.country;
  const cityKey = slugifyRo(listing.location.city ?? "");
  if (typeof country !== "string" || !country.trim() || !cityKey || !listing.industry) return null;

  const countryKey = slugifyRo(country);
  const cities = CITY_ENTRIES.filter((city) => {
    const countryAliases = [city.countryCode, ...countryNames.map((names) => names.of(city.countryCode) ?? "")];
    const cityAliases = [city.id, ...Object.values(city.name), ...Object.values(city.slug)];
    return countryAliases.some((alias) => slugifyRo(alias) === countryKey)
      && cityAliases.some((alias) => slugifyRo(alias) === cityKey);
  });
  // Ambiguous or unsupported geography has no safe destination.
  if (cities.length !== 1) return null;
  const city = cities[0];
  const matches = industries.filter((item) => item.id === listing.industry?.id);
  if (matches.length !== 1) return null;
  const industry = matches[0];

  const taxonomy = listTaxonomy(industries, locale);
  const entry = taxonomy.find((item) => item.kind === "industry" && item.industrySlug === industry.slug);
  if (!entry || taxonomy.filter((item) => item.slug === entry.slug).length !== 1) return null;

  return {
    href: localeHref(locale, city.slug[locale], entry.slug),
    cityName: city.name[locale],
    cityAliases: [...new Set([city.id, ...Object.values(city.name), ...Object.values(city.slug)].map(slugifyRo))],
    industryId: industry.id,
    industrySlug: industry.slug,
  };
}

/** Search supports fuzzy cities; require exact city/category evidence for this link. */
export function hasLocationCategoryResult(
  target: LocationCategoryTarget,
  locations: Pick<LocationCard, "city" | "industry">[],
): boolean {
  return locations.some((location) => location.industry?.id === target.industryId
    && target.cityAliases.includes(slugifyRo(location.city ?? "")));
}
