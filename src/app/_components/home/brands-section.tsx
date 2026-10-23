"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import { SectionTitle } from "@/components/ui/section-title";
import { BusinessOverlayCard, type BusinessCardData } from "@/components/business";

// "Brands" — overlay-card grid of listed brands (business sourced; no heart:
// customers save locations and people only). Cards are pre-mapped on the
// server and, until the dedicated brand page exists, link to each brand's
// primary location page. Styling mirrors the "Fresh on Zavoia" section.
export function BrandsSection({ cards }: { cards: BusinessCardData[] }) {
  const { locale, dict } = useTranslation();
  const s = dict.homeSections.brands;

  return (
    <section className="zw-container" style={{ paddingTop: 60 }}>
      <SectionTitle
        title={s.title}
        action={s.action}
        href={localeHref(locale, "search")}
      />
      {cards.length === 0 ? (
        <p
          className="txt-pretty"
          style={{ fontSize: 15, color: "var(--c-600)", maxWidth: 460 }}
        >
          {s.empty}
        </p>
      ) : (
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
      )}
    </section>
  );
}
