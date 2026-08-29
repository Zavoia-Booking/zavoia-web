import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { SITE_URL } from "@/lib/site";
import { ApiError } from "@/lib/api/http";
import { getListing } from "@/lib/api/marketplace/public";
import { BUSINESS_TAG, businessTag } from "@/lib/cache/tags";
import type { ListingDetail } from "@/lib/api/marketplace/types";
import { BusinessDetail } from "../_components/business-detail";
import { BusinessNotFound } from "../_components/business-not-found";

// ISR. The route param is a LOCATION slug (non-enumerable — the backend
// resolves it, or a numeric id, to a listing), so nothing is prerendered at
// build time: the first request for a slug renders it, and the result is
// cached and served from the CDN for everyone after that. No backend call is
// needed during `next build`.
//
// 600s is the FLOOR, not the freshness plan — see `LISTING_REVALIDATE_SECONDS`
// in @/lib/cache/tags. Publishing a business calls the revalidate webhook,
// which invalidates this page's tag immediately; the window only covers
// edits that never fire a webhook. Must be a literal to be statically
// analysable.
export const revalidate = 600;

// Required for ISR even though it enumerates nothing: without a
// `generateStaticParams`, Next treats the route as purely on-demand and never
// gives it a `dynamicRoutes` cache entry. Returning [] means "prerender no
// paths, but cache each one after its first request".
export async function generateStaticParams() {
  return [];
}

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// Both the metadata and the page body fetch the same listing; identical GETs
// are memoized within one render pass, so this is a single request. Two tags:
// the specific page, and the coarse `business` tag for a bulk flush.
const LISTING_CACHE = (slug: string) => ({
  revalidate: 600,
  tags: [BUSINESS_TAG, businessTag(slug)],
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { locale, slug } = await params;
    if (!isLocale(locale)) return {};
    if (!slug) return {};
    const listing = await getListing(slug, LISTING_CACHE(slug));

    // Location page → the location's own name titles the tab (business-level
    // listing name only as fallback).
    const title = listing.location?.name || listing.name;
    const description = listing.description ?? undefined;
    const image = listing.featuredImage ?? listing.logo ?? undefined;

    // The same URL under both locales renders the same business with different
    // chrome, so each is canonical for its own locale and the two are declared
    // as alternates — not as duplicates competing for one canonical.
    const languages = Object.fromEntries(
      LOCALES.map((l) => [l, localeHref(l, "business", slug)]),
    ) as Record<Locale, string>;

    return {
      title,
      description,
      alternates: {
        canonical: localeHref(locale, "business", slug),
        languages: { ...languages, "x-default": languages[DEFAULT_LOCALE] },
      },
      openGraph: {
        type: "website",
        title,
        description,
        url: `${SITE_URL}${localeHref(locale, "business", slug)}`,
        images: image ? [image] : undefined,
      },
    };
  } catch (error) {
    // A dead slug renders the not-found state below (a 200, because the route
    // streams), so the noindex has to be explicit — nothing throws
    // `notFound()` to add one. Any other failure gets no metadata and the page
    // rethrows anyway.
    if (error instanceof ApiError && error.status === 404) {
      return { robots: { index: false, follow: false } };
    }
    return {};
  }
}

export default async function BusinessDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  if (!slug) notFound();

  // The render is CACHED, so the two failure modes are different problems.
  // An upstream 404 is a real answer — no such listing — and is safe to cache
  // as the not-found state (metadata marks it noindex). Anything else (backend
  // down, 500, timeout) is rethrown: the render fails, nothing is stored, and
  // the next request retries, so an outage can never freeze "not found" into
  // the cache for the whole revalidate window.
  let listing: ListingDetail;
  try {
    listing = await getListing(slug, LISTING_CACHE(slug));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return <BusinessNotFound locale={locale} />;
    }
    throw error;
  }

  return <BusinessDetail listing={listing} locale={locale} />;
}
