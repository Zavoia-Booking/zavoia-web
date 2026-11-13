import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { AppleCallback } from "./_components/apple-callback";

export const dynamicParams = false;

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  return {
    // This copy already names Zavoia, so skip the layout's "| Zavoia" suffix.
    title: { absolute: dictionaries[locale].auth.appleCallback.pageTitle },
    robots: { index: false, follow: false },
  };
}

/**
 * Return URL registered at Apple for Sign in with Apple, as the locale-less
 * `<origin>/auth/apple/callback` — the proxy rewrites it to this
 * default-locale route, like Google's /auth/callback. The web button uses
 * Apple JS in popup mode, so Apple hands the result to the opening page and
 * normally closes the popup itself; this page only covers a popup that stays
 * open (or is opened directly) and never handles credentials.
 */
export default async function AppleCallbackPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <AppleCallback locale={locale} />;
}
