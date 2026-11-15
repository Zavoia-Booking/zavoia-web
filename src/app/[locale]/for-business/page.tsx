import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/i18n/locales";
import { marketingPageContent } from "@/lib/marketing/page-content";
import { marketingStructuredData } from "@/lib/seo/marketing-structured-data";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import { ForBusinessContent } from "@/app/_components/for-business/for-business-content";
import { businessPageMetadata } from "@/app/_components/for-business/metadata";

export const dynamicParams = false;

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const content = marketingPageContent(locale, "for-business");

  // Indexable marketing page — no robots noindex.
  return businessPageMetadata(
    locale,
    "for-business",
    content.name,
    content.description,
  );
}

export default async function ForBusinessPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const content = marketingPageContent(locale, "for-business");
  const jsonLd = marketingStructuredData(locale, "for-business", content);

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <ForBusinessContent locale={locale} faqItems={content.faqItems} />
    </main>
  );
}
