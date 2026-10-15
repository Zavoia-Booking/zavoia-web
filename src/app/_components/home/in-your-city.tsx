"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { SectionTitle } from "@/components/ui/section-title";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { BusinessOverlayCard } from "@/components/business";
import { locationCardToData } from "@/lib/marketplace/card-mappers";
import { useHomeCoords } from "./use-home-coords";
import { useHomeFeed } from "./use-home-feed";
import { SectionFailed } from "./section-failed";
import { mapHref } from "./map-href";
import { useFavoriteToggle } from "./use-favorite-toggle";

// The shuffled city feed is distance-scoped (50km, the API ceiling), not
// name-scoped. Its tab-local seed and pagination survive language navigation.
export function InYourCity() {
  const { locale, dict } = useTranslation();
  const router = useRouter();
  const fav = useFavoriteToggle("location");
  const s = dict.homeSections.inCity;

  const { coords, city, resolving } = useHomeCoords();
  const { items, loading, loaded, failed, hasMore, showMore, retry } =
    useHomeFeed("city", coords);
  // The API carries both taxonomy labels. Presentation changes with language;
  // the public rows, their order and the number of loaded pages do not.
  const visible = items.map((item) => locationCardToData(item, locale));
  const busy = resolving || (coords != null && (loading || (!loaded && !failed)));

  if (!busy && failed && visible.length === 0) {
    return <SectionFailed paddingTop={60} onRetry={retry} />;
  }

  // Nothing in range, or nowhere to anchor → hide the section entirely.
  if (!busy && visible.length === 0) return null;

  return (
    <>
      <section className="zw-container" style={{ paddingTop: 60 }}>
        <SectionTitle
          kicker={s.kicker}
          title={s.title}
          action={s.action}
          onAction={() => router.push(mapHref(locale, city))}
        />
        {busy && visible.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "var(--c-600)",
              fontSize: 14,
            }}
          >
            <Spinner size={18} />
            {s.locating}
          </div>
        ) : (
          <>
            <div
              className="zw-stagger"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(232px, 1fr))",
                gap: 18,
              }}
            >
              {visible.map((b) => (
                <BusinessOverlayCard
                  key={b.id}
                  b={b}
                  favorited={fav.isFavorited(Number(b.id))}
                  onFavorite={fav.canFavorite ? fav.toggle : undefined}
                />
              ))}
            </div>
            {hasMore && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: 30,
                }}
              >
                <Button
                  kind="secondary"
                  size="lg"
                  onClick={showMore}
                  disabled={busy}
                >
                  {s.showMore}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
      {failed && <SectionFailed paddingTop={24} onRetry={retry} />}
    </>
  );
}
