import { splitAboutContent } from "@/features/website/components/builder/aboutContent";
import { localized } from "@/features/website/components/builder/preview/shared/util";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import type { PublicWebsite } from "@/lib/api/marketplace/types";
import { webUrl } from "@/lib/locations/structured-data";
import { merchantId, webPageNode } from "@/lib/seo/entities";
import { siteEntities } from "@/lib/seo/site-identity";
import { SITE_URL } from "@/lib/site";

function text(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

/**
 * Describe the published page and the same merchant named by its brand and
 * location pages. Only visible About copy, FAQ pairs and footer contacts are included.
 * The website projection lacks the locations' stable public UUIDs, so it must
 * not invent separate LocalBusiness identities from their numeric editor IDs.
 */
export function websiteStructuredData(site: PublicWebsite, locale: Locale, pagePath: string) {
  const name = text(site.identity.name);
  if (!name) return null;
  const layout = site.website.pageLayout ?? [];
  const visibleContent = layout.filter((entry) => entry.visible
    && entry.type !== "announcement" && entry.type !== "nav" && entry.type !== "footer");
  const footerVisible = visibleContent.length > 0
    && !layout.some((entry) => entry.type === "footer" && !entry.visible);
  const navVisible = visibleContent.length > 0
    && !layout.some((entry) => entry.type === "nav" && !entry.visible);
  const footer = layout.find((entry) => entry.type === "footer");
  // The navigation always uses the merchant logo. Of the footer variants,
  // only Directory renders the image; unknown/retired variants fall back to it.
  const directoryFooter = !["editorial", "signature", "masthead", "marque"].includes(footer?.variant ?? "");
  const logoVisible = navVisible || (footerVisible && directoryFooter && footer?.config?.showLogo !== false);
  const logo = logoVisible ? webUrl(site.identity.logo, true) : undefined;
  const about = layout.find((entry) => entry.type === "about" && entry.visible);
  const copy = splitAboutContent(site.website.aboutContent ?? "");
  const description = about ? text([
    about.config?.headlineHidden === true ? undefined : text(copy.title),
    text(copy.body),
  ].filter(Boolean).join("\n\n")) : undefined;
  const email = footerVisible ? text(site.identity.email) : undefined;
  // Match the public renderer's field-by-field language fallback. A populated
  // snapshot is insufficient: the FAQ section must also be in the visible layout.
  const faqItems = visibleContent.some((entry) => entry.type === "faq")
    ? (site.website.faq ?? []).flatMap((item) => {
        const q = text(localized(item.q, locale));
        const a = text(localized(item.a, locale));
        return q && a ? [{ q, a }] : [];
      })
    : [];
  const sameAs = footerVisible ? [...new Set([
    site.identity.instagramUrl, site.identity.facebookUrl,
    site.identity.tiktokUrl, site.identity.pinterestUrl,
    // Marque shows social profiles and email, but has no website contact link.
    footer?.variant !== "marque" ? site.identity.websiteUrl : undefined,
  ].flatMap((value) => {
    const source = text(value);
    const url = source ? webUrl(/^https?:\/\//i.test(source) ? source : `https://${source}`) : undefined;
    return url ? [url] : [];
  }))] : [];
  const businessId = merchantId(site.businessId);

  return {
    "@context": "https://schema.org",
    "@graph": [
      ...siteEntities(),
      {
        "@type": "Organization",
        "@id": businessId,
        name,
        // A website can be published independently of its marketplace profile.
        url: `${SITE_URL}${localeHref(DEFAULT_LOCALE, encodeURIComponent(site.slug))}`,
        ...(description && { description }),
        ...(logo && { logo }),
        ...(email && { email }),
        ...(sameAs.length > 0 && { sameAs }),
      },
      webPageNode({
        locale,
        path: pagePath,
        name,
        description,
        mainEntityId: businessId,
        publisherId: businessId,
        faqItems,
      }),
    ],
  };
}
