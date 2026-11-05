import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { format, formatCount } from "@/i18n/format";
import { formatPrice, getPlanPricing } from "@/lib/marketing/pricing";
import { businessPageMetadata } from "@/app/_components/for-business/metadata";
import { PricingContent } from "./_components/pricing-content";

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = dictionaries[locale];
  const pricing = getPlanPricing(locale);

  return businessPageMetadata(
    locale,
    "pricing",
    dict.pricing.pageTitle,
    format(dict.pricing.pageDescription, {
      base: formatPrice(pricing.plans.base.monthly, pricing.currency),
      plus: formatPrice(pricing.plans.plus.monthly, pricing.currency),
      seat: formatPrice(pricing.teamMember, pricing.currency),
      days: formatCount(pricing.trialDays, locale, dict.businessMarketing.counts.days),
    }),
  );
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <PricingContent locale={locale} />;
}
