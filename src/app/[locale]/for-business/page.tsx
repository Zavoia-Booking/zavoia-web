import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { format, formatCount } from "@/i18n/format";
import { TRIAL_DAYS } from "@/lib/marketing/pricing";
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
  const dict = dictionaries[locale];
  const days = formatCount(TRIAL_DAYS, locale, dict.businessMarketing.counts.days);

  // Indexable marketing page — no robots noindex.
  return businessPageMetadata(
    locale,
    "for-business",
    dict.forBusiness.pageTitle,
    format(dict.forBusiness.pageDescription, { days }),
  );
}

export default async function ForBusinessPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <main>
      <ForBusinessContent locale={locale} />
    </main>
  );
}
