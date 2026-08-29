import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/locales";
import {
  findCity,
  findTaxonomy,
  getCategoryAlternates,
  type CityView,
  type TaxonomyView,
} from "@/data/seo";
import { dictionaries, format } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { getIndustries, searchListings } from "@/lib/api/marketplace/public";
import type {
  Industry,
  LocationCard,
  SearchListingsParams,
} from "@/lib/api/marketplace/types";
import { CategoryContent } from "@/app/_components/category-content";

// The taxonomy behind these pages is LIVE (GET /marketplace/public/industries),
// not a hand-maintained list, so a slug here can never drift from what the
// search endpoint accepts. That makes the route data-dependent, which is why it
// prerenders nothing and caches per-path on first request instead: the backend
// is never called during `next build`.
export const revalidate = 600;

export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

/** Cards shown per city × category page. */
const CATEGORY_LIMIT = 24;

type Props = {
  params: Promise<{ locale: string; city: string; industry: string }>;
};

/**
 * Everything both `generateMetadata` and the page body need. Identical fetches
 * are memoised within one render pass, so calling this twice costs one round
 * trip each to the taxonomy and the search.
 */
async function resolve(
  locale: Locale,
  citySlug: string,
  taxonomySlug: string,
): Promise<
  | { kind: "notFound" }
  | { kind: "redirect"; to: string }
  | {
      kind: "ok";
      city: CityView;
      entry: TaxonomyView;
      industries: Industry[];
      listings: LocationCard[];
    }
> {
  const city = findCity(locale, citySlug);
  if (!city) return { kind: "notFound" };

  // A taxonomy outage must not turn every category URL into a 404 — but it also
  // can't be rendered as "no businesses here", so it degrades to notFound and
  // the page is retried on the next revalidate.
  const industries = await getIndustries().catch((): Industry[] => []);
  if (industries.length === 0) return { kind: "notFound" };

  const { entry, redirectTo } = findTaxonomy(industries, locale, taxonomySlug);
  if (redirectTo) {
    return { kind: "redirect", to: localeHref(locale, city.slug, redirectTo) };
  }
  if (!entry) return { kind: "notFound" };

  // Strict, so the server cannot quietly drop the city or the category and
  // backfill from elsewhere: a page titled "Barbershops in Cluj" must never
  // list a spa in Iași.
  const params: SearchListingsParams = {
    city: city.name,
    strict: true,
    limit: CATEGORY_LIMIT,
    ...(entry.kind === "tag"
      ? { tagIds: [entry.tagId] }
      : { industrySlug: entry.industrySlug }),
  };
  const listings = await searchListings(params).then(
    (r) => r.locations,
    () => [] as LocationCard[],
  );

  return { kind: "ok", city, entry, industries, listings };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, city: citySlug, industry: slug } = await params;
  if (!isLocale(localeParam)) return {};

  const resolved = await resolve(localeParam, citySlug, slug);
  if (resolved.kind !== "ok") return {};

  const { city, entry, industries, listings } = resolved;
  const dict = dictionaries[localeParam];
  const vars = {
    industry: entry.name,
    industryLower: entry.name.toLowerCase(),
    city: city.name,
  };

  const title = format(dict.category.titleTemplate, vars);
  const description = format(dict.category.descriptionTemplate, vars);
  const canonical = localeHref(localeParam, city.slug, entry.slug);
  const languages = getCategoryAlternates(industries, city.id, entry.id);

  return {
    title,
    description,
    // A page with nothing to list is still useful to a visitor who arrived from
    // an internal link, but it is thin content and must not be offered to the
    // index. It starts being indexable the moment a business opens here.
    robots:
      listings.length === 0 ? { index: false, follow: true } : undefined,
    alternates: {
      canonical,
      languages: { ...languages, "x-default": languages[DEFAULT_LOCALE] },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      locale: localeParam,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { locale: localeParam, city: citySlug, industry: slug } = await params;
  if (!isLocale(localeParam)) notFound();

  const resolved = await resolve(localeParam, citySlug, slug);
  if (resolved.kind === "redirect") permanentRedirect(resolved.to);
  if (resolved.kind !== "ok") notFound();

  return (
    <CategoryContent
      locale={localeParam}
      city={resolved.city}
      entry={resolved.entry}
      industries={resolved.industries}
      listings={resolved.listings}
    />
  );
}
