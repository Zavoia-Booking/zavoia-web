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
import { VerifyEmail } from "./_components/verify-email";

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
    LOCALES.map((l) => [l, localeHref(l, "auth", "verify-email")]),
  ) as Record<Locale, string>;

  return {
    title: dict.verifyEmail.pageTitle,
    description: dict.verifyEmail.pageDescription,
    robots: { index: false, follow: false },
    alternates: {
      canonical: localeHref(locale, "auth", "verify-email"),
      languages: {
        ...languages,
        "x-default": localeHref(DEFAULT_LOCALE, "auth", "verify-email"),
      },
    },
  };
}

export default async function VerifyEmailPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <Suspense fallback={null}>
      <VerifyEmail locale={locale} />
    </Suspense>
  );
}
