"use client";

import { Suspense, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { localeHref } from "@/i18n/routes";
import type { ToastHandle } from "@/components/ui/toast";
import {
  Avatar,
  Button,
  HeartButton,
  Icon,
  Rating,
  StatusPill,
  Skeleton,
  useToast,
} from "@/components/ui";
import { taxonomyLabel, toCat } from "@/lib/marketplace/card-mappers";
import { industryVisual } from "@/lib/marketplace/industry-visuals";
import { getPendingFavoriteIds, subscribeFavoriteIds } from "@/lib/favorites/store";
import { openStatus } from "@/lib/marketplace/working-hours";
import { useVenueClock } from "@/lib/marketplace/use-venue-clock";
import { useTranslation } from "@/i18n/useTranslation";
import { format, formatCount } from "@/i18n/format";
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
import { professionalHref } from "@/lib/professionals/urls";
import { locationHref, locationName } from "@/lib/locations/identity";
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
  VenueTagDictionaries,
} from "@/lib/api/marketplace/types";
import type { LocationBrandSummary } from "@/lib/marketplace/location-brand.server";

type Tab = "services" | "team" | "reviews" | "about";

interface Props {
  listing: ListingDetail;
  locale: Locale;
  categoryHref?: string | null;
  /** Whether the header's category page lists a place other than this one. */
  categoryHasOthers?: boolean;
  /** This location's own venue tags, resolved on the server; null when it has none. */
  venueTags?: VenueTagDictionaries | null;
  /** The brand page's details for the other locations; null when unavailable. */
  brand?: LocationBrandSummary | null;
}

export function BusinessDetail({ listing, locale, categoryHref, categoryHasOthers = false, venueTags = null, brand = null }: Props) {
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
  const now = useVenueClock();
  const shareToast = useRef<ToastHandle | null>(null);
  const sharePending = useRef(false);
  const shareActive = useRef(true);
  const [sharing, setSharing] = useState(false);
  useEffect(() => {
    shareActive.current = true;
    return () => { shareActive.current = false; shareToast.current?.dismiss(); };
  }, []);
  // The page is a LOCATION page — lead with the location's name (the
  // business-level listing name is the fallback for legacy payloads).
  const displayName = locationName(listing);

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

  // Keep the location's base content in ISR HTML. Query-only deep links are
  // applied by a small Suspense child, rather than suspending this whole page.
  const [tab, setTab] = useState<Tab>("services");
  const [memberId, setMemberId] = useState<number | null>(null);
  const initialUrlApplied = useRef(false);
  const selectTab = useCallback((next: Tab) => {
    // A user's local selection wins if the URL resolver hydrates later.
    initialUrlApplied.current = true;
    setTab(next);
    // The address follows the visible tab, so a refresh or a copied link reopens it.
    // Replacing the entry keeps Back leaving the page rather than stepping through tabs.
    const url = new URL(window.location.href);
    if (next === "services") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    url.searchParams.delete("member");
    if (url.href !== window.location.href) window.history.replaceState(null, "", url);
  }, []);
  const applyInitialUrl = useCallback((next: Tab, nextMemberId: number | null) => {
    if (initialUrlApplied.current) return;
    initialUrlApplied.current = true;
    setTab(next);
    setMemberId(next === "team" ? nextMemberId : null);
  }, []);

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
    // (Step 1); whatever changes there flows back into this page's selection.
    openBooking({
      businessId: listing.businessId,
      listingId: listing.listingId,
      locationId: listing.locationId,
      venue: { businessName: listing.name, locationName: listing.location?.name ?? null },
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
      onServicesChange: (picks) => setSelection(picks),
    });
  }, [canBook, openBooking, listing, currency, showPricing, selectedItems]);

  const copyLink = useCallback(async (url: string) => {
    if (!shareActive.current) return;
    shareToast.current?.dismiss();
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      if (shareActive.current) shareToast.current = toast(t.shareCopied, "copy");
    } catch {
      if (shareActive.current) shareToast.current = toast(dict.locationPage.shareError, "warn", undefined, "error");
    }
  }, [t.shareCopied, dict.locationPage.shareError, toast]);

  const onShare = useCallback(async () => {
    if (sharePending.current) return;
    sharePending.current = true;
    setSharing(true);
    shareToast.current?.dismiss();
    const sharedUrl = new URL(locationHref(locale, listing), window.location.origin);
    if (tab !== "services") sharedUrl.searchParams.set("tab", tab);
    const url = sharedUrl.href;
    try {
      if (navigator.share) {
        try {
          await navigator.share({ title: displayName, url });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          if (shareActive.current) shareToast.current = toast(dict.locationPage.shareFailed, "warn", {
            label: dict.locationPage.copyLink,
            onClick: () => { void copyLink(url); },
          }, "error");
        }
      } else {
        await copyLink(url);
      }
    } finally {
      sharePending.current = false;
      if (shareActive.current) setSharing(false);
    }
  }, [displayName, locale, listing, tab, copyLink, dict.locationPage.shareFailed, dict.locationPage.copyLink, toast]);

  const industry = listing.industry as IndustryRef | null;
  const cat = toCat(industry);
  const visual = industryVisual(cat);
  const industryLabel = industry ? taxonomyLabel({ ...industry, slug: cat }, locale, dict.industries) : null;
  const { status, closesAt } = now === null ? {} : openStatus({ ...listing.location, timezone: listing.location.timezone?.trim() || listing.timezone?.trim() || "" }, new Date(now));
  const phone = listing.location.phone || listing.phone;
  const placeHref = buildPlaceHref(listing);
  const brandHref = localeHref(locale, "brand", listing.businessSlug ?? String(listing.businessId));
  const mapHref = listing.location.latitude != null && listing.location.longitude != null
    ? `${localeHref(locale, "search")}?lat=${listing.location.latitude}&lng=${listing.location.longitude}&radius=${SEARCH_RADIUS_KM}&focus=${locationId}`
    : null;
  const addressLabel = listing.location.address || listing.location.city;
  const compactTitle = Array.from(displayName.trim()).length > 24;
  const formattedRating = listing.averageRating != null
    ? new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(listing.averageRating)
    : null;
  const reviewCountLabel = formatCount(listing.totalReviews, locale, {
    one: t.reviewsCountOne,
    few: t.reviewsCount,
    other: t.reviewsCountMany,
  });
  const hasOpeningStatus = now === null || !!status;
  const servicesLabel = format(listing.services.length === 1 ? dict.locationPage.servicesCountOne : dict.locationPage.servicesCount, { count: String(listing.services.length) });

  return <main className={styles.page}><div className={`zw-container ${styles.frame}`}>
    <Suspense fallback={null}>
      <InitialLocationUrl onResolve={applyInitialUrl} />
    </Suspense>
    <div className={styles.toolbar}>
      <button type="button" className={styles.back} aria-label={t.back} onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(localeHref(locale, "search"));
      }}><Icon name="back" size={16} /><span className={styles.backLabel}>{t.back}</span></button>
      <div className={styles.identityActions}>
        {mapHref && <Link href={mapHref} prefetch={false} className={styles.toolbarMapAction} aria-label={t.seeOnMap}><Icon name="pin" size={18} />{t.seeOnMap}</Link>}
        <Button kind="ghost" size="sm" className={styles.shareAction} loading={sharing} aria-label={t.share} onClick={onShare}><Icon name="share" size={18} /><span className={styles.shareLabel}>{t.share}</span></Button>
        <span className={styles.saveAction}><FavoriteHeart locationId={locationId} /></span>
      </div>
    </div>

    <div className={styles.overview}>
      <header className={styles.identity}>
        <div className={styles.identityText}>
          {(industryLabel || hasOpeningStatus) && <div className={styles.eyebrow}>
            {industryLabel && (categoryHref ? <Link href={categoryHref} prefetch={false} className={styles.categoryLink}><Icon name={visual.icon} color={visual.accent} size={18} />{industryLabel}</Link> : <span className={styles.categoryLink}><Icon name={visual.icon} color={visual.accent} size={18} />{industryLabel}</span>)}
            {hasOpeningStatus && <span className={styles.openingStatus}>
              {now === null ? <Skeleton w={55} h={19} style={{ display: "inline-block" }} /> : status && <StatusPill status={status} />}
              {status === "open" && closesAt && <span className={styles.closingTime}>{format(dict.common.closesAt, { time: closesAt })}</span>}
            </span>}
          </div>}
          <h1 data-long-name={compactTitle || undefined}>{displayName}</h1>
        </div>
        {(formattedRating !== null || distanceStr) && <div className={styles.trust}>
          {formattedRating !== null && <button
            type="button"
            className={styles.ratingLink}
            aria-label={`${dict.locationPage.readReviews}: ${format(dict.locationPage.ratingLabel, { rating: formattedRating })}, ${reviewCountLabel}`}
            onClick={() => selectTab("reviews")}
          >
            <Icon name="star" size={20} color="var(--p-500)" />
            <span className={styles.ratingValue}>{formattedRating}</span>
            <span className={styles.reviewCount}>{reviewCountLabel}</span>
            <Icon name="chevR" size={16} />
          </button>}
          {distanceStr && <div className={styles.meta}><span>{distanceStr}</span></div>}
        </div>}
        {addressLabel && (placeHref ? <a
          href={placeHref}
          target="_blank"
          rel="noreferrer"
          className={`${styles.where} ${styles.addressLink}`}
          aria-label={`${dict.locationPage.openInMaps}: ${addressLabel}`}
        >
          <Icon name="pin" size={20} />
          <span className={styles.addressContent}><span className={styles.addressLine}>{addressLabel}</span></span>
          <Icon name="arrowUR" size={14} />
        </a> : <div className={styles.where}>
          <Icon name="pin" size={20} />
          <span className={styles.addressContent}><span className={styles.addressLine}>{addressLabel}</span></span>
        </div>)}
        <Link href={brandHref} className={styles.brandLink}><Avatar src={listing.logo ?? undefined} name={listing.name} size={32} decorative /><span>{listing.name}</span><Icon name="arrowUR" size={16} /></Link>
      </header>
      <LocationGallery listing={listing} cat={cat} />
    </div>

    <div className={styles.columns}>
      <div className={styles.content}>
        <Tabs tab={tab} setTab={selectTab} listing={listing} panelId={panelId} />
        {/* Public content is present in the initial HTML; tabs only control visibility. */}
        {(["services", "team", "reviews", "about"] as const).map(key => <div key={key} role="tabpanel" id={`${panelId}-${key}-panel`} aria-labelledby={`${panelId}-${key}-tab`} hidden={tab !== key} tabIndex={0} className={styles.tabPanel}>
          {key === "services" && <LocationServices listing={listing} locale={locale} picked={picked} pickedBundles={pickedBundles} togglePick={togglePick} toggleBundle={toggleBundle} canSelect={canBook} showPricing={showPricing} />}
          {key === "team" && <TeamTab members={listing.teamMembers} memberId={tab === "team" ? memberId : null} setMemberId={setMemberId} listing={listing} locale={locale} />}
          {key === "reviews" && <LocationReviews listing={listing} locale={locale} memberId={tab === "reviews" ? memberId : null} setMemberId={setMemberId} />}
          {key === "about" && <LocationAbout listing={listing} locale={locale} phone={phone} now={now} canBook={canBook} venueTags={venueTags} brand={brand} discover={categoryHref && categoryHasOthers && industryLabel ? { href: categoryHref, industry: industryLabel, visual } : null} />}
        </div>)}
      </div>
      <LocationBookingSummary selectedItems={selectedItems} removePick={removePick} removeBundle={removeBundle} onBook={onBook} canBook={canBook} hasCatalog={hasCatalog} showPricing={showPricing} phone={phone} displayName={displayName} totals={totalsFmt} currency={currency} locale={locale} />
    </div>
    <span className="sr-only">{servicesLabel}</span>
  </div></main>;
}

/** Query changes after initialization do not override local tab/profile state. */
function InitialLocationUrl({ onResolve }: { onResolve: (tab: Tab, memberId: number | null) => void }) {
  const searchParams = useSearchParams();
  const applied = useRef(false);
  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    const rawTab = searchParams.get("tab");
    const tab = rawTab === "team" || rawTab === "reviews" || rawTab === "about" ? rawTab : "services";
    const rawMember = searchParams.get("member");
    const memberId = rawMember ? Number(rawMember) : NaN;
    onResolve(tab, Number.isInteger(memberId) && memberId > 0 ? memberId : null);
  }, [onResolve, searchParams]);
  return null;
}

function FavoriteHeart({ locationId }: { locationId: number }) {
  const { isFavorited, toggle } = useFavoriteToggle("location");
  const pending = useSyncExternalStore(subscribeLocationFavorites, () => getPendingFavoriteIds("location").has(locationId), () => false);
  return <HeartButton active={isFavorited(locationId)} loading={pending} floating={false} size={44} iconSize={20} onClick={() => { toggle(locationId); }} />;
}

const subscribeLocationFavorites = (listener: () => void) => subscribeFavoriteIds("location", listener);

function Tabs({ tab, setTab, listing, panelId }: { tab: Tab; setTab: (tab: Tab) => void; listing: ListingDetail; panelId: string }) {
  const { dict } = useTranslation();
  const listRef = useRef<HTMLDivElement>(null);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const [indicator, setIndicator] = useState<{ x: number; scale: number } | null>(null);
  const [hover, setHover] = useState<{ left: number; right: number; visible: boolean; instant: boolean } | null>(null);
  const items: Array<{ key: Tab; label: string; count?: number }> = [
    { key: "services", label: dict.business.tabServices, count: listing.services.length + listing.bundles.length },
    { key: "team", label: dict.business.tabTeam, count: listing.teamMembers.length },
    { key: "reviews", label: dict.business.tabReviews, count: listing.totalReviews },
    { key: "about", label: dict.business.tabAbout },
  ];
  const activeIndex = items.findIndex(item => item.key === tab);

  // The ink rule springs between tabs once measured. Until then the selected tab
  // keeps its own border, so server HTML and the first paint already show it.
  useLayoutEffect(() => {
    const list = listRef.current;
    const active = refs.current[activeIndex];
    if (!list || !active) return;
    const measure = () => {
      if (!list.clientWidth) return;
      const x = active.offsetLeft;
      const scale = active.offsetWidth / list.clientWidth;
      setIndicator(previous => previous?.x === x && previous.scale === scale ? previous : { x, scale });
    };
    measure();
    // Fonts settling, viewport changes and the hidden phone counts all move labels.
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    for (const element of refs.current) if (element) observer.observe(element);
    return () => observer.disconnect();
  }, [activeIndex]);

  // From deep in a long panel, a shorter one would open at the footer. Start
  // the new panel just under the stuck bar instead. The bar opens the content
  // column, so the column's top is where the bar sits before it sticks.
  const choose = (key: Tab) => {
    const list = listRef.current;
    const column = list?.parentElement;
    if (key !== tab && list && column) {
      const offset = column.getBoundingClientRect().top - (parseFloat(getComputedStyle(list).top) || 0);
      if (offset < -1) window.scrollTo({ top: window.scrollY + offset, behavior: "instant" });
    }
    setTab(key);
  };

  // One hover fill glides between tabs; entering the bar shows it in place.
  const showHover = (index: number) => {
    const list = listRef.current;
    const target = refs.current[index];
    if (!list || !target) return;
    const left = target.offsetLeft;
    const right = list.clientWidth - left - target.offsetWidth;
    setHover(previous => ({ left, right, visible: true, instant: !previous?.visible }));
  };

  return <div ref={listRef} role="tablist" aria-label={dict.business.location} className={styles.tabs} data-indicator={indicator ? "" : undefined}
    onPointerLeave={() => setHover(previous => previous?.visible ? { ...previous, visible: false } : previous)}>
    <span aria-hidden="true" className={styles.tabHover} data-visible={hover?.visible || undefined} data-instant={hover?.instant || undefined}
      style={hover ? { clipPath: `inset(0 ${hover.right}px 0 ${hover.left}px round 999px)` } : undefined} />
    {items.map((item, index) => <button key={item.key} ref={element => { refs.current[index] = element; }} type="button" role="tab" id={`${panelId}-${item.key}-tab`} aria-controls={`${panelId}-${item.key}-panel`} aria-selected={tab === item.key} tabIndex={tab === item.key ? 0 : -1} onClick={() => choose(item.key)} onPointerEnter={event => { if (event.pointerType === "mouse") showHover(index); }} onKeyDown={event => {
      let next: number;
      if (event.key === "ArrowRight") next = (index + 1) % items.length;
      else if (event.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = items.length - 1;
      else return;
      event.preventDefault();
      choose(items[next].key);
      refs.current[next]?.focus();
    }}><span className={styles.tabLabel}>{item.label}{item.count != null && <span className={styles.tabCount}>{item.count}</span>}</span></button>)}
    {indicator && <span aria-hidden="true" className={styles.tabIndicator} style={{ transform: `translateX(${indicator.x}px) scaleX(${indicator.scale})` }} />}
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
      const content = <>
        {/* The name follows in text; the photo would only repeat it. */}
        <span className={styles.teamPortrait} aria-hidden="true"><Avatar src={member.profileImage ?? undefined} name={name} size={80} ring monogram loading="lazy" decorative /></span>
        <span className={styles.teamIdentity}><strong>{name}</strong>{member.professionalTitle && <span>{member.professionalTitle}</span>}{member.averageRating != null && <Rating rating={member.averageRating} reviews={member.totalReviews} size={13} />}</span>
        {/* The profile opens here, so a right arrow, not the leave-the-site one. */}
        <span className={styles.profileLink}><span className={styles.profileLinkLabel}>{dict.locationPage.viewProfile}</span><Icon name="arrowR" size={14} /></span>
      </>;
      return member.publicProfileAvailable === true && member.uuid ? (
        <Link key={member.id} href={professionalHref(locale, member.uuid)} prefetch={false} className={styles.teamCard}
          onNavigate={(event) => { event.preventDefault(); setMemberId(member.id); }}>
          {content}
        </Link>
      ) : (
        <button key={member.id} type="button" className={styles.teamCard} onClick={() => setMemberId(member.id)}>
          {content}
        </button>
      );
    })}</div>
    {selected && <TeamMemberProfileModal member={selected} listing={listing} locale={locale} onClose={() => setMemberId(null)} />}
  </div>;
}

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

/** Shows the place without starting a route. Google labels an address search; bare coordinates only drop a pin. */
function buildPlaceHref(listing: ListingDetail): string | null {
  const { latitude, longitude, address } = listing.location;
  const query = address?.trim() || (latitude != null && longitude != null ? `${latitude},${longitude}` : null);
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}
