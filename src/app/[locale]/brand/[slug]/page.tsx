import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { SITE_URL } from "@/lib/site";
import { ApiError } from "@/lib/api/http";
import { getBrand } from "@/lib/api/marketplace/public";
import { BRAND_TAG, brandTag } from "@/lib/cache/tags";
import type { BrandDetail as BrandDetailData } from "@/lib/api/marketplace/types";
import { BrandDetail } from "../_components/brand-detail";
import { BusinessNotFound } from "../../business/_components/business-not-found";

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

const BRAND_CACHE = (slug: string) => ({
  revalidate: 600,
  tags: [BRAND_TAG, brandTag(slug)],
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { locale, slug } = await params;
    if (!isLocale(locale)) return {};
    if (!slug) return {};
    const brand = await getBrand(slug, BRAND_CACHE(slug));

    const title = brand.name;
    const description = brand.tagline ?? brand.description ?? undefined;
    const image = brand.heroImageUrl ?? brand.logo ?? undefined;

    // One canonical per locale, the pair declared as alternates — see the
    // business detail route for the reasoning.
    const languages = Object.fromEntries(
      LOCALES.map((l) => [l, localeHref(l, "brand", slug)]),
    ) as Record<Locale, string>;

    return {
      title,
      description,
      alternates: {
        canonical: localeHref(locale, "brand", slug),
        languages: { ...languages, "x-default": languages[DEFAULT_LOCALE] },
      },
      openGraph: {
        type: "website",
        title,
        description,
        url: `${SITE_URL}${localeHref(locale, "brand", slug)}`,
        images: image ? [image] : undefined,
      },
    };
  } catch (error) {
    // Dead slug → the not-found state below, which needs an explicit noindex.
    if (error instanceof ApiError && error.status === 404) {
      return { robots: { index: false, follow: false } };
    }
    return {};
  }
}

export default async function BrandPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  if (!slug) notFound();

  // Cached render: an upstream 404 is the real "no such brand" answer and is
  // cached as the not-found state (noindexed via generateMetadata); every other
  // failure is rethrown so an outage is never cached as "not found". Same split
  // as the business detail route.
  let brand: BrandDetailData;
  try {
    brand = await getBrand(slug, BRAND_CACHE(slug));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return <BusinessNotFound locale={locale} />;
    }
    throw error;
  }

  return <BrandDetail brand={brand} locale={locale} />;
}
