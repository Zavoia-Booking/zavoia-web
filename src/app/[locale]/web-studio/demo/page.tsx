import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { ShuffleExperience } from "@/app/_components/try/shuffle-experience";
import { demoReturnHref } from "@/app/_components/try/demo-return-href";

export const dynamicParams = false;

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const one = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? null;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = dictionaries[locale].tryStudio;
  return {
    title: copy.pageTitle,
    description: copy.pageDescription,
    robots: { index: false, follow: true },
    alternates: { canonical: localeHref(locale, "web-studio", "demo") },
  };
}

/** The actual website renderer with sample data, not an account or draft editor. */
export default async function WebsiteDemoPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  return <ShuffleExperience locale={locale} backHref={demoReturnHref(one(query.returnTo), locale)} initialCode={one(query.s)} source={one(query.src)} initialExample={one(query.example)} initialHidden={one(query.hide)} initialDevice={one(query.device)} />;
}
