"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { SectionTitle } from "@/components/ui/section-title";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  BusinessOverlayCard,
  type BusinessCardData,
} from "@/components/business";
import { searchListings } from "@/lib/api/marketplace/public";
import { locationCardToData } from "@/lib/marketplace/card-mappers";
import { useHomeCoords } from "./use-home-coords";
import { mapHref } from "./map-href";
import { useFavoriteToggle } from "./use-favorite-toggle";

const PAGE = 10;

/**
 * Scope of this feed, in km. Deliberately much wider than "Near you" (20km) — this is the
 * whole city and its surroundings, not walking distance. 50 is also the server's hard
 * ceiling (`MAX_RADIUS_KM`), so it can't be widened further without an API change.
 */
const RADIUS_KM = 50;

/**
 * Per-mount shuffle key. Sent to the API, which orders by a hash of seed+location id: the
 * order is random per visit but STABLE across pages, so appending an offset page can never
 * repeat or skip a card. Generated on the client only (never during SSR) so it can't cause
 * a hydration mismatch.
 */
function makeSeed(): string {
  return Math.random().toString(36).slice(2, 12) || "zv";
}


// "Places in your city" — replaces the old newest-first "Fresh on Zavoia" grid.
//
// Anchors on the visitor's position (geolocation → IP estimate, shared with
// "Near you" via useHomeCoords) and pulls everything within RADIUS_KM, 10 at a
// time behind a "Show more" button. Scoped by DISTANCE, not by city name: a
// suburb under a different locality name still belongs in "your city".
//
// Shuffled server-side via `seed` so that, despite sharing an anchor with
// "Near you", this feed never restates it in distance order.
//
// `strict` is non-negotiable here: a section headed "in your city" must never
// pad itself with places outside the radius it promises. No coords, or nothing
// in range → the section hides rather than showing unrelated listings.
export function InYourCity() {
  const { locale, dict } = useTranslation();
  const router = useRouter();
  const fav = useFavoriteToggle("location");
  const s = dict.homeSections.inCity;

  const { coords, city, resolving } = useHomeCoords();
  const [cards, setCards] = useState<BusinessCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const seed = useRef<string | null>(null);

  // Fetch one page. `offset` 0 replaces the list; anything else appends.
  const load = useCallback(
    async (offset: number) => {
      if (!coords) return;
      seed.current ??= makeSeed();
      // Deferred to a microtask so the spinner/disabled state never comes from
      // a synchronous setState inside the effect that triggers the first page.
      void Promise.resolve().then(() => setLoading(true));
      try {
        const res = await searchListings({
          lat: coords.lat,
          lng: coords.lng,
          radius: RADIUS_KM,
          seed: seed.current,
          strict: true,
          limit: PAGE,
          offset,
        });
        const page = res.locations.map((l) => locationCardToData(l, locale));
        setCards((prev) => {
          if (offset === 0) return page;
          // The seeded order is stable, so this is belt-and-braces: never let a
          // repeated id reach React as a duplicate key.
          const seen = new Set(prev.map((c) => c.id));
          return [...prev, ...page.filter((c) => !seen.has(c.id))];
        });
        setTotal(res.total);
      } catch {
        // Network/backend failure → leave what we have; the section hides if
        // that is nothing. Never substitute out-of-radius listings.
        if (offset === 0) setCards([]);
      } finally {
        setLoading(false);
      }
    },
    [coords, locale],
  );

  // First page, once the anchor is known.
  useEffect(() => {
    if (!coords) return;
    void load(0);
  }, [coords, load]);

  const visible = cards;
  const hasMore = cards.length < total;
  // `loading` only means anything once there is an anchor to load for: no coords and
  // done resolving is a settled empty state, not a pending one.
  const busy = resolving || (coords != null && loading);

  const showMore = useCallback(() => {
    void load(cards.length);
  }, [load, cards.length]);

  // Nothing in range, or nowhere to anchor → hide the section entirely.
  if (!busy && visible.length === 0) return null;

  return (
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
  );
}
