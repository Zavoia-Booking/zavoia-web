"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { SectionTitle } from "@/components/ui/section-title";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { BusinessFeedCard, type BusinessCardData } from "@/components/business";
import { getNearbyLocations } from "@/lib/api/marketplace/public";
import { locationCardToData } from "@/lib/marketplace/card-mappers";
import { useHomeCoords } from "./use-home-coords";
import { mapHref } from "./map-href";

const PAGE = 6;
// Radius (km) for the "near you" query — roughly a city and its immediate
// surroundings. The API widens it on its own (up to 50km) when nothing is in
// range and flags that via `fallback`.
const RADIUS_KM = 20;


// "More places nearby" — nearby LOCATION cards (with distance) within
// RADIUS_KM, sorted by distance. Coordinates come from the shared home ladder
// (geolocation → IP estimate), so this rail and "In your city" prompt once
// between them.
//
// `strict` stops the server widening an empty 20km query out to 50km: a rail
// that promises "nearby" hides rather than showing places that are not.
// "Show more" pages by 6.
export function NearYouSection() {
  const { locale, dict } = useTranslation();
  const router = useRouter();
  const s = dict.homeSections.nearYou;

  const { coords, city, resolving } = useHomeCoords();
  const [nearby, setNearby] = useState<BusinessCardData[]>([]);
  const [limit, setLimit] = useState(PAGE);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch nearby whenever coords or limit change.
  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    // Mark loading via a microtask so the spinner/disabled state shows during
    // pagination without a synchronous setState in the effect body.
    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });
    getNearbyLocations({
      lat: coords.lat,
      lng: coords.lng,
      radius: RADIUS_KM,
      strict: true,
      limit,
    })
      .then((res) => {
        if (cancelled) return;
        setNearby(res.data.map((l) => locationCardToData(l, locale)));
        setTotal(res.total);
      })
      .catch(() => {
        if (cancelled) return;
        // Network/back-end failure → keep the rail empty rather than filling it
        // with listings that are not actually nearby.
        setNearby([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coords, limit, locale]);

  const showMore = useCallback(() => setLimit((l) => l + PAGE), []);

  const cards = nearby;
  const hasMore = nearby.length < total;
  // `loading` only means anything once there is an anchor to load for: no coords and
  // done resolving is a settled empty state, not a pending one.
  const busy = resolving || (coords != null && loading);

  // Nothing in range, or nowhere to anchor → hide the section entirely.
  if (!busy && cards.length === 0) return null;

  return (
    <section className="zw-container" style={{ paddingTop: 60 }}>
      <SectionTitle
        kicker={s.kicker}
        title={s.title}
        action={s.action}
        onAction={() => router.push(mapHref(locale, city))}
      />
      {busy && cards.length === 0 ? (
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
              gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
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
