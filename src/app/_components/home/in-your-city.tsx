"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { SectionTitle } from "@/components/ui/section-title";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessOverlayCard } from "@/components/business";
import { locationCardToData } from "@/lib/marketplace/card-mappers";
import { useHomeCoords } from "./use-home-coords";
import { useHomeFeed } from "./use-home-feed";
import { useDiscoveryFeed } from "./discovery-feedback";
import { mapHref } from "./map-href";
import { useFavoriteToggle } from "./use-favorite-toggle";
import styles from "./discovery-rail.module.css";

// The shuffled city feed is distance-scoped (50km, the API ceiling), not
// name-scoped. Its tab-local seed and pagination survive language navigation.
export function InYourCity() {
  const { locale, dict } = useTranslation();
  const fav = useFavoriteToggle("location");
  const s = dict.homeSections.inCity;

  const { coords, city, resolving } = useHomeCoords();
  const { items, loading, loaded, failed, hasMore, showMore, retry, failureId, failureKind, retryAt } =
    useHomeFeed("city", coords);
  // The API carries both taxonomy labels. Presentation changes with language;
  // the public rows, their order and the number of loaded pages do not.
  const visible = items.map((item) => locationCardToData(item, locale));
  const busy = resolving || (coords != null && (loading || (!loaded && !failed)));
  useDiscoveryFeed("city", {
    pending: busy, failed, count: items.length, retry, failureId, failureKind, retryAt,
  });

  if (failed && visible.length === 0) return null;

  // Nothing in range, or nowhere to anchor → hide the section entirely.
  if (!busy && visible.length === 0) return null;

  return (
    <section className={`zw-container ${styles.section}`} aria-busy={busy}>
      <SectionTitle
        title={s.title}
        action={s.action}
        href={mapHref(locale, city)}
      />
      {busy && visible.length === 0 ? (
        <div
          aria-hidden="true"
          className={`zw-carousel-rail ${styles.track}`}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={styles.item}>
              <Skeleton h="auto" r={18} className={styles.skeleton} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div
            className={`zw-carousel-rail ${styles.track}`}
            data-locale-scroll="home-city"
            role="list"
            aria-label={s.title}
          >
            {visible.map((b) => (
              <div key={b.id} className={styles.item} role="listitem">
                <BusinessOverlayCard
                  b={b}
                  compactOnMobile
                  favorited={fav.isFavorited(Number(b.id))}
                  onFavorite={fav.toggle}
                />
              </div>
            ))}
          </div>
          {hasMore && (
            <div className={styles.more}>
              <Button
                kind="secondary"
                size="lg"
                onClick={showMore}
                loading={busy}
                disabled={retryAt > 0}
                aria-label={s.showMore}
              >
                {s.showMore}
              </Button>
            </div>
          )}
        </>
      )}
      <p role="status" className="sr-only">{busy ? s.locating : ""}</p>
    </section>
  );
}
