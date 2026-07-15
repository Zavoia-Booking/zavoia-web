import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/i18n/locales";
import { getListing } from "@/lib/api/marketplace/public";
import type { ListingDetail } from "@/lib/api/marketplace/types";
import { BusinessDetail } from "../_components/business-detail";
import { BusinessNotFound } from "../_components/business-not-found";

// Live marketplace data: never statically prerender (the backend may be down
// during `next build`). The route param is a LOCATION slug (non-enumerable);
// the backend resolves it (it also accepts a numeric id) to a listing.
export const dynamic = "force-dynamic";

// Slugs aren't known at build time — accept any slug and render it dynamically.
export const dynamicParams = true;

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { locale, slug } = await params;
    if (!isLocale(locale)) return {};
    if (!slug) return {};
    const listing = await getListing(slug);
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
    listing = await getListing(slug);
  } catch {
    listing = null;
  }

  if (!listing) return <BusinessNotFound locale={locale} />;

  return <BusinessDetail listing={listing} locale={locale} />;
}
