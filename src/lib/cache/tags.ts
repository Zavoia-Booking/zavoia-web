/**
 * Cache tags for the public marketplace pages.
 *
 * ONE tag per entity, not one per entity type. A business detail page is built
 * from services, team members, locations, photos and reviews, and any of those
 * can change independently — but they all render the same URL, so they all
 * invalidate the same tag. admin-api never needs to know which sub-resource
 * changed; it only needs to name the business.
 *
 * Slugs are lower-cased because cache tags are case-sensitive while the URL
 * and the backend's slug resolution are not: without this, a visitor arriving
 * at /business/Salon-X would populate a tag that a `salon-x` webhook payload
 * would never match.
 */

/** Coarse tags — invalidate every listing / brand / website page at once. */
export const BUSINESS_TAG = "business";
export const BRAND_TAG = "brand";
export const WEBSITE_TAG = "website";

/** `idOrSlug` is whatever the URL carried: a location slug or a numeric id. */
export function businessTag(idOrSlug: string): string {
  return `${BUSINESS_TAG}:${idOrSlug.toLowerCase()}`;
}

/** `idOrSlug` is a business (brand) slug or a numeric business id. */
export function brandTag(idOrSlug: string): string {
  return `${BRAND_TAG}:${idOrSlug.toLowerCase()}`;
}

/**
 * The published Website Builder microsite at zavoia.com/<businessSlug>.
 *
 * Keyed by the SAME string as `brandTag` — both pages are addressed by
 * businessSlug (or numeric business id) — so admin-api's `brands` payload
 * flushes both without needing a second array. See the revalidate route.
 */
export function websiteTag(idOrSlug: string): string {
  return `${WEBSITE_TAG}:${idOrSlug.toLowerCase()}`;
}

/**
 * Time-based floor for the listing / brand / website pages, in seconds.
 *
 * This is the safety net, NOT the primary freshness mechanism: if the
 * revalidate webhook is never wired up, misfires, or admin-api forgets a call
 * site, every page still self-heals within this window. The webhook only makes
 * the important cases (publish / unpublish) fast.
 *
 * Route segment `revalidate` exports must be statically analysable, so the
 * pages repeat the literal rather than importing this — keep them in sync.
 */
export const LISTING_REVALIDATE_SECONDS = 600;
