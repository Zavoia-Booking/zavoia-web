import "server-only";

import { getSitemapEntries } from "@/lib/api/marketplace/public";
import type { MarketplaceSitemap } from "@/lib/api/marketplace/types";
import {
  BRAND_TAG,
  BUSINESS_TAG,
  LISTING_REVALIDATE_SECONDS,
  SITEMAP_TAG,
  WEBSITE_TAG,
} from "@/lib/cache/tags";

/**
 * The public URL inventory behind the sitemap. Every consumer uses these exact
 * cache options so they share one cached response and its invalidation tags.
 * Failures reject: the sitemap must not publish an outage as empty inventory.
 */
export function loadSitemapFeed(): Promise<MarketplaceSitemap> {
  return getSitemapEntries({
    revalidate: LISTING_REVALIDATE_SECONDS,
    tags: [SITEMAP_TAG, BUSINESS_TAG, BRAND_TAG, WEBSITE_TAG],
  });
}

/** For optional links: a failed or slow feed resolves to null instead of failing the page. */
export async function getOptionalSitemapFeed(): Promise<MarketplaceSitemap | null> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      loadSitemapFeed().catch(() => null),
      new Promise<null>((resolve) => { timeout = setTimeout(() => resolve(null), 2000); }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}
