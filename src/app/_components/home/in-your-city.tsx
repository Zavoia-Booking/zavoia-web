"use client";

import type { CSSProperties } from "react";
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

/** Compact 3 / 4 / 3 rows, with no isolated final tile or double-height cards. */
function cityTiles(count: number) {
  const tiles: { columns: number; style: CSSProperties }[] = [];
  let row = 0;
  while (tiles.length < count) {
    const remaining = count - tiles.length;
    let rowCount = remaining <= 4 ? remaining : row % 3 === 1 ? 4 : 3;
    if (remaining - rowCount === 1) rowCount -= 1;
    const columns = rowCount === 4 ? [3, 3, 3, 3]
      : rowCount === 3 ? (row % 3 === 0 ? [5, 4, 3] : [3, 4, 5])
      : rowCount === 2 ? [6, 6] : [6];
    for (const span of columns) tiles.push({
      columns: span,
      style: {
        "--city-columns": span,
        "--city-tile-height": rowCount === 4 ? "248px" : "280px",
        "--city-title-size": span >= 5 ? "24px" : "22px",
      } as CSSProperties,
    });
    row += 1;
  }
  return tiles;
}

function cityImageSizes(columns: number, tabletWide: boolean) {
  return [
    "(max-width: 320px) 248px",
    "(max-width: 404px) calc(86vw - 27.52px)",
    "(max-width: 640px) 320px",
    `(max-width: 920px) ${tabletWide ? "calc(100vw - 40px)" : "calc((100vw - 58px) / 2)"}`,
    `(max-width: 1099px) ${tabletWide ? "90vw" : "calc((90vw - 18px) / 2)"}`,
    `(max-width: 1556px) calc((90vw + 18px) / 12 * ${columns} - 18px)`,
    `${Math.ceil(1418 * columns / 12 - 18)}px`,
  ].join(", ");
}

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
  const tiles = cityTiles(visible.length || 10);
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
          className={`zw-carousel-rail ${styles.track} ${styles.cityTrack}`}
        >
          {tiles.map((tile, i) => (
            <div key={i} className={styles.item} style={tile.style}>
              <Skeleton h="var(--city-card-height, auto)" r={18} className={styles.skeleton} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div
            className={`zw-carousel-rail ${styles.track} ${styles.cityTrack}`}
            data-locale-scroll="home-city"
            role="list"
            aria-label={s.title}
          >
            {visible.map((b, index) => (
              <div key={b.id} className={styles.item} style={tiles[index].style} role="listitem">
                <BusinessOverlayCard
                  b={b}
                  compactOnMobile
                  bento
                  imageSizes={cityImageSizes(tiles[index].columns, visible.length % 2 === 1 && index === visible.length - 1)}
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
