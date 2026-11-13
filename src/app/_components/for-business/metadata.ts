import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { socialMetadata } from "@/lib/site";

/** Indexable metadata for a business marketing page, in both languages. */
export function businessPageMetadata(
  locale: Locale,
  segment: "for-business" | "pricing",
  title: string,
  description: string,
): Metadata {
  const canonical = localeHref(locale, segment);
  const languages = Object.fromEntries(
    LOCALES.map((l) => [l, localeHref(l, segment)]),
  ) as Record<Locale, string>;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { ...languages, "x-default": localeHref(DEFAULT_LOCALE, segment) },
    },
    ...socialMetadata(locale, canonical, title, description),
  };
}
