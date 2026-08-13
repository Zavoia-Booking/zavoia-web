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
import { useFavoriteToggle } from "@/app/_components/home/use-favorite-toggle";
import { EmptyState } from "./empty-state";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import { formatDuration, formatMoney } from "@/lib/format/money-time";
import { useBooking } from "@/lib/booking";
import {
  getTeamMember,
  getTeamMemberBookingContext,
  getTeamMemberInListing,
} from "@/lib/api/marketplace/public";
import type {
  ListingDetail,
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

export function TeamMemberProfileModal({
  member,
  listing,
  businessId,
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
  locale: Locale;
  onClose: () => void;
}) {
  const { dict } = useTranslation();
  const t = dict.business;
  const openBooking = useBooking().openBooking;
  const cardRef = useRef<HTMLDivElement>(null);
  // Favorite heart — hidden for signed-out visitors (same rule as the cards).
  // The hook seeds the current state from GET favorite/professionals itself.
  const favorites = useFavoriteToggle("professional");

  const [profile, setProfile] = useState<TeamMemberProfile | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // Favorites flow only: where the member can be booked (null while loading).
  const [context, setContext] = useState<TeamMemberBookingContext | null>(null);
  const [contextFailed, setContextFailed] = useState(false);
  const [venueKey, setVenueKey] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [allReviews, setAllReviews] = useState(false);
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

  const loading = !profile && !failed;

  useEffect(() => {
    let alive = true;
    const req = listing
      ? getTeamMemberInListing(listing.listingId, member.id)
      : getTeamMember(member.id);
    req
      .then((p) => {
        if (alive) setProfile(p);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [listing, member.id, attempt]);

  // Favorites flow: resolve the member's bookable venues + per-venue menus.
  useEffect(() => {
    if (listing) return;
    let alive = true;
    getTeamMemberBookingContext(member.id)
      .then((ctx) => {
        if (alive) setContext(ctx);
      })
      .catch(() => {
        if (alive) setContextFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [listing, member.id, attempt]);

  // Shareable deep link (?tab=team&member=<id>) while open; drop it on close.
  // Location-page flow only — the Saved page has no ?member= inbound route.
  const syncUrl = !!listing;
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
    const focusables = (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    );
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
  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }),
    [locale],
  );

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

  // Favorites flow: flatten businesses → venues. One entry per bookable
  // location; the first is the working default (menus differ per venue, so a
  // default beats an empty state — switching is one click).
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
    venues.find((v) => v.key === venueKey) ?? venues[0] ?? null;

  const pickVenue = useCallback((key: string) => {
    setVenueKey(key);
    // Menus and prices are venue-specific — a selection never carries over.
    setPicked(new Set());
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
  const servicesPending = !listing && !context && !contextFailed;
  const showPrices = listing
    ? true
    : selectedVenue?.location.showPricing !== false;

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
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const pickedServices = useMemo(
    () => activeServices.filter((s) => picked.has(s.id)),
    [activeServices, picked],
  );
  const totalMinor = pickedServices.reduce((a, s) => a + s.priceAmountMinor, 0);
  const totalDur = pickedServices.reduce((a, s) => a + s.duration, 0);

  const canBook = listing
    ? listing.allowOnlineBooking && activeServices.length > 0
    : selectedVenue != null &&
      selectedVenue.location.allowOnlineBooking &&
      activeServices.length > 0;
  const currency = (
    listing
      ? listing.businessCurrency
      : (selectedVenue?.business.businessCurrency ?? "EUR")
  ).toUpperCase();

  const onBook = useCallback(() => {
    if (pickedServices.length === 0) return;
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
        businessId: listing.businessId,
        listingId: listing.listingId,
        locationId: listing.locationId,
        timezone: listing.timezone,
        currency,
        bookingPolicy: listing.bookingPolicy,
        services,
      });
    } else if (selectedVenue) {
      openBooking({
        businessId: selectedVenue.business.id,
        listingId: selectedVenue.business.listingId,
        locationId: selectedVenue.location.id,
        // Context timezone is location || business; a null here is a data
        // gap — fall back to the browser tz rather than fabricating one.
        timezone:
          selectedVenue.location.timezone ??
          Intl.DateTimeFormat().resolvedOptions().timeZone,
        currency,
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
    selectedVenue,
    currency,
    member.id,
    onClose,
  ]);

  const about = profile?.about;
  const visibleReviews = profile
    ? allReviews
      ? profile.reviews
      : profile.reviews.slice(0, INITIAL_REVIEWS)
    : [];

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
        style={{ position: "absolute", inset: 0, background: "rgba(28,28,26,0.42)" }}
      />
      <div ref={cardRef} tabIndex={-1} className="zw-member-card zw-modal-in" style={{ outline: "none" }}>
        {favorites.canFavorite && (
          <div style={{ position: "absolute", top: 14, left: 14, zIndex: 2 }}>
            <HeartButton
              active={favorites.isFavorited(member.id)}
              floating={false}
              size={36}
              onClick={() => favorites.toggle(member.id)}
            />
          </div>
        )}
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
            width: 32,
            height: 32,
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

        <div className="zw-member-body zw-noscrollbar">
          {/* ── Identity rail ─────────────────────────────── */}
          <aside className="zw-member-rail zw-noscrollbar">
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
                      width: 34,
                      height: 34,
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
          <div className="zw-member-main zw-noscrollbar">
            {loading && <ProfileSkeleton />}

            {failed && (
              <div style={{ paddingTop: 8 }}>
                <p style={{ margin: 0, fontSize: 14, color: "var(--c-600)" }}>
                  {t.memberLoadError}
                </p>
                <div style={{ marginTop: 12 }}>
                  <Button
                    kind="secondary"
                    size="sm"
                    onClick={() => {
                      setFailed(false);
                      setAttempt((a) => a + 1);
                    }}
                  >
                    {t.memberRetry}
                  </Button>
                </div>
              </div>
            )}

            {profile && (
              <div className="zv-tab-in" style={{ display: "flex", flexDirection: "column", gap: 30 }}>
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
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {venues.map((v) => {
                        const on = v.key === selectedVenue?.key;
                        const multi = venues.length > 1;
                        const venueRating =
                          v.location.averageRating != null
                            ? Number(v.location.averageRating)
                            : null;
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
                              {(v.location.address || venueRating != null) && (
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
                                  {venueRating != null && (
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
                                      {venueRating.toFixed(1)}
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
                          padding: "13px 0",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            className="zv-skel"
                            style={{ height: 13, width: "56%", marginBottom: 7 }}
                          />
                          <div className="zv-skel" style={{ height: 10, width: 110 }} />
                        </div>
                        <div
                          className="zv-skel"
                          style={{ width: 34, height: 34, borderRadius: "50%" }}
                        />
                      </div>
                    ))}
                  </section>
                )}

                {/* Favorites flow — no bookable venue (or the context call
                    failed): the profile stays useful, booking is just absent. */}
                {!listing && !servicesPending && venues.length === 0 && (
                  <p style={{ margin: 0, fontSize: 13.5, color: "var(--c-600)" }}>
                    {t.memberNoBooking}
                  </p>
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
                                    {showPrices &&
                                      ` · ${formatMoney(s.priceAmountMinor, currency, locale)}`}
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
                                      width: 34,
                                      height: 34,
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

                <section>
                  <SectionKicker>{t.tabReviews}</SectionKicker>
                  {profile.reviews.length === 0 ? (
                    <EmptyState
                      icon="starO"
                      title={t.reviewsEmptyTitle}
                      body={t.reviewsEmptyBody}
                    />
                  ) : (
                    <>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                      <span
                        style={{
                          fontSize: 30,
                          fontWeight: 600,
                          letterSpacing: "-0.03em",
                          lineHeight: 1,
                          color: "var(--c-900)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {(avgRating ?? 0).toFixed(1)}
                      </span>
                      <Stars value={avgRating ?? 0} size={13} />
                      <span style={{ fontSize: 13, color: "var(--c-600)" }}>
                        {format(
                          profile.reviewStats.totalCount === 1
                            ? t.reviewsCountOne
                            : t.reviewsCount,
                          { count: String(profile.reviewStats.totalCount) },
                        )}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", marginTop: 4 }}>
                      {visibleReviews.map((r) => {
                        const name = [r.customer?.firstName, r.customer?.lastName]
                          .filter(Boolean)
                          .join(" ")
                          .trim();
                        return (
                          <div
                            key={r.id}
                            style={{
                              padding: "16px 0",
                              boxShadow: "inset 0 -1px 0 rgba(28,28,26,0.06)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <Avatar
                                src={r.customer?.profileImage ?? undefined}
                                name={name || "?"}
                                size={32}
                              />
                              <div>
                                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--c-900)" }}>
                                  {name || "—"}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 2 }}>
                                  <Stars value={r.rating} size={10.5} />
                                  <span style={{ fontSize: 11.5, color: "var(--c-500)" }}>
                                    {dateFmt.format(new Date(r.createdAt))}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {r.comment && (
                              <p
                                className="txt-pretty"
                                style={{
                                  margin: "9px 0 0",
                                  fontSize: 14,
                                  lineHeight: 1.6,
                                  color: "var(--c-800)",
                                }}
                              >
                                {r.comment}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {!allReviews && profile.reviews.length > INITIAL_REVIEWS && (
                      <div style={{ marginTop: 16 }}>
                        <Button kind="secondary" size="sm" onClick={() => setAllReviews(true)}>
                          {format(t.memberShowAllReviews, {
                            count: String(profile.reviews.length),
                          })}
                        </Button>
                      </div>
                    )}
                    </>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>

        {/* ── Booking bar ─────────────────────────────────── */}
        {(canBook || servicesPending) && (
          <div
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
              <span style={{ fontSize: 13, color: "var(--c-600)" }}>
                {t.memberChecking}
              </span>
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
                {pickedServices.length} · {formatDuration(totalDur)}
                {showPrices && ` · ${formatMoney(totalMinor, currency, locale)}`}
              </span>
            ) : (
              <span style={{ fontSize: 13, color: "var(--c-600)" }}>
                {t.memberSelectPrompt}
              </span>
            )}
            <Button
              kind="primary"
              onClick={onBook}
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
            cursor: "zoom-out",
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
              width: 36,
              height: 36,
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
        color: "var(--c-500)",
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
        color: "var(--c-500)",
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
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }} aria-hidden>
      <div>
        <div className="zv-skel" style={{ height: 11, width: 72, marginBottom: 14 }} />
        <div className="zv-skel" style={{ height: 13, width: "92%", marginBottom: 8 }} />
        <div className="zv-skel" style={{ height: 13, width: "78%" }} />
      </div>
      <div>
        <div className="zv-skel" style={{ height: 11, width: 88, marginBottom: 14 }} />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0" }}
          >
            <div style={{ flex: 1 }}>
              <div className="zv-skel" style={{ height: 13, width: "56%", marginBottom: 7 }} />
              <div className="zv-skel" style={{ height: 10, width: 110 }} />
            </div>
            <div className="zv-skel" style={{ width: 34, height: 34, borderRadius: "50%" }} />
          </div>
        ))}
      </div>
      <div>
        <div className="zv-skel" style={{ height: 11, width: 80, marginBottom: 14 }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 10,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="zv-skel" style={{ aspectRatio: "1", borderRadius: 12 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
