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
import { AccountContent } from "./_components/account-content";

// Live customer data is fetched client-side; never statically prerender (the
// backend may be down during `next build`). Mirrors search / business pages.
export const dynamic = "force-dynamic";

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
    LOCALES.map((l) => [l, localeHref(l, "account")]),
  ) as Record<Locale, string>;

  return {
    title: dict.account.title,
    robots: { index: false, follow: false },
    alternates: {
      canonical: localeHref(locale, "account"),
      languages: {
        ...languages,
        "x-default": localeHref(DEFAULT_LOCALE, "account"),
      },
    },
  };
}

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <AccountContent locale={locale} />;
}
