import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
  type Locale,
} from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { ForBusinessContent } from "@/app/_components/for-business/for-business-content";

export const dynamicParams = false;

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = dictionaries[locale];

  const languages = Object.fromEntries(
    LOCALES.map((l) => [l, localeHref(l, "for-business")]),
  ) as Record<Locale, string>;

  // Indexable marketing page — no robots noindex.
  return {
    title: dict.forBusiness.pageTitle,
    description: dict.forBusiness.pageDescription,
    alternates: {
      canonical: localeHref(locale, "for-business"),
      languages: {
        ...languages,
        "x-default": localeHref(DEFAULT_LOCALE, "for-business"),
      },
    },
  };
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
