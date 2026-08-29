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
import {
  getBrands,
  getIndustries,
  searchListings,
} from "@/lib/api/marketplace/public";
import type {
  BrandCard,
  Industry,
  LocationCard,
} from "@/lib/api/marketplace/types";

// The home fetches live marketplace data, so it must NOT be statically
// prerendered at build time (the backend may be down during `next build`).
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

  // The three feeds fire in parallel and are handed to HomeContent UNAWAITED:
  // each one streams into its own <Suspense> boundary, so the hero and the
  // editorial bands reach the browser without waiting on admin-api at all.
  //
  // Build-safety: the .catch() at creation doubles as the empty-data fallback
  // (a failed/absent backend never crashes the render) and ensures the promise
  // is already handled before its consumer awaits it.
  const industries = getIndustries().catch((): Industry[] => []);
  // Editor's pick is the one home feed that is NOT location-scoped: it renders
  // on the server, before any coordinates exist. No geo params → the search
  // path's default order (top-rated, then newest).
  const editorsPick = searchListings({ limit: 10 })
    .then((res) => res.locations)
    .catch((): LocationCard[] => []);
  const brands = getBrands({ limit: 10 })
    .then((res) => res.data)
    .catch((): BrandCard[] => []);

  return (
    <HomeContent
      locale={localeParam}
      industries={industries}
      editorsPick={editorsPick}
      brands={brands}
    />
  );
}
