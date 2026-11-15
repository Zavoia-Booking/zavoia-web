import "server-only";
import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { LocaleRouteAlternates } from "@/i18n/locale-navigation";
import { localeHref } from "@/i18n/routes";
import { getPostTranslation } from "@/lib/blog/alternates";
import { categoryLabelKey } from "@/lib/blog/categories";
import { blogBreadcrumbStructuredData } from "@/lib/seo/page-structured-data";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import { collectionItemList } from "@/lib/seo/collection-structured-data";
import { webPageNode } from "@/lib/seo/entities";
import { siteEntities } from "@/lib/seo/site-identity";
import type { BlogTab } from "@/lib/blog/categories";
import { blogIndexHref, paginateBlogPosts, parseBlogQuery, type BlogSearchParams } from "@/lib/blog/listing";
import { OPEN_GRAPH_LOCALES, SITE_URL, defaultSocialImage } from "@/lib/site";
import { listPosts } from "@/sanity/queries";
import { notFoundMetadata } from "@/app/_components/not-found/metadata";
import { BlogList } from "./blog-list";
import { toBlogCardVM } from "./vm";

const loadPosts = cache(listPosts);

/** Metadata and schema describe the same localized archive and page number. */
function archiveCopy(locale: Locale, category: BlogTab, page: number) {
  const { blog } = dictionaries[locale];
  const copy = category === "all"
    ? { seoTitle: blog.listTitle, seoDescription: blog.listDescription }
    : blog.categoryPages[category];
  return {
    title: page > 0 ? `${copy.seoTitle} · ${blog.pageLabel} ${page + 1}` : copy.seoTitle,
    description: copy.seoDescription,
  };
}

/** A category path owns its category; query parameters may only repeat it. */
function archiveQuery(category: BlogTab, searchParams: BlogSearchParams) {
  const query = parseBlogQuery(searchParams);
  if (!query || (query.category !== "all" && query.category !== category)) return null;
  return { category, page: query.page };
}

const resolveArchive = cache(async (locale: Locale, category: BlogTab, page: number) => {
  const posts = await loadPosts();
  const cards = posts.flatMap((post) => {
    const card = toBlogCardVM(post, locale);
    return card ? [card] : [];
  });
  const listing = paginateBlogPosts(cards, category, page);
  if (!listing) return null;

  const translatedListings = LOCALES.map((language) => ({
    language,
    listing: paginateBlogPosts(posts.filter((post) => getPostTranslation(post, language)), category, page),
  }));
  const indexable = category === "all" || listing.total > 0;

  // Empty categories are usable but do not enter the indexed language cluster.
  // Every populated version emits the same reciprocal cluster.
  const languages = indexable ? Object.fromEntries(translatedListings.flatMap((translation) =>
    translation.listing && (category === "all" || translation.listing.total > 0)
      ? [[translation.language, blogIndexHref(translation.language, category, page)]]
      : [],
  )) : {};

  // The language control appends the page query itself. Keep destinations
  // path-only and omit translations without this page of the archive.
  const navigationLanguages = Object.fromEntries(translatedListings.flatMap((translation) =>
    translation.listing ? [[translation.language, blogIndexHref(translation.language, category)]] : [],
  ));
  // Without hydration there is no browser query to append. Provide complete
  // archive URLs to the fallback links, including the current page number.
  const noscriptLanguages = Object.fromEntries(translatedListings.flatMap((translation) =>
    translation.listing ? [[translation.language, blogIndexHref(translation.language, category, page)]] : [],
  ));

  return { listing, indexable, languages, navigationLanguages, noscriptLanguages };
});

/** Shared metadata for the Journal index and its fixed editorial categories. */
export async function archiveMetadata(localeValue: string, category: BlogTab, searchParams: BlogSearchParams): Promise<Metadata> {
  if (!isLocale(localeValue)) return {};
  const locale = localeValue;
  const query = archiveQuery(category, searchParams);
  if (!query) return notFoundMetadata(locale);
  const resolved = await resolveArchive(locale, category, query.page);
  if (!resolved) return notFoundMetadata(locale);
  const { title, description } = archiveCopy(locale, category, query.page);
  const canonical = blogIndexHref(locale, category, query.page);
  const { languages } = resolved;
  const defaultLanguage = languages[DEFAULT_LOCALE] ?? Object.values(languages)[0];

  return {
    title: { absolute: title },
    description,
    ...(!resolved.indexable && { robots: { index: false, follow: true } }),
    alternates: {
      canonical,
      ...(defaultLanguage && { languages: { ...languages, "x-default": defaultLanguage } }),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: "Zavoia",
      locale: OPEN_GRAPH_LOCALES[locale],
      alternateLocale: LOCALES.filter((language) => language !== locale && languages[language])
        .map((language) => OPEN_GRAPH_LOCALES[language]),
      images: [defaultSocialImage(locale)],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultSocialImage(locale)],
    },
  };
}

/** Keep selection, pagination and localized destinations in the server HTML. */
export async function renderBlogArchive(localeValue: string, category: BlogTab, searchParams: BlogSearchParams) {
  if (!isLocale(localeValue)) notFound();
  const locale = localeValue;
  const query = archiveQuery(category, searchParams);
  if (!query) notFound();
  const resolved = await resolveArchive(locale, category, query.page);
  if (!resolved) notFound();
  const { blog } = dictionaries[locale];
  const breadcrumbs = category === "all" ? null : blogBreadcrumbStructuredData([
    { name: blog.heading, path: blogIndexHref(locale) },
    { name: blog[categoryLabelKey(category)], path: blogIndexHref(locale, category, query.page) },
  ]);
  const path = blogIndexHref(locale, category, query.page);
  const pageUrl = `${SITE_URL}${path}`;
  const { title, description } = archiveCopy(locale, category, query.page);
  const { featured, items } = resolved.listing;
  const displayedPosts = featured ? [featured, ...items] : items;
  const itemList = collectionItemList(path, displayedPosts.map((post) => ({
    name: post.title,
    path: localeHref(locale, "blog", post.slug),
  })));
  const breadcrumb = breadcrumbs ? { ...breadcrumbs, "@id": `${pageUrl}#breadcrumb` } : null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      ...siteEntities(),
      webPageNode({
        type: "CollectionPage",
        locale,
        path,
        name: title,
        description,
        breadcrumbId: breadcrumb?.["@id"],
        mainEntityId: itemList?.["@id"],
      }),
      ...(itemList ? [itemList] : []),
      ...(breadcrumb ? [breadcrumb] : []),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <LocaleRouteAlternates
        pathname={blogIndexHref(locale, category)}
        alternates={resolved.navigationLanguages}
        noscriptAlternates={resolved.noscriptLanguages}
        currentLocale={locale}
        label={dictionaries[locale].language.label}
        localeNames={dictionaries[locale].localeNames}
      />
      <BlogList locale={locale} listing={resolved.listing} />
    </>
  );
}
