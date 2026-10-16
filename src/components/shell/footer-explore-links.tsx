"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useHomeLocationSnapshot } from "@/app/_components/home/use-home-coords";
import { findCity, findLocationCity } from "@/data/seo";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/format";
import { Skeleton } from "@/components/ui/skeleton";

export type FooterCategory = { id: string; slug: string; label: string };

import styles from "./footer.module.css";

export function FooterExploreLinks({ locale, categories, pending = false }: {
  locale: Locale;
  categories: FooterCategory[];
  pending?: boolean;
}) {
  const { dict } = useTranslation();
  const params = useParams();
  const location = useHomeLocationSnapshot();
  // Only [city]/[industry] supplies both params. A one-segment microsite slug
  // must never be treated as city context, nor may UI language imply country.
  const routeCity = typeof params.city === "string" && typeof params.industry === "string"
    ? findCity(locale, params.city) : undefined;
  const city = routeCity ?? findLocationCity(locale, location);

  if (!city) return null;

  // A failed or empty taxonomy response must not leave an orphan city heading
  // or collapse the space already reserved by the pending links.
  if (!pending && categories.length === 0) {
    return <li className={styles.categories} aria-hidden="true" />;
  }

  const cityLabel = format(dict.footer.inCity, { city: city.name });

  return (
    <li className={styles.categories} aria-busy={pending || undefined}>
      <p className={styles.city}>{cityLabel}</p>
      <ul className={styles.linkList} aria-label={cityLabel} role="list">
        {pending && Array.from({ length: 5 }, (_, index) => (
          <li key={index} aria-hidden="true">
            <span className={styles.link} style={{ display: "flex" }}><Skeleton w="75%" h={16} r={4} /></span>
          </li>
        ))}
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={localeHref(locale, city.slug, category.slug)}
              className={styles.link}
            >
              {category.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}
