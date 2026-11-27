import { DEFAULT_LOCALE, type Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import type { BrandDetail, TeamMemberBookingBusiness, TeamMemberProfile } from "@/lib/api/marketplace/types";
import { webUrl } from "@/lib/locations/structured-data";
import { businessSameAs } from "@/lib/marketplace/business-profile-links";
import { profileLinkHref } from "@/lib/marketplace/profile-link";
import { professionalHref } from "@/lib/professionals/urls";
import { professionalLanguageLabels } from "@/lib/professionals/languages";
import { getPostModifiedAt, getPostPublishedAt } from "@/lib/blog/dates";
import { SITE_URL } from "@/lib/site";
import { organizationId, siteEntities, websiteId } from "@/lib/seo/site-identity";
import { merchantId, webPageId, webPageNode, type FaqItem } from "./entities";
import { collectionItemList } from "./collection-structured-data";

export { siteEntities, websiteId } from "@/lib/seo/site-identity";
export { serializeJsonLd } from "./json-ld";

function text(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

/**
 * The merchant organization that location pages already name as each branch's
 * parent, with the same id and URL. Ratings stay out: the aggregate mixes
 * venue and professional reviews.
 */
export function brandStructuredData(brand: BrandDetail, locale: Locale, pagePath: string) {
  const name = text(brand.name);
  if (!name) return null;
  const pageUrl = `${SITE_URL}${pagePath}`;
  const description = text(brand.description);
  const logo = webUrl(brand.logo, true);
  const sameAs = businessSameAs(brand);
  const key = encodeURIComponent(text(brand.slug) || String(brand.businessId));
  // Branch cards link to real pages. This payload lacks each location UUID,
  // so the list identifies their pages rather than inventing competing venues.
  const locations = collectionItemList(pagePath, brand.locations.flatMap(location => {
    const locationName = text(location.name);
    return locationName ? [{
      name: locationName,
      path: localeHref(locale, "business", encodeURIComponent(text(location.slug) || String(location.id))),
    }] : [];
  }));
  return {
    "@context": "https://schema.org",
    "@graph": [
      ...siteEntities(),
      {
        "@type": "Organization",
        "@id": merchantId(brand.businessId),
        name,
        url: `${SITE_URL}${localeHref(DEFAULT_LOCALE, "brand", key)}`,
        ...(description && { description }),
        ...(logo && { logo }),
        ...(sameAs.length > 0 && { sameAs }),
      },
      {
        "@type": locations ? "CollectionPage" : "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name,
        inLanguage: locale,
        isPartOf: { "@id": websiteId },
        publisher: { "@id": organizationId },
        about: { "@id": merchantId(brand.businessId) },
        mainEntity: { "@id": locations?.["@id"] ?? merchantId(brand.businessId) },
        ...(description && { description }),
      },
      ...(locations ? [locations] : []),
    ],
  };
}

/** Social keys the profile shows, normalized the way the profile links them. */
const PROFILE_LINK_KEYS = ["instagram", "tiktok", "facebook", "website"] as const;

/**
 * Only what the profile shows: a real name (never the unnamed placeholder),
 * title, portrait, bio, the social links it renders and the businesses it can
 * be booked at. Ratings stay out, as on location pages.
 */
export function professionalStructuredData(
  profile: TeamMemberProfile,
  locale: Locale,
  businesses: readonly TeamMemberBookingBusiness[],
) {
  const name = text(profile.about?.displayName) || text([profile.firstName, profile.lastName].filter(Boolean).join(" "));
  if (!name) return null;
  const pageUrl = `${SITE_URL}${professionalHref(locale, profile.uuid)}`;
  const personId = `${SITE_URL}/#person-${encodeURIComponent(profile.uuid)}`;
  const jobTitle = text(profile.about?.professionalTitle);
  const description = text(profile.about?.aboutMe);
  const image = webUrl(profile.profileImage, true);
  const languages = professionalLanguageLabels(profile.about?.languages ?? [], dictionaries[locale].venueTags.languages)
    .map(value => value.trim()).filter(Boolean);
  const links = profile.about?.socialLinks ?? {};
  const sameAs = [...new Set(PROFILE_LINK_KEYS.flatMap((key) => {
    const url = profileLinkHref(links[key]);
    return url ? [url] : [];
  }))];
  const seenBusinesses = new Set<number>();
  const worksFor = businesses.flatMap((business) => {
    const businessName = text(business.name);
    if (!businessName || seenBusinesses.has(business.id)) return [];
    seenBusinesses.add(business.id);
    return [{ "@type": "Organization", "@id": merchantId(business.id), name: businessName }];
  });
  return {
    "@context": "https://schema.org",
    "@graph": [
      ...siteEntities(),
      {
        "@type": "Person",
        "@id": personId,
        name,
        url: `${SITE_URL}${professionalHref(DEFAULT_LOCALE, profile.uuid)}`,
        mainEntityOfPage: { "@id": `${pageUrl}#webpage` },
        ...(jobTitle && { jobTitle }),
        ...(description && { description }),
        ...(image && { image }),
        ...(languages.length > 0 && { knowsLanguage: languages }),
        ...(sameAs.length > 0 && { sameAs }),
        ...(worksFor.length > 0 && { worksFor }),
      },
      {
        "@type": "ProfilePage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name,
        inLanguage: locale,
        isPartOf: { "@id": websiteId },
        publisher: { "@id": organizationId },
        mainEntity: { "@id": personId },
        ...(description && { description }),
      },
    ],
  };
}

/**
 * The visible post: its headline, summary, byline, publication date and cover.
 * The author is the name in the visible byline; Zavoia stays the publisher.
 * An optional significant-modification date is supplied only after validation.
 */
export function blogPostStructuredData(post: {
  locale: Locale;
  path: string;
  headline: string;
  description?: string;
  articleSection?: string;
  datePublished: string;
  dateModified?: string;
  image?: string | string[];
  author: string | { name: string; url?: string };
  faqItems?: readonly FaqItem[];
  breadcrumbs?: ReturnType<typeof blogBreadcrumbStructuredData>;
}) {
  const headline = text(post.headline);
  if (!headline) return null;
  const pageUrl = `${SITE_URL}${post.path}`;
  const description = text(post.description);
  const articleSection = text(post.articleSection);
  const datePublished = getPostPublishedAt({ publishedAt: post.datePublished });
  const dateModified = datePublished ? getPostModifiedAt({
    publishedAt: post.datePublished, modifiedAt: post.dateModified,
  }) : undefined;
  const images = (Array.isArray(post.image) ? post.image : [post.image])
    .map((image) => webUrl(image)).filter((image): image is string => Boolean(image));
  const author = typeof post.author === "string" ? { name: post.author } : post.author;
  const authorName = text(author.name);
  const authorUrl = webUrl(author.url);
  return {
    "@context": "https://schema.org",
    "@graph": [
      ...siteEntities(),
      webPageNode({
        locale: post.locale, path: post.path, name: headline, description,
        mainEntityId: `${pageUrl}#article`, faqItems: post.faqItems,
        breadcrumbId: post.breadcrumbs?.["@id"],
      }),
      {
        "@type": "BlogPosting",
        "@id": `${pageUrl}#article`,
        headline,
        ...(description && { description }),
        ...(articleSection && { articleSection }),
        ...(authorName && { author: {
          "@type": "Person",
          name: authorName,
          ...(authorUrl && { url: authorUrl }),
        } }),
        ...(datePublished && { datePublished }),
        ...(dateModified && { dateModified }),
        ...(images.length > 0 && { image: [...new Set(images)] }),
        inLanguage: post.locale,
        url: pageUrl,
        mainEntityOfPage: { "@id": webPageId(post.path) },
        isPartOf: { "@id": websiteId },
        publisher: { "@id": organizationId },
      },
      ...(post.breadcrumbs ? [post.breadcrumbs] : []),
    ],
  };
}

/** A graph node for the Journal/category/title relationships visible on the page. */
export function blogBreadcrumbStructuredData(items: { name: string; path: string }[]) {
  if (items.length < 2) return null;
  return {
    "@type": "BreadcrumbList",
    "@id": `${SITE_URL}${items[items.length - 1].path}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
