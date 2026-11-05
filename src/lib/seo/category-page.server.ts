import "server-only";

import { findCity, findTaxonomy, type CityView, type TaxonomyView } from "@/data/seo";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { getIndustries } from "@/lib/api/marketplace/public";
import type { Industry } from "@/lib/api/marketplace/types";

export type CategoryRoute =
  | { kind: "notFound" }
  | { kind: "redirect"; to: string }
  | { kind: "ok"; city: CityView; entry: TaxonomyView; industries: Industry[] };

/**
 * Resolve a /[city]/[industry] address against the configured cities and the
 * live taxonomy. The page and its layout's metadata share this one decision.
 */
export async function resolveCategoryRoute(
  locale: Locale,
  citySlug: string,
  taxonomySlug: string,
): Promise<CategoryRoute> {
  const city = findCity(locale, citySlug);
  if (!city) return { kind: "notFound" };

  // Only a successful taxonomy response can establish that a category is absent.
  // Let operational failures reach the existing error boundary, preserving ISR
  // data rather than caching an outage as a missing or empty category.
  const industries = await getIndustries();
  if (industries.length === 0) return { kind: "notFound" };

  const { entry, redirectTo } = findTaxonomy(industries, locale, taxonomySlug);
  if (redirectTo) {
    return { kind: "redirect", to: localeHref(locale, city.slug, redirectTo) };
  }
  if (!entry) return { kind: "notFound" };

  return { kind: "ok", city, entry, industries };
}
