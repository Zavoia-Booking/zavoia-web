import { dictionaries } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { OPEN_GRAPH_LOCALES, SITE_URL, defaultSocialImage } from "@/lib/site";
import type { BrandDetail as BrandDetailData } from "@/lib/api/marketplace/types";
import { BrandDetail } from "../_components/brand-detail";
import { notFoundMetadata } from "@/app/_components/not-found/metadata";
import { brandStructuredData, serializeJsonLd } from "@/lib/seo/page-structured-data";
import { getBrandPageData } from "./server";

// ISR, same shape as the business detail route. The param is a businessSlug
// (vanity URL) or a numeric business id — non-enumerable, so nothing is
// prerendered at build time and the backend is never called during
// `next build`. Must be a literal to be statically analysable.
export const revalidate = 600;

// Required for ISR even though it enumerates nothing: without a
// `generateStaticParams`, Next treats the route as purely on-demand and never
// gives it a `dynamicRoutes` cache entry. Returning [] means "prerender no
// paths, but cache each one after its first request".
export async function generateStaticParams() {
  return [];
}

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

/**
 * The brand's one address: its short address when it has one, else its
 * number. The page answers on both, and the number points here.
 */
function brandPath(locale: Locale, brand: Pick<BrandDetailData, "slug" | "businessId">): string {
  return localeHref(locale, "brand", encodeURIComponent(brand.slug?.trim() || String(brand.businessId)));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !slug) return {};
  try {
    const brand = await getBrandPageData(slug);
    if (!brand) return notFoundMetadata(locale);
    const t = dictionaries[locale].brandPage;

    const title = format(brand.locations.length > 0 ? t.metaTitle : t.metaTitleProfile, { name: brand.name });
    // Describe this profile's purpose, using the same location condition as its body.
    const description = format(
      brand.locations.length > 0 ? t.metaDescription : t.metaDescriptionProfile,
      { name: brand.name },
    );
    const image = brand.logo?.trim();
    // A logo suits the compact card; without one, the shared brand artwork.
    const socialImage = image ? { url: image, alt: brand.name } : defaultSocialImage(locale);

    // One canonical per locale, the pair declared as alternates — see the
    // business detail route for the reasoning.
    const languages = Object.fromEntries(
      LOCALES.map((l) => [l, brandPath(l, brand)]),
    ) as Record<Locale, string>;

    return {
      title,
      description,
      alternates: {
        canonical: brandPath(locale, brand),
        languages: { ...languages, "x-default": languages[DEFAULT_LOCALE] },
      },
      openGraph: {
        type: "website",
        siteName: "Zavoia",
        title,
        description,
        url: `${SITE_URL}${brandPath(locale, brand)}`,
        locale: OPEN_GRAPH_LOCALES[locale],
        alternateLocale: LOCALES.filter((language) => language !== locale).map((language) => OPEN_GRAPH_LOCALES[language]),
        images: [socialImage],
      },
      twitter: {
        card: image ? "summary" : "summary_large_image",
        title,
        description,
        images: [socialImage],
      },
    };
  } catch {
    // The availability guard propagates operational failures to recovery.
    return {};
  }
}

export default async function BrandPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  if (!slug) notFound();

  const brand = await getBrandPageData(slug);
  if (!brand) notFound();

  // The canonical path, exactly as generateMetadata declares it.
  const jsonLd = brandStructuredData(brand, locale, brandPath(locale, brand));
  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      )}
      <BrandDetail brand={brand} locale={locale} />
    </>
  );
}
