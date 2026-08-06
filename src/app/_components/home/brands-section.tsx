"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import { SectionTitle } from "@/components/ui/section-title";
import { BusinessOverlayCard, type BusinessCardData } from "@/components/business";
import { useFavoriteToggle } from "./use-favorite-toggle";

// "Brands" — overlay-card grid of listed brands (business sourced; favorites
// toggle the business endpoint). Cards are pre-mapped on the server and, until
// the dedicated brand page exists, link to each brand's primary location page.
// Styling mirrors the "Fresh on Zavoia" section.
export function BrandsSection({ cards }: { cards: BusinessCardData[] }) {
  const { locale, dict } = useTranslation();
  const router = useRouter();
  const fav = useFavoriteToggle("business");
  const s = dict.homeSections.brands;

  return (
    <section className="zw-container" style={{ paddingTop: 60 }}>
      <SectionTitle
        kicker={s.kicker}
        title={s.title}
        action={s.action}
        onAction={() => router.push(localeHref(locale, "search"))}
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
          className="zw-stagger"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(232px, 1fr))",
            gap: 18,
          }}
        >
          {cards.map((b) => (
            <BusinessOverlayCard
              key={b.id}
              b={b}
              favorited={fav.isFavorited(Number(b.id))}
              onFavorite={fav.canFavorite ? fav.toggle : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}
