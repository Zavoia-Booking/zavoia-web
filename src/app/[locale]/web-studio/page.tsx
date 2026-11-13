import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, LOCALES, isLocale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { socialMetadata } from "@/lib/site";
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
  return <main><WebStudioContent locale={locale} /></main>;
}
