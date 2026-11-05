import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import type { ListingDetail } from "@/lib/api/marketplace/types";

type LocationIdentity = Pick<ListingDetail, "slug" | "locationId" | "name" | "location">;

/** Resolve aliases from the returned location, never from the requested URL. */
export function locationHref(locale: Locale, listing: LocationIdentity): string {
  const slug = listing.slug?.trim() || listing.location.slug?.trim() || String(listing.locationId);
  return localeHref(locale, "business", encodeURIComponent(slug));
}

function cleanName(value: string | null | undefined): string {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

/** The location keeps its own name in the visible page heading. */
export function locationName(listing: LocationIdentity): string {
  return cleanName(listing.location.name) || cleanName(listing.name) || String(listing.locationId);
}

function titleParts(listing: LocationIdentity, cityName: string | null | undefined) {
  const seen = new Set<string>();
  const distinct = (value: string | null | undefined) => {
    const name = cleanName(value);
    const key = name.normalize("NFC").toLowerCase();
    if (!name || seen.has(key)) return "";
    seen.add(key);
    return name;
  };
  const identity = [distinct(listing.name), distinct(listing.location.name)].filter(Boolean).join(" – ")
    || locationName(listing);
  return { identity, city: distinct(cityName) };
}

/** Brand and location names, without repeating an identical name. */
export function locationIdentity(listing: LocationIdentity): string {
  return titleParts(listing, null).identity;
}

/** Add brand and city context for search, without repeating identical fields.
 * The city defaults to the location's own field; metadata passes its localized name. */
export function locationTitle(listing: LocationIdentity, cityName: string | null | undefined = listing.location.city): string {
  const { identity, city } = titleParts(listing, cityName);
  return city ? `${identity}, ${city}` : identity;
}
