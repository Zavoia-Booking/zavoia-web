"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import { SectionTitle } from "@/components/ui/section-title";
import { BusinessOverlayCard, type BusinessCardData } from "@/components/business";

// "Brands" — overlay-card grid of listed brands (business sourced; no heart:
// customers save locations and people only). Cards are pre-mapped on the
// server and, until the dedicated brand page exists, link to each brand's
// primary location page. Styling mirrors the "Fresh on Zavoia" section.
// With no brands yet the section is left out, as the website showcase is.
export function BrandsSection({ cards }: { cards: BusinessCardData[] }) {
  const { locale, dict } = useTranslation();
  const s = dict.homeSections.brands;

  if (cards.length === 0) return null;

  return (
    <section className="zw-container" style={{ paddingTop: 60 }}>
      <SectionTitle
        title={s.title}
        action={s.action}
        href={localeHref(locale, "search")}
      />
      <div

        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(232px, 100%), 1fr))",
          gap: 18,
        }}
      >
        {cards.map((b) => (
          <BusinessOverlayCard key={b.id} b={b} />
        ))}
      </div>
    </section>
  );
}
