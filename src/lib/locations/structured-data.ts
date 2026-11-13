import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import type { ListingDetail, ListingLocation } from "@/lib/api/marketplace/types";
import { countryCode } from "@/lib/geo/country-code";
import { parseWorkingHoursDay, WEEKDAYS } from "@/lib/marketplace/working-hours";
import { SITE_URL } from "@/lib/site";
import { locationHref, locationIdentity, locationName, locationTitle } from "./identity";

const organizationId = `${SITE_URL}/#organization`;
const websiteId = `${SITE_URL}/#website`;

function text(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

/** Public web URLs only; a gallery's root-relative upload URL belongs to this site. */
export function webUrl(value: unknown, allowRelative = false): string | undefined {
  const source = text(value);
  if (!source || (!/^https?:\/\//i.test(source) && !(allowRelative && /^\/(?!\/)/.test(source)))) return undefined;
  try {
    const url = new URL(source, SITE_URL);
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

function postalAddress(location: ListingLocation) {
  const components = location.addressComponents;
  const street = text(components?.street);
  const number = text(components?.streetNumber);
  // Keep the supplied formatted address intact when no structured street exists;
  // splitting it at commas would guess at local address conventions.
  const streetAddress = street ? [number, street].filter(Boolean).join(" ") : text(location.address);
  const addressLocality = text(location.city) || text(components?.city);
  const postalCode = text(components?.postalCode);
  // Stored as typed ("Romania", "România"). Google prefers the two-letter code;
  // a name no country matches is kept as written.
  const country = text(components?.country);
  const addressCountry = countryCode(country) ?? country;
  if (!streetAddress && !addressLocality && !postalCode && !addressCountry) return undefined;
  return {
    "@type": "PostalAddress",
    ...(streetAddress && { streetAddress }),
    ...(addressLocality && { addressLocality }),
    ...(postalCode && { postalCode }),
    ...(addressCountry && { addressCountry }),
  };
}

function coordinates(location: ListingLocation) {
  const { latitude, longitude } = location;
  if (typeof latitude !== "number" || typeof longitude !== "number"
    || !Number.isFinite(latitude) || !Number.isFinite(longitude)
    || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return undefined;
  return { "@type": "GeoCoordinates", latitude, longitude };
}

function openingHours(location: ListingLocation) {
  const dayName = (day: string) => `https://schema.org/${day[0].toUpperCase()}${day.slice(1)}`;
  if (location.open247) {
    return [{
      "@type": "OpeningHoursSpecification",
      dayOfWeek: WEEKDAYS.map(dayName),
      opens: "00:00",
      closes: "23:59",
    }];
  }
  // These are published venue wall times, not today's status or UTC instants.
  // Google represents explicit closure with equal midnight endpoints, and an
  // overnight interval on the day it starts. Unknown days remain absent.
  return WEEKDAYS.flatMap(day => {
    const hours = parseWorkingHoursDay(location.workingHours?.[day]);
    if (hours.kind === "unknown") return [];
    return [{
      "@type": "OpeningHoursSpecification",
      dayOfWeek: dayName(day),
      opens: hours.kind === "closed" ? "00:00" : hours.open,
      closes: hours.kind === "closed" ? "00:00" : hours.close,
    }];
  });
}

/** Pages above this location, root first, as their own headings name them. */
export type LocationBreadcrumb = ReadonlyArray<{ name: string; href: string }>;

export type LocationPageContext = {
  /** The visible trail above this location, when it has a confirmed parent page. */
  ancestors?: LocationBreadcrumb | null;
  /** The document title, without the site suffix. */
  title?: string;
};

/** Factual public entities only: ratings, offers and inferred subtypes are excluded. */
export function locationStructuredData(
  listing: ListingDetail,
  locale: Locale,
  { ancestors = null, title = locationTitle(listing) }: LocationPageContext = {},
) {
  const url = `${SITE_URL}${locationHref(locale, listing)}`;
  const canonicalLocationUrl = `${SITE_URL}${locationHref(DEFAULT_LOCALE, listing)}`;
  const locationId = `${SITE_URL}/#location-${encodeURIComponent(text(listing.location.uuid) || String(listing.locationId))}`;
  const merchantId = `${SITE_URL}/#business-${listing.businessId}`;
  const pageId = `${url}#webpage`;
  const breadcrumbId = `${url}#breadcrumb`;
  // The visible heading, which closes the breadcrumb trail.
  const name = locationName(listing);
  // The business itself is the brand and the branch, as people search for it.
  const businessName = locationIdentity(listing);
  const description = text(listing.location.description);
  const merchantName = text(listing.name);
  const merchantDescription = text(listing.description);
  const merchantUrl = `${SITE_URL}${localeHref(DEFAULT_LOCALE, "brand", encodeURIComponent(text(listing.businessSlug) || String(listing.businessId)))}`;
  const logo = webUrl(listing.logo, true);
  const sameAs = [...new Set([
    listing.websiteUrl, listing.instagramUrl, listing.facebookUrl, listing.tiktokUrl, listing.pinterestUrl,
  ].map(value => webUrl(value)).filter((value): value is string => Boolean(value)))];
  const image = [...new Set([
    listing.featuredImage,
    ...listing.portfolioImages.map(photo => typeof photo === "string" ? photo : photo.url),
  ].map(value => webUrl(value, true)).filter((value): value is string => Boolean(value)))];
  const address = postalAddress(listing.location);
  const geo = coordinates(listing.location);
  const telephone = text(listing.location.phone);
  const email = text(listing.location.email);
  const hours = openingHours(listing.location);
  // These brand contacts are rendered only when the branch has no own value.
  const merchantTelephone = !telephone ? text(listing.phone) : undefined;
  const merchantEmail = !email ? text(listing.email) : undefined;
  // Only a confirmed parent page makes a trail; the location's own name closes it.
  const breadcrumb = ancestors?.length ? {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: [...ancestors.map(item => ({ name: item.name, item: `${SITE_URL}${item.href}` })), { name, item: url }]
      .map((item, index) => ({ "@type": "ListItem", position: index + 1, ...item })),
  } : undefined;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "Zavoia",
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/brand/wordmark-cropped.png`,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: "Zavoia",
        url: `${SITE_URL}/`,
        inLanguage: [...LOCALES],
        publisher: { "@id": organizationId },
      },
      ...(merchantName ? [{
        "@type": "Organization",
        "@id": merchantId,
        name: merchantName,
        url: merchantUrl,
        ...(merchantDescription && { description: merchantDescription }),
        ...(logo && { logo }),
        ...(sameAs.length > 0 && { sameAs }),
        ...(merchantTelephone && { telephone: merchantTelephone }),
        ...(merchantEmail && { email: merchantEmail }),
      }] : []),
      {
        "@type": "LocalBusiness",
        "@id": locationId,
        name: businessName,
        url: canonicalLocationUrl,
        mainEntityOfPage: { "@id": pageId },
        ...(merchantName && { parentOrganization: { "@id": merchantId } }),
        ...(description && { description }),
        ...(image.length > 0 && { image }),
        ...(address && { address }),
        ...(geo && { geo }),
        ...(telephone && { telephone }),
        ...(email && { email }),
        ...(hours.length > 0 && { openingHoursSpecification: hours }),
      },
      {
        "@type": "WebPage",
        "@id": pageId,
        url,
        name: title,
        inLanguage: locale,
        isPartOf: { "@id": websiteId },
        publisher: { "@id": organizationId },
        mainEntity: { "@id": locationId },
        ...(breadcrumb && { breadcrumb: { "@id": breadcrumbId } }),
        ...(description && { description }),
      },
      ...(breadcrumb ? [breadcrumb] : []),
    ],
  };
}

/** Safe inside a native application/ld+json script, including merchant-supplied text. */
export function serializeLocationStructuredData(listing: ListingDetail, locale: Locale, context: LocationPageContext = {}): string {
  return JSON.stringify(locationStructuredData(listing, locale, context)).replace(/</g, "\\u003c");
}
