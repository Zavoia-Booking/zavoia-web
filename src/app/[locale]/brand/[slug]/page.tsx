import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { getBrand } from "@/lib/api/marketplace/public";
import { BRAND_TAG, brandTag } from "@/lib/cache/tags";
import type { BrandDetail as BrandDetailData } from "@/lib/api/marketplace/types";
import { BrandDetail } from "../_components/brand-detail";
import { BusinessNotFound } from "../../business/_components/business-not-found";

// ISR, same shape as the business detail route. The param is a businessSlug
// (vanity URL) or a numeric business id — non-enumerable, so nothing is
// prerendered at build time and the backend is never called during
// `next build`. Must be a literal to be statically analysable.
export const revalidate = 300;

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
  revalidate: 300,
  tags: [BRAND_TAG, brandTag(slug)],
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { locale, slug } = await params;
    if (!isLocale(locale)) return {};
    if (!slug) return {};
    const brand = await getBrand(slug, BRAND_CACHE(slug));
    return {
      title: brand.name,
      description: brand.tagline ?? brand.description ?? undefined,
      robots: { index: false, follow: true },
    };
  } catch {
    return {};
  }
}

export default async function BrandPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  if (!slug) notFound();

  // Build-safety: a failed/absent backend renders the not-found state rather
  // than crashing the route.
  let brand: BrandDetailData | null = null;
  try {
    brand = await getBrand(slug, BRAND_CACHE(slug));
  } catch {
    brand = null;
  }

  if (!brand) return <BusinessNotFound locale={locale} />;

  return <BrandDetail brand={brand} locale={locale} />;
}
