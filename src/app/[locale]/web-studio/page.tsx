import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, LOCALES, isLocale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { socialMetadata } from "@/lib/site";
import { marketingPageContent } from "@/lib/marketing/page-content";
import { marketingStructuredData } from "@/lib/seo/marketing-structured-data";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import { WebStudioContent } from "@/app/_components/web-studio/web-studio-content";

export function generateStaticParams() {
  return LOCALES.map(locale => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = dictionaries[locale].webStudio;
  const canonical = localeHref(locale, "web-studio");
  return {
    title: t.pageTitle,
    description: t.pageDescription,
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(LOCALES.map(language => [language, localeHref(language, "web-studio")])),
        "x-default": localeHref(DEFAULT_LOCALE, "web-studio"),
      },
    },
    ...socialMetadata(locale, canonical, t.pageTitle, t.pageDescription),
  };
}

/** Authored bilingual examples always show the same verified designs and copy. */
export default async function WebStudioPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const content = marketingPageContent(locale, "web-studio");
  const jsonLd = marketingStructuredData(locale, "web-studio", content);
  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
    <WebStudioContent locale={locale} faqItems={content.faqItems} />
  </main>;
}
