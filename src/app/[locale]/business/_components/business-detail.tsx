"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { localeHref } from "@/i18n/routes";
import { InlineError } from "@/components/ui/inline-error";
import {
  Avatar,
  CatDot,
  HeartButton,
  Icon,
  Rating,
  StatusPill,
  Skeleton,
  useToast,
} from "@/components/ui";
import { taxonomyLabel, toCat } from "@/lib/marketplace/card-mappers";
import { openStatus } from "@/lib/marketplace/working-hours";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import {
  formatSelectionSpread,
  sumServiceSpreads,
} from "@/lib/format/money-time";
import { useBooking } from "@/lib/booking";
import type { BookingSelectionItem } from "@/lib/booking";
import { pushRecentView } from "@/lib/recent-views";
import { useFavoriteToggle } from "@/app/_components/home/use-favorite-toggle";
import { SEARCH_RADIUS_KM } from "@/components/search/constants";
import { TeamMemberProfileModal } from "./team-member-profile-modal";
import { EmptyState } from "./empty-state";
import styles from "./business-detail.module.css";
import { LocationGallery } from "./location-gallery";
import { LocationServices } from "./location-services";
import { LocationReviews } from "./location-reviews";
import { LocationBookingSummary } from "./location-booking-summary";
import { LocationAbout } from "./location-about";
import type {
  IndustryRef,
  ListingDetail,
  ListingTeamMember,
} from "@/lib/api/marketplace/types";

type Tab = "services" | "team" | "reviews" | "about";

interface Props {
  listing: ListingDetail;
  locale: Locale;
  categoryHref?: string | null;
}

export function BusinessDetail({ listing, locale, categoryHref }: Props) {
  const { dict } = useTranslation();
  const toast = useToast();
  const t = dict.business;
  const openBooking = useBooking().openBooking;

  const currency = listing.businessCurrency;
  const locationId = listing.locationId;
  const hasCatalog = listing.services.length > 0 || listing.bundles.length > 0;
  const canBook = listing.allowOnlineBooking && hasCatalog;
  const showPricing = !(listing.additionalSettings && typeof listing.additionalSettings === "object" && "showPricing" in listing.additionalSettings && listing.additionalSettings.showPricing === false);
  const router = useRouter();
  const panelId = useId();
  const now = useSyncExternalStore(subscribeClock, minuteSnapshot, serverClockSnapshot);
  const [shareError, setShareError] = useState(false);
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
  const [visitedTabs, setVisitedTabs] = useState<Set<Tab>>(() => new Set([tab]));
  const selectTab = (next: Tab) => {
    setTab(next);
    setVisitedTabs(previous => previous.has(next) ? previous : new Set([...previous, next]));
  };
  const [memberId, setMemberId] = useState<number | null>(() => {
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
    (type: "service" | "bundle", id: number) => {
      if (!canBook) return;
      setSelection((prev) =>
        prev.some((x) => x.type === type && x.id === id)
          ? prev.filter((x) => !(x.type === type && x.id === id))
          : [...prev, { type, id }],
      );
    },
    [canBook],
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
      showPricing,
      bookingPolicy: listing.bookingPolicy,
      services: selectedItems,
      catalog: {
        serviceCategories: listing.serviceCategories,
        services: listing.services,
        bundles: listing.bundles,
      },
    });
  }, [canBook, openBooking, listing, currency, showPricing, selectedItems]);

  const onShare = useCallback(async () => {
    setShareError(false);
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: displayName, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      toast(t.shareCopied, "copy");
    } catch {
      setShareError(true);
    }
  }, [displayName, t.shareCopied, toast]);

  const industry = listing.industry as IndustryRef | null;
  const cat = toCat(industry);
  const industryLabel = industry ? taxonomyLabel(industry, locale) : null;
  const { status, closesAt } = now === null ? {} : openStatus({ ...listing.location, timezone: listing.timezone }, new Date(now));
  const phone = listing.location.phone || listing.phone;
  const directionsHref = buildDirectionsHref(listing);
  const brandHref = localeHref(locale, "brand", listing.businessSlug ?? String(listing.businessId));
  const mapHref = listing.location.latitude != null && listing.location.longitude != null
    ? `${localeHref(locale, "search")}?lat=${listing.location.latitude}&lng=${listing.location.longitude}&radius=${SEARCH_RADIUS_KM}&focus=${locationId}`
    : null;
  const servicesLabel = format(listing.services.length === 1 ? dict.locationPage.servicesCountOne : dict.locationPage.servicesCount, { count: String(listing.services.length) });

  return <main className={`zw-container ${styles.page}`}>
    <button type="button" className={styles.back} onClick={() => {
      if (window.history.length > 1) router.back();
      else router.push(localeHref(locale, "search"));
    }}><Icon name="back" size={15} />{t.back}</button>

    <LocationGallery listing={listing} cat={cat} />

    <div className={styles.columns}>
      <div className={styles.content}>
        <header className={styles.identity}>
          <div className={styles.identityTop}>
            <div className={styles.identityText}>
              <Link href={brandHref} className={styles.brandLink}><Avatar src={listing.logo ?? undefined} name={listing.name} size={22} /><span>{listing.name}</span><Icon name="arrowUR" size={12} /></Link>
              <h1>{displayName}</h1>
            </div>
            <div className={styles.identityActions}>
              {mapHref && <Link href={mapHref} className={`${styles.iconAction} ${styles.mapAction}`} aria-label={t.seeOnMap} title={t.seeOnMap}><Icon name="pin" size={17} /></Link>}
              <button type="button" className={styles.iconAction} aria-label={t.share} title={t.share} onClick={onShare}><Icon name="share" size={17} /></button>
              <FavoriteHeart locationId={locationId} />
            </div>
          </div>
          <div className={styles.meta}>
            {listing.averageRating != null && <button type="button" className={styles.ratingLink} onClick={() => selectTab("reviews")}><Rating rating={listing.averageRating} reviews={listing.totalReviews} size={14} /></button>}
            {industryLabel && (categoryHref ? <Link href={categoryHref} prefetch={false} className={styles.categoryLink}><CatDot cat={cat} size={7} />{industryLabel}</Link> : <span className={styles.categoryLink}><CatDot cat={cat} size={7} />{industryLabel}</span>)}
            {distanceStr && <span>{distanceStr}</span>}
            {now === null ? <Skeleton w={105} h={16} style={{ display: "inline-block" }} /> : status && <StatusPill status={status} closesAt={closesAt} />}
          </div>
          {(listing.location.address || listing.location.city) && <div className={styles.addressLine}><Icon name="pin" size={15} />{directionsHref ? <a href={directionsHref} target="_blank" rel="noreferrer">{listing.location.address || listing.location.city}</a> : <span>{listing.location.address || listing.location.city}</span>}</div>}
          {shareError && <InlineError>{dict.locationPage.shareError}</InlineError>}
        </header>

        <Tabs tab={tab} setTab={selectTab} listing={listing} panelId={panelId} />
        {(["services", "team", "reviews", "about"] as const).map(key => <div key={key} role="tabpanel" id={`${panelId}-${key}-panel`} aria-labelledby={`${panelId}-${key}-tab`} hidden={tab !== key} tabIndex={0} className={styles.tabPanel}>
          {visitedTabs.has(key) && <>
            {key === "services" && <LocationServices listing={listing} locale={locale} picked={picked} pickedBundles={pickedBundles} togglePick={togglePick} toggleBundle={toggleBundle} canSelect={canBook} showPricing={showPricing} />}
            {key === "team" && <TeamTab members={listing.teamMembers} memberId={memberId} setMemberId={setMemberId} listing={listing} locale={locale} />}
            {key === "reviews" && <LocationReviews listing={listing} locale={locale} />}
            {key === "about" && <LocationAbout listing={listing} locale={locale} phone={phone} directionsHref={directionsHref} />}
          </>}
        </div>)}
      </div>
      <LocationBookingSummary selectedItems={selectedItems} removePick={removePick} removeBundle={removeBundle} onBook={onBook} canBook={canBook} hasCatalog={hasCatalog} showPricing={showPricing} phone={phone} displayName={displayName} totals={totalsFmt} currency={currency} locale={locale} />
    </div>
    <span className="sr-only">{servicesLabel}</span>
  </main>;
}

function FavoriteHeart({ locationId }: { locationId: number }) {
  const { isFavorited, toggle } = useFavoriteToggle("location");
  return <HeartButton active={isFavorited(locationId)} floating={false} size={44} onClick={() => { toggle(locationId); }} />;
}

function Tabs({ tab, setTab, listing, panelId }: { tab: Tab; setTab: (tab: Tab) => void; listing: ListingDetail; panelId: string }) {
  const { dict } = useTranslation();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const items: Array<{ key: Tab; label: string; count?: number }> = [
    { key: "services", label: dict.business.tabServices, count: listing.services.length + listing.bundles.length },
    { key: "team", label: dict.business.tabTeam, count: listing.teamMembers.length },
    { key: "reviews", label: dict.business.tabReviews, count: listing.totalReviews },
    { key: "about", label: dict.business.tabAbout },
  ];
  return <div role="tablist" aria-label={dict.business.location} className={styles.tabs}>
    {items.map((item, index) => <button key={item.key} ref={element => { refs.current[index] = element; }} type="button" role="tab" id={`${panelId}-${item.key}-tab`} aria-controls={`${panelId}-${item.key}-panel`} aria-selected={tab === item.key} tabIndex={tab === item.key ? 0 : -1} onClick={() => setTab(item.key)} onKeyDown={event => {
      let next: number;
      if (event.key === "ArrowRight") next = (index + 1) % items.length;
      else if (event.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = items.length - 1;
      else return;
      event.preventDefault();
      setTab(items[next].key);
      refs.current[next]?.focus();
    }}>{item.label}{item.count != null && <span className={styles.tabCount}>{item.count}</span>}</button>)}
  </div>;
}

function TeamTab({ members, memberId, setMemberId, listing, locale }: { members: ListingTeamMember[]; memberId: number | null; setMemberId: (id: number | null) => void; listing: ListingDetail; locale: Locale }) {
  const { dict } = useTranslation();
  const [view, setView] = useState<"grid" | "list">("grid");
  const selected = members.find(member => member.id === memberId);
  if (members.length === 0) return <EmptyState icon="user" title={dict.locationPage.teamEmptyTitle} body={dict.locationPage.teamEmptyBody} />;
  return <div className={styles.team}>
    <div className={styles.teamToolbar}><p>{format(members.length === 1 ? dict.locationPage.professionalsCountOne : dict.locationPage.professionalsCount, { count: String(members.length) })}</p><div className={styles.viewSwitch}>
      <button type="button" aria-label={dict.locationPage.gridView} aria-pressed={view === "grid"} onClick={() => setView("grid")}><Icon name="grid" size={17} /></button>
      <button type="button" aria-label={dict.locationPage.listView} aria-pressed={view === "list"} onClick={() => setView("list")}><Icon name="list" size={17} /></button>
    </div></div>
    <div className={view === "grid" ? styles.teamGrid : styles.teamList}>{members.map(member => {
      const name = member.displayName || [member.firstName, member.lastName].filter(Boolean).join(" ");
      return <button key={member.id} type="button" className={styles.teamCard} onClick={() => setMemberId(member.id)}>
        <Avatar src={member.profileImage ?? undefined} name={name} size={80} ring />
        <span className={styles.teamIdentity}><strong>{name}</strong>{member.professionalTitle && <span>{member.professionalTitle}</span>}{member.averageRating != null && <Rating rating={member.averageRating} reviews={member.totalReviews} size={13} />}</span>
        <span className={styles.profileLink}>{dict.locationPage.viewProfile}<Icon name="arrowUR" size={14} /></span>
      </button>;
    })}</div>
    {selected && <TeamMemberProfileModal member={selected} listing={listing} locale={locale} onClose={() => setMemberId(null)} />}
  </div>;
}

function subscribeClock(listener: () => void) {
  const interval = window.setInterval(listener, 30_000);
  document.addEventListener("visibilitychange", listener);
  return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", listener); };
}
const minuteSnapshot = () => Math.floor(Date.now() / 60_000) * 60_000;
const serverClockSnapshot = () => null;

function useUserCoords(): { lat: number; lng: number } | null {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(position => {
      if (!cancelled) setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
    }, () => {}, { timeout: 8000, maximumAge: 5 * 60 * 1000 });
    return () => { cancelled = true; };
  }, []);
  return coords;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const distance = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, distance)));
}

function buildDirectionsHref(listing: ListingDetail): string | null {
  const { latitude, longitude, address } = listing.location;
  if (latitude != null && longitude != null) return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  return address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null;
}
