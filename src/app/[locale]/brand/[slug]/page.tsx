import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/i18n/locales";
import { getBrand } from "@/lib/api/marketplace/public";
import type { BrandDetail as BrandDetailData } from "@/lib/api/marketplace/types";
import { BrandDetail } from "../_components/brand-detail";
import { BusinessNotFound } from "../../business/_components/business-not-found";

// Live marketplace data: never statically prerender (the backend may be down
// during `next build`). The route param is a businessSlug (vanity URL); the
// backend also resolves a numeric business id.
export const dynamic = "force-dynamic";

export const dynamicParams = true;

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { locale, slug } = await params;
    if (!isLocale(locale)) return {};
    if (!slug) return {};
    const brand = await getBrand(slug);
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
    brand = await getBrand(slug);
  } catch {
    brand = null;
  }

  if (!brand) return <BusinessNotFound locale={locale} />;

  return <BrandDetail brand={brand} locale={locale} />;
}
