import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { professionalHref } from "@/lib/professionals/urls";
import { getCategoryAlternates } from "@/data/seo";
import { getCategoryDiscoveryGroups } from "@/lib/seo/category-discovery";
import { listPostsForSitemap } from "@/sanity/queries";
import { getPostAlternates } from "@/lib/blog/alternates";
import { LEGAL_DOCUMENTS } from "@/data/legal";
import { getIndustries, getSitemapEntries } from "@/lib/api/marketplace/public";
import {
  BRAND_TAG,
  BUSINESS_TAG,
  LISTING_REVALIDATE_SECONDS,
  WEBSITE_TAG,
} from "@/lib/cache/tags";
import type { Industry, MarketplaceSitemap } from "@/lib/api/marketplace/types";

// The marketplace URL families are live data, so this file is no longer a
// build-time constant: it is regenerated on the same cadence as the pages it
// advertises, and the same publish/unpublish webhook that flushes a listing
// flushes this too (the fetch carries all three coarse tags).
export const revalidate = 600;

const EMPTY_SITEMAP: MarketplaceSitemap = {
  locations: [],
  brands: [],
  websites: [],
  professionals: [],
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

// Same degrade-not-fail contract as `loadMarketplaceEntries` above, applied
// to the Sanity fetch: a blip there previously took the whole `/sitemap.xml`
// down with it (no `.catch`) instead of just omitting the blog URLs.
async function loadBlogEntries(): Promise<
  Awaited<ReturnType<typeof listPostsForSitemap>>
> {
  try {
    return await listPostsForSitemap();
  } catch {
    return [];
  }
}

async function loadIndustries(): Promise<Industry[]> {
  try {
    return await getIndustries();
  } catch {
    return [];
  }
}

/** Advertise only city/taxonomy combinations supported by a searchable location.
 * Reuses the existing sitemap feed and taxonomy request; no per-city searches.
 */
function categoryEntries(marketplace: MarketplaceSitemap, industries: Industry[]): MetadataRoute.Sitemap {
  const groups = getCategoryDiscoveryGroups(marketplace.locations, industries, DEFAULT_LOCALE);
  return groups.flatMap((city) =>
    city.entries.flatMap((entry) => {
      const languages = Object.fromEntries(Object.entries(
        getCategoryAlternates(industries, city.id, entry.id),
      ).map(([locale, path]) => [locale, abs(path)]));
      return LOCALES.flatMap((locale) => languages[locale] ? [{
        url: languages[locale],
        // The feed cannot establish the category's last significant change.
        // An omitted date is more accurate than regeneration time.
        alternates: { languages: { ...languages, "x-default": languages[DEFAULT_LOCALE] } },
      }] : []);
    }),
  );
}

function abs(path: string): string {
  return `${SITE_URL}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const homeLanguages = Object.fromEntries(
    LOCALES.map((l) => [l, abs(localeHref(l))]),
  ) as Record<Locale, string>;

  const homeEntries: MetadataRoute.Sitemap = LOCALES.map((locale) => ({
    url: abs(localeHref(locale)),
    changeFrequency: "weekly",
    priority: 1,
    alternates: {
      languages: {
        ...homeLanguages,
        "x-default": homeLanguages[DEFAULT_LOCALE],
      },
    },
  }));

  const industryDirectoryLanguages = Object.fromEntries(
    LOCALES.map((l) => [l, abs(localeHref(l, "industries"))]),
  );
  const industryDirectoryEntries: MetadataRoute.Sitemap = LOCALES.map((locale) => ({
    url: abs(localeHref(locale, "industries")),
    changeFrequency: "weekly",
    priority: 0.7,
    alternates: {
      languages: {
        ...industryDirectoryLanguages,
        "x-default": industryDirectoryLanguages[DEFAULT_LOCALE],
      },
    },
  }));

  const blogIndexLanguages = Object.fromEntries(
    LOCALES.map((l) => [l, abs(localeHref(l, "blog"))]),
  ) as Record<Locale, string>;

  const blogIndexEntries: MetadataRoute.Sitemap = LOCALES.map((locale) => ({
    url: abs(localeHref(locale, "blog")),
    changeFrequency: "weekly",
    priority: 0.7,
    alternates: {
      languages: {
        ...blogIndexLanguages,
        "x-default": blogIndexLanguages[DEFAULT_LOCALE],
      },
    },
  }));

  const posts = await loadBlogEntries();
  const postEntries: MetadataRoute.Sitemap = posts.flatMap((post) => {
    const alternates = getPostAlternates(post);
    const languages = Object.fromEntries(
      Object.entries(alternates).map(([language, path]) => [language, abs(path)]),
    );

    const entries: MetadataRoute.Sitemap = [];
    for (const locale of LOCALES) {
      const path = alternates[locale];
      if (!path) continue;
      entries.push({
        url: abs(path),
        lastModified: new Date(post.publishedAt),
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: {
          languages: {
            ...languages,
            "x-default": languages[DEFAULT_LOCALE] ?? abs(path),
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
  const [marketplace, industries] = await Promise.all([loadMarketplaceEntries(), loadIndustries()]);

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

  const professionalEntries: MetadataRoute.Sitemap = (marketplace.professionals ?? []).flatMap(({ uuid }) => {
    const languages = Object.fromEntries(
      LOCALES.map((locale) => [locale, abs(professionalHref(locale, uuid))]),
    ) as Record<Locale, string>;
    // No single profile timestamp accounts for changes to reviews and venues.
    // Omit lastModified rather than imply that sitemap regeneration is an edit.
    return LOCALES.map((locale) => ({
      url: languages[locale],
      alternates: { languages: { ...languages, "x-default": languages[DEFAULT_LOCALE] } },
    }));
  });

  return [
    ...homeEntries,
    ...industryDirectoryEntries,
    ...categoryEntries(marketplace, industries),
    ...listingEntries,
    ...websiteEntries,
    ...brandEntries,
    ...professionalEntries,
    ...blogIndexEntries,
    ...postEntries,
    ...legalEntries,
  ];
}
