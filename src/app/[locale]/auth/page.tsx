import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
  type Locale,
} from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { AuthTabs } from "./_components/auth-tabs";

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
    LOCALES.map((l) => [l, localeHref(l, "auth")]),
  ) as Record<Locale, string>;

  return {
    title: dict.auth.pageTitle,
    description: dict.auth.pageDescription,
    robots: { index: false, follow: false },
    alternates: {
      canonical: localeHref(locale, "auth"),
      languages: {
        ...languages,
        "x-default": localeHref(DEFAULT_LOCALE, "auth"),
      },
    },
  };
}

export default async function AuthPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <Suspense fallback={null}>
      <AuthTabs locale={locale} />
    </Suspense>
  );
}
