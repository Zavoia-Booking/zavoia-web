import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/locales";
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
// 300s is the FLOOR, not the freshness plan — see `LISTING_REVALIDATE_SECONDS`
// in @/lib/cache/tags. Publishing a business calls the revalidate webhook,
// which invalidates this page's tag immediately; the window only covers
// edits that never fire a webhook. Must be a literal to be statically
// analysable.
export const revalidate = 300;

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
  revalidate: 300,
  tags: [BUSINESS_TAG, businessTag(slug)],
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { locale, slug } = await params;
    if (!isLocale(locale)) return {};
    if (!slug) return {};
    const listing = await getListing(slug, LISTING_CACHE(slug));
    return {
      // Location page → the location's own name titles the tab (business-level
      // listing name only as fallback).
      title: listing.location?.name || listing.name,
      description: listing.description ?? undefined,
      // Personalised / live-data page — keep it out of the index.
      robots: { index: false, follow: true },
    };
  } catch {
    return {};
  }
}

export default async function BusinessDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  if (!slug) notFound();

  // Build-safety: a failed/absent backend renders the not-found state rather
  // than crashing the route. `getListing` is called with the LOCATION slug
  // (the backend resolves slug-or-id).
  let listing: ListingDetail | null = null;
  try {
    listing = await getListing(slug, LISTING_CACHE(slug));
  } catch {
    listing = null;
  }

  if (!listing) return <BusinessNotFound locale={locale} />;

  return <BusinessDetail listing={listing} locale={locale} />;
}
