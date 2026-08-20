"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { localeHref } from "@/i18n/routes";
import {
  Avatar,
  Button,
  CatDot,
  HeartButton,
  Icon,
  Img,
  Rating,
  Stars,
  StatusPill,
  useToast,
} from "@/components/ui";
import { taxonomyLabel, toCat } from "@/lib/marketplace/card-mappers";
import { openStatus } from "@/lib/marketplace/working-hours";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import {
  formatMoney,
  formatSelectionSpread,
  formatServiceSpread,
  sumServiceSpreads,
  type ServiceSpread,
} from "@/lib/format/money-time";
import { useBooking } from "@/lib/booking";
import type { BookingSelectionItem } from "@/lib/booking";
import { pushRecentView } from "@/lib/recent-views";
import { useFavoriteToggle } from "@/app/_components/home/use-favorite-toggle";
import { getListingReviews } from "@/lib/api/marketplace/public";
import { SEARCH_RADIUS_KM } from "@/components/search/constants";
import { TeamMemberProfileModal } from "./team-member-profile-modal";
import { EmptyState } from "./empty-state";
import type {
  IndustryRef,
  ListingDetail,
  ListingTeamMember,
  Review,
  ServiceSummary,
} from "@/lib/api/marketplace/types";

type Tab = "services" | "team" | "reviews" | "about";

const WEEKDAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

interface Props {
  listing: ListingDetail;
  locale: Locale;
}

export function BusinessDetail({ listing, locale }: Props) {
  const { dict } = useTranslation();
  const toast = useToast();
  const t = dict.business;
  const openBooking = useBooking().openBooking;

  const currency = listing.businessCurrency;
  const locationId = listing.locationId;
  const canBook = listing.allowOnlineBooking;
  // The page is a LOCATION page — lead with the location's name (the
  // business-level listing name is the fallback for legacy payloads).
  const displayName = listing.location?.name || listing.name;

  // Distance from the visitor (client-only geolocation). Null until resolved or
  // when coords/listing position are unavailable → the segment is simply omitted.
  const userCoords = useUserCoords();
  const distanceStr =
    userCoords &&
    listing.location.latitude != null &&
    listing.location.longitude != null
      ? `${haversineKm(userCoords, {
          lat: listing.location.latitude,
          lng: listing.location.longitude,
        }).toFixed(1)} km`
      : null;

  // Record the view (location id) once on mount.
  useEffect(() => {
    pushRecentView(locationId);
  }, [locationId]);

  // Deep-link support (brand page → team member profile): `?tab=<tab>` opens
  // that tab, `?member=<id>` additionally opens that member's profile modal on
  // the team tab. Read once as initial state — in-page navigation stays local.
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams.get("tab");
    return t === "team" || t === "reviews" || t === "about" ? t : "services";
  });
  const [initialMemberId] = useState<number | null>(() => {
    const raw = searchParams.get("member");
    const n = raw ? Number(raw) : NaN;
    return Number.isInteger(n) && n > 0 ? n : null;
  });

  // Single ordered selection list so the appointment summary preserves the exact
  // order the user picked items in (services and bundles interleaved as chosen),
  // rather than grouping all services then all bundles. A `bundle` and a `service`
  // sharing the same numeric id never collide because each ref carries its `type`.
  const [selection, setSelection] = useState<
    Array<{ type: "service" | "bundle"; id: number }>
  >([]);

  const toggleRef = useCallback(
    (type: "service" | "bundle", id: number) =>
      setSelection((prev) =>
        prev.some((x) => x.type === type && x.id === id)
          ? prev.filter((x) => !(x.type === type && x.id === id))
          : [...prev, { type, id }],
      ),
    [],
  );
  const removeRef = useCallback(
    (type: "service" | "bundle", id: number) =>
      setSelection((prev) =>
        prev.filter((x) => !(x.type === type && x.id === id)),
      ),
    [],
  );

  const togglePick = useCallback(
    (serviceId: number) => toggleRef("service", serviceId),
    [toggleRef],
  );
  const removePick = useCallback(
    (serviceId: number) => removeRef("service", serviceId),
    [removeRef],
  );
  const toggleBundle = useCallback(
    (bundleId: number) => toggleRef("bundle", bundleId),
    [toggleRef],
  );
  const removeBundle = useCallback(
    (bundleId: number) => removeRef("bundle", bundleId),
    [removeRef],
  );

  // Derived id sets for O(1) `.has()` checks in the row UIs (kept stable for the
  // existing ServiceRow / bundle-card APIs).
  const picked = useMemo(
    () =>
      new Set(
        selection.filter((x) => x.type === "service").map((x) => x.id),
      ),
    [selection],
  );
  const pickedBundles = useMemo(
    () =>
      new Set(selection.filter((x) => x.type === "bundle").map((x) => x.id)),
    [selection],
  );

  const servicesById = useMemo(
    () => new Map(listing.services.map((s) => [s.id, s])),
    [listing.services],
  );
  const bundlesById = useMemo(
    () => new Map(listing.bundles.map((b) => [b.id, b])),
    [listing.bundles],
  );

  // Build the summary in selection order: services carry `serviceId`, bundles
  // carry `bundleId`. Both flow through the booking drawer unchanged.
  const selectedItems: BookingSelectionItem[] = useMemo(
    () =>
      selection.flatMap((ref): BookingSelectionItem[] => {
        if (ref.type === "service") {
          const s = servicesById.get(ref.id);
          return s
            ? [
                {
                  serviceId: s.id,
                  name: s.name,
                  priceAmountMinor: s.priceAmountMinor,
                  duration: s.duration,
                  // Carry the staff spread so the rail row and the running
                  // total say "from …" wherever the menu row above them does.
                  priceFromMinor: s.priceFromMinor,
                  priceVariesByStaff: s.priceVariesByStaff,
                  durationMinMinutes: s.durationMinMinutes,
                  durationMaxMinutes: s.durationMaxMinutes,
                  durationVariesByStaff: s.durationVariesByStaff,
                },
              ]
            : [];
        }
        const b = bundlesById.get(ref.id);
        return b
          ? [
              {
                bundleId: b.id,
                name: b.name,
                priceAmountMinor: b.priceAmountMinor,
                duration: b.duration,
                // Package-priced, so only the duration can spread.
                durationMinMinutes: b.durationMinMinutes,
                durationMaxMinutes: b.durationMaxMinutes,
                durationVariesByStaff: b.durationVariesByStaff,
              },
            ]
          : [];
      }),
    [selection, servicesById, bundlesById],
  );

  // Totals fold the per-item spreads, so a selection containing even one
  // service whose professionals charge differently reads as a floor ("from
  // €85") rather than a promise the booking flow would then break.
  const totals = useMemo(
    () => sumServiceSpreads(selectedItems),
    [selectedItems],
  );
  const totalsFmt = formatSelectionSpread(totals, currency, locale);

  const onBook = useCallback(() => {
    if (!canBook) return;
    // Book CTA hands over the BOOKING listingId (NOT the route locationId).
    // `catalog` lets the drawer render its own in-drawer service picker
    // (Step 1) when no services were pre-selected on this page.
    openBooking({
      businessId: listing.businessId,
      listingId: listing.listingId,
      locationId: listing.locationId,
      timezone: listing.timezone,
      currency,
      bookingPolicy: listing.bookingPolicy,
      services: selectedItems,
      catalog: {
        serviceCategories: listing.serviceCategories,
        services: listing.services,
        bundles: listing.bundles,
      },
    });
  }, [canBook, openBooking, listing, currency, selectedItems]);

  const onShare = useCallback(() => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: displayName, url }).catch(() => {});
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(url)
        .then(() => toast(t.shareCopied, "copy"))
        .catch(() => {});
    }
  }, [displayName, t.shareCopied, toast]);

  const industry = listing.industry as IndustryRef | null;
  const cat = toCat(industry);
  const industryLabel = industry ? taxonomyLabel(industry, locale) : null;
  // Live open/closed status WITH closing time — same derivation as the map
  // cards (reuse openStatus so the "· closes 20:00" suffix matches exactly).
  const { status, closesAt } = openStatus(listing.location);

  const phone = listing.location.phone;
  const directionsHref = buildDirectionsHref(listing);

  // "See on map" → the search map anchored on this location, with its pin
  // pre-selected (?focus=). Only offered when the location has coordinates.
  const mapHref =
    listing.location.latitude != null && listing.location.longitude != null
      ? `${localeHref(locale, "search")}?lat=${listing.location.latitude}&lng=${listing.location.longitude}&radius=${SEARCH_RADIUS_KM}&focus=${locationId}`
      : null;

  return (
    <main className="zw-container" style={{ paddingTop: 22, width: "100%" }}>
      {/* Back */}
      <button
        type="button"
        className="tap"
        onClick={() => window.history.back()}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 16,
          background: "transparent",
          border: 0,
          cursor: "pointer",
          fontSize: 13.5,
          fontWeight: 600,
          color: "var(--c-600)",
          padding: "4px 0",
        }}
      >
        <Icon name="back" size={14} color="var(--c-600)" />
        {t.back}
      </button>

      <Gallery listing={listing} cat={cat} />

      <div
        data-biz-cols="1"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 372px",
          gap: "clamp(28px, 4vw, 56px)",
          marginTop: 30,
          alignItems: "start",
        }}
      >
        {/* Left column */}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(26px, 3vw, 36px)",
                  fontWeight: 600,
                  letterSpacing: "-0.035em",
                  lineHeight: 1.05,
                  color: "var(--c-900)",
                }}
              >
                {displayName}
              </h1>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 9,
                  marginTop: 12,
                  fontSize: 14,
                  color: "var(--c-600)",
                }}
              >
                {joinDot(
                  [
                    listing.averageRating != null && (
                      <Rating
                        rating={listing.averageRating}
                        reviews={listing.totalReviews}
                        size={14}
                      />
                    ),
                    industryLabel && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <CatDot cat={cat} size={8} />
                        {industryLabel}
                      </span>
                    ),
                    listing.location.city && (
                      <span>{listing.location.city}</span>
                    ),
                    distanceStr && <span>{distanceStr}</span>,
                    status && <StatusPill status={status} closesAt={closesAt} />,
                  ].filter(Boolean) as React.ReactNode[],
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              {mapHref && (
                <Link
                  href={mapHref}
                  className="tap"
                  aria-label={t.seeOnMap}
                  title={t.seeOnMap}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "1px solid rgba(28,28,26,0.12)",
                    background: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="pin" size={16} color="var(--c-800)" />
                </Link>
              )}
              <button
                type="button"
                className="tap"
                aria-label={t.share}
                onClick={onShare}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  cursor: "pointer",
                  border: "1px solid rgba(28,28,26,0.12)",
                  background: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="share" size={16} color="var(--c-800)" />
              </button>
              <FavoriteHeart
                locationId={locationId}
                seeded={listing.isFavorited === true}
              />
            </div>
          </div>

          <Tabs tab={tab} setTab={setTab} dict={t} />

          {tab === "services" && (
            <ServicesTab
              listing={listing}
              picked={picked}
              togglePick={togglePick}
              pickedBundles={pickedBundles}
              toggleBundle={toggleBundle}
              currency={currency}
              locale={locale}
              dict={t}
            />
          )}
          {tab === "team" && (
            <TeamTab
              members={listing.teamMembers}
              initialMemberId={initialMemberId}
              listing={listing}
              locale={locale}
            />
          )}
          {tab === "reviews" && (
            <ReviewsTab listing={listing} locale={locale} dict={t} />
          )}
          {tab === "about" && (
            <AboutTab
              listing={listing}
              locale={locale}
              dict={t}
              phone={phone}
              directionsHref={directionsHref}
            />
          )}
        </div>

        {/* Right rail — sticky on desktop */}
        <div
          className="zw-only-desktop"
          style={{ position: "sticky", top: "calc(var(--nav-h) + 18px)" }}
        >
          <BookingRail
            selectedItems={selectedItems}
            removePick={removePick}
            removeBundle={removeBundle}
            onBook={onBook}
            canBook={canBook}
            totals={totalsFmt}
            currency={currency}
            locale={locale}
            dict={t}
          />
        </div>
      </div>

      {/* Mobile bottom booking bar */}
      <div
        className="zw-only-mobile zv-frost"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: "calc(58px + env(safe-area-inset-bottom))",
          zIndex: 80,
          borderTop: "1px solid rgba(28,28,26,0.08)",
          padding: "10px var(--gutter)",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--c-900)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {selectedItems.length > 0
              ? `${selectedItems.length} · ${
                  totalsFmt.priceVaries ? `${t.priceFrom} ` : ""
                }${totalsFmt.price}`
              : displayName}
          </div>
          {!canBook && (
            <div
              className="txt-pretty"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                lineHeight: 1.45,
                color: "var(--c-600)",
                marginTop: 2,
              }}
            >
              {t.onlineBookingUnavailable}
            </div>
          )}
        </div>
        <Button kind="accent" onClick={onBook} disabled={!canBook}>
          {bookLabel(selectedItems.length, t)}
        </Button>
      </div>
      <div className="zw-only-mobile" style={{ height: 64 }} />
    </main>
  );
}

// ─────────────────────────────────────────────
// Favorite heart — reuses useFavoriteToggle("location"), seeded from
// listing.isFavorited. The hook owns the endpoint/toast/revert logic; we
// blend the seed with the hook's post-interaction state for the visual.
// Hidden entirely for signed-out visitors (same rule as the home/search cards).
// ─────────────────────────────────────────────
function FavoriteHeart({
  locationId,
  seeded,
}: {
  locationId: number;
  seeded: boolean;
}) {
  const { canFavorite, isFavorited, toggle } = useFavoriteToggle("location");
  const [touched, setTouched] = useState(false);
  const active = touched ? isFavorited(locationId) : seeded;
  if (!canFavorite) return null;
  return (
    <HeartButton
      active={active}
      floating={false}
      size={40}
      onClick={() => {
        setTouched(true);
        toggle(locationId);
      }}
    />
  );
}

// ─────────────────────────────────────────────
// Distance segment — "1.2 km" from the visitor to this location, matching the
// map cards' format. Geolocation is client-only, so coords resolve in an effect
// after mount (null on the server and first render → no hydration mismatch).
// Gracefully omits itself when geolocation is unknown/denied or the location
// has no lat/lng (no "NaN km", no dangling "·"). Mirrors RecentlyViewed.
// ─────────────────────────────────────────────
/**
 * Resolves the visitor's coordinates via the Geolocation API (client-only).
 * Returns null on the server, before resolution, and on denial/unavailability,
 * so callers can simply omit any distance UI when it's null.
 */
function useUserCoords(): { lat: number; lng: number } | null {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        /* denied / unavailable → keep distance hidden */
      },
      { timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return coords;
}

// ─────────────────────────────────────────────
// Gallery — featured + portfolio. <2 images → single hero.
// ─────────────────────────────────────────────
function Gallery({
  listing,
  cat,
}: {
  listing: ListingDetail;
  cat: string;
}) {
  const { dict } = useTranslation();
  const t = dict.business;
  const displayName = listing.location?.name || listing.name;
  const photos = useMemo(() => {
    const urls: string[] = [];
    if (listing.featuredImage) urls.push(listing.featuredImage);
    for (const p of listing.portfolioImages) {
      if (p.url && !urls.includes(p.url)) urls.push(p.url);
    }
    return urls;
  }, [listing.featuredImage, listing.portfolioImages]);

  const single = photos.length < 2;

  return (
    <div style={{ position: "relative" }}>
      <div
        data-gallery-grid="1"
        style={{
          display: "grid",
          gridTemplateColumns: single ? "1fr" : "2fr 1fr",
          gridTemplateRows: single ? "1fr" : "1fr 1fr",
          gap: 10,
          height: "clamp(280px, 36vw, 440px)",
          borderRadius: 24,
          overflow: "hidden",
        }}
      >
        <div
          className="zw-zoom-wrap zw-zoom-parent"
          style={{
            gridRow: single ? "auto" : "1 / 3",
            background: "var(--c-300)",
          }}
        >
          <Img
            src={photos[0]}
            alt={displayName}
            label={cat}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
        {!single &&
          photos.slice(1, 3).map((p, i) => (
            <div
              key={i}
              className="zw-zoom-wrap zw-zoom-parent zw-only-desktop"
              style={{ background: "var(--c-300)" }}
            >
              <Img
                src={p}
                alt={`${displayName} ${i + 2}`}
                label={cat}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          ))}
      </div>
      {photos.length > 1 && (
        <span
          style={{
            position: "absolute",
            bottom: 14,
            right: 14,
            background: "rgba(255,255,255,0.94)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(28,28,26,0.10)",
            borderRadius: 999,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--c-900)",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            boxShadow: "var(--sh-sm)",
          }}
        >
          <Icon name="grid" size={14} color="var(--c-900)" />
          {t.showAllPhotos}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────
function Tabs({
  tab,
  setTab,
  dict,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  dict: typeof import("@/i18n/dictionaries/en").en.business;
}) {
  const items: { key: Tab; label: string }[] = [
    { key: "services", label: dict.tabServices },
    { key: "team", label: dict.tabTeam },
    { key: "reviews", label: dict.tabReviews },
    { key: "about", label: dict.tabAbout },
  ];
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        gap: 26,
        borderBottom: "1px solid rgba(28,28,26,0.08)",
        marginTop: 28,
      }}
    >
      {items.map((it) => {
        const on = tab === it.key;
        return (
          <button
            key={it.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => setTab(it.key)}
            className="tap"
            style={{
              background: "transparent",
              border: 0,
              cursor: "pointer",
              padding: "12px 2px 13px",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: on ? "var(--c-900)" : "var(--c-500)",
              boxShadow: on ? "inset 0 -2px 0 var(--p-500)" : "none",
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Services tab — grouped by category (serviceCategories order), with a
// bundles section appended.
// ─────────────────────────────────────────────
function ServicesTab({
  listing,
  picked,
  togglePick,
  pickedBundles,
  toggleBundle,
  currency,
  locale,
  dict,
}: {
  listing: ListingDetail;
  picked: Set<number>;
  togglePick: (id: number) => void;
  pickedBundles: Set<number>;
  toggleBundle: (id: number) => void;
  currency: string;
  locale: Locale;
  dict: typeof import("@/i18n/dictionaries/en").en.business;
}) {
  const groups = useMemo(() => {
    const byCat = new Map<
      number | "uncat",
      { name: string; color: string; items: ServiceSummary[] }
    >();
    // Seed group order from serviceCategories[].
    for (const c of listing.serviceCategories) {
      byCat.set(c.id, { name: c.name, color: c.color, items: [] });
    }
    for (const s of listing.services) {
      const key = s.categoryId ?? "uncat";
      if (!byCat.has(key)) {
        byCat.set(key, {
          name: s.category?.name ?? "",
          color: s.category?.color ?? "var(--c-400)",
          items: [],
        });
      }
      byCat.get(key)!.items.push(s);
    }
    return [...byCat.values()].filter((g) => g.items.length > 0);
  }, [listing.serviceCategories, listing.services]);

  if (listing.services.length === 0 && listing.bundles.length === 0) {
    return (
      <div className="zv-tab-in" style={{ paddingTop: 24 }}>
        <EmptyState
          icon="scissors"
          title={dict.servicesEmptyTitle}
          body={dict.servicesEmptyBody}
        />
      </div>
    );
  }

  return (
    <div
      className="zv-tab-in"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 28,
        paddingTop: 24,
      }}
    >
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.name && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--c-500)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: g.color,
                }}
              />
              {g.name}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {g.items.map((it) => (
              <ServiceRow
                key={it.id}
                id={it.id}
                name={it.name}
                description={it.description}
                service={it}
                on={picked.has(it.id)}
                onToggle={() => togglePick(it.id)}
                currency={currency}
                locale={locale}
                dict={dict}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Bundles — hidden when empty. Each package lists its included services
          and adds as ONE bundled line-item (bundleId) via the +/check toggle. */}
      {listing.bundles.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--c-500)",
            }}
          >
            {dict.bundles}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {listing.bundles.map((b) => {
              const on = pickedBundles.has(b.id);
              // Savings = sum of the contained services' à-la-carte prices minus
              // the bundle price. Positive only for FIXED/DISCOUNT bundles; a plain
              // SUM bundle nets zero, so the discount UI is hidden.
              const originalMinor = b.services.reduce(
                (sum, s) => sum + s.priceAmountMinor,
                0,
              );
              const savedMinor = originalMinor - b.priceAmountMinor;
              const hasDiscount = originalMinor > 0 && savedMinor > 0;
              const pct = hasDiscount
                ? Math.round((savedMinor / originalMinor) * 100)
                : 0;
              return (
                <div
                  key={b.id}
                  className="zw-hover-row"
                  style={{
                    padding: "15px 10px",
                    borderRadius: 14,
                    boxShadow: "inset 0 -1px 0 rgba(28,28,26,0.05)",
                  }}
                >
                  {/* Name + savings badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15.5,
                        fontWeight: 600,
                        color: "var(--c-900)",
                        letterSpacing: "-0.015em",
                        minWidth: 0,
                      }}
                    >
                      {b.name}
                    </div>
                    {hasDiscount && (
                      <span
                        style={{
                          flexShrink: 0,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--s-success-600)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {dict.bundleSave}{" "}
                        {formatMoney(savedMinor, currency, locale)} · {pct}%
                      </span>
                    )}
                  </div>

                  {b.description && (
                    <div
                      className="txt-pretty"
                      style={{
                        fontSize: 13,
                        color: "var(--c-600)",
                        marginTop: 3,
                      }}
                    >
                      {b.description}
                    </div>
                  )}

                  {/* Included services — vertical list, each with a checkmark */}
                  {b.services.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 7,
                        marginTop: 11,
                      }}
                    >
                      {b.services.map((s) => (
                        <div
                          key={s.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            fontSize: 13.5,
                            color: "var(--c-700)",
                          }}
                        >
                          <Icon
                            name="check"
                            size={14}
                            color="var(--p-600)"
                          />
                          <span>{s.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer — price (with struck-through original) + add toggle */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                      gap: 16,
                      marginTop: 13,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--c-900)",
                          }}
                        >
                          {formatMoney(b.priceAmountMinor, currency, locale)}
                        </span>
                        {hasDiscount && (
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 12,
                              color: "var(--c-400)",
                              textDecoration: "line-through",
                            }}
                          >
                            {formatMoney(originalMinor, currency, locale)}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "var(--c-500)",
                          marginTop: 4,
                        }}
                      >
                        {formatServiceSpread(b, currency, locale).duration}
                      </div>
                    </div>
                    <ToggleAddButton
                      on={on}
                      onToggle={() => toggleBundle(b.id)}
                      label={b.name}
                      dict={dict}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ServiceRow({
  name,
  description,
  service,
  on,
  onToggle,
  currency,
  locale,
  dict,
}: {
  id: number;
  name: string;
  description: string | null;
  /** Carries the staff spread, so the row can say "from …" when price varies. */
  service: ServiceSpread;
  on: boolean;
  onToggle: () => void;
  currency: string;
  locale: Locale;
  dict: typeof import("@/i18n/dictionaries/en").en.business;
}) {
  const meta = formatServiceSpread(service, currency, locale);
  return (
    <div
      className="zw-hover-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "15px 10px",
        borderRadius: 14,
        boxShadow: "inset 0 -1px 0 rgba(28,28,26,0.05)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15.5,
            fontWeight: 600,
            color: "var(--c-900)",
            letterSpacing: "-0.015em",
          }}
        >
          {name}
        </div>
        {description && (
          <div
            className="txt-pretty"
            style={{ fontSize: 13, color: "var(--c-600)", marginTop: 3 }}
          >
            {description}
          </div>
        )}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--c-700)",
            marginTop: 6,
          }}
        >
          {meta.duration} ·{" "}
          {meta.priceVaries && (
            <span style={{ fontWeight: 500, color: "var(--c-600)" }}>
              {dict.priceFrom}{" "}
            </span>
          )}
          {meta.price}
        </div>
      </div>
      <ToggleAddButton on={on} onToggle={onToggle} label={name} dict={dict} />
    </div>
  );
}

// Shared 38×38 circular add/remove toggle — used by both service rows and
// package (bundle) rows so the styling/markup stay identical.
function ToggleAddButton({
  on,
  onToggle,
  label,
  dict,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
  dict: typeof import("@/i18n/dictionaries/en").en.business;
}) {
  return (
    <button
      type="button"
      className="tap"
      onClick={onToggle}
      aria-label={on ? `${dict.remove} ${label}` : `${dict.add} ${label}`}
      aria-pressed={on}
      style={{
        width: 38,
        height: 38,
        borderRadius: "50%",
        cursor: "pointer",
        flexShrink: 0,
        border: on ? "1px solid var(--c-ink)" : "1px solid rgba(28,28,26,0.16)",
        background: on ? "var(--c-ink)" : "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={on ? "check" : "plus"} size={16} color={on ? "#fff" : "var(--c-900)"} />
    </button>
  );
}

// ─────────────────────────────────────────────
// Team tab — grid of cards; clicking opens a read-only modal.
// ─────────────────────────────────────────────
function TeamTab({
  members,
  initialMemberId,
  listing,
  locale,
}: {
  members: ListingTeamMember[];
  initialMemberId?: number | null;
  listing: ListingDetail;
  locale: Locale;
}) {
  // Deep-linked member (?member=<id>) starts with their profile modal open.
  const [open, setOpen] = useState<ListingTeamMember | null>(
    () => members.find((m) => m.id === initialMemberId) ?? null,
  );
  if (members.length === 0) return null;
  return (
    <div
      className="zv-tab-in"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 16,
        paddingTop: 24,
      }}
    >
      {members.map((m) => {
        const displayName =
          m.displayName ??
          [m.firstName, m.lastName].filter(Boolean).join(" ").trim();
        return (
          <div
            key={m.id}
            className="zw-hover-lift"
            role="button"
            tabIndex={0}
            onClick={() => setOpen(m)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpen(m);
              }
            }}
            style={{
              background: "#fff",
              border: "1px solid rgba(28,28,26,0.07)",
              borderRadius: 18,
              padding: "22px 16px 18px",
              cursor: "pointer",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              boxShadow: "var(--sh-sm)",
            }}
          >
            <Avatar
              src={m.profileImage ?? undefined}
              name={displayName}
              size={72}
              ring
            />
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--c-900)",
                letterSpacing: "-0.015em",
                marginTop: 4,
              }}
            >
              {displayName}
            </div>
            {m.professionalTitle && (
              <div
                style={{ fontSize: 12.5, color: "var(--c-600)", marginTop: -4 }}
              >
                {m.professionalTitle}
              </div>
            )}
            {m.averageRating != null && (
              <Rating
                rating={m.averageRating}
                reviews={m.totalReviews}
                size={12.5}
              />
            )}
          </div>
        );
      })}
      {open && (
        <TeamMemberProfileModal
          member={open}
          listing={listing}
          locale={locale}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Reviews tab — average + distribution + paginated list.
// ─────────────────────────────────────────────
function ReviewsTab({
  listing,
  locale,
  dict,
}: {
  listing: ListingDetail;
  locale: Locale;
  dict: typeof import("@/i18n/dictionaries/en").en.business;
}) {
  const [reviews, setReviews] = useState<Review[]>(listing.reviews);
  const [offset, setOffset] = useState(listing.reviews.length);
  const [total, setTotal] = useState(listing.reviewStats.totalCount);
  const [loading, setLoading] = useState(false);

  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }),
    [locale],
  );

  const stats = listing.reviewStats;
  const distTotal = useMemo(
    () =>
      Object.values(stats.ratingDistribution).reduce(
        (a, v) => a + (v || 0),
        0,
      ) || 1,
    [stats.ratingDistribution],
  );

  const loadMore = useCallback(() => {
    setLoading(true);
    const limit = 10;
    getListingReviews(listing.locationId, { offset, limit })
      .then((res) => {
        setReviews((prev) => [...prev, ...res.data]);
        setOffset(res.pagination.offset + res.data.length);
        setTotal(res.pagination.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [listing.locationId, offset]);

  if (stats.totalCount === 0 && reviews.length === 0) {
    return (
      <div className="zv-tab-in" style={{ paddingTop: 24 }}>
        <EmptyState
          icon="starO"
          title={dict.reviewsEmptyTitle}
          body={dict.reviewsEmptyBody}
        />
      </div>
    );
  }

  const hasMore = offset < total;

  return (
    <div className="zv-tab-in" style={{ paddingTop: 24 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "clamp(24px, 4vw, 56px)",
          alignItems: "center",
          padding: "6px 0 26px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: "var(--c-900)",
            }}
          >
            {(stats.averageRating ?? 0).toFixed(1)}
          </div>
          <div style={{ marginTop: 8 }}>
            <Stars value={stats.averageRating ?? 0} size={15} />
          </div>
          <div style={{ fontSize: 13, color: "var(--c-600)", marginTop: 7 }}>
            {format(
              stats.totalCount === 1 ? dict.reviewsCountOne : dict.reviewsCount,
              { count: String(stats.totalCount) },
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 7,
            maxWidth: 420,
          }}
        >
          {[5, 4, 3, 2, 1].map((s) => {
            const count = stats.ratingDistribution[s] ?? 0;
            return (
              <div
                key={s}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "var(--c-600)",
                    width: 10,
                  }}
                >
                  {s}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 7,
                    borderRadius: 99,
                    background: "var(--c-200)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.round((count / distTotal) * 100)}%`,
                      height: "100%",
                      borderRadius: 99,
                      background: "var(--p-500)",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--c-500)",
                    width: 28,
                    textAlign: "right",
                  }}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {reviews.map((r) => {
          const name = [r.customer.firstName, r.customer.lastName]
            .filter(Boolean)
            .join(" ")
            .trim();
          return (
            <div
              key={r.id}
              style={{
                padding: "20px 0",
                boxShadow: "inset 0 -1px 0 rgba(28,28,26,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 10,
                }}
              >
                <Avatar
                  src={r.customer.profileImage ?? undefined}
                  name={name || "?"}
                  size={38}
                />
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--c-900)",
                    }}
                  >
                    {name || "—"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 3,
                    }}
                  >
                    <Stars value={r.rating} size={11} />
                    <span style={{ fontSize: 12, color: "var(--c-500)" }}>
                      {dateFmt.format(new Date(r.createdAt))}
                    </span>
                  </div>
                </div>
              </div>
              {r.comment && (
                <p
                  className="txt-pretty"
                  style={{
                    margin: 0,
                    fontSize: 14.5,
                    lineHeight: 1.6,
                    color: "var(--c-800)",
                    maxWidth: 640,
                  }}
                >
                  {r.comment}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {hasMore && (
        <div style={{ marginTop: 18 }}>
          <Button
            kind="secondary"
            onClick={loadMore}
            disabled={loading}
          >
            {dict.loadMoreReviews}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// About tab — description, opening hours, address.
// ─────────────────────────────────────────────
function AboutTab({
  listing,
  locale,
  dict,
  phone,
  directionsHref,
}: {
  listing: ListingDetail;
  locale: Locale;
  dict: typeof import("@/i18n/dictionaries/en").en.business;
  phone: string | null;
  directionsHref: string | null;
}) {
  const timezone = listing.timezone;
  const dayName = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, {
      weekday: "long",
      timeZone: timezone,
    });
    // Map weekday key → localized long name using a known reference week.
    // 2024-01-07 is a Sunday (UTC); index 0..6 = Sun..Sat.
    const names: Record<string, string> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.UTC(2024, 0, 7 + i, 12));
      names[WEEKDAY_KEYS[i]] = fmt.format(d);
    }
    return names;
  }, [locale, timezone]);

  const wh = listing.location.workingHours ?? {};

  return (
    <div
      className="zv-tab-in"
      style={{
        paddingTop: 24,
        display: "flex",
        flexDirection: "column",
        gap: 30,
      }}
    >
      {listing.description && (
        <p
          className="txt-pretty"
          style={{
            margin: 0,
            fontSize: 15.5,
            lineHeight: 1.65,
            color: "var(--c-800)",
            maxWidth: 620,
          }}
        >
          {listing.description}
        </p>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 28,
        }}
      >
        {!listing.location.open247 && (
          <div>
            <Kicker>{dict.hours}</Kicker>
            <div
              style={{ display: "flex", flexDirection: "column", gap: 9 }}
            >
              {/* Render Monday-first. */}
              {[1, 2, 3, 4, 5, 6, 0].map((i) => {
                const key = WEEKDAY_KEYS[i];
                const day = wh[key];
                const isOpen = day?.isOpen && day.open && day.close;
                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      fontSize: 14,
                    }}
                  >
                    <span style={{ color: "var(--c-700)" }}>{dayName[key]}</span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12.5,
                        fontWeight: 500,
                        color: isOpen ? "var(--c-800)" : "var(--c-500)",
                      }}
                    >
                      {isOpen ? `${day!.open} – ${day!.close}` : dict.closed}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div>
          <Kicker>{dict.address}</Kicker>
          <div
            style={{
              fontSize: 14.5,
              color: "var(--c-800)",
              lineHeight: 1.5,
            }}
          >
            {listing.location.address || listing.location.city || "—"}
            {listing.location.address && listing.location.city && (
              <>
                <br />
                {listing.location.city}
              </>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            {phone && (
              <a href={`tel:${phone}`} style={{ textDecoration: "none" }}>
                <Button kind="secondary" size="sm">
                  <Icon name="phone" size={14} color="var(--c-800)" />
                  {dict.call}
                </Button>
              </a>
            )}
            {directionsHref && (
              <a
                href={directionsHref}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "none" }}
              >
                <Button kind="secondary" size="sm">
                  <Icon name="pin" size={14} color="var(--c-800)" />
                  {dict.directions}
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Brand — who runs this location; links to the brand page. Older API
          payloads may lack businessSlug — the brand route also resolves the
          numeric business id. */}
      <div>
        <Kicker>{dict.aboutBrand}</Kicker>
        <Link
          href={localeHref(
            locale,
            "brand",
            listing.businessSlug ?? String(listing.businessId),
          )}
          className="zw-hover-row"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            maxWidth: 420,
            padding: 10,
            margin: -10,
            borderRadius: 14,
            textDecoration: "none",
          }}
        >
          <Avatar
            src={listing.logo ?? undefined}
            name={listing.name}
            size={48}
            ring
          />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontSize: 15,
                fontWeight: 600,
                color: "var(--c-900)",
                letterSpacing: "-0.015em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {listing.name}
            </span>
            {listing.industry && (
              <span
                style={{
                  display: "block",
                  fontSize: 12.5,
                  color: "var(--c-600)",
                  marginTop: 2,
                }}
              >
                {taxonomyLabel(listing.industry, locale)}
              </span>
            )}
          </span>
        </Link>
      </div>
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--c-500)",
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// Booking rail — sticky right column.
// ─────────────────────────────────────────────
function BookingRail({
  selectedItems,
  removePick,
  removeBundle,
  onBook,
  canBook,
  totals,
  currency,
  locale,
  dict,
}: {
  selectedItems: BookingSelectionItem[];
  removePick: (serviceId: number) => void;
  removeBundle: (bundleId: number) => void;
  onBook: () => void;
  canBook: boolean;
  /** Pre-formatted selection spread — see formatSelectionSpread. */
  totals: ReturnType<typeof formatSelectionSpread>;
  currency: string;
  locale: Locale;
  dict: typeof import("@/i18n/dictionaries/en").en.business;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid rgba(28,28,26,0.08)",
        borderRadius: 22,
        boxShadow: "var(--sh-md)",
        padding: "22px 22px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--c-900)",
        }}
      >
        {dict.bookHeading}
      </div>

      {selectedItems.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            background: "var(--c-50)",
            border: "1px solid rgba(28,28,26,0.06)",
            borderRadius: 14,
            padding: "6px 4px",
          }}
        >
          {selectedItems.map((it) => {
            const itemMeta = formatServiceSpread(it, currency, locale);
            return (
            <div
              key={
                it.serviceId != null ? `s${it.serviceId}` : `b${it.bundleId}`
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "var(--c-900)",
                  }}
                >
                  {it.name}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "var(--c-600)",
                    marginTop: 2,
                  }}
                >
                  {itemMeta.duration} ·{" "}
                  {itemMeta.priceVaries && (
                    <span style={{ fontWeight: 500 }}>{dict.priceFrom} </span>
                  )}
                  {itemMeta.price}
                </div>
              </div>
              <button
                type="button"
                className="tap"
                onClick={() => {
                  if (it.serviceId != null) removePick(it.serviceId);
                  else if (it.bundleId != null) removeBundle(it.bundleId);
                }}
                aria-label={`${dict.remove} ${it.name}`}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  border: 0,
                  cursor: "pointer",
                  background: "var(--c-200)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name="x" size={12} color="var(--c-700)" />
              </button>
            </div>
            );
          })}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 10px 8px",
              borderTop: "1px solid rgba(28,28,26,0.07)",
              marginTop: 2,
            }}
          >
            <span
              style={{ fontSize: 13, fontWeight: 600, color: "var(--c-700)" }}
            >
              {totals.duration} {dict.totalLabel}
            </span>
            <span
              style={{
                fontSize: 14.5,
                fontWeight: 700,
                color: "var(--c-900)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {totals.priceVaries && (
                <span style={{ fontWeight: 500, fontSize: 12.5 }}>
                  {dict.priceFrom}{" "}
                </span>
              )}
              {totals.price}
            </span>
          </div>
        </div>
      ) : (
        <div
          style={{
            fontSize: 13.5,
            color: "var(--c-600)",
            lineHeight: 1.5,
            background: "var(--c-50)",
            border: "1px dashed rgba(28,28,26,0.14)",
            borderRadius: 14,
            padding: "14px 16px",
          }}
        >
          {dict.bookRailEmpty}
        </div>
      )}

      <Button
        kind="accent"
        size="lg"
        onClick={onBook}
        disabled={!canBook}
        style={{ width: "100%" }}
      >
        {bookLabel(selectedItems.length, dict)}
      </Button>

      {!canBook && (
        <div
          className="txt-pretty"
          style={{
            textAlign: "center",
            fontSize: 12,
            lineHeight: 1.45,
            color: "var(--c-500)",
          }}
        >
          {dict.onlineBookingUnavailable}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function bookLabel(
  count: number,
  dict: typeof import("@/i18n/dictionaries/en").en.business,
): string {
  if (count === 0) return dict.bookNow;
  return format(count === 1 ? dict.bookNOne : dict.bookN, {
    count: String(count),
  });
}

/**
 * Interleave a list of already-filtered info-line nodes with "·" separators,
 * so no dangling separators appear regardless of which segments are present.
 */
function joinDot(nodes: React.ReactNode[]): React.ReactNode[] {
  return nodes.flatMap((node, i) =>
    i === 0
      ? [<span key={`seg-${i}`}>{node}</span>]
      : [
          <span key={`dot-${i}`} style={{ color: "var(--c-400)" }}>
            ·
          </span>,
          <span key={`seg-${i}`}>{node}</span>,
        ],
  );
}

/** Haversine distance in km between two {lat,lng} points. */
function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371; // Earth radius (km)
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Google Maps directions URL from coords, falling back to the address. */
function buildDirectionsHref(listing: ListingDetail): string | null {
  const { latitude, longitude, address } = listing.location;
  if (latitude != null && longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address,
    )}`;
  }
  return null;
}
