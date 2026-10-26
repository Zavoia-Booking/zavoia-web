"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Avatar, Button, HeartButton, Icon, Img, Rating, Stars, useToast } from "@/components/ui";
import { PageError } from "@/components/ui/page-error";
import { ImageViewer } from "@/components/ui/image-viewer";
import { Skeleton } from "@/components/ui/skeleton";
import { useToastContainerRef, type ToastHandle } from "@/components/ui/toast";
import styles from "./team-member-profile-modal.module.css";
import disclosure from "@/components/ui/disclosure-motion.module.css";
import { ProfessionalReviewsEmptyArt } from "./professional-reviews-empty-art";
import { useFavoriteToggle } from "@/app/_components/home/use-favorite-toggle";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import { professionalHref } from "@/lib/professionals/urls";
import { cn } from "@/shared/lib/utils";
import { professionalLanguageLabels } from "@/lib/professionals/languages";
import { isProfessionalUnavailable as isMemberUnavailable, type ProfessionalBookingContextSeed } from "@/lib/professionals/booking-context";
import { format, formatCount } from "@/i18n/format";
import { errorMessage } from "@/lib/api/error-messages";
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

// Professional profile shared by the public page and contextual modal.
// The page supplies the server-resolved profile; existing modal entry points
// retain their scoped or generic lookup. Both presentations hand the same
// selected venue and professional-pinned services to the existing booking flow.

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
 * `ListingTeamMember` satisfies it; Saved and appointment details map their
 * professional identity data into the same shape.
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

function validCurrency(value: string): boolean {
  return /^[A-Z]{3}$/.test(value) && Intl.supportedValuesOf("currency").includes(value);
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

export interface ProfessionalProfileProps {
  member: TeamMemberSeed;
  /**
   * Location-page flow: the listing scopes the profile (services come from
   * it). Without a listing, venues and their menus are resolved through
   * GET /team-member/:id/booking-context.
   */
  listing?: ListingDetail;
  /**
   * Keep only this business's venues in brand and appointment contexts.
   * The member may also work elsewhere. Omitted on the
   * Saved page, where venues across all businesses are the point.
   */
  businessId?: number;
  /** Appointment flow: keep its venue selected, without changing the page URL. */
  locationId?: number;
  /** Website context uses the same location-scoped professional booking journey. */
  websiteSlug?: string;
  locale: Locale;
  onClose?: () => void;
  presentation?: "modal" | "page";
  /** Server-loaded independent profile, shared with the page's metadata. */
  initialProfile?: TeamMemberProfile;
  /** Public page's existing venue contract, including nonfatal recovery state. */
  initialBookingContext?: ProfessionalBookingContextSeed;
}

const noop = () => {};

/** Shared profile content and booking behavior with contextual and page presentations. */
export function ProfessionalProfile({
  member,
  listing,
  businessId,
  locationId,
  websiteSlug,
  locale,
  onClose = noop,
  presentation = "modal",
  initialProfile,
  initialBookingContext,
}: ProfessionalProfileProps) {
  const { dict } = useTranslation();
  const t = dict.business;
  const toast = useToast();
  const isModal = presentation === "modal";
  const openBooking = useBooking().openBooking;
  const cardRef = useRef<HTMLDivElement>(null);
  const toastContainerRef = useToastContainerRef();
  // Keep the profile's native scroll positions and service/venue selections
  // while booking is active, so an explicit return resumes this same profile.
  const [bookingActive, setBookingActive] = useState(false);
  const [sharing, setSharing] = useState(false);
  const sharingRef = useRef(false);
  const shareToast = useRef<ToastHandle | null>(null);
  const profileAvailableRef = useRef(false);
  const navigatingAwayRef = useRef(false);
  const bookingOpenerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    profileAvailableRef.current = true;
    return () => {
      profileAvailableRef.current = false;
      shareToast.current?.dismiss();
    };
  }, []);
  // Favorite heart — shown to everyone; signed out, a tap asks to sign in
  // (same rule as the cards).
  // The hook seeds the current state from GET favorite/professionals itself.
  const favorites = useFavoriteToggle("professional");
  const favoritePending = useSyncExternalStore(
    subscribeProfessionalFavorites,
    () => getPendingFavoriteIds("professional").has(member.id),
    () => false,
  );

  const [loadedProfile, setProfile] = useState<TeamMemberProfile | null>(null);
  const [profileError, setProfileError] = useState<unknown>(null);
  const [requesting, setRequesting] = useState(!initialProfile);
  const [profileAttempt, setProfileAttempt] = useState(0);
  const profile = initialProfile && !listing && initialProfile.id === member.id && profileAttempt === 0
    ? initialProfile
    : loadedProfile;
  const [contextAttempt, setContextAttempt] = useState(0);
  const contextSeed = !listing && initialBookingContext?.memberId === member.id
    ? initialBookingContext : undefined;
  // Without a listing: where the member can be booked (null while loading).
  const [loadedContext, setContext] = useState<TeamMemberBookingContext | null>(null);
  const context = contextSeed?.status === "ready" && contextAttempt === 0
    ? contextSeed.context : loadedContext;
  const [contextRequesting, setContextRequesting] = useState(!listing && !contextSeed);
  // A failed booking-context load means two very different things. Permanent
  // (CUSTOMER_BOOKING.E16/E17 — the team member is gone, or has no active
  // assignment anywhere) is honestly "can't be booked". Transient (offline,
  // timeout, 5xx) is "we couldn't find out", and saying "no booking here"
  // there tells the user something we don't actually know.
  const [loadedContextFailure, setContextFailure] = useState<
    "permanent" | "transient" | null
  >(contextSeed?.status === "unavailable" ? "permanent" : contextSeed?.status === "error" ? "transient" : null);
  const contextFailure = contextSeed && contextAttempt === 0
    ? contextSeed.status === "unavailable" ? "permanent" : contextSeed.status === "error" ? "transient" : null
    : loadedContextFailure;
  const contextToast = useRef<ToastHandle | null>(null);
  const [venueKey, setVenueKey] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ scope: string | null; ids: ReadonlySet<number> }>({
    scope: null,
    ids: EMPTY_PICKED,
  });
  const [portfolioIndex, setPortfolioIndex] = useState(-1);
  const portfolioTriggers = useRef<Array<HTMLButtonElement | null>>([]);
  const portfolioOpener = useRef<HTMLButtonElement | null>(null);
  const setCardRef = useCallback((node: HTMLDivElement | null) => {
    cardRef.current = node;
    // Keep toast actions inside the active modal's keyboard scope. Ref cleanup
    // runs before the booking dialog or gallery takes over the surface.
    if (isModal && !bookingActive && portfolioIndex < 0) toastContainerRef?.(node);
  }, [isModal, bookingActive, portfolioIndex, toastContainerRef]);
  // Portal target exists only on the client (the deep-link path renders the
  // modal on the very first pass, which also runs on the server).
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  // The gallery owns keyboard/focus handling until its closing animation ends.
  // The ref also guards the parent's native Escape listener in the same event.
  const portfolioIndexRef = useRef(-1);
  const openPortfolio = useCallback((index: number) => {
    portfolioIndexRef.current = index;
    setPortfolioIndex(index);
  }, []);

  const failed = profileError !== null;
  const profileUnavailable = failed && isMemberUnavailable(profileError);
  const canShareProfile = !!profile?.uuid && profile.publicProfileAvailable === true && !profileUnavailable;
  const loading = !profile && !failed;

  useEffect(() => {
    // The page already resolved this same independent profile on the server.
    if (initialProfile && !listing && initialProfile.id === member.id && profileAttempt === 0) return;
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
  }, [listing, member.id, profileAttempt, initialProfile]);

  // Without a listing, resolve the member's bookable venues and their menus.
  useEffect(() => {
    if (listing) return;
    if (contextSeed && contextAttempt === 0) return;
    let alive = true;
    getTeamMemberBookingContext(member.id)
      .then((ctx) => {
        if (alive) {
          setContext(ctx);
          setContextFailure(null);
          contextToast.current?.dismiss();
          contextToast.current = null;
        }
      })
      .catch((e) => {
        if (!alive) return;
        const unavailable = isMemberUnavailable(e);
        setContextFailure(
          unavailable ? "permanent" : "transient",
        );
        if (!unavailable) {
          contextToast.current?.dismiss();
          contextToast.current = toast(errorMessage(e, dict.errors, t.memberContextLoadError), "warn", undefined, "error");
        }
        if (unavailable) setContext(null);
      })
      .finally(() => { if (alive) setContextRequesting(false); });
    return () => {
      alive = false;
      contextToast.current?.dismiss();
      contextToast.current = null;
    };
  }, [listing, member.id, contextAttempt, contextSeed, toast, dict.errors, t.memberContextLoadError]);

  // Server-known failures can reach this effect before the sibling toast host
  // registers. Announce after hydration, using the same client-ready snapshot
  // as the modal portal; browser request failures already arrive asynchronously.
  useEffect(() => {
    if (!mounted || contextSeed?.status !== "error" || contextAttempt !== 0) return;
    const error = new ApiError("", contextSeed.error.status, contextSeed.error.code);
    error.retryAfterSeconds = contextSeed.error.retryAfterSeconds;
    const notification = toast(errorMessage(error, dict.errors, t.memberContextLoadError), "warn", undefined, "error");
    return () => notification.dismiss();
  }, [mounted, contextSeed, contextAttempt, toast, dict.errors, t.memberContextLoadError]);

  // Shareable deep link (?tab=team&member=<id>) while open; drop it on close.
  // Location-page flow only; Saved and appointment profiles leave the URL alone.
  const onNavigateAway = useCallback(() => {
    // Next owns the destination URL. A cleanup replaceState would supersede
    // its pending navigation when closing this location-scoped modal.
    navigatingAwayRef.current = true;
    onClose();
  }, [onClose]);
  const syncUrl = isModal && !!listing && !websiteSlug;
  useEffect(() => {
    if (typeof window === "undefined" || !syncUrl || bookingActive) return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", "team");
    url.searchParams.set("member", String(member.id));
    window.history.replaceState(null, "", url);
    return () => {
      if (navigatingAwayRef.current) return;
      const u = new URL(window.location.href);
      if (u.pathname !== url.pathname || u.searchParams.get("member") !== String(member.id)) return;
      u.searchParams.delete("member");
      window.history.replaceState(null, "", u);
    };
  }, [member.id, syncUrl, bookingActive]);

  // Lock the page scroll behind the dialog.
  useEffect(() => {
    if (!isModal || bookingActive) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [bookingActive, isModal]);

  // Focus the dialog on open; hand focus back to the opener card on close.
  // Gated on `mounted` — on the deep-link/SSR path the portal renders one
  // pass later than the component mounts, so an ungated effect would fire
  // while cardRef is still null and the focus trap would never engage.
  useEffect(() => {
    if (!isModal || !mounted) return;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    return () => {
      requestAnimationFrame(() => {
        if (opener?.isConnected) opener.focus({ preventScroll: true });
      });
    };
  }, [mounted, isModal]);

  useEffect(() => {
    if (!mounted || bookingActive) return;
    if (!isModal && !bookingOpenerRef.current) return;
    // Wait for the booking dialog's isolation cleanup before restoring focus.
    const frame = requestAnimationFrame(() => {
      const target = bookingOpenerRef.current ?? cardRef.current;
      if (target?.isConnected) target.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [mounted, bookingActive, isModal]);

  // The fullscreen gallery handles its own Escape; it must not close this profile.
  useEffect(() => {
    if (!isModal || bookingActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || portfolioIndexRef.current >= 0) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, bookingActive, isModal]);

  // Keep Tab cycling inside the dialog (aria-modal alone doesn't trap focus).
  // The gallery suspends this trap and owns its separate portal. Disabled controls
  // (e.g. the Book CTA before a pick) are excluded — they can never hold focus, and
  // matching them would break the last-element wrap check.
  const onTrapTab = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || e.defaultPrevented || portfolioIndexRef.current >= 0) return;
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
    member.displayName?.trim() ||
    [member.firstName, member.lastName].filter(Boolean).join(" ").trim() ||
    dict.saved.unnamedPerson;
  const firstName = displayName.split(" ")[0] || displayName;
  const portfolioImages = useMemo(() => {
    // Admin uploads store objects; legacy/seed rows contain URL strings.
    // Keep their order and duplicate entries, excluding only missing sources.
    const sources = (profile?.portfolio ?? []).flatMap((image, index) => {
      const src = (typeof image === "string" ? image : image.url)?.trim();
      return src ? [{ id: `${index}:${src}`, src }] : [];
    });
    return sources.map((image, index) => ({
      ...image,
      alt: format(t.memberPhotoAlt, { name: displayName, index: String(index + 1) }),
    }));
  }, [profile?.portfolio, displayName, t.memberPhotoAlt]);
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
        value: formatCount(profile.yearsOfExperience, locale, {
          one: t.memberStatYearsOne,
          few: t.memberStatYears,
          other: t.memberStatYearsMany,
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
      const joined = new Date(profile.memberSince);
      // The server and first client render agree; mounted profiles keep the
      // browser-local year used by the existing contextual modal.
      const year = mounted ? joined.getFullYear() : joined.getUTCFullYear();
      if (Number.isFinite(year)) {
        cells.push({ value: format(t.memberStatSince, { year: String(year) }), label: t.memberStatSinceLabel });
      }
    }
    return cells;
  }, [profile, t, numFmt, mounted, locale]);

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
        business.locations
          .filter((location) => locationId == null || location.id === locationId)
          .map((location) => ({
            key: `${business.id}-${location.id}`,
            business,
            location,
          })),
      );
  }, [listing, context, businessId, locationId]);
  const selectedVenue =
    venues.find((v) => v.key === venueKey) ?? (venues.length === 1 ? venues[0] : null);
  const selectionScope = listing
    ? `listing-${listing.listingId}-${listing.locationId}`
    : selectedVenue?.key ?? null;
  const picked = selection.scope === selectionScope ? selection.ids : EMPTY_PICKED;

  const pickVenue = useCallback((key: string) => {
    if (key === selectedVenue?.key) return;
    setVenueKey(key);
    // Menus and prices are venue-specific — reset only when changing venues.
    setSelection({ scope: key, ids: EMPTY_PICKED });
  }, [selectedVenue?.key]);

  // The bookable menu for the current flow. Location-page flow: the listing-
  // scoped profile services. Otherwise: the selected venue's menu (the
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
  const currencyValid = validCurrency(currency);
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

  // The profile and menu remain useful when this venue lacks booking metadata.
  // Announce once per affected venue; clear stale feedback on recovery or exit.
  const bookingMetadataFailure = profile && !failed && onlineBookingAllowed &&
    activeServices.length > 0 && !bookingDetailsAvailable ? selectionScope : null;
  useEffect(() => {
    if (!mounted || !bookingMetadataFailure) return;
    const notification = toast(t.memberBookingDetailsUnavailable, "warn", undefined, "error");
    return () => notification.dismiss();
  }, [mounted, bookingMetadataFailure, toast, t.memberBookingDetailsUnavailable]);

  const onBook = useCallback(() => {
    if (bookingActive || !canBook || pickedServices.length === 0) return;
    bookingOpenerRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const profileOrigin = {
      isAvailable: () => profileAvailableRef.current,
      onReturn: () => setBookingActive(false),
      onDismiss: () => {
        if (!profileAvailableRef.current) return;
        if (isModal) onClose();
        else setBookingActive(false);
      },
    };
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
        profileOrigin,
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
        profileOrigin,
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
    setBookingActive(true);
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
    bookingActive,
    isModal,
  ]);

  const about = profile?.about;

  const copyLink = useCallback(async () => {
    if (!canShareProfile || !profile?.uuid || !profileAvailableRef.current) return;
    shareToast.current?.dismiss();
    const url = new URL(professionalHref(locale, profile.uuid), window.location.origin).href;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      if (profileAvailableRef.current) toast(t.shareCopied, "copy");
    } catch {
      if (profileAvailableRef.current) shareToast.current = toast(t.memberCopyError, "warn", undefined, "error");
    }
  }, [canShareProfile, profile?.uuid, locale, toast, t.shareCopied, t.memberCopyError]);

  const onShare = useCallback(async () => {
    if (!canShareProfile || !profile?.uuid || sharingRef.current) return;
    sharingRef.current = true;
    setSharing(true);
    shareToast.current?.dismiss();
    try {
      if (navigator.share) {
        try {
          // Invoke directly from the click; do not fetch before the share sheet.
          await navigator.share({
            title: displayName,
            url: new URL(professionalHref(locale, profile.uuid), window.location.origin).href,
          });
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          if (profileAvailableRef.current) {
            shareToast.current = toast(t.memberShareError, "warn", {
              label: t.memberCopyLink,
              // A fresh click grants clipboard activation after a failed share.
              onClick: () => { void copyLink(); },
            }, "error");
          }
        }
      } else {
        await copyLink();
      }
    } finally {
      sharingRef.current = false;
      if (profileAvailableRef.current) setSharing(false);
    }
  }, [canShareProfile, profile?.uuid, locale, displayName, copyLink, toast, t.memberShareError, t.memberCopyLink]);

  // Portal to <body>: an ancestor animating `transform` (e.g. the tab's
  // .zv-tab-in entrance) would otherwise become the containing block for this
  // fixed overlay and clip it during the animation.
  if (isModal && !mounted) return null;

  const Root = isModal ? "div" : "main";
  const Name = isModal ? "h2" : "h1";
  const serviceMenu = (
    <ProfessionalServiceMenu
      services={activeServices}
      firstName={firstName}
      currency={currency}
      showPricing={showPricing}
      canBook={canBook}
      picked={picked}
      onToggle={togglePick}
      headingLevel={isModal ? "h3" : "h2"}
      locale={locale}
    />
  );
  const renderVenueServices = (venue: Venue, selected: boolean) => {
    const venueCurrency = (venue.business.businessCurrency ?? "").trim().toUpperCase();
    const metadataAvailable = validCurrency(venueCurrency) && validTimeZone((venue.location.timezone ?? "").trim());
    return (
      <ProfessionalServiceMenu
        services={venue.location.services}
        firstName={firstName}
        currency={venueCurrency}
        showPricing={venue.location.showPricing !== false}
        canBook={!!profile && !profileUnavailable && venue.location.allowOnlineBooking === true && metadataAvailable}
        picked={selected ? picked : EMPTY_PICKED}
        onToggle={selected ? togglePick : noop}
        headingLevel={isModal ? "h4" : "h3"}
        locale={locale}
        locationHref={venues.length > 1 ? localeHref(locale, "business", venue.location.slug || String(venue.location.id)) : undefined}
        locationName={[venue.business.name, venue.location.name !== venue.business.name ? venue.location.name : null].filter(Boolean).join(" · ")}
        onNavigate={onNavigateAway}
      />
    );
  };
  const content = (
    <Root
      className={isModal ? `zw-member-overlay ${styles.overlay}` : styles.page}
      role={isModal ? "dialog" : undefined}
      aria-modal={isModal ? true : undefined}
      aria-label={displayName}
      inert={portfolioIndex >= 0 || bookingActive || undefined}
      style={isModal && bookingActive ? { display: "none" } : undefined}
      onKeyDown={isModal ? onTrapTab : undefined}
    >
      {isModal && <div
        className="zv-sheet-backdrop"
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(28,28,26,0.34)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", cursor: "pointer" }}
      />}
      <div ref={setCardRef} tabIndex={isModal ? -1 : undefined} className={isModal ? `zw-member-card zw-modal-in ${styles.card}` : `zw-container ${styles.pageCard}`} style={{ outline: "none" }}>
        <div className={styles.toolbar}>
          {!isModal && <Link className={styles.pageBack} href={localeHref(locale, "search")}>
            <Icon name="chevL" size={16} />{t.browseBusinesses}
          </Link>}
          <div className={styles.toolbarActions}>
            <div className={styles.save}>
              <HeartButton
                active={favorites.isFavorited(member.id)}
                floating={false}
                size={44}
                iconSize={20}
                loading={favoritePending}
                onClick={() => favorites.toggle(member.id)}
              />
            </div>
            {(!profile || canShareProfile) && <Button kind="ghost" size="sm" className={styles.share} onClick={onShare}
              aria-label={t.share} disabled={!canShareProfile} loading={sharing}>
              <Icon name="share" size={18} />{t.share}
            </Button>}
          </div>
          {isModal && <button
            type="button"
            className={`tap ${styles.close}`}
            aria-label={t.close}
            onClick={onClose}
          >
            <Icon name="x" size={18} color="var(--c-800)" />
          </button>}
        </div>

        <div className={`zw-member-body ${styles.body}`}>
          {/* ── Identity rail ─────────────────────────────── */}
          <aside className={`zw-member-rail ${styles.rail}`}>
            <div className={styles.identity}>
              <div className={styles.portrait}>
                <Avatar src={profile?.profileImage ?? member.profileImage ?? undefined} name={displayName} size={112} ring />
              </div>
              <div className={styles.identityText}>
                <Name className={`txt-balance ${styles.name}`}>
                  {displayName}
                </Name>
                {professionalTitle && (
                  <div className={styles.professionalTitle}>
                    {professionalTitle}
                  </div>
                )}
                {avgRating != null && (
                  <div className={styles.rating}>
                    <Rating rating={avgRating} reviews={reviewCount} size={13.5} />
                  </div>
                )}
                {isModal && canShareProfile && profile && (
                  <Link
                    className={cn(styles.viewLocation, styles.viewProfile)}
                    href={professionalHref(locale, profile.uuid)}
                    onNavigate={onNavigateAway}
                  >
                    {dict.locationPage.viewProfile}<Icon name="arrowR" size={14} />
                  </Link>
                )}
              </div>
            </div>

            {stats.length > 0 && (
              <div className={styles.stats}>
                {stats.map((c) => (
                  <div key={c.label} className={styles.stat}>
                    <div className={styles.statValue}>
                      {c.value}
                    </div>
                    <div className={styles.statLabel}>
                      {c.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {about?.languages && about.languages.length > 0 && (
              <div className={styles.railSection}>
                <RailKicker as={isModal ? "h3" : "h2"}>{t.memberSpeaks}</RailKicker>
                <div className={styles.railText}>
                  {professionalLanguageLabels(about.languages, dict.venueTags.languages).join(", ")}
                </div>
              </div>
            )}

            {about?.interests && about.interests.length > 0 && (
              <div className={styles.railSection}>
                <RailKicker as={isModal ? "h3" : "h2"}>{t.memberSpecialties}</RailKicker>
                <div className={styles.specialties}>
                  {about.interests.map((it) => (
                    <span
                      key={it}
                      className={styles.specialty}
                    >
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {socials.length > 0 && (
              <div className={styles.socials}>
                {socials.map((s) => (
                  <a
                    key={s.key}
                    className={`tap ${styles.social}`}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.key}
                  >
                    <Icon name={s.icon} size={17} color="currentColor" />
                  </a>
                ))}
              </div>
            )}
          </aside>

          {/* ── Content ───────────────────────────────────── */}
          <div className={`zw-member-main ${styles.main}`} aria-busy={requesting || contextRequesting || undefined}>
            {loading && <ProfileSkeleton />}

            {failed && (
              <>
                <PageError
                  variant="contained"
                  title={profileUnavailable ? t.memberUnavailable : t.memberLoadError}
                  description={profileUnavailable
                    ? dict.notFound.page.description
                    : errorMessage(profileError, dict.errors, dict.errors.pageRecovery.body)}
                  primary={profileUnavailable ? (isModal
                    ? { label: t.close, onClick: onClose }
                    : { label: t.browseBusinesses, href: localeHref(locale, "search") }) : {
                    label: t.memberRetry,
                    loading: requesting,
                    onClick: () => {
                      setRequesting(true);
                      setProfileAttempt((a) => a + 1);
                    },
                  }}
                  focusOnMount
                />
                <span role="status" className="sr-only">{requesting ? t.memberChecking : ""}</span>
              </>
            )}

            {profile && (
              <div className={styles.sections}>
                {about?.aboutMe && (
                  <section>
                    <SectionKicker as={isModal ? "h3" : "h2"}>{t.tabAbout}</SectionKicker>
                    <p
                      className={`txt-pretty ${styles.bio}`}
                    >
                      {about.aboutMe}
                    </p>
                  </section>
                )}

                {/* Without a listing: where the member can be booked. One card
                    per venue; the inline menu always belongs to the selected
                    venue (prices/menus differ per location). */}
                {!listing && venues.length > 0 && (
                  <ProfessionalVenues
                    venues={venues}
                    selectedKey={selectedVenue?.key ?? null}
                    onPick={pickVenue}
                    renderServices={renderVenueServices}
                    onNavigate={onNavigateAway}
                    locale={locale}
                    headingLevel={isModal ? "h3" : "h2"}
                  />
                )}

                {/* Booking context still resolving. */}
                {servicesPending && (
                  <section aria-hidden>
                    <SectionKicker as={isModal ? "h3" : "h2"}>{t.tabServices}</SectionKicker>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={styles.serviceRow}
                      >
                        <div style={{ flex: 1 }}>
                          <Skeleton w="56%" h={23} style={{ marginBottom: 6 }} />
                          <Skeleton w={110} h={18.75} />
                        </div>
                        <Skeleton w={44} h={44} r={999} />
                      </div>
                    ))}
                  </section>
                )}

                {/* No bookable venue (or the context call
                    failed): the profile stays useful, booking is just absent. */}
                {!listing && !servicesPending && (contextFailure || venues.length === 0) && (
                  <div>
                    {contextFailure !== "transient" && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13.5,
                          color: "var(--c-600)",
                        }}
                      >
                        {locationId != null ? t.memberNoBookingAtLocation : t.memberNoBooking}
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

                {listing && serviceMenu}

                {portfolioImages.length > 0 && (
                  <section>
                    <SectionKicker as={isModal ? "h3" : "h2"}>{t.memberPortfolio}</SectionKicker>
                    <div className={styles.portfolio}>
                      {portfolioImages.map((image, index) => (
                        <button
                          key={image.id}
                          ref={(node) => { portfolioTriggers.current[index] = node; }}
                          type="button"
                          className={`zw-member-tile tap ${styles.portfolioTile}`}
                          aria-label={format(t.memberPhotoAria, { name: displayName, index: String(index + 1) })}
                          aria-haspopup="dialog"
                          onClick={(event) => {
                            portfolioOpener.current = event.currentTarget;
                            openPortfolio(index);
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image.src} alt={image.alt} loading="lazy" />
                        </button>
                      ))}
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
                  headingLevel={isModal ? "h3" : "h2"}
                  localTime={mounted}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Booking bar ─────────────────────────────────── */}
        {!profileUnavailable && (canBook || servicesPending) && (
          <div
            aria-busy={servicesPending}
            className={styles.bookingBar}
          >
            {servicesPending ? (
              <div className={styles.bookingSummary}>
                <div aria-hidden="true"><Skeleton h={18} r={4} style={{ maxWidth: 160 }} /></div>
                <span role="status" className="sr-only">{t.memberChecking}</span>
              </div>
            ) : pickedServices.length > 0 ? (
              <span className={`${styles.bookingSummary} ${styles.bookingTotal}`}>
                {pickedServices.length} · {formatDuration(totalDur)} ·{" "}
                {showPricing
                  ? formatMoney(totalMinor, currency, locale)
                  : dict.locationPage.requestQuote}
              </span>
            ) : (
              <span className={styles.bookingSummary}>
                {t.memberSelectPrompt}
              </span>
            )}
            <Button
              kind="accent"
              size="lg"
              className={styles.bookingAction}
              onClick={onBook}
              style={{ border: "none", color: "var(--c-50)" }}
              disabled={servicesPending || pickedServices.length === 0}
            >
              {format(t.memberBookWith, { name: firstName })}
            </Button>
          </div>
        )}
      </div>

      {/* Its portal sits outside the inert profile in the DOM. */}
      {portfolioIndex >= 0 && portfolioImages.length > 0 && (
        <ImageViewer
          images={portfolioImages}
          index={Math.min(portfolioIndex, portfolioImages.length - 1)}
          onIndexChange={openPortfolio}
          title={displayName}
          labels={{
            close: t.memberClosePhotoAria,
            previous: dict.locationPage.previousPhoto,
            next: dict.locationPage.nextPhoto,
            position: (index, count) => format(dict.locationPage.photoPosition, { index: String(index + 1), count: String(count) }),
            unavailable: dict.imageViewer.unavailable,
          }}
          getSource={(index) => portfolioTriggers.current[index] ?? null}
          getReturnFocus={() => portfolioOpener.current}
        />
      )}
    </Root>
  );
  return isModal ? createPortal(content, document.body) : content;
}

/** Render each venue's own menu in its actual panel, including before a choice. */
function ProfessionalServiceMenu({
  services,
  firstName,
  currency,
  showPricing,
  canBook,
  picked,
  onToggle,
  headingLevel,
  locale,
  locationHref,
  locationName,
  onNavigate,
}: {
  services: BookableService[];
  firstName: string;
  currency: string;
  showPricing: boolean;
  canBook: boolean;
  picked: ReadonlySet<number>;
  onToggle: (id: number) => void;
  headingLevel: "h2" | "h3" | "h4";
  locale: Locale;
  locationHref?: string;
  locationName?: string;
  onNavigate?: () => void;
}) {
  const { dict } = useTranslation();
  const t = dict.business;
  const currencyValid = validCurrency(currency);
  const groups = new Map<string, { name: string; color: string; items: BookableService[] }>();
  for (const service of services) {
    const key = service.category?.name ?? "";
    if (!groups.has(key)) groups.set(key, {
      name: key,
      color: service.category?.color ?? "var(--c-400)",
      items: [],
    });
    groups.get(key)!.items.push(service);
  }
  const locationLink = locationHref ? (
    <Link className={styles.viewLocation} href={locationHref} onNavigate={onNavigate}
      aria-label={locationName ? format(t.memberViewLocationAria, { name: locationName }) : undefined}>
      {t.memberViewLocation}<Icon name="arrowR" size={14} />
    </Link>
  ) : null;

  if (services.length === 0) return (
    <div className={styles.servicesHeader}>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--c-600)" }}>
        {format(t.memberNoServicesHere, { name: firstName })}
      </p>
      {locationLink}
    </div>
  );

  return (
    <section>
      <div className={styles.servicesHeader}>
        <SectionKicker as={headingLevel}>{t.tabServices}</SectionKicker>
        {locationLink}
      </div>
      <div className={styles.serviceGroups}>
        {[...groups.values()].map((group) => (
          <div key={group.name}>
            {group.name && (
              <div className={styles.category}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: group.color }} />
                {group.name}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {group.items.map((service) => {
                const selected = picked.has(service.id);
                const content = (
                  <>
                    <span className={styles.serviceText}>
                      <span className={styles.serviceName}>{service.name}</span>
                      <span className={styles.serviceMeta}>
                        {formatDuration(service.duration)}
                        {!showPricing
                          ? ` · ${dict.locationPage.requestQuote}`
                          : currencyValid ? ` · ${formatMoney(service.priceAmountMinor, currency, locale)}` : ""}
                      </span>
                    </span>
                    {canBook && (
                      <span className={styles.pick} aria-hidden="true">
                        <Icon name={selected ? "check" : "plus"} size={18} color={selected ? "var(--c-50)" : "var(--c-900)"} />
                      </span>
                    )}
                  </>
                );
                return canBook ? (
                  <button key={service.id} type="button" className={styles.serviceRow} data-selected={selected}
                    onClick={() => onToggle(service.id)}
                    aria-label={`${selected ? t.remove : t.add} ${service.name}`} aria-pressed={selected}>
                    {content}
                  </button>
                ) : (
                  <div key={service.id} className={styles.serviceRow} data-selected={selected}>{content}</div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Group the same eligible venues for display; selection and booking stay upstream. */
function ProfessionalVenues({
  venues,
  selectedKey,
  onPick,
  renderServices,
  onNavigate,
  locale,
  headingLevel,
}: {
  venues: Venue[];
  selectedKey: string | null;
  onPick: (key: string) => void;
  renderServices: (venue: Venue, selected: boolean) => React.ReactNode;
  onNavigate: () => void;
  locale: Locale;
  headingLevel: "h2" | "h3";
}) {
  const { dict } = useTranslation();
  const panelPrefix = useId();
  // Preserve the outgoing venue's own prices and picks until its close finishes.
  const [closingMenus, setClosingMenus] = useState<Map<string, React.ReactNode>>(() => new Map());
  const multi = venues.length > 1;
  const groups = new Map<number, { business: ContextBusiness; venues: Venue[] }>();
  for (const venue of venues) {
    const group = groups.get(venue.business.id);
    if (group) group.venues.push(venue);
    else groups.set(venue.business.id, { business: venue.business, venues: [venue] });
  }

  return (
    <section>
      <SectionKicker as={headingLevel}>{multi ? dict.business.memberChooseVenue : dict.business.memberLocation}</SectionKicker>
      <div className={styles.venues}>
        {[...groups.values()].map(({ business, venues: groupVenues }) => (
          <div key={business.id} role={multi ? "group" : undefined} aria-label={multi ? business.name : undefined}>
            {multi && (
              <div className={styles.venueGroupHeader}>
                <div className={styles.venueGroupIdentity}>
                  <Avatar src={business.logo ?? undefined} name={business.name} size={28} />
                  <span className={styles.venueGroupName}>{business.name}</span>
                </div>
                <span className={styles.venueGroupCount}>
                  {formatCount(groupVenues.length, locale, {
                    one: dict.brandPage.locationsCountOne,
                    few: dict.brandPage.locationsCount,
                    other: dict.brandPage.locationsCountMany,
                  })}
                </span>
              </div>
            )}
            <div className={styles.venueOptions}>
              {groupVenues.map((venue) => {
                const { location } = venue;
                const selected = venue.key === selectedKey;
                const panelId = `${panelPrefix}-${venue.key}-services`;
                const rating = location.averageRating != null ? Number(location.averageRating) : null;
                const hasRating = rating != null && Number.isFinite(rating) && rating > 0;
                const distinctLocation = location.name && location.name !== business.name;
                const details = (
                  <span className={styles.venueText}>
                    {!multi && distinctLocation && <span className={styles.venueBrand}>{business.name}</span>}
                    <span className={styles.venueName}>{distinctLocation ? location.name : business.name}</span>
                    {location.address && <span className={styles.venueAddress}>{location.address}</span>}
                    {hasRating && <span className={styles.venueRating}><Rating rating={rating} reviews={location.totalReviews} size={13} /></span>}
                  </span>
                );

                return (
                  <div key={venue.key} className={`${styles.venueEntry} ${disclosure.root}`}>
                    <div className={styles.venue} data-single={!multi} data-selected={selected}>
                      <Img
                        src={location.featuredImage ?? business.logo ?? undefined}
                        alt=""
                        className={styles.venuePhoto}
                        label={<Icon name="pin" size={24} color="var(--c-500)" />}
                      />
                      {multi ? (
                        <button
                          type="button"
                          className={styles.venueChoice}
                          aria-label={[business.name, location.name, location.address].filter(Boolean).join(", ")}
                          aria-pressed={selected}
                          aria-expanded={selected}
                          aria-controls={panelId}
                          onClick={() => {
                            if (!selected) {
                              const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                              setClosingMenus((current) => {
                                const next = reduceMotion ? new Map<string, React.ReactNode>() : new Map(current);
                                next.delete(venue.key);
                                const outgoing = venues.find((item) => item.key === selectedKey);
                                if (outgoing && !reduceMotion) next.set(outgoing.key, renderServices(outgoing, true));
                                return next;
                              });
                            }
                            onPick(venue.key);
                          }}
                        >
                          {details}
                          <span aria-hidden className={styles.venueRadio}>
                            {selected && <Icon name="check" size={14} color="var(--c-50)" />}
                          </span>
                        </button>
                      ) : (
                        <Link className={styles.venueChoice} href={localeHref(locale, "business", location.slug || String(location.id))} onNavigate={onNavigate}>
                          {details}
                          <Icon name="chevR" size={18} color="var(--c-600)" />
                        </Link>
                      )}
                    </div>
                    <div
                      id={panelId}
                      className={styles.venueServices}
                      data-open={selected}
                      inert={!selected}
                      aria-hidden={!selected}
                      onTransitionEnd={(event) => {
                        if (event.target === event.currentTarget && event.propertyName === "grid-template-rows" && !selected) {
                          setClosingMenus((current) => {
                            if (!current.has(venue.key)) return current;
                            const next = new Map(current);
                            next.delete(venue.key);
                            return next;
                          });
                        }
                      }}
                    >
                      <div className={disclosure.body}>
                        <div className={styles.venueServicesBody}>
                          {closingMenus.get(venue.key) ?? renderServices(venue, selected)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProfessionalReviews({
  memberId,
  initialReviews,
  initialTotal,
  averageRating,
  locale,
  headingLevel,
  localTime,
}: {
  memberId: number;
  initialReviews: ProfessionalReview[];
  initialTotal: number;
  averageRating: number | null;
  locale: Locale;
  headingLevel: "h2" | "h3";
  localTime: boolean;
}) {
  const { dict } = useTranslation();
  const t = dict.business;
  const toast = useToast();
  const [reviews, setReviews] = useState(initialReviews);
  const [offset, setOffset] = useState(initialReviews.length);
  const [total, setTotal] = useState(initialTotal);
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);
  const loadToast = useRef<ToastHandle | null>(null);
  const active = useRef(true);
  const inFlight = useRef(false);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      loadToast.current?.dismiss();
    };
  }, []);

  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: localTime ? undefined : "UTC" }),
    [locale, localTime],
  );
  const hasMore = offset < total;
  const visibleReviews = expanded ? reviews : reviews.slice(0, INITIAL_REVIEWS);

  const loadMore = async () => {
    if (inFlight.current) return;
    setExpanded(true);
    if (!hasMore) return;
    inFlight.current = true;
    setPending(true);
    loadToast.current?.dismiss();
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
        loadToast.current = toast(errorMessage(error, dict.errors, t.loadMoreReviewsError), "warn", undefined, "error");
      }
    } finally {
      inFlight.current = false;
      if (active.current) setPending(false);
    }
  };

  return (
    <section className={styles.reviewsSection}>
      <SectionKicker as={headingLevel}>{t.tabReviews}</SectionKicker>
      {reviews.length === 0 && total === 0 ? (
        <div className={styles.reviewsEmpty}>
          <div className={styles.reviewsEmptyArt}><ProfessionalReviewsEmptyArt /></div>
          <div className={styles.reviewsEmptyCopy}>
            <p className={styles.reviewsEmptyTitle}>{t.memberReviewsEmptyTitle}</p>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.reviewSummary}>
            <span className={styles.reviewAverage}>
              {averageRating == null ? "—" : new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(averageRating)}
            </span>
            <div className={styles.reviewAggregate}>
              {averageRating != null && <Stars value={averageRating} size={16} gap={3} />}
              <span className={styles.reviewCount}>
                {formatCount(total, locale, {
                  one: t.reviewsCountOne,
                  few: t.reviewsCount,
                  other: t.reviewsCountMany,
                })}
              </span>
            </div>
          </div>
          <div aria-busy={pending || undefined} className={styles.reviewList}>
            {visibleReviews.map((review) => {
              const name = [review.customer?.firstName, review.customer?.lastName].filter(Boolean).join(" ").trim();
              return (
                <article key={review.id} className={styles.review}>
                  <header className={styles.reviewHeader}>
                    <Avatar src={review.customer?.profileImage ?? undefined} name={name || "?"} size={40} />
                    <div className={styles.reviewIdentity}>
                      <div className={styles.reviewName}>{name || "—"}</div>
                      <Stars value={review.rating} size={13} gap={2} />
                    </div>
                    <time dateTime={review.createdAt} className={styles.reviewDate}>
                      {dateFmt.format(new Date(review.createdAt))}
                    </time>
                  </header>
                  {review.comment && (
                    <p className={`txt-pretty ${styles.reviewComment}`}>
                      {review.comment}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
          {((!expanded && reviews.length > INITIAL_REVIEWS) || hasMore) && (
            <div className={styles.reviewsMore}>
              <Button kind="secondary" size="sm" onClick={loadMore} loading={pending}>
                {t.loadMoreReviews}
              </Button>
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

/** Readable section headings matching the appointment dialogs. */
function SectionKicker({ children, as: Heading = "h3" }: { children: React.ReactNode; as?: "h2" | "h3" | "h4" }) {
  return (
    <Heading className={`txt-balance ${styles.sectionHeading}`}>
      {children}
    </Heading>
  );
}

/** Quieter labels for supporting profile details. */
function RailKicker({ children, as: Heading = "h3" }: { children: React.ReactNode; as?: "h2" | "h3" }) {
  return (
    <Heading className={styles.railHeading}>
      {children}
    </Heading>
  );
}

/** Loading placeholder mirroring the content column's real layout. */
function ProfileSkeleton() {
  return (
    <div className={styles.sections} aria-hidden>
      <div>
        <Skeleton h={25} w={72} style={{ marginBottom: 16 }} />
        <Skeleton h={24} w="92%" />
        <Skeleton h={24} w="78%" />
      </div>
      <div>
        <Skeleton h={25} w={88} style={{ marginBottom: 16 }} />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={styles.serviceRow}
          >
            <div style={{ flex: 1 }}>
              <Skeleton h={23} w="56%" style={{ marginBottom: 6 }} />
              <Skeleton h={18.75} w={110} />
            </div>
            <Skeleton w={44} h={44} r={999} />
          </div>
        ))}
      </div>
      <div>
        <Skeleton h={25} w={80} style={{ marginBottom: 16 }} />
        <div className={styles.portfolio}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} h="auto" r={12} style={{ aspectRatio: "1" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
