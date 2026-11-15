"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import { SectionTitle } from "@/components/ui/section-title";
import { BusinessOverlayCard, type BusinessCardData } from "@/components/business";
import styles from "./discovery-rail.module.css";

// Listed brands are pre-mapped on the server. Customers save locations and
// people only, so brand cards do not show a heart.
// With no brands yet the section is left out, as the website showcase is.
export function BrandsSection({ cards }: { cards: BusinessCardData[] }) {
  const { locale, dict } = useTranslation();
  const s = dict.homeSections.brands;

  if (cards.length === 0) return null;

  return (
    <section className={`zw-container ${styles.section}`}>
      <SectionTitle
        title={s.title}
        action={s.action}
        href={localeHref(locale, "search")}
      />
      <div
        className={`zw-carousel-rail ${styles.track}`}
        data-locale-scroll="home-brands"
        role="list"
        aria-label={s.title}
      >
        {cards.map((b) => (
          <div key={b.id} className={styles.item} role="listitem">
            <BusinessOverlayCard b={b} compactOnMobile />
          </div>
        ))}
      </div>
    </section>
  );
}
