import "server-only";

import { getVenueTags } from "@/lib/api/marketplace/public";
import type { ListingDetail, VenueTagDictionaries } from "@/lib/api/marketplace/types";
import { LISTING_REVALIDATE_SECONDS, TAXONOMY_TAG } from "@/lib/cache/tags";

function tagIds(value: number[] | undefined): Set<number> {
  return new Set(Array.isArray(value) ? value : []);
}

/**
 * The location's amenities, payment methods and languages, in the vocabulary's
 * display order. Optional details must not make a usable location page fail or
 * wait indefinitely, so any failure renders the page without them.
 */
export async function getLocationVenueTags(listing: ListingDetail): Promise<VenueTagDictionaries | null> {
  const amenityIds = tagIds(listing.amenityTagIds);
  const paymentMethodIds = tagIds(listing.paymentMethodTagIds);
  const languageIds = tagIds(listing.languageTagIds);
  if (!amenityIds.size && !paymentMethodIds.size && !languageIds.size) return null;

  async function resolve(): Promise<VenueTagDictionaries> {
    const dictionaries = await getVenueTags({ revalidate: LISTING_REVALIDATE_SECONDS, tags: [TAXONOMY_TAG] });
    return {
      amenities: (dictionaries.amenities ?? []).filter((tag) => amenityIds.has(tag.id)),
      paymentMethods: (dictionaries.paymentMethods ?? []).filter((tag) => paymentMethodIds.has(tag.id)),
      languages: (dictionaries.languages ?? []).filter((tag) => languageIds.has(tag.id)),
    };
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
