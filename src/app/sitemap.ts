import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { professionalHref } from "@/lib/professionals/urls";
import { getCategoryAlternates } from "@/data/seo";
import { getCategoryDiscoveryGroups } from "@/lib/seo/category-discovery";
import { listPostsForSitemap } from "@/sanity/queries";
import { getPostAlternates, getPostTranslation } from "@/lib/blog/alternates";
import { CATEGORY_ORDER } from "@/lib/blog/categories";
import { categoryPath } from "@/lib/blog/category-routes";
import { getPostModifiedAt } from "@/lib/blog/dates";
import { getIndustries } from "@/lib/api/marketplace/public";
import { loadSitemapFeed } from "@/lib/seo/sitemap-feed.server";
import { webUrl } from "@/lib/locations/structured-data";
import type { Industry, MarketplaceSitemap } from "@/lib/api/marketplace/types";

// The marketplace URL families are live data, so this file is no longer a
// build-time constant. Public-page invalidations expire its inventory tag and
// route; the interval is a fallback for edits whose webhook was not delivered.
export const revalidate = 600;

/**
 * An upstream failure is not an empty public inventory. Let Next preserve the
 * last successful regeneration, or fail a cold request, rather than publish a
 * successful sitemap that has silently lost every marketplace URL.
 */
function loadMarketplaceEntries(): Promise<MarketplaceSitemap> {
  return loadSitemapFeed();
}

// A failed CMS query must not replace the last good sitemap with missing posts.
function loadBlogEntries(): Promise<
  Awaited<ReturnType<typeof listPostsForSitemap>>
> {
  return listPostsForSitemap();
}

// Taxonomy failures must preserve the last good sitemap too; an outage is not
// evidence that every city/category destination has disappeared.
function loadIndustries(): Promise<Industry[]> {
  return getIndustries();
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

/** Public photo URLs for an image sitemap entry. Next writes each one into the
 * XML verbatim, so a query string's "&" must arrive already escaped.
 */
function sitemapImages(values: string[] | undefined): string[] {
  const urls = (values ?? []).map((value) => webUrl(value, true)).filter((url): url is string => Boolean(url));
  return [...new Set(urls)].map((url) => url
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;"));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const homeLanguages = Object.fromEntries(
    LOCALES.map((l) => [l, abs(localeHref(l))]),
  ) as Record<Locale, string>;

  const homeEntries: MetadataRoute.Sitemap = LOCALES.map((locale) => ({
    url: abs(localeHref(locale)),
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
    alternates: {
      languages: {
        ...industryDirectoryLanguages,
        "x-default": industryDirectoryLanguages[DEFAULT_LOCALE],
      },
    },
  }));

  // The business marketing pages and the help centre share one route in both languages.
  const businessEntries: MetadataRoute.Sitemap = (["for-business", "pricing", "web-studio", "help"] as const).flatMap((segment) => {
    const languages = Object.fromEntries(
      LOCALES.map((l) => [l, abs(localeHref(l, segment))]),
    ) as Record<Locale, string>;
    return LOCALES.map((locale) => ({
      url: languages[locale],
      alternates: { languages: { ...languages, "x-default": languages[DEFAULT_LOCALE] } },
    }));
  });

  const blogIndexLanguages = Object.fromEntries(
    LOCALES.map((l) => [l, abs(localeHref(l, "blog"))]),
  ) as Record<Locale, string>;

  const blogIndexEntries: MetadataRoute.Sitemap = LOCALES.map((locale) => ({
    url: abs(localeHref(locale, "blog")),
    alternates: {
      languages: {
        ...blogIndexLanguages,
        "x-default": blogIndexLanguages[DEFAULT_LOCALE],
      },
    },
  }));

  const posts = await loadBlogEntries();
  const blogCategoryEntries: MetadataRoute.Sitemap = CATEGORY_ORDER.flatMap((category) => {
    const languages = Object.fromEntries(LOCALES.flatMap((locale) =>
      posts.some((post) => post.category === category && getPostTranslation(post, locale))
        ? [[locale, abs(categoryPath(locale, category))]]
        : [],
    ));
    const fallback = languages[DEFAULT_LOCALE] ?? Object.values(languages)[0];
    if (!fallback) return [];

    return Object.values(languages).map((url) => ({
      url,
      // Post dates do not establish when the category's introductory copy changed.
      alternates: { languages: { ...languages, "x-default": fallback } },
    }));
  });
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
        lastModified: new Date(getPostModifiedAt(post) ?? post.publishedAt),
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

  // Marketplace URLs. These render identical content under both locales (the
  // data is the same; only the chrome is translated), so each URL is listed
  // once per locale with the pair declared as alternates — never as two
  // competing canonicals.
  const [marketplace, industries] = await Promise.all([loadMarketplaceEntries(), loadIndustries()]);

  const localizedEntries = (
    entries: typeof marketplace.locations,
    toPath: (locale: Locale, slug: string) => string,
    includeLastModified = true,
  ): MetadataRoute.Sitemap =>
    entries.flatMap((entry) => {
      const languages = Object.fromEntries(
        LOCALES.map((l) => [l, abs(toPath(l, entry.slug))]),
      ) as Record<Locale, string>;
      // Both languages show the same gallery, including photos only the viewer opens.
      const images = sitemapImages(entry.images);
      return LOCALES.map((locale) => ({
        url: abs(toPath(locale, entry.slug)),
        ...(includeLastModified ? { lastModified: new Date(entry.updatedAt) } : {}),
        alternates: {
          languages: {
            ...languages,
            "x-default": languages[DEFAULT_LOCALE],
          },
        },
        ...(images.length > 0 && { images }),
      }));
    });

  const listingEntries = localizedEntries(
    marketplace.locations,
    (locale, slug) => localeHref(locale, "business", slug),
    // The location row does not establish the last significant change across
    // all of its services, team and brand data. Omit an unproven page timestamp.
    false,
  );

  const brandEntries = localizedEntries(
    marketplace.brands,
    (locale, slug) => localeHref(locale, "brand", slug),
    // business.updatedAt does not cover the displayed listing, locations or team.
    false,
  );

  const websiteEntries = localizedEntries(
    marketplace.websites,
    (locale, slug) => localeHref(locale, slug),
    // The publish timestamp does not cover subsequent live catalogue/review edits.
    false,
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

  // The legal directory and all policy documents are noindex, regardless of status.
  return [
    ...homeEntries,
    ...industryDirectoryEntries,
    ...businessEntries,
    ...categoryEntries(marketplace, industries),
    ...listingEntries,
    ...websiteEntries,
    ...brandEntries,
    ...professionalEntries,
    ...blogIndexEntries,
    ...blogCategoryEntries,
    ...postEntries,
  ];
}
