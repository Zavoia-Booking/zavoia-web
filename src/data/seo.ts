import { LOCALES, type Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";

type LocalizedText = Record<Locale, string>;

type CityEntry = {
  id: string;
  slug: LocalizedText;
  name: LocalizedText;
};

type IndustryEntry = {
  id: string;
  slug: LocalizedText;
  name: LocalizedText;
  singular: LocalizedText;
};

export const CITY_ENTRIES: readonly CityEntry[] = [
  {
    id: "bucharest",
    slug: { ro: "bucuresti", en: "bucharest" },
    name: { ro: "București", en: "Bucharest" },
  },
  {
    id: "cluj",
    slug: { ro: "cluj-napoca", en: "cluj-napoca" },
    name: { ro: "Cluj-Napoca", en: "Cluj-Napoca" },
  },
  {
    id: "timisoara",
    slug: { ro: "timisoara", en: "timisoara" },
    name: { ro: "Timișoara", en: "Timisoara" },
  },
  {
    id: "iasi",
    slug: { ro: "iasi", en: "iasi" },
    name: { ro: "Iași", en: "Iasi" },
  },
  {
    id: "constanta",
    slug: { ro: "constanta", en: "constanta" },
    name: { ro: "Constanța", en: "Constanta" },
  },
  {
    id: "brasov",
    slug: { ro: "brasov", en: "brasov" },
    name: { ro: "Brașov", en: "Brasov" },
  },
  {
    id: "sibiu",
    slug: { ro: "sibiu", en: "sibiu" },
    name: { ro: "Sibiu", en: "Sibiu" },
  },
  {
    id: "craiova",
    slug: { ro: "craiova", en: "craiova" },
    name: { ro: "Craiova", en: "Craiova" },
  },
  {
    id: "oradea",
    slug: { ro: "oradea", en: "oradea" },
    name: { ro: "Oradea", en: "Oradea" },
  },
];

export const INDUSTRY_ENTRIES: readonly IndustryEntry[] = [
  {
    id: "barbers",
    slug: { ro: "frizerii", en: "barbers" },
    name: { ro: "Frizerii", en: "Barbers" },
    singular: { ro: "frizerie", en: "barber" },
  },
  {
    id: "nail-salons",
    slug: { ro: "saloane-unghii", en: "nail-salons" },
    name: { ro: "Saloane de unghii", en: "Nail Salons" },
    singular: { ro: "salon de unghii", en: "nail salon" },
  },
  {
    id: "hair-salons",
    slug: { ro: "coafor", en: "hair-salons" },
    name: { ro: "Coafor", en: "Hair Salons" },
    singular: { ro: "salon de coafură", en: "hair salon" },
  },
  {
    id: "beauty-salons",
    slug: { ro: "saloane-infrumusetare", en: "beauty-salons" },
    name: { ro: "Saloane de înfrumusețare", en: "Beauty Salons" },
    singular: { ro: "salon de înfrumusețare", en: "beauty salon" },
  },
  {
    id: "massage",
    slug: { ro: "masaj", en: "massage" },
    name: { ro: "Masaj", en: "Massage" },
    singular: { ro: "centru de masaj", en: "massage studio" },
  },
  {
    id: "spa",
    slug: { ro: "spa", en: "spa" },
    name: { ro: "Spa", en: "Spa" },
    singular: { ro: "spa", en: "spa" },
  },
  {
    id: "tattoo",
    slug: { ro: "tatuaje", en: "tattoo-studios" },
    name: { ro: "Saloane de tatuaje", en: "Tattoo Studios" },
    singular: { ro: "salon de tatuaje", en: "tattoo studio" },
  },
];

export type CityView = { id: string; slug: string; name: string };
export type IndustryView = {
  id: string;
  slug: string;
  name: string;
  singular: string;
};

export function listCities(locale: Locale): CityView[] {
  return CITY_ENTRIES.map((c) => ({
    id: c.id,
    slug: c.slug[locale],
    name: c.name[locale],
  }));
}

export function listIndustries(locale: Locale): IndustryView[] {
  return INDUSTRY_ENTRIES.map((i) => ({
    id: i.id,
    slug: i.slug[locale],
    name: i.name[locale],
    singular: i.singular[locale],
  }));
}

export function findCity(locale: Locale, slug: string): CityView | undefined {
  const entry = CITY_ENTRIES.find((c) => c.slug[locale] === slug);
  if (!entry) return undefined;
  return { id: entry.id, slug: entry.slug[locale], name: entry.name[locale] };
}

export function findIndustry(
  locale: Locale,
  slug: string,
): IndustryView | undefined {
  const entry = INDUSTRY_ENTRIES.find((i) => i.slug[locale] === slug);
  if (!entry) return undefined;
  return {
    id: entry.id,
    slug: entry.slug[locale],
    name: entry.name[locale],
    singular: entry.singular[locale],
  };
}

export async function getAllLocaleCityIndustryTriples(): Promise<
  Array<{ locale: Locale; city: string; industry: string }>
> {
  return LOCALES.flatMap((locale) =>
    CITY_ENTRIES.flatMap((city) =>
      INDUSTRY_ENTRIES.map((industry) => ({
        locale,
        city: city.slug[locale],
        industry: industry.slug[locale],
      })),
    ),
  );
}

export function getCategoryAlternates(
  cityId: string,
  industryId: string,
): Record<Locale, string> {
  const city = CITY_ENTRIES.find((c) => c.id === cityId);
  const industry = INDUSTRY_ENTRIES.find((i) => i.id === industryId);
  if (!city || !industry) return {} as Record<Locale, string>;

  return Object.fromEntries(
    LOCALES.map((locale) => [
      locale,
      localeHref(locale, city.slug[locale], industry.slug[locale]),
    ]),
  ) as Record<Locale, string>;
}
