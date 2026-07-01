import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
  type Locale,
} from "@/i18n/locales";
import { dictionaries, format } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { getPricing } from "@/lib/marketing/pricing";
import { PricingContent } from "./_components/pricing-content";

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = dictionaries[locale];
  const pricing = getPricing(locale);

  const languages = Object.fromEntries(
    LOCALES.map((l) => [l, localeHref(l, "pricing")]),
  ) as Record<Locale, string>;

  return {
    title: dict.pricing.pageTitle,
    description: format(dict.pricing.pageDescription, {
      monthly: String(pricing.monthly),
    }),
    alternates: {
      canonical: localeHref(locale, "pricing"),
      languages: {
        ...languages,
        "x-default": localeHref(DEFAULT_LOCALE, "pricing"),
      },
    },
  };
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <PricingContent locale={locale} />;
}
