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
import type { BusinessCardData } from "@/components/business/types";
import type {
  BusinessCard,
  IndustryRef,
  ListingDetail,
  LocationCard,
} from "@/lib/api/marketplace/types";
import { openStatus } from "./working-hours";

/**
 * Best-effort industry → category-dot key. Matches slug first, then name,
 * checking the most specific tokens before the broader ones. Defaults to
 * `"hair"` so the dot/colour always resolves.
 */
export function toCat(
  industry?: { name?: string | null; slug?: string | null } | null,
): CategoryKey {
  const haystack = `${industry?.slug ?? ""} ${industry?.name ?? ""}`.toLowerCase();
  const has = (...tokens: string[]) => tokens.some((t) => haystack.includes(t));

  // Order matters: check narrower categories before broader fallbacks.
  if (has("color", "colour")) return "color";
  if (has("nails", "nail", "manicure")) return "nails";
  if (has("brow", "brows", "lash", "lashes")) return "brow";
  if (has("skin", "skincare", "facial", "aesthetics", "beauty")) return "skin";
  if (has("massage", "spa", "wellness")) return "massage";
  if (has("auto", "automotive", "garage", "mot", "car")) return "auto";
  if (has("dental", "dentist")) return "dental";
  if (has("cleaning", "cleaner")) return "cleaning";
  if (has("fitness", "gym", "training", "pilates")) return "fitness";
  if (has("pets", "pet", "grooming")) return "pets";
  if (has("trades", "electrician", "plumber", "handyman")) return "trades";
  if (has("hair", "barber", "salon")) return "hair";
  return "hair";
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
 * BUSINESS-sourced card (latest listings / business-name hits).
 * Navigates to the primary location's detail page: slug when available,
 * otherwise the numeric `primaryLocationId` (the detail route resolves both).
 * Only when both are missing is there no href (the card falls back to onClick).
 */
export function businessCardToData(
  b: BusinessCard,
  locale: Locale,
): BusinessCardData {
  const navTarget = b.slug ?? b.primaryLocationId;
  return {
    id: b.id,
    slug: b.slug ?? undefined,
    name: b.name,
    cat: toCat(b.industry),
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
 * LOCATION-sourced card (search / nearby results). `id` is the location id,
 * which is also the detail-page nav target.
 */
export function locationCardToData(
  l: LocationCard,
  locale: Locale,
): BusinessCardData {
  const os = openStatus(l);
  return {
    id: l.id,
    slug: l.slug,
    name: l.name,
    cat: toCat(l.industry),
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
    name: d.name,
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
