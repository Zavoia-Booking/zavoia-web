"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { Icon } from "@/components/ui/icon";
import { useSearchOverlay } from "@/components/search/search-overlay-provider";
import { taxonomyLabel } from "@/lib/marketplace/card-mappers";
import { industryAccent, industryIcon } from "@/lib/marketplace/industry-visuals";
import type { Industry } from "@/lib/api/marketplace/types";
import { useHomeLocationSnapshot } from "./use-home-coords";
import styles from "./category-rail.module.css";

export function CategoryRail({ locale, industries, featuredIndustryIds }: {
  locale: Locale;
  industries: Industry[];
  featuredIndustryIds: number[];
}) {
  const { dict } = useTranslation();
  const { openSearch } = useSearchOverlay();
  const location = useHomeLocationSnapshot();
  const t = dict.searchOverlay;
  const featured = featuredIndustryIds.flatMap((id) => {
    const industry = industries.find((item) => item.id === id);
    return industry ? [industry] : [];
  });

  if (industries.length === 0) return null;

  const browse = (industry: Industry) => openSearch({
    step: "what",
    browseIndustry: industry.slug,
    industries,
    initial: {
      where: {
        label: location.city ?? undefined,
        lat: location.coords?.lat,
        lng: location.coords?.lng,
      },
    },
  });

  return (
    <section className={`zw-container ${styles.section}`} aria-label={t.browseByIndustry}>
      <ul className={styles.grid} role="list">
        {featured.map((industry) => (
          <li key={industry.id}>
            <Link
              href={`${localeHref(locale, "search")}?industry=${encodeURIComponent(industry.slug)}`}
              prefetch={false}
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
            className={styles.tile}
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
