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
import { HomeContent } from "@/app/_components/home-content";

export const dynamicParams = false;

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = dictionaries[locale];

  const languages = Object.fromEntries(
    LOCALES.map((l) => [l, localeHref(l)]),
  ) as Record<Locale, string>;

  return {
    title: dict.home.title,
    description: dict.home.description,
    alternates: {
      canonical: localeHref(locale),
      languages: { ...languages, "x-default": localeHref(DEFAULT_LOCALE) },
    },
    openGraph: {
      title: dict.home.title,
      description: dict.home.description,
      url: localeHref(locale),
      type: "website",
      locale,
    },
  };
}

export default async function Home({ params }: Props) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  return <HomeContent locale={localeParam} />;
}
