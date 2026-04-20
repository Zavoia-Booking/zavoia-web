import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/locales";
import { CITY_ENTRIES, INDUSTRY_ENTRIES } from "@/data/seo";
import { localeHref } from "@/i18n/routes";
import { listPostsForSitemap } from "@/sanity/queries";

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

  return [
    ...homeEntries,
    ...categoryEntries,
    ...blogIndexEntries,
    ...postEntries,
  ];
}
