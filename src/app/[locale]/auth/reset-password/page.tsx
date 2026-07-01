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
import { ResetPasswordForm } from "./_components/reset-password-form";

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
    LOCALES.map((l) => [l, localeHref(l, "auth", "reset-password")]),
  ) as Record<Locale, string>;

  return {
    title: dict.resetPassword.pageTitle,
    description: dict.resetPassword.pageDescription,
    robots: { index: false, follow: false },
    alternates: {
      canonical: localeHref(locale, "auth", "reset-password"),
      languages: {
        ...languages,
        "x-default": localeHref(DEFAULT_LOCALE, "auth", "reset-password"),
      },
    },
  };
}

export default async function ResetPasswordPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <Suspense fallback={null}>
      <ResetPasswordForm locale={locale} />
    </Suspense>
  );
}
