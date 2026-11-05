import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import type { BrandDetail, TeamMemberBookingBusiness, TeamMemberProfile } from "@/lib/api/marketplace/types";
import { webUrl } from "@/lib/locations/structured-data";
import { professionalHref } from "@/lib/professionals/urls";
import { SITE_URL } from "@/lib/site";

// Shared node ids: location pages and the homepage describe these same entities.
const organizationId = `${SITE_URL}/#organization`;
const websiteId = `${SITE_URL}/#website`;
const merchantId = (businessId: number) => `${SITE_URL}/#business-${businessId}`;

function text(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

/** Zavoia and its website, exactly as the homepage and location pages describe them. */
function siteEntities() {
  return [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: "Zavoia",
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/brand/wordmark-cropped.png`,
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: "Zavoia",
      url: `${SITE_URL}/`,
      inLanguage: [...LOCALES],
      publisher: { "@id": organizationId },
    },
  ];
}

/** Safe inside a native application/ld+json script, including merchant- and editor-supplied text. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
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
  const key = encodeURIComponent(text(brand.slug) || String(brand.businessId));
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
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name,
        inLanguage: locale,
        isPartOf: { "@id": websiteId },
        publisher: { "@id": organizationId },
        about: { "@id": merchantId(brand.businessId) },
      },
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
  const links = profile.about?.socialLinks ?? {};
  const sameAs = [...new Set(PROFILE_LINK_KEYS.flatMap((key) => {
    const value = text(links[key]);
    const url = value ? webUrl(/^https?:\/\//i.test(value) ? value : `https://${value}`) : undefined;
    return url ? [url] : [];
  }))];
  const worksFor = businesses.flatMap((business) => {
    const businessName = text(business.name);
    return businessName ? [{ "@type": "Organization", "@id": merchantId(business.id), name: businessName }] : [];
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
        ...(jobTitle && { jobTitle }),
        ...(description && { description }),
        ...(image && { image }),
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
      },
    ],
  };
}

/**
 * The visible post: its headline, summary, publication date and cover. Sanity
 * holds no author or significant-modification date, so neither is claimed.
 */
export function blogPostStructuredData(post: {
  locale: Locale;
  path: string;
  headline: string;
  description?: string;
  datePublished: string;
  image?: string;
}) {
  const headline = text(post.headline);
  if (!headline) return null;
  const pageUrl = `${SITE_URL}${post.path}`;
  const description = text(post.description);
  const image = webUrl(post.image);
  return {
    "@context": "https://schema.org",
    "@graph": [
      ...siteEntities(),
      {
        "@type": "BlogPosting",
        "@id": `${pageUrl}#article`,
        headline,
        ...(description && { description }),
        datePublished: post.datePublished,
        ...(image && { image: [image] }),
        inLanguage: post.locale,
        url: pageUrl,
        mainEntityOfPage: pageUrl,
        isPartOf: { "@id": websiteId },
        publisher: { "@id": organizationId },
      },
    ],
  };
}
