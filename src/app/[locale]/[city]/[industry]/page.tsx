import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/locales";
import {
  findCity,
  findIndustry,
  getAllLocaleCityIndustryTriples,
  getCategoryAlternates,
} from "@/data/seo";
import { dictionaries, format } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { CategoryContent } from "@/app/_components/category-content";

// Real city/industry combos are prerendered for SEO (generateStaticParams).
// Allow on-demand params so unknown 2-segment paths (e.g. /legal/privacy, which
// collides with this route until the literal /legal/[doc] route exists) render
// and hit the notFound() below — a clean 404 — instead of Next throwing an
// internal NoFallbackError in production for an un-generated param.
export const dynamicParams = true;

export async function generateStaticParams() {
  return getAllLocaleCityIndustryTriples();
}

type Props = {
  params: Promise<{ locale: string; city: string; industry: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale: localeParam, city: citySlug, industry: industrySlug } =
    await params;
  if (!isLocale(localeParam)) return {};

  const city = findCity(localeParam, citySlug);
  const industry = findIndustry(localeParam, industrySlug);
  if (!city || !industry) return {};

  const dict = dictionaries[localeParam];
  const vars = {
    industry: industry.name,
    industryLower: industry.name.toLowerCase(),
    city: city.name,
    singular: industry.singular,
  };

  const title = format(dict.category.titleTemplate, vars);
  const description = format(dict.category.descriptionTemplate, vars);
  const canonical = localeHref(localeParam, city.slug, industry.slug);
  const languages = getCategoryAlternates(city.id, industry.id);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { ...languages, "x-default": languages[DEFAULT_LOCALE] },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      locale: localeParam,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { locale: localeParam, city: citySlug, industry: industrySlug } =
    await params;
  if (!isLocale(localeParam)) notFound();

  const city = findCity(localeParam, citySlug);
  const industry = findIndustry(localeParam, industrySlug);
  if (!city || !industry) notFound();

  return (
    <CategoryContent locale={localeParam} city={city} industry={industry} />
  );
}
