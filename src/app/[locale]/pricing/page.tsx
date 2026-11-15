import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/i18n/locales";
import { marketingPageContent } from "@/lib/marketing/page-content";
import { marketingStructuredData } from "@/lib/seo/marketing-structured-data";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import { businessPageMetadata } from "@/app/_components/for-business/metadata";
import { PricingContent } from "./_components/pricing-content";

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const content = marketingPageContent(locale, "pricing");

  return businessPageMetadata(
    locale,
    "pricing",
    content.name,
    content.description,
  );
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const content = marketingPageContent(locale, "pricing");
  const jsonLd = marketingStructuredData(locale, "pricing", content);

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
    <PricingContent locale={locale} faqItems={content.faqItems} />
  </>;
}
