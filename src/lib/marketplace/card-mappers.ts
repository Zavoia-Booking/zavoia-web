/**
 * Pure mappers: marketplace API discovery shapes → the shared `BusinessCardData`
 * UI shape consumed by the business cards. No side effects, no React.
 *
 * `href` always targets the business-detail route `business/<slug>` (the slug
 * is non-enumerable, so businesses can't be enumerated by incrementing an id).
 */

import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import type { CategoryKey } from "@/components/ui/cat-dot";
import { industrySlugOf } from "./industry-visuals";
import type { BusinessCardData } from "@/components/business/types";
import type {
  BrandCard,
  BusinessCard,
  IndustryRef,
  ListingDetail,
  LocationCard,
} from "@/lib/api/marketplace/types";
import { openStatus } from "./working-hours";

/**
 * Industry → category key, i.e. the canonical industry slug.
 *
 * Cards embed an `IndustryRef` carrying only an id and an English name, so pass
 * `slugById` (built from the loaded taxonomy) wherever it is available for an
 * exact mapping; without it this falls back to the canonical name table. See
 * `lib/marketplace/industry-visuals.ts`.
 */
export function toCat(
  industry?: { id?: number; name?: string | null; slug?: string | null } | null,
  slugById?: ReadonlyMap<number, string>,
): CategoryKey {
  return industrySlugOf(industry, slugById);
}

/**
 * Locale-aware label for an industry or industry tag: the Romanian `nameRo`
 * for the ro locale when the API provides one, else the English `name`.
 */
export function taxonomyLabel(
  x: { name: string; nameRo?: string | null },
  locale: Locale,
): string {
  return locale === "ro" && x.nameRo ? x.nameRo : x.name;
}

/**
 * BUSINESS-sourced card (business-name search hits). Titles lead with the
 * business name. Navigates to the primary location's detail page: slug when
 * available, otherwise the numeric `primaryLocationId` (the detail route
 * resolves both). Only when both are missing is there no href (the card falls
 * back to onClick).
 */
export function businessCardToData(
  b: BusinessCard,
  locale: Locale,
  slugById?: ReadonlyMap<number, string>,
): BusinessCardData {
  const navTarget = b.slug ?? b.primaryLocationId;
  return {
    id: b.id,
    slug: b.slug ?? undefined,
    name: b.name,
    cat: toCat(b.industry, slugById),
    catLabel: b.industry ? taxonomyLabel(b.industry, locale) : undefined,
    rating: b.averageRating ?? undefined,
    reviews: b.totalReviews,
    image: b.featuredImage ?? b.logo ?? undefined,
    city: b.city ?? undefined,
    href:
      navTarget != null
        ? localeHref(locale, "business", String(navTarget))
        : undefined,
  };
}

/**
 * BRAND-sourced card (Brands browse feed). `id` is the businessId (favorites
 * toggle the business endpoint). Everything shown is business-level: brand name,
 * brand profile image (location photo only as fallback), business-wide rating.
 * Navigates to the BRAND page (businessSlug); brands without one fall back to
 * their primary location's detail page.
 */
export function brandCardToData(b: BrandCard, locale: Locale): BusinessCardData {
  const locationTarget = b.primaryLocationSlug ?? b.primaryLocationId;
  return {
    id: b.businessId,
    slug: b.slug ?? undefined,
    name: b.name,
    cat: toCat(b.industry),
    catLabel: b.industry ? taxonomyLabel(b.industry, locale) : undefined,
    rating: b.averageRating ?? undefined,
    reviews: b.totalReviews,
    // Business profile image ONLY — no location-photo fallback: a brand card
    // without a logo shows the placeholder rather than borrowing a location's photo.
    image: b.profileImage ?? undefined,
    city: b.city ?? undefined,
    href: b.slug
      ? localeHref(locale, "brand", b.slug)
      : locationTarget != null
        ? localeHref(locale, "business", String(locationTarget))
        : undefined,
  };
}

/**
 * LOCATION-sourced card (search / nearby results). `id` is the location id,
 * which is also the detail-page nav target.
 */
export function locationCardToData(
  l: LocationCard,
  locale: Locale,
  slugById?: ReadonlyMap<number, string>,
): BusinessCardData {
  const os = openStatus(l);
  return {
    id: l.id,
    slug: l.slug,
    name: l.name,
    cat: toCat(l.industry, slugById),
    catLabel: l.industry ? taxonomyLabel(l.industry, locale) : undefined,
    rating: l.averageRating ?? undefined,
    reviews: l.totalReviews,
    image: l.featuredImage ?? undefined,
    city: l.city ?? undefined,
    distance: l.distanceKm != null ? `${l.distanceKm.toFixed(1)} km` : undefined,
    status: os.status,
    closesAt: os.closesAt,
    href: localeHref(locale, "business", l.slug),
  };
}

/** LISTING-detail-sourced card (recently viewed). `locationId` is the nav target. */
export function listingToCardData(
  d: ListingDetail,
  locale: Locale,
): BusinessCardData {
  // `industry` on a listing can be the full Industry or the minimal IndustryRef.
  const industry = d.industry as IndustryRef | null;
  return {
    id: d.locationId,
    slug: d.slug,
    // The card stands in for the LOCATION it links to — lead with its name.
    name: d.location?.name || d.name,
    cat: toCat(industry),
    catLabel: industry ? taxonomyLabel(industry, locale) : undefined,
    rating: d.averageRating ?? undefined,
    reviews: d.totalReviews,
    image: d.featuredImage ?? d.logo ?? undefined,
    city: d.location?.city ?? undefined,
    status: d.location?.open247 ? "24-7" : undefined,
    href: localeHref(locale, "business", d.slug),
  };
}
