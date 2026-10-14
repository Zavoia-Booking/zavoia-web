"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useHomeLocationSnapshot } from "@/app/_components/home/use-home-coords";
import { findCity, findLocationCity } from "@/data/seo";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/format";

export type FooterCategory = { id: string; slug: string; label: string };

import styles from "./footer.module.css";

export function FooterExploreLinks({ locale, categories }: {
  locale: Locale;
  categories: FooterCategory[];
}) {
  const { dict } = useTranslation();
  const params = useParams();
  const location = useHomeLocationSnapshot();
  // Only [city]/[industry] supplies both params. A one-segment microsite slug
  // must never be treated as city context, nor may UI language imply country.
  const routeCity = typeof params.city === "string" && typeof params.industry === "string"
    ? findCity(locale, params.city) : undefined;
  const city = routeCity ?? findLocationCity(locale, location);

  if (!city || categories.length === 0) {
    return (
      <Link href={localeHref(locale, "search")} className={styles.link}>
        {dict.footer.findBusiness}
      </Link>
    );
  }

  return (
    <>
      <span className={styles.city}>
        {format(dict.footer.inCity, { city: city.name })}
      </span>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={localeHref(locale, city.slug, category.slug)}
          className={styles.link}
        >
          {category.label}
        </Link>
      ))}
    </>
  );
}
