import "server-only";

import { taxonomyDisplayName } from "@/data/seo";
import { dictionaries } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { getIndustries, searchListings } from "@/lib/api/marketplace/public";
import type { ListingDetail } from "@/lib/api/marketplace/types";
import { BUSINESS_TAG, LISTING_REVALIDATE_SECONDS, TAXONOMY_TAG } from "@/lib/cache/tags";
import { getLocationCategoryTarget, hasLocationCategoryResult } from "./location-category";

export interface LocationCategoryLink {
  href: string;
  /** That page's own heading, for example "Beauty in Bucharest". */
  name: string;
  /** Whether that page lists a location other than this one. */
  hasOthers: boolean;
}

/** Optional discovery must not make a usable location page fail or wait indefinitely. */
export async function getLocationCategory(listing: ListingDetail, locale: Locale): Promise<LocationCategoryLink | null> {
  if (!listing.industry || !listing.location.city || !listing.location.addressComponents?.country) return null;

  async function resolve(): Promise<LocationCategoryLink | null> {
    const industries = await getIndustries({ revalidate: LISTING_REVALIDATE_SECONDS, tags: [TAXONOMY_TAG] });
    const target = getLocationCategoryTarget(listing, industries, locale);
    if (!target) return null;
    const { locations } = await searchListings({
      city: target.cityName,
      industrySlug: target.industrySlug,
      strict: true,
      limit: 2,
    }, { revalidate: LISTING_REVALIDATE_SECONDS, tags: [BUSINESS_TAG, TAXONOMY_TAG] });
    // The first strict result proves the page exists, as it always has; the
    // second can only show that it holds more than this location.
    if (!hasLocationCategoryResult(target, locations.slice(0, 1))) return null;
    const others = locations.filter((location) => location.id !== listing.locationId);
    const dict = dictionaries[locale];
    const name = format(dict.category.heading, {
      industry: taxonomyDisplayName(target.entry, industries, locale, dict),
      city: target.cityName,
    });
    return { href: target.href, name, hasOthers: hasLocationCategoryResult(target, others) };
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    // Keep the shared fetch/cache lifecycle intact; only bound this optional wait.
    return await Promise.race([
      resolve().catch(() => null),
      new Promise<null>((resolve) => { timeout = setTimeout(() => resolve(null), 2000); }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}
