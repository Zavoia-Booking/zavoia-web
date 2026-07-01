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
import { HelpContent } from "./_components/help-content";

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = dictionaries[locale];

  const languages = Object.fromEntries(
    LOCALES.map((l) => [l, localeHref(l, "help")]),
  ) as Record<Locale, string>;

  return {
    title: dict.help.pageTitle,
    description: dict.help.pageDescription,
    alternates: {
      canonical: localeHref(locale, "help"),
      languages: {
        ...languages,
        "x-default": localeHref(DEFAULT_LOCALE, "help"),
      },
    },
  };
}

export default async function HelpPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <HelpContent locale={locale} />;
}
