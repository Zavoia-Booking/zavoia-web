import { notFound } from "next/navigation";
import { dictionaries } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { locationPageTitle } from "@/lib/locations/metadata";
import { getLocationPageListing } from "@/lib/locations/server";
import { serializeLocationStructuredData } from "@/lib/locations/structured-data";
import { BusinessDetail } from "../_components/business-detail";
import { getLocationCategory } from "@/lib/seo/location-category.server";
import { getLocationVenueTags } from "@/lib/marketplace/location-venue-tags.server";
import { getLocationBrand } from "@/lib/marketplace/location-brand.server";

// ISR. The route param is a LOCATION slug (non-enumerable — the backend
// resolves it, or a numeric id, to a listing), so nothing is prerendered at
// build time: the first request for a slug renders it, and the result is
// cached and served from the CDN for everyone after that. No backend call is
// needed during `next build`.
//
// The webhook expires location changes immediately. Time-based revalidation
// is the fallback for missed notifications, not a guaranteed freshness bound
// during an upstream outage. This export must remain statically analysable.
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

export default async function BusinessDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  if (!slug) notFound();

  const listing = await getLocationPageListing(slug);
  if (!listing) notFound();

  const [category, venueTags, brand] = await Promise.all([
    getLocationCategory(listing, locale),
    getLocationVenueTags(listing),
    getLocationBrand(listing),
  ]);
  // The category page's own breadcrumb, extended by this location. Without a
  // confirmed category page there is no truthful trail, so none is published.
  // Markup only: the page opens with its back control, and each step is
  // already a visible link here (logo, category eyebrow, footer directory).
  const dict = dictionaries[locale];
  const trail = category ? [
    { name: dict.breadcrumbHome, href: localeHref(locale) },
    { name: dict.industryDirectory.heading, href: localeHref(locale, "industries") },
    { name: category.name, href: category.href },
  ] : null;
  const structuredData = serializeLocationStructuredData(listing, locale, {
    ancestors: trail,
    title: locationPageTitle(listing, locale),
  });
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
      <BusinessDetail
        key={listing.locationId}
        listing={listing}
        locale={locale}
        categoryHref={category?.href ?? null}
        categoryHasOthers={category?.hasOthers ?? false}
        venueTags={venueTags}
        brand={brand}
      />
    </>
  );
}
