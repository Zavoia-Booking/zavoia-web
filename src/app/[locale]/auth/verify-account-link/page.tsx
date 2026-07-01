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
import { VerifyAccountLink } from "./_components/verify-account-link";

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
  const dict = dictionaries[locale].auth;

  const languages = Object.fromEntries(
    LOCALES.map((l) => [l, localeHref(l, "auth", "verify-account-link")]),
  ) as Record<Locale, string>;

  return {
    title: dict.verifyLink.pageTitle,
    description: dict.verifyLink.pageDescription,
    robots: { index: false, follow: false },
    alternates: {
      canonical: localeHref(locale, "auth", "verify-account-link"),
      languages: {
        ...languages,
        "x-default": localeHref(
          DEFAULT_LOCALE,
          "auth",
          "verify-account-link",
        ),
      },
    },
  };
}

export default async function VerifyAccountLinkPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <Suspense fallback={null}>
      <VerifyAccountLink locale={locale} />
    </Suspense>
  );
}
