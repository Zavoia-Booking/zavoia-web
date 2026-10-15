import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { CITY_ENTRIES, listTaxonomy, slugifyRo } from "@/data/seo";
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
  const taxonomy = listTaxonomy(industries, DEFAULT_LOCALE);
  const industryById = new Map(industries.map((industry) => [industry.id, industry.slug]));
  const tagById = new Map(taxonomy.flatMap((entry) => entry.kind === "tag" ? [[entry.tagId, entry.id] as const] : []));
  const eligible = new Map<string, Set<string>>();

  for (const location of marketplace.locations) {
    const category = location.category;
    if (!category?.city) continue;
    // Match actual indexed city names against configured aliases. Visitor
    // geolocation/country fallbacks must never invent inventory for a city.
    const cityKey = slugifyRo(category.city);
    const city = CITY_ENTRIES.find((candidate) =>
      [candidate.id, ...Object.values(candidate.name), ...Object.values(candidate.slug)]
        .some((alias) => slugifyRo(alias) === cityKey),
    );
    if (!city) continue;
    const entries = eligible.get(city.id) ?? new Set<string>();
    const industry = category.industryId == null ? undefined : industryById.get(category.industryId);
    if (industry) entries.add(industry);
    for (const tagId of category.tagIds) {
      const tag = tagById.get(tagId);
      if (tag) entries.add(tag);
    }
    eligible.set(city.id, entries);
  }

  const taxonomyByLocale = Object.fromEntries(
    LOCALES.map((locale) => [locale, new Map(listTaxonomy(industries, locale).map((entry) => [entry.id, entry]))]),
  ) as Record<Locale, Map<string, (typeof taxonomy)[number]>>;

  return CITY_ENTRIES.flatMap((city) =>
    [...(eligible.get(city.id) ?? [])].sort().flatMap((id) => {
      const languages = Object.fromEntries(LOCALES.flatMap((locale) => {
        const entry = taxonomyByLocale[locale].get(id);
        return entry ? [[locale, abs(localeHref(locale, city.slug[locale], entry.slug))]] : [];
      }));
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

  return [
    ...homeEntries,
    ...industryDirectoryEntries,
    ...categoryEntries(marketplace, industries),
    ...listingEntries,
    ...websiteEntries,
    ...brandEntries,
    ...blogIndexEntries,
    ...postEntries,
    ...legalEntries,
  ];
}
