"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import { SectionTitle } from "@/components/ui/section-title";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { BusinessFeedCard, type BusinessCardData } from "@/components/business";
import { getNearbyLocations } from "@/lib/api/marketplace/public";
import { locationCardToData } from "@/lib/marketplace/card-mappers";

const PAGE = 8;

// "More places nearby" — requests geolocation on mount and shows nearby
// LOCATION cards (with distance) from the API. On denial/error/timeout it
// falls back to the server-provided latest listings. "Show more" pages by 8.
export function NearYouSection({ fallback }: { fallback: BusinessCardData[] }) {
  const { locale, dict } = useTranslation();
  const router = useRouter();
  const s = dict.homeSections.nearYou;

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  // null = haven't decided yet; true = use nearby; false = use fallback.
  const [useNearby, setUseNearby] = useState<boolean | null>(null);
  const [nearby, setNearby] = useState<BusinessCardData[]>([]);
  const [limit, setLimit] = useState(PAGE);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  // Tracks the visible count for the fallback path (paged client-side).
  const [fallbackLimit, setFallbackLimit] = useState(PAGE);
  const requested = useRef(false);

  // Ask for geolocation once. State is only updated from async callbacks (the
  // geolocation success/error handlers, or a deferred microtask for the
  // no-API path) so we never call setState synchronously inside the effect.
  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      Promise.resolve().then(() => {
        setUseNearby(false);
        setLoading(false);
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setUseNearby(true);
      },
      () => {
        setUseNearby(false);
        setLoading(false);
      },
      { timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  // Fetch nearby whenever coords or limit change (only on the nearby path).
  useEffect(() => {
    if (useNearby !== true || !coords) return;
    let cancelled = false;
    // Mark loading via a microtask so the spinner/disabled state shows during
    // pagination without a synchronous setState in the effect body.
    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });
    getNearbyLocations({ lat: coords.lat, lng: coords.lng, limit })
      .then((res) => {
        if (cancelled) return;
        setNearby(res.data.map((l) => locationCardToData(l, locale)));
        setTotal(res.total);
      })
      .catch(() => {
        if (cancelled) return;
        // Network/back-end failure → fall back to latest listings.
        setUseNearby(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [useNearby, coords, limit, locale]);

  const showMoreNearby = useCallback(() => setLimit((l) => l + PAGE), []);
  const showMoreFallback = useCallback(
    () => setFallbackLimit((l) => l + PAGE),
    [],
  );

  const onNearbyPath = useNearby === true;
  const cards = onNearbyPath ? nearby : fallback.slice(0, fallbackLimit);
  const hasMore = onNearbyPath
    ? nearby.length < total
    : fallbackLimit < fallback.length;

  // Nothing to show on either path → hide the section entirely.
  if (!loading && cards.length === 0) return null;

  return (
    <section className="zw-container" style={{ paddingTop: 60 }}>
      <SectionTitle
        kicker={s.kicker}
        title={s.title}
        action={s.action}
        onAction={() => router.push(localeHref(locale, "search"))}
      />
      {loading && cards.length === 0 ? (
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
                onClick={onNearbyPath ? showMoreNearby : showMoreFallback}
                disabled={loading}
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
