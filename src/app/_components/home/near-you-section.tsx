"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { SectionTitle } from "@/components/ui/section-title";
import { SectionFailed } from "./section-failed";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessFeedCard } from "@/components/business";
import { locationCardToData } from "@/lib/marketplace/card-mappers";
import { useHomeCoords } from "./use-home-coords";
import { useHomeFeed } from "./use-home-feed";
import { mapHref } from "./map-href";

// Strictly within 20km, ordered by distance. The shared store fetches real
// offset pages (6 rows), rather than downloading the whole rail on every click.
export function NearYouSection() {
  const { locale, dict } = useTranslation();
  const s = dict.homeSections.nearYou;

  const { coords, city, resolving } = useHomeCoords();
  const { items, loading, loaded, failed, hasMore, showMore, retry } =
    useHomeFeed("nearby", coords);
  const cards = items.map((item) => locationCardToData(item, locale));
  const busy = resolving || (coords != null && (loading || (!loaded && !failed)));

  if (failed && cards.length === 0) {
    return <SectionFailed paddingTop={60} onRetry={retry} loading={busy} />;
  }

  // Nothing in range, or nowhere to anchor → hide the section entirely.
  if (!busy && cards.length === 0) return null;

  return (
    <>
      <section className="zw-container" style={{ paddingTop: 60 }} aria-busy={busy}>
        <SectionTitle
          title={s.title}
          action={s.action}
          href={mapHref(locale, city)}
        />
        {busy && cards.length === 0 ? (
          <div
            aria-hidden="true"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(360px, 100%), 1fr))",
              gap: 16,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} h={168} r={18} />
            ))}
          </div>
        ) : (
          <>
            <div

              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(360px, 100%), 1fr))",
                gap: 16,
              }}
            >
              {cards.map((b) => (
                <BusinessFeedCard key={b.id} b={b} />
              ))}
            </div>
            {hasMore && (
              <div
                style={{ display: "flex", justifyContent: "center", marginTop: 30 }}
              >
                <Button
                  kind="secondary"
                  size="lg"
                  onClick={showMore}
                  disabled={busy}
                  aria-label={s.showMore}
                  aria-busy={busy}
                  style={{ position: "relative" }}
                >
                  <span aria-hidden={busy || undefined} style={{ visibility: busy ? "hidden" : undefined }}>
                    {s.showMore}
                  </span>
                  {busy && (
                    <span aria-hidden="true" style={{ position: "absolute" }}>
                      <Spinner size={18} color="var(--c-900)" />
                    </span>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
        <p role="status" className="sr-only">{busy ? s.locating : ""}</p>
      </section>
      {failed && <SectionFailed paddingTop={24} onRetry={retry} loading={busy} />}
    </>
  );
}
