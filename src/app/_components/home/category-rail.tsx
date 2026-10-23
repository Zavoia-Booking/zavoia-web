"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { Icon } from "@/components/ui/icon";
import { useServiceCatalog } from "@/components/search/service-catalog-provider";
import { taxonomyLabel } from "@/lib/marketplace/card-mappers";
import { industryAccent, industryIcon } from "@/lib/marketplace/industry-visuals";
import type { Industry, IndustryTag } from "@/lib/api/marketplace/types";
import { useHomeLocationSnapshot } from "./use-home-coords";
import styles from "./category-rail.module.css";

export function CategoryRail({ locale, industries, featuredIndustryIds }: {
  locale: Locale;
  industries: Industry[];
  featuredIndustryIds: number[];
}) {
  const { dict } = useTranslation();
  const router = useRouter();
  const { openCatalog } = useServiceCatalog();
  const location = useHomeLocationSnapshot();
  const t = dict.searchOverlay;
  const featured = featuredIndustryIds.flatMap((id) => {
    const industry = industries.find((item) => item.id === id);
    return industry ? [industry] : [];
  });

  if (industries.length === 0) return null;

  const selectService = (industry: Industry, tag: IndustryTag) => {
    const params = new URLSearchParams({
      industry: industry.slug,
      tagIds: String(tag.id),
    });
    if (location.city) params.set("city", location.city);
    if (location.coords) {
      params.set("lat", String(location.coords.lat));
      params.set("lng", String(location.coords.lng));
    }
    router.push(`${localeHref(locale, "search")}?${params.toString()}`);
  };
  const browse = (industry?: Industry) => openCatalog({
    industries,
    initialIndustry: industry?.slug,
    onSelect: selectService,
  });

  return (
    <section className={`zw-container ${styles.section}`} aria-label={t.browseByIndustry}>
      <ul className={styles.grid} role="list">
        {featured.map((industry) => (
          <li key={industry.id}>
            <Link
              href={`${localeHref(locale, "search")}?industry=${encodeURIComponent(industry.slug)}`}
              prefetch={false}
              title={taxonomyLabel(industry, locale, dict.industries)}
              className={styles.tile}
              aria-haspopup={industry.tags.length > 0 ? "dialog" : undefined}
              onNavigate={(event) => {
                // Tagless industries still have a working industry search.
                // Modified clicks and no-JS navigation use the real href.
                if (industry.tags.length === 0) return;
                event.preventDefault();
                browse(industry);
              }}
            >
              <span className={styles.glyph}>
                <Icon name={industryIcon(industry.slug)} size={24} color={industryAccent(industry.slug)} />
              </span>
              <span className={styles.label} title={taxonomyLabel(industry, locale, dict.industries)}>{taxonomyLabel(industry, locale, dict.industries)}</span>
            </Link>
          </li>
        ))}
        <li>
          <Link
            href={localeHref(locale, "industries")}
            prefetch={false}
            title={t.seeAllIndustries}
            className={styles.tile}
            aria-haspopup="dialog"
            onNavigate={(event) => {
              event.preventDefault();
              browse();
            }}
          >
            <span className={`${styles.glyph} ${styles.allGlyph}`}>
              <Icon name="grid" size={23} />
            </span>
            <span className={styles.label} title={t.seeAllIndustries}>{t.seeAllIndustries}</span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
