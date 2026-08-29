import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/locales";
import { CITY_ENTRIES, INDUSTRY_ENTRIES } from "@/data/seo";
import { localeHref } from "@/i18n/routes";
import { listPostsForSitemap } from "@/sanity/queries";
import { LEGAL_DOCUMENTS } from "@/data/legal";
import { getSitemapEntries } from "@/lib/api/marketplace/public";
import {
  BRAND_TAG,
  BUSINESS_TAG,
  LISTING_REVALIDATE_SECONDS,
  WEBSITE_TAG,
} from "@/lib/cache/tags";
import type { MarketplaceSitemap } from "@/lib/api/marketplace/types";

// The marketplace URL families are live data, so this file is no longer a
// build-time constant: it is regenerated on the same cadence as the pages it
// advertises, and the same publish/unpublish webhook that flushes a listing
// flushes this too (the fetch carries all three coarse tags).
export const revalidate = 600;

const EMPTY_SITEMAP: MarketplaceSitemap = {
  locations: [],
  brands: [],
  websites: [],
};

/**
 * A crawler must never be sent to a page that 404s, but a sitemap that fails to
 * build must not take the whole file down either: an unreachable backend
 * degrades to the static marketing URLs rather than throwing.
 */
async function loadMarketplaceEntries(): Promise<MarketplaceSitemap> {
  try {
    return await getSitemapEntries({
      revalidate: LISTING_REVALIDATE_SECONDS,
      tags: [BUSINESS_TAG, BRAND_TAG, WEBSITE_TAG],
    });
  } catch {
    return EMPTY_SITEMAP;
  }
}

function abs(path: string): string {
  return `${SITE_URL}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const homeLanguages = Object.fromEntries(
    LOCALES.map((l) => [l, abs(localeHref(l))]),
  ) as Record<Locale, string>;

  const homeEntries: MetadataRoute.Sitemap = LOCALES.map((locale) => ({
    url: abs(localeHref(locale)),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 1,
    alternates: {
      languages: {
        ...homeLanguages,
        "x-default": homeLanguages[DEFAULT_LOCALE],
      },
    },
  }));

  const categoryEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    CITY_ENTRIES.flatMap((city) =>
      INDUSTRY_ENTRIES.map((industry) => {
        const languages = Object.fromEntries(
          LOCALES.map((l) => [
            l,
            abs(localeHref(l, city.slug[l], industry.slug[l])),
          ]),
        ) as Record<Locale, string>;
        return {
          url: abs(
            localeHref(locale, city.slug[locale], industry.slug[locale]),
          ),
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.8,
          alternates: {
            languages: {
              ...languages,
              "x-default": languages[DEFAULT_LOCALE],
            },
          },
        };
      }),
    ),
  );

  const blogIndexLanguages = Object.fromEntries(
    LOCALES.map((l) => [l, abs(localeHref(l, "blog"))]),
  ) as Record<Locale, string>;

  const blogIndexEntries: MetadataRoute.Sitemap = LOCALES.map((locale) => ({
    url: abs(localeHref(locale, "blog")),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
    alternates: {
      languages: {
        ...blogIndexLanguages,
        "x-default": blogIndexLanguages[DEFAULT_LOCALE],
      },
    },
  }));

  const posts = await listPostsForSitemap();
  const postEntries: MetadataRoute.Sitemap = posts.flatMap((post) => {
    const languages: Partial<Record<Locale, string>> = {};
    for (const l of LOCALES) {
      const slug = post.slug[l]?.current;
      if (slug) languages[l] = abs(localeHref(l, "blog", slug));
    }

    const entries: MetadataRoute.Sitemap = [];
    for (const locale of LOCALES) {
      const slug = post.slug[locale]?.current;
      if (!slug) continue;
      entries.push({
        url: abs(localeHref(locale, "blog", slug)),
        lastModified: new Date(post.publishedAt),
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: {
          languages: {
            ...(languages as Record<Locale, string>),
            "x-default": languages[DEFAULT_LOCALE] ?? abs(localeHref(locale, "blog", slug)),
          },
        },
      });
    }
    return entries;
  });

  const legalHubLanguages = Object.fromEntries(
    LOCALES.map((l) => [l, abs(localeHref(l, "terms"))]),
  ) as Record<Locale, string>;

  const legalEntries: MetadataRoute.Sitemap = [
    ...LOCALES.map((locale) => ({
      url: abs(localeHref(locale, "terms")),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.4,
      alternates: {
        languages: {
          ...legalHubLanguages,
          "x-default": legalHubLanguages[DEFAULT_LOCALE],
        },
      },
    })),
    ...LOCALES.flatMap((locale) =>
      LEGAL_DOCUMENTS.map((doc) => {
        const languages = Object.fromEntries(
          LOCALES.map((l) => [l, abs(localeHref(l, "terms", doc.slug))]),
        ) as Record<Locale, string>;
        return {
          url: abs(localeHref(locale, "terms", doc.slug)),
          lastModified: now,
          changeFrequency: "monthly" as const,
          priority: 0.3,
          alternates: {
            languages: {
              ...languages,
              "x-default": languages[DEFAULT_LOCALE],
            },
          },
        };
      }),
    ),
  ];

  // Marketplace URLs. These render identical content under both locales (the
  // data is the same; only the chrome is translated), so each URL is listed
  // once per locale with the pair declared as alternates — never as two
  // competing canonicals.
  const marketplace = await loadMarketplaceEntries();

  const localizedEntries = (
    entries: typeof marketplace.locations,
    toPath: (locale: Locale, slug: string) => string,
    priority: number,
    changeFrequency: "daily" | "weekly" | "monthly",
  ): MetadataRoute.Sitemap =>
    entries.flatMap((entry) => {
      const languages = Object.fromEntries(
        LOCALES.map((l) => [l, abs(toPath(l, entry.slug))]),
      ) as Record<Locale, string>;
      const lastModified = new Date(entry.updatedAt);
      return LOCALES.map((locale) => ({
        url: abs(toPath(locale, entry.slug)),
        lastModified,
        changeFrequency,
        priority,
        alternates: {
          languages: {
            ...languages,
            "x-default": languages[DEFAULT_LOCALE],
          },
        },
      }));
    });

  const listingEntries = localizedEntries(
    marketplace.locations,
    (locale, slug) => localeHref(locale, "business", slug),
    0.9,
    "weekly",
  );

  const brandEntries = localizedEntries(
    marketplace.brands,
    (locale, slug) => localeHref(locale, "brand", slug),
    0.7,
    "weekly",
  );

  const websiteEntries = localizedEntries(
    marketplace.websites,
    (locale, slug) => localeHref(locale, slug),
    0.8,
    "weekly",
  );

  return [
    ...homeEntries,
    ...categoryEntries,
    ...listingEntries,
    ...websiteEntries,
    ...brandEntries,
    ...blogIndexEntries,
    ...postEntries,
    ...legalEntries,
  ];
}
