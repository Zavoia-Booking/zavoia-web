"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { Avatar, Button, HeartButton, Icon, Rating, Stars } from "@/components/ui";
import { InlineError } from "@/components/ui/inline-error";
import { Skeleton } from "@/components/ui/skeleton";
import styles from "./team-member-profile-modal.module.css";
import { useFavoriteToggle } from "@/app/_components/home/use-favorite-toggle";
import { EmptyState } from "./empty-state";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/format";
import { errorMessage, mapBackendCode } from "@/lib/api/error-messages";
import { ApiError } from "@/lib/api/http";
import { getPendingFavoriteIds, subscribeFavoriteIds } from "@/lib/favorites/store";
import type { Locale } from "@/i18n/locales";
import { formatDuration, formatMoney } from "@/lib/format/money-time";
import { useBooking } from "@/lib/booking";
import {
  getTeamMember,
  getTeamMemberBookingContext,
  getTeamMemberInListing,
  getTeamMemberReviews,
} from "@/lib/api/marketplace/public";
import type {
  ListingDetail,
  ProfessionalReview,
  TeamMemberBookingContext,
  TeamMemberProfile,
} from "@/lib/api/marketplace/types";

// Team member profile modal — the full professional profile fetched from
// GET /marketplace/public/listing/:listingId/team-member/:id. The lean card
// data (name/title/rating) renders instantly; bio, stats, services, portfolio
// and reviews stream in. Desktop: two-pane (identity rail + scrolling content).
// Mobile (≤720px): bottom sheet, single scroll. Booking hands the selected
// services to the booking drawer with the professional pre-selected per item.

const HAIRLINE = "1px solid rgba(28,28,26,0.08)";
const INITIAL_REVIEWS = 4;
const EMPTY_PICKED: ReadonlySet<number> = new Set();

/** Social keys → icon names, in display order. */
const SOCIALS: Array<{ key: string; icon: "ig" | "tt" | "fb" | "globe" }> = [
  { key: "instagram", icon: "ig" },
  { key: "tiktok", icon: "tt" },
  { key: "facebook", icon: "fb" },
  { key: "website", icon: "globe" },
];

function externalHref(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

/** Inert subscription for the client-detection useSyncExternalStore. */
function subscribeNoop(): () => void {
  return () => {};
}

/**
 * Lean identity data that renders instantly while the full profile loads.
 * `ListingTeamMember` satisfies it (location-page flow); the Saved page maps a
 * `FavoriteProfessional` into it (favorites flow).
 */
export interface TeamMemberSeed {
  id: number;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  profileImage: string | null;
  professionalTitle: string | null;
  averageRating: number | null;
  totalReviews: number;
}

/** The minimal service shape both flows share (listing profile vs. booking context). */
interface BookableService {
  id: number;
  name: string;
  priceAmountMinor: number;
  duration: number;
  category?: { id: number; name: string; color: string } | null;
}

type ContextBusiness = TeamMemberBookingContext["businesses"][number];
type ContextLocation = ContextBusiness["locations"][number];

/** One bookable venue (business × location) from the booking context. */
interface Venue {
  key: string;
  business: ContextBusiness;
  location: ContextLocation;
}

// These responses mean the current public profile/booking context is unavailable.
// Retrying the same request is not a useful recovery action for this state.
const MEMBER_GONE_CODES = {
  "CUSTOMER_BOOKING.E16": true,
  "CUSTOMER_BOOKING.E17": true,
} as const;

function isMemberUnavailable(error: unknown): boolean {
  return Boolean(mapBackendCode(error, MEMBER_GONE_CODES)) ||
    (error instanceof ApiError && (error.status === 404 || error.status === 410));
}

function validTimeZone(value: string): boolean {
  if (!value) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function subscribeProfessionalFavorites(listener: () => void): () => void {
  return subscribeFavoriteIds("professional", listener);
}

export function TeamMemberProfileModal({
  member,
  listing,
  businessId,
  websiteSlug,
  locale,
  onClose,
}: {
  member: TeamMemberSeed;
  /**
   * Location-page flow: the listing scopes the profile (services come from
   * it). Omitted in the favorites flow — venues + per-venue menus are then
   * resolved via GET /team-member/:id/booking-context.
   */
  listing?: ListingDetail;
  /**
   * Favorites-flow scope: keep only this business's venues from the booking
   * context (brand page — the member may also work elsewhere). Omitted on the
   * Saved page, where venues across all businesses are the point.
   */
  businessId?: number;
  /** Website context uses the same location-scoped professional booking journey. */
  websiteSlug?: string;
  locale: Locale;
  onClose: () => void;
}) {
  const { dict } = useTranslation();
  const t = dict.business;
  const openBooking = useBooking().openBooking;
  const cardRef = useRef<HTMLDivElement>(null);
  // Favorite heart — shown to everyone; signed out, a tap asks to sign in
  // (same rule as the cards).
  // The hook seeds the current state from GET favorite/professionals itself.
  const favorites = useFavoriteToggle("professional");
  const favoritePending = useSyncExternalStore(
    subscribeProfessionalFavorites,
    () => getPendingFavoriteIds("professional").has(member.id),
    () => false,
  );

  const [profile, setProfile] = useState<TeamMemberProfile | null>(null);
  const [profileError, setProfileError] = useState<unknown>(null);
  const [requesting, setRequesting] = useState(true);
  const [profileAttempt, setProfileAttempt] = useState(0);
  const [contextAttempt, setContextAttempt] = useState(0);
  // Favorites flow only: where the member can be booked (null while loading).
  const [context, setContext] = useState<TeamMemberBookingContext | null>(null);
  const [contextRequesting, setContextRequesting] = useState(!listing);
  // A failed booking-context load means two very different things. Permanent
  // (CUSTOMER_BOOKING.E16/E17 — the team member is gone, or has no active
  // assignment anywhere) is honestly "can't be booked". Transient (offline,
  // timeout, 5xx) is "we couldn't find out", and saying "no booking here"
  // there tells the user something we don't actually know.
  const [contextFailure, setContextFailure] = useState<
    "permanent" | "transient" | null
  >(null);
  const [contextError, setContextError] = useState<unknown>(null);
  const [venueKey, setVenueKey] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ scope: string | null; ids: ReadonlySet<number> }>({
    scope: null,
    ids: EMPTY_PICKED,
  });
  const [lightbox, setLightbox] = useState<string | null>(null);
  // Portal target exists only on the client (the deep-link path renders the
  // modal on the very first pass, which also runs on the server).
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  // Ref mirror lets the window key handler read the lightbox state without
  // re-subscribing (and keeps the handler free of state-updater side effects).
  const lightboxRef = useRef<string | null>(null);
  const openLightbox = useCallback((v: string | null) => {
    lightboxRef.current = v;
    setLightbox(v);
  }, []);

  const failed = profileError !== null;
  const profileUnavailable = failed && isMemberUnavailable(profileError);
  const loading = !profile && !failed;

  useEffect(() => {
    let alive = true;
    const req = listing
      ? // Scoped to THIS location: the menu, prices and durations must match
        // the venue whose page opened the modal — and the booking it hands off.
        getTeamMemberInListing(listing.listingId, member.id, listing.locationId)
      : getTeamMember(member.id);
    req
      .then((p) => {
        if (alive) {
          setProfile(p);
          setProfileError(null);
        }
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setProfileError(error);
        if (isMemberUnavailable(error)) setProfile(null);
      })
      .finally(() => { if (alive) setRequesting(false); });
    return () => {
      alive = false;
    };
  }, [listing, member.id, profileAttempt]);

  // Favorites flow: resolve the member's bookable venues + per-venue menus.
  useEffect(() => {
    if (listing) return;
    let alive = true;
    getTeamMemberBookingContext(member.id)
      .then((ctx) => {
        if (alive) {
          setContext(ctx);
          setContextFailure(null);
          setContextError(null);
        }
      })
      .catch((e) => {
        if (!alive) return;
        const unavailable = isMemberUnavailable(e);
        setContextFailure(
          unavailable ? "permanent" : "transient",
        );
        setContextError(e);
        if (unavailable) setContext(null);
      })
      .finally(() => { if (alive) setContextRequesting(false); });
    return () => {
      alive = false;
    };
  }, [listing, member.id, contextAttempt]);

  // Shareable deep link (?tab=team&member=<id>) while open; drop it on close.
  // Location-page flow only — the Saved page has no ?member= inbound route.
  const syncUrl = !!listing && !websiteSlug;
  useEffect(() => {
    if (typeof window === "undefined" || !syncUrl) return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", "team");
    url.searchParams.set("member", String(member.id));
    window.history.replaceState(null, "", url);
    return () => {
      const u = new URL(window.location.href);
      u.searchParams.delete("member");
      window.history.replaceState(null, "", u);
    };
  }, [member.id, syncUrl]);

  // Lock the page scroll behind the dialog.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Focus the dialog on open; hand focus back to the opener card on close.
  // Gated on `mounted` — on the deep-link/SSR path the portal renders one
  // pass later than the component mounts, so an ungated effect would fire
  // while cardRef is still null and the focus trap would never engage.
  useEffect(() => {
    if (!mounted) return;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    cardRef.current?.focus();
    return () => opener?.focus();
  }, [mounted]);

  // Escape dismisses the lightbox first, then the dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (lightboxRef.current) openLightbox(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, openLightbox]);

  // Keep Tab cycling inside the dialog (aria-modal alone doesn't trap focus).
  // Rooted at the overlay (e.currentTarget), not the card, so the lightbox's
  // close button participates while it is open; disabled controls (e.g. the
  // Book CTA before a pick) are excluded — they can never hold focus, and
  // matching them would break the last-element wrap check.
  const onTrapTab = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const card = cardRef.current;
    if (!card) return;
    const focusables = Array.from((e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(
      'button, a[href], [tabindex]',
    )).filter((element) => element.tabIndex >= 0 && !element.matches(":disabled") &&
      !element.closest('[hidden], [inert], [aria-hidden="true"], [aria-disabled="true"]') &&
      element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden");
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === card)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  // Lean card data renders instantly; the fetched profile refines it.
  const displayName =
    profile?.about?.displayName?.trim() ||
    member.displayName ||
    [member.firstName, member.lastName].filter(Boolean).join(" ").trim();
  const firstName = displayName.split(" ")[0] || displayName;
  const professionalTitle =
    profile?.about?.professionalTitle ?? member.professionalTitle;
  // Older API builds send the stored aggregate as a string — coerce defensively.
  const statsAvg =
    profile?.reviewStats.averageRating != null
      ? Number(profile.reviewStats.averageRating)
      : null;
  const avgRating = statsAvg ?? member.averageRating;
  const reviewCount = profile?.reviewStats.totalCount ?? member.totalReviews;

  const numFmt = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  // Stat strip cells — only the facts that exist.
  const stats = useMemo(() => {
    const cells: Array<{ value: string; label: string }> = [];
    if (profile?.yearsOfExperience != null && profile.yearsOfExperience > 0) {
      cells.push({
        value:
          profile.yearsOfExperience === 1
            ? t.memberStatYearsOne
            : format(t.memberStatYears, {
                count: numFmt.format(profile.yearsOfExperience),
              }),
        label: t.memberStatYearsLabel,
      });
    }
    if (profile && profile.visitsCompleted > 0) {
      cells.push({
        value: numFmt.format(profile.visitsCompleted),
        label: t.memberStatVisitsLabel,
      });
    }
    if (profile?.memberSince) {
      const year = new Date(profile.memberSince).getFullYear();
      if (Number.isFinite(year)) {
        cells.push({ value: String(year), label: t.memberStatSinceLabel });
      }
    }
    return cells;
  }, [profile, t, numFmt]);

  const socials = useMemo(() => {
    const links = profile?.about?.socialLinks ?? {};
    return SOCIALS.filter(({ key }) => {
      const v = links[key];
      return typeof v === "string" && v.trim().length > 0;
    }).map(({ key, icon }) => ({ key, icon, href: externalHref(links[key]!.trim()) }));
  }, [profile]);

  // A single venue is unambiguous. Multiple venues need an explicit choice
  // before displaying their location-specific menu, prices, or booking action.
  const venues = useMemo<Venue[]>(() => {
    if (listing || !context) return [];
    return context.businesses
      .filter((business) => businessId == null || business.id === businessId)
      .flatMap((business) =>
        business.locations.map((location) => ({
          key: `${business.id}-${location.id}`,
          business,
          location,
        })),
      );
  }, [listing, context, businessId]);
  const selectedVenue =
    venues.find((v) => v.key === venueKey) ?? (venues.length === 1 ? venues[0] : null);
  const selectionScope = listing
    ? `listing-${listing.listingId}-${listing.locationId}`
    : selectedVenue?.key ?? null;
  const picked = selection.scope === selectionScope ? selection.ids : EMPTY_PICKED;

  const pickVenue = useCallback((key: string) => {
    setVenueKey(key);
    // Menus and prices are venue-specific — a selection never carries over.
    setSelection({ scope: key, ids: EMPTY_PICKED });
  }, []);

  // The bookable menu for the current flow. Location-page flow: the listing-
  // scoped profile services. Favorites flow: the selected venue's menu (the
  // unscoped profile endpoint returns services: []).
  const activeServices: BookableService[] = useMemo(
    () =>
      listing
        ? (profile?.services ?? [])
        : (selectedVenue?.location.services ?? []),
    [listing, profile, selectedVenue],
  );
  // The context still loading in the favorites flow ≠ "no services".
  const servicesPending = listing ? !profile && !failed : !context && !contextFailure;
  // Services grouped by category — same grammar as the Services tab.
  const serviceGroups = useMemo(() => {
    const by = new Map<
      string,
      { name: string; color: string; items: BookableService[] }
    >();
    for (const s of activeServices) {
      const key = s.category?.name ?? "";
      if (!by.has(key)) {
        by.set(key, {
          name: s.category?.name ?? "",
          color: s.category?.color ?? "var(--c-400)",
          items: [],
        });
      }
      by.get(key)!.items.push(s);
    }
    return [...by.values()];
  }, [activeServices]);

  const togglePick = useCallback((id: number) => {
    if (!selectionScope) return;
    setSelection((previous) => {
      const next = new Set(previous.scope === selectionScope ? previous.ids : EMPTY_PICKED);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { scope: selectionScope, ids: next };
    });
  }, [selectionScope]);

  const pickedServices = useMemo(
    () => activeServices.filter((s) => picked.has(s.id)),
    [activeServices, picked],
  );
  const totalMinor = pickedServices.reduce((a, s) => a + s.priceAmountMinor, 0);
  const totalDur = pickedServices.reduce((a, s) => a + s.duration, 0);

  const currency = (listing?.businessCurrency ?? selectedVenue?.business.businessCurrency ?? "").trim().toUpperCase();
  const currencyValid = /^[A-Z]{3}$/.test(currency) && Intl.supportedValuesOf("currency").includes(currency);
  const timezone = (listing?.timezone ?? selectedVenue?.location.timezone ?? "").trim();
  const bookingDetailsAvailable = currencyValid && validTimeZone(timezone);
  const onlineBookingAllowed = listing
    ? listing.allowOnlineBooking === true
    : selectedVenue?.location.allowOnlineBooking === true;
  const canBook = !!profile && !profileUnavailable && onlineBookingAllowed &&
    bookingDetailsAvailable && activeServices.length > 0;
  const showPricing = listing
    ? !(listing.additionalSettings && typeof listing.additionalSettings === "object" &&
      "showPricing" in listing.additionalSettings && listing.additionalSettings.showPricing === false)
    : selectedVenue?.location.showPricing !== false;

  const onBook = useCallback(() => {
    if (!canBook || pickedServices.length === 0) return;
    // Each item carries the professional so the drawer pre-selects them.
    const services = pickedServices.map((s) => ({
      serviceId: s.id,
      name: s.name,
      priceAmountMinor: s.priceAmountMinor,
      duration: s.duration,
      teamMemberId: member.id,
    }));
    if (listing) {
      openBooking({
        websiteSlug,
        businessId: listing.businessId,
        listingId: listing.listingId,
        locationId: listing.locationId,
        timezone,
        currency,
        showPricing,
        bookingPolicy: listing.bookingPolicy,
        services,
      });
    } else if (selectedVenue) {
      openBooking({
        businessId: selectedVenue.business.id,
        listingId: selectedVenue.business.listingId,
        locationId: selectedVenue.location.id,
        timezone,
        currency,
        showPricing,
        // The booking context carries no policy — the drawer must not
        // fabricate a cancellation window from a null policy.
        bookingPolicy: null,
        services,
      });
    }
    onClose();
  }, [
    pickedServices,
    openBooking,
    listing,
    websiteSlug,
    selectedVenue,
    currency,
    timezone,
    showPricing,
    canBook,
    member.id,
    onClose,
  ]);

  const about = profile?.about;

  // Portal to <body>: an ancestor animating `transform` (e.g. the tab's
  // .zv-tab-in entrance) would otherwise become the containing block for this
  // fixed overlay and clip it during the animation.
  if (!mounted) return null;

  return createPortal(
    <div
      className="zw-member-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={displayName}
      onKeyDown={onTrapTab}
    >
      <div
        className="zv-sheet-backdrop"
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(28,28,26,0.42)", cursor: "pointer" }}
      />
      <div ref={cardRef} tabIndex={-1} className={`zw-member-card zw-modal-in ${styles.card}`} style={{ outline: "none" }}>
        <div style={{ position: "absolute", top: 14, left: 14, zIndex: 2 }}>
          <HeartButton
            active={favorites.isFavorited(member.id)}
            floating={false}
            size={44}
            iconSize={20}
            loading={favoritePending}
            onClick={() => favorites.toggle(member.id)}
          />
        </div>
        <button
          type="button"
          className="tap"
          aria-label={t.close}
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 2,
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: 0,
            cursor: "pointer",
            background: "var(--c-200)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="x" size={13} color="var(--c-700)" />
        </button>

        <div className="zw-member-body">
          {/* ── Identity rail ─────────────────────────────── */}
          <aside className="zw-member-rail">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <Avatar src={member.profileImage ?? undefined} name={displayName} size={96} ring />
              <div
                className="txt-balance"
                style={{
                  marginTop: 14,
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.15,
                  color: "var(--c-900)",
                }}
              >
                {displayName}
              </div>
              {professionalTitle && (
                <div style={{ marginTop: 4, fontSize: 13.5, color: "var(--c-600)" }}>
                  {professionalTitle}
                </div>
              )}
              {avgRating != null && (
                <div style={{ marginTop: 8 }}>
                  <Rating rating={avgRating} reviews={reviewCount} size={13} />
                </div>
              )}
            </div>

            {stats.length > 0 && (
              <div
                style={{
                  display: "flex",
                  marginTop: 20,
                  borderTop: HAIRLINE,
                  borderBottom: HAIRLINE,
                }}
              >
                {stats.map((c, i) => (
                  <div
                    key={c.label}
                    style={{
                      flex: 1,
                      padding: "12px 4px",
                      textAlign: "center",
                      borderLeft: i > 0 ? HAIRLINE : undefined,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--c-900)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {c.value}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--c-600)", marginTop: 3 }}>
                      {c.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {about?.languages && about.languages.length > 0 && (
              <div style={{ marginTop: 22 }}>
                <RailKicker>{t.memberSpeaks}</RailKicker>
                <div style={{ fontSize: 13.5, color: "var(--c-800)", lineHeight: 1.5 }}>
                  {about.languages.join(", ")}
                </div>
              </div>
            )}

            {about?.interests && about.interests.length > 0 && (
              <div style={{ marginTop: 22 }}>
                <RailKicker>{t.memberSpecialties}</RailKicker>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {about.interests.map((it) => (
                    <span
                      key={it}
                      style={{
                        fontSize: 12.5,
                        color: "var(--c-800)",
                        padding: "5px 11px",
                        borderRadius: 999,
                        background: "var(--c-100)",
                        border: "1px solid rgba(28,28,26,0.07)",
                      }}
                    >
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {socials.length > 0 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
                {socials.map((s) => (
                  <a
                    key={s.key}
                    className="tap"
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.key}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      border: "1px solid rgba(28,28,26,0.14)",
                      background: "#fff",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--c-800)",
                    }}
                  >
                    <Icon name={s.icon} size={15} color="currentColor" />
                  </a>
                ))}
              </div>
            )}
          </aside>

          {/* ── Content ───────────────────────────────────── */}
          <div className="zw-member-main" aria-busy={requesting || contextRequesting || undefined}>
            {loading && <ProfileSkeleton />}

            {failed && (
              <div style={{ paddingTop: 8 }}>
                <InlineError style={{ margin: 0 }}>
                  {profileUnavailable ? t.memberUnavailable : errorMessage(profileError, dict.errors, t.memberLoadError)}
                </InlineError>
                <div style={{ marginTop: 12 }}>
                  {profileUnavailable ? (
                    <Button kind="secondary" size="sm" onClick={onClose} style={{ minHeight: 44 }}>
                      {t.close}
                    </Button>
                  ) : <Button
                    kind="secondary"
                    size="sm"
                    style={{ minHeight: 44 }}
                    loading={requesting}
                    onClick={() => {
                      setRequesting(true);
                      setProfileAttempt((a) => a + 1);
                    }}
                  >
                    {t.memberRetry}
                  </Button>}
                  <span role="status" className="sr-only">{requesting ? t.memberChecking : ""}</span>
                </div>
              </div>
            )}

            {profile && (
              <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
                {about?.aboutMe && (
                  <section>
                    <SectionKicker>{t.tabAbout}</SectionKicker>
                    <p
                      className="txt-pretty"
                      style={{
                        margin: 0,
                        fontSize: 14.5,
                        lineHeight: 1.65,
                        color: "var(--c-800)",
                        maxWidth: 560,
                      }}
                    >
                      {about.aboutMe}
                    </p>
                  </section>
                )}

                {/* Favorites flow — where the member can be booked. One card
                    per venue; the menu below always belongs to the selected
                    venue (prices/menus differ per location). */}
                {!listing && venues.length > 0 && (
                  <section>
                    <SectionKicker>{t.memberChooseVenue}</SectionKicker>
                    {!selectedVenue && (
                      <p style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.5, color: "var(--c-600)" }}>
                        {t.memberChooseVenuePrompt}
                      </p>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {venues.map((v) => {
                        const on = v.key === selectedVenue?.key;
                        const multi = venues.length > 1;
                        const venueRating =
                          v.location.averageRating != null
                            ? Number(v.location.averageRating)
                            : null;
                        const hasVenueRating = venueRating != null && Number.isFinite(venueRating) && venueRating > 0;
                        return (
                          <button
                            key={v.key}
                            type="button"
                            className="tap"
                            onClick={multi ? () => pickVenue(v.key) : undefined}
                            aria-pressed={on}
                            disabled={!multi}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              textAlign: "left",
                              width: "100%",
                              padding: "11px 12px",
                              borderRadius: 14,
                              background: "#fff",
                              cursor: multi ? "pointer" : "default",
                              border: on
                                ? "1px solid var(--c-ink)"
                                : "1px solid rgba(28,28,26,0.10)",
                              boxShadow: on ? "var(--sh-sm)" : "none",
                            }}
                          >
                            <Avatar
                              src={
                                v.location.featuredImage ??
                                v.business.logo ??
                                undefined
                              }
                              name={v.business.name}
                              size={40}
                            />
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <span
                                style={{
                                  display: "block",
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: "var(--c-900)",
                                  letterSpacing: "-0.015em",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {v.business.name}
                                {v.location.name &&
                                v.location.name !== v.business.name
                                  ? ` · ${v.location.name}`
                                  : ""}
                              </span>
                              {(v.location.address || hasVenueRating) && (
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 7,
                                    marginTop: 3,
                                    fontSize: 12.5,
                                    color: "var(--c-600)",
                                    minWidth: 0,
                                  }}
                                >
                                  {hasVenueRating && (
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 3,
                                        fontWeight: 600,
                                        color: "var(--c-800)",
                                        flexShrink: 0,
                                        fontVariantNumeric: "tabular-nums",
                                      }}
                                    >
                                      <Icon
                                        name="star"
                                        size={10.5}
                                        color="var(--p-500)"
                                      />
                                      {venueRating!.toFixed(1)}
                                    </span>
                                  )}
                                  {v.location.address && (
                                    <span
                                      style={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {v.location.address}
                                    </span>
                                  )}
                                </span>
                              )}
                            </span>
                            {multi && (
                              <span
                                aria-hidden
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: "50%",
                                  flexShrink: 0,
                                  border: on
                                    ? "1px solid var(--c-ink)"
                                    : "1px solid rgba(28,28,26,0.18)",
                                  background: on ? "var(--c-ink)" : "#fff",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {on && (
                                  <Icon name="check" size={12} color="#fff" />
                                )}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Favorites flow — booking context still resolving. */}
                {servicesPending && (
                  <section aria-hidden>
                    <SectionKicker>{t.tabServices}</SectionKicker>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "13px 8px",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <Skeleton w="56%" h={21.75} style={{ marginBottom: 4 }} />
                          <Skeleton w={110} h={18.75} />
                        </div>
                        <Skeleton w={44} h={44} r={999} />
                      </div>
                    ))}
                  </section>
                )}

                {/* Favorites flow — no bookable venue (or the context call
                    failed): the profile stays useful, booking is just absent. */}
                {!listing && !servicesPending && (contextFailure || venues.length === 0) && (
                  <div>
                    {contextFailure === "transient" ? (
                      <InlineError style={{ margin: 0 }}>
                        {errorMessage(contextError, dict.errors, t.memberContextLoadError)}
                      </InlineError>
                    ) : (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13.5,
                          color: "var(--c-600)",
                        }}
                      >
                        {t.memberNoBooking}
                      </p>
                    )}
                    {contextFailure === "transient" && (
                      <div style={{ marginTop: 10 }}>
                        <Button
                          kind="secondary"
                          size="sm"
                          style={{ minHeight: 44 }}
                          loading={contextRequesting}
                          onClick={() => {
                            setContextRequesting(true);
                            setContextAttempt((a) => a + 1);
                          }}
                        >
                          {t.memberRetry}
                        </Button>
                        <span role="status" className="sr-only">{contextRequesting ? t.memberChecking : ""}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* The menu is scoped to the venue whose page opened this, so a
                    professional assigned here without any service enabled here
                    has an empty one. Say so — an unexplained missing services
                    section reads as a loading failure. */}
                {!servicesPending &&
                  activeServices.length === 0 &&
                  (listing || selectedVenue) && (
                    <p
                      style={{ margin: 0, fontSize: 13.5, color: "var(--c-600)" }}
                    >
                      {format(t.memberNoServicesHere, { name: firstName })}
                    </p>
                  )}

                {onlineBookingAllowed && activeServices.length > 0 && !bookingDetailsAvailable && (
                  <InlineError>{t.memberBookingDetailsUnavailable}</InlineError>
                )}

                {activeServices.length > 0 && (
                  <section>
                    <SectionKicker>{t.tabServices}</SectionKicker>
                    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                      {serviceGroups.map((g, gi) => (
                        <div key={gi}>
                          {g.name && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 2,
                                fontFamily: "var(--font-mono)",
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                color: "var(--c-600)",
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
                            {g.items.map((s) => (
                              <div
                                key={s.id}
                                className="zw-hover-row"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 14,
                                  padding: "13px 8px",
                                  borderRadius: 12,
                                  boxShadow: "inset 0 -1px 0 rgba(28,28,26,0.05)",
                                }}
                              >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: 14.5,
                                      fontWeight: 600,
                                      color: "var(--c-900)",
                                      letterSpacing: "-0.015em",
                                    }}
                                  >
                                    {s.name}
                                  </div>
                                  <div
                                    style={{
                                      fontFamily: "var(--font-mono)",
                                      fontSize: 12.5,
                                      fontWeight: 700,
                                      color: "var(--c-700)",
                                      marginTop: 4,
                                      fontVariantNumeric: "tabular-nums",
                                    }}
                                  >
                                    {formatDuration(s.duration)}
                                    {!showPricing
                                      ? ` · ${dict.locationPage.requestQuote}`
                                      : currencyValid ? ` · ${formatMoney(s.priceAmountMinor, currency, locale)}` : ""}
                                  </div>
                                </div>
                                {canBook && (
                                  <button
                                    type="button"
                                    className="tap"
                                    onClick={() => togglePick(s.id)}
                                    aria-label={
                                      picked.has(s.id)
                                        ? `${t.remove} ${s.name}`
                                        : `${t.add} ${s.name}`
                                    }
                                    aria-pressed={picked.has(s.id)}
                                    style={{
                                      width: 44,
                                      height: 44,
                                      borderRadius: "50%",
                                      cursor: "pointer",
                                      flexShrink: 0,
                                      border: picked.has(s.id)
                                        ? "1px solid var(--c-ink)"
                                        : "1px solid rgba(28,28,26,0.16)",
                                      background: picked.has(s.id) ? "var(--c-ink)" : "#fff",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Icon
                                      name={picked.has(s.id) ? "check" : "plus"}
                                      size={15}
                                      color={picked.has(s.id) ? "#fff" : "var(--c-900)"}
                                    />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {profile.portfolio.length > 0 && (
                  <section>
                    <SectionKicker>{t.memberPortfolio}</SectionKicker>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                        gap: 10,
                      }}
                    >
                      {profile.portfolio.map((img, i) => {
                        // Admin uploads store {url,…} objects; seed/legacy rows
                        // are bare URL strings — accept both.
                        const url = typeof img === "string" ? img : img.url;
                        if (!url) return null;
                        return (
                          <button
                            key={url + i}
                            type="button"
                            className="zw-member-tile tap"
                            aria-label={t.memberPhotoAria}
                            onClick={() => openLightbox(url)}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" loading="lazy" />
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                <ProfessionalReviews
                  key={profile.id}
                  memberId={profile.id}
                  initialReviews={profile.reviews}
                  initialTotal={profile.reviewStats.totalCount}
                  averageRating={avgRating}
                  locale={locale}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Booking bar ─────────────────────────────────── */}
        {!profileUnavailable && (canBook || servicesPending) && (
          <div
            aria-busy={servicesPending}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "13px 20px calc(13px + env(safe-area-inset-bottom))",
              borderTop: HAIRLINE,
              background: "#fff",
            }}
          >
            {servicesPending ? (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div aria-hidden="true"><Skeleton h={18} r={4} style={{ maxWidth: 160 }} /></div>
                <span role="status" className="sr-only">{t.memberChecking}</span>
              </div>
            ) : pickedServices.length > 0 ? (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--c-800)",
                  fontVariantNumeric: "tabular-nums",
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {pickedServices.length} · {formatDuration(totalDur)} ·{" "}
                {showPricing
                  ? formatMoney(totalMinor, currency, locale)
                  : dict.locationPage.requestQuote}
              </span>
            ) : (
              <span style={{ fontSize: 13, color: "var(--c-600)" }}>
                {t.memberSelectPrompt}
              </span>
            )}
            <Button
              kind="primary"
              onClick={onBook}
              style={{ minHeight: 44 }}
              disabled={servicesPending || pickedServices.length === 0}
            >
              {format(t.memberBookWith, { name: firstName })}
            </Button>
          </div>
        )}
      </div>

      {/* ── Portfolio lightbox ──────────────────────────── */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.memberPhotoAria}
          onClick={() => openLightbox(null)}
          className="zv-fade"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            background: "rgba(28,28,26,0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            cursor: "pointer",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt=""
            style={{
              maxWidth: "92vw",
              maxHeight: "86vh",
              borderRadius: 14,
              boxShadow: "var(--sh-xl)",
            }}
          />
          <button
            type="button"
            className="tap"
            aria-label={t.memberClosePhotoAria}
            onClick={() => openLightbox(null)}
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: 0,
              cursor: "pointer",
              background: "rgba(255,255,255,0.14)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="x" size={15} color="#fff" />
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}

function ProfessionalReviews({
  memberId,
  initialReviews,
  initialTotal,
  averageRating,
  locale,
}: {
  memberId: number;
  initialReviews: ProfessionalReview[];
  initialTotal: number;
  averageRating: number | null;
  locale: Locale;
}) {
  const { dict } = useTranslation();
  const t = dict.business;
  const [reviews, setReviews] = useState(initialReviews);
  const [offset, setOffset] = useState(initialReviews.length);
  const [total, setTotal] = useState(initialTotal);
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const active = useRef(true);
  const inFlight = useRef(false);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }),
    [locale],
  );
  const hasMore = offset < total;
  const visibleReviews = expanded ? reviews : reviews.slice(0, INITIAL_REVIEWS);

  const loadMore = async () => {
    if (inFlight.current) return;
    setExpanded(true);
    if (!hasMore) return;
    inFlight.current = true;
    setPending(true);
    setLoadError(null);
    try {
      const response = await getTeamMemberReviews(memberId, { offset, limit: 10 });
      if (!active.current) return;
      setReviews((current) => {
        // A new review can shift an offset-based feed between requests.
        const unique = new Map(current.map((review) => [review.id, review]));
        for (const review of response.data) unique.set(review.id, review);
        return [...unique.values()];
      });
      setOffset(response.pagination.offset + response.data.length);
      setTotal(response.pagination.total);
    } catch (error) {
      if (active.current) {
        setLoadError(errorMessage(error, dict.errors, t.loadMoreReviewsError));
      }
    } finally {
      inFlight.current = false;
      if (active.current) setPending(false);
    }
  };

  return (
    <section>
      <SectionKicker>{t.tabReviews}</SectionKicker>
      {reviews.length === 0 && total === 0 ? (
        <EmptyState icon="starO" title={t.reviewsEmptyTitle} body={t.reviewsEmptyBody} />
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1, color: "var(--c-900)", fontVariantNumeric: "tabular-nums" }}>
              {new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(averageRating ?? 0)}
            </span>
            <Stars value={averageRating ?? 0} size={13} />
            <span style={{ fontSize: 13, color: "var(--c-600)", fontVariantNumeric: "tabular-nums" }}>
              {format(total === 1 ? t.reviewsCountOne : t.reviewsCount, { count: String(total) })}
            </span>
          </div>
          <div aria-busy={pending || undefined} style={{ display: "flex", flexDirection: "column", marginTop: 4 }}>
            {visibleReviews.map((review) => {
              const name = [review.customer?.firstName, review.customer?.lastName].filter(Boolean).join(" ").trim();
              return (
                <div key={review.id} style={{ padding: "16px 0", boxShadow: "inset 0 -1px 0 rgba(28,28,26,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar src={review.customer?.profileImage ?? undefined} name={name || "?"} size={32} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--c-900)" }}>{name || "—"}</div>
                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 7, marginTop: 2 }}>
                        <Stars value={review.rating} size={10.5} />
                        <time dateTime={review.createdAt} style={{ fontSize: 11.5, color: "var(--c-600)" }}>
                          {dateFmt.format(new Date(review.createdAt))}
                        </time>
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="txt-pretty" style={{ margin: "9px 0 0", fontSize: 14, lineHeight: 1.6, color: "var(--c-800)", overflowWrap: "anywhere" }}>
                      {review.comment}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {((!expanded && reviews.length > INITIAL_REVIEWS) || hasMore) && (
            <div style={{ marginTop: 16 }}>
              <Button kind="secondary" size="sm" onClick={loadMore} loading={pending} style={{ minHeight: 44 }}>
                {t.loadMoreReviews}
              </Button>
              {loadError && <InlineError style={{ display: "flex", marginTop: 10 }}>{loadError}</InlineError>}
            </div>
          )}
          <span role="status" className="sr-only">
            {pending
              ? dict.locationPage.reviewsUpdating
              : expanded ? dict.locationPage.reviewsUpdated : ""}
          </span>
        </>
      )}
    </section>
  );
}

/** Mono uppercase section label — the page's kicker grammar, modal-scaled. */
function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--c-600)",
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

/** Same kicker, tighter — for rail blocks. */
function RailKicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--c-600)",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

/** Loading placeholder mirroring the content column's real layout. */
function ProfileSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 }} aria-hidden>
      <div>
        <Skeleton h={16.5} w={72} style={{ marginBottom: 14 }} />
        <Skeleton h={24} w="92%" />
        <Skeleton h={24} w="78%" />
      </div>
      <div>
        <Skeleton h={16.5} w={88} style={{ marginBottom: 14 }} />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 8px" }}
          >
            <div style={{ flex: 1 }}>
              <Skeleton h={21.75} w="56%" style={{ marginBottom: 4 }} />
              <Skeleton h={18.75} w={110} />
            </div>
            <Skeleton w={44} h={44} r={999} />
          </div>
        ))}
      </div>
      <div>
        <Skeleton h={16.5} w={80} style={{ marginBottom: 14 }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 10,
          }}
        >
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} h="auto" r={12} style={{ aspectRatio: "1" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
