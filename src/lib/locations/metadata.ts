import "server-only";

import type { Metadata } from "next";
import { dictionaries } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/locales";
import type { ListingDetail } from "@/lib/api/marketplace/types";
import { taxonomyLabel, toCat } from "@/lib/marketplace/card-mappers";
import { getConfiguredCity } from "@/lib/seo/location-category";
import { DEFAULT_SOCIAL_IMAGE, OPEN_GRAPH_LOCALES, SITE_URL } from "@/lib/site";
import { locationHref, locationIdentity, locationTitle } from "./identity";

/** About this many title characters show in results; the site suffix may be cut. */
const TITLE_DISPLAY_LIMIT = 60;

/** Search copy built only from what the page shows: its industry label, city and actions. */
function searchCopy(listing: ListingDetail, locale: Locale) {
  const dict = dictionaries[locale];
  const t = dict.locationPage;
  const identity = locationIdentity(listing);
  // A configured city keeps its localized name, as its category page does.
  const city = getConfiguredCity(listing)?.name[locale] ?? (listing.location.city?.trim().replace(/\s+/g, " ") || undefined);
  // The header's own industry label.
  const industry = listing.industry
    ? taxonomyLabel({ ...listing.industry, slug: toCat(listing.industry) }, locale, dict.industries).trim() || undefined
    : undefined;

  // Lead with the category and city when they fit; a longer title keeps the plain form.
  const withCategory = industry && city
    ? `${identity} | ${format(dict.category.titleTemplate, { industry, city })}`
    : undefined;
  const title = withCategory && withCategory.length <= TITLE_DISPLAY_LIMIT ? withCategory : locationTitle(listing, city);

  const industryLower = industry?.toLocaleLowerCase(locale);
  const lead = industryLower && city ? format(t.metaLeadIndustryCity, { name: identity, industry: industryLower, city })
    : city ? format(t.metaLeadCity, { name: identity, city })
    : industryLower ? format(t.metaLeadIndustry, { name: identity, industry: industryLower })
    : format(t.metaLeadName, { name: identity });
  // The same availability rules as the page's booking action.
  const hasCatalog = listing.services.length > 0 || listing.bundles.length > 0;
  const action = listing.allowOnlineBooking && hasCatalog ? t.metaActionBook
    : hasCatalog ? t.metaActionServices
    : t.metaActionDetails;
  return { title, fallbackDescription: `${lead} ${action}` };
}

/** The document title before the site suffix; the page's WebPage markup repeats it. */
export function locationPageTitle(listing: ListingDetail, locale: Locale): string {
  return searchCopy(listing, locale).title;
}

export function locationMetadata(listing: ListingDetail, locale: Locale): Metadata {
  const { title, fallbackDescription } = searchCopy(listing, locale);
  // The top-level description describes the brand, not necessarily this branch.
  const description = listing.location.description?.trim() || fallbackDescription;
  const languages = Object.fromEntries(LOCALES.map(language => [language, locationHref(language, listing)]));
  const url = `${SITE_URL}${locationHref(locale, listing)}`;
  const photo = listing.featuredImage?.trim() || listing.portfolioImages
    .map(image => (typeof image === "string" ? image : image.url)?.trim())
    .find(Boolean);
  const logo = listing.logo?.trim();
  const image = photo || logo;
  const socialImage = image ? { url: image, alt: title } : DEFAULT_SOCIAL_IMAGE;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { ...languages, "x-default": languages[DEFAULT_LOCALE] },
    },
    openGraph: {
      type: "website",
      siteName: "Zavoia",
      title,
      description,
      url,
      locale: OPEN_GRAPH_LOCALES[locale],
      alternateLocale: LOCALES.filter(language => language !== locale).map(language => OPEN_GRAPH_LOCALES[language]),
      images: [socialImage],
    },
    twitter: {
      card: !photo && logo ? "summary" : "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}
