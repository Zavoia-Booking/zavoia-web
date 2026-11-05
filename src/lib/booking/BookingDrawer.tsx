"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { Avatar, Button, Icon, Skeleton, Spinner } from "@/components/ui";
import { useToast, useToastContainerRef } from "@/components/ui/toast";
import styles from "./booking-drawer.module.css";
import { useTranslation } from "@/i18n/useTranslation";
import { format, formatCount } from "@/i18n/format";
import { localeHref } from "@/i18n/routes";
import {
  formatDuration,
  formatMoney,
  formatSelectionSpread,
  formatServiceSpread,
  sumServiceSpreads,
  type ServiceSpread,
} from "@/lib/format/money-time";
import {
  itemVariesByStaff,
  needsStaffChoice,
  resolveSlotItems,
  slotSpread,
  staffFiguresForItem,
  type ResolvedSlotItem,
} from "@/lib/booking/staff-resolution";
import { useAuth } from "@/lib/auth/useAuth";
import { getAuthenticatedSessionId } from "@/lib/auth/session-store";
import { useAuthModal } from "@/components/shell/auth-modal-provider";
import { errorMessage, mapBackendCode } from "@/lib/api/error-messages";
import {
  getBookingCalendar,
  getBookingSlots,
} from "@/lib/api/marketplace/booking";
import { bookAppointment } from "@/lib/api/marketplace/appointments";
import { classifyBookingBlock, type BookingBlock } from "./errors";
import type {
  BookAppointmentBody,
  BookingCalendar,
  BookingPolicy,
  BookingCalendarDay,
  BookingDaySlots,
  BookingServiceItem,
  ServiceSelection,
  TimeSlot,
} from "@/lib/api/marketplace/types";
import type {
  BookingPick,
  BookingSelectionItem,
  OpenBookingPayload,
} from "./types";
import { addWallDays, todayInTz, zonedWallTimeToUtcISO } from "./tz";
import { useBooking } from "./useBooking";
import { exactSlotSelection, findExactSlot } from "./sequence";
import { BookingSuccessArt } from "./booking-success-art";

export interface BookingDrawerProps {
  open: boolean;
  payload: OpenBookingPayload | null;
  onClose: () => void;
}

type Step = 1 | 2 | 3;
type StaffPicks = Record<number, number>; // slot-item index → chosen staffId
type StaffPerson = { staffId: number; name: string; image: string | null };
/** One booked service or package, as the confirmation lists it. */
type BookedItem = {
  key: string;
  name: string;
  bundle: boolean;
  /** Venue wall-clock start ("HH:mm"); null when only the response is known. */
  startTime: string | null;
  durationMinutes: number;
  staffId: number | null;
};

/** The named professionals behind a set of picks, once each, in booking order. */
function peopleFor(
  staffIds: Array<number | undefined>,
  directory: BookingDaySlots["staffDirectory"] | undefined,
): StaffPerson[] {
  return [
    ...new Set(staffIds.filter((id): id is number => id != null)),
  ].flatMap((staffId) => {
    const entry = directory?.[staffId];
    return entry?.name ? [{ staffId, name: entry.name, image: entry.image }] : [];
  });
}

const CAL_DAYS_TO_CHECK = 30;

/** crypto.randomUUID with a non-crypto fallback (older Safari / SSR-less guard). */
function mintKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `bk-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Map resolved booking selection items into calendar/slots ServiceSelection[]. */
function toServiceSelections(
  services: BookingSelectionItem[],
): ServiceSelection[] {
  return services.map((s) => ({
    ...(s.bundleId != null
      ? { bundleId: s.bundleId }
      : { serviceId: s.serviceId }),
    ...(s.teamMemberId != null ? { teamMemberId: s.teamMemberId } : {}),
  }));
}

/** Drop every pinned professional so availability is fetched unpinned. */
function stripPins(services: BookingSelectionItem[]): BookingSelectionItem[] {
  return services.map((s) => ({ ...s, teamMemberId: undefined }));
}

/**
 * The preselection as services-step picks, or null when this booking has no
 * services step: the menu didn't come along, a professional is pinned (profile
 * and rebook keep their own choice), or an item isn't on the menu.
 */
function servicesStepPicks(
  payload: OpenBookingPayload | null,
): BookingPick[] | null {
  if (!payload) return null;
  const picks: BookingPick[] = [];
  for (const item of payload.services) {
    if (!payload.catalog || item.teamMemberId != null) return null;
    if (
      item.bundleId != null &&
      payload.catalog.bundles.some((bundle) => bundle.id === item.bundleId)
    )
      picks.push({ type: "bundle", id: item.bundleId });
    else if (
      item.serviceId != null &&
      payload.catalog.services.some((service) => service.id === item.serviceId)
    )
      picks.push({ type: "service", id: item.serviceId });
    else return null;
  }
  return picks;
}

/** Identifies an ordered selection; order matters, services run in sequence. */
function selectionKey(picks: BookingPick[]): string {
  return picks
    .map((pick) => `${pick.type === "bundle" ? "b" : "s"}${pick.id}`)
    .join(",");
}

/** Format a YYYY-MM-DD into a localized "Mon, Jan 5"-style label. */
function fmtDateLabel(date: string, locale: string, timeZone: string): string {
  const [y, mo, d] = date.split("-").map(Number);
  // Anchor at noon UTC to avoid the calendar date drifting across the day line
  // when projected into the location tz for display.
  const dt = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
  }).format(dt);
}

/** Format an HH:mm into a localized time label using the location tz. */
function fmtTimeLabel(
  date: string,
  time: string,
  locale: string,
  timeZone: string,
): string {
  const iso = zonedWallTimeToUtcISO(date, time, timeZone);
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

type SlotGroup = "morning" | "afternoon" | "evening";
function groupForTime(start: string): SlotGroup {
  const h = Number(start.split(":")[0]);
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

/**
 * Submit-time booking failures, keyed on the FULL namespaced backend code —
 * `ApiError.code` is always namespaced ("MARKETPLACE_BOOKING.E08"), and a bare
 * suffix collides across namespaces (`CUSTOMER_BOOKING.E14` — booking disabled
 * for the venue, a permanent block handled separately by classifyBookingBlock
 * — is a completely different failure from `MARKETPLACE_BOOKING.E14` below).
 * See reschedule-modal.tsx, which solves the identical problem the same way.
 * Every mapped code sends the user back to step 2 — date/time/staff all live
 * there now, so step 1 is never a valid error-recovery target.
 */
const BOOKING_SUBMIT_ERROR_KEYS: Record<string, keyof BookingDict["errors"]> = {
  "MARKETPLACE_BOOKING.E08": "tooSoon",
  "MARKETPLACE_BOOKING.E09": "tooFar",
  "MARKETPLACE_BOOKING.E10": "slotConflict",
  "MARKETPLACE_BOOKING.E11": "outsideHours",
  "MARKETPLACE_BOOKING.E14": "calendarBlock",
  "MARKETPLACE_BOOKING.E15": "staffUnavailable",
};

/**
 * Real booking drawer: date → time + staff → review/confirm → success.
 * Wired to the live availability + book endpoints. The full `payload`
 * (listingId, locationId, businessId, timezone, currency, services) is provided
 * by the detail page via useBooking().openBooking().
 */
export function BookingDrawer({ open, payload, onClose }: BookingDrawerProps) {
  const { dict, locale } = useTranslation();
  const router = useRouter();
  const { status } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { closeForAuth, returnToProfile } = useBooking();
  const toast = useToast();
  const toastContainerRef = useToastContainerRef();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const setDialogRef = useCallback(
    (node: HTMLDivElement | null) => {
      dialogRef.current = node;
      toastContainerRef?.(node);
    },
    [toastContainerRef],
  );
  const t = dict.booking;
  const tb = dict.business;

  // Whether this session has a reachable step 1 — whenever the menu came along
  // with no professional pinned (see servicesStepPicks). A preselection opens
  // on step 2 with step 1 one Back away. Captured once per open (see the reset
  // effect below) so it doesn't flicker as local picks change.
  const [hasStep1, setHasStep1] = useState(
    () => servicesStepPicks(payload) !== null,
  );

  // ── Flow state ──
  const [step, setStep] = useState<Step>(
    payload?.services.length === 0 ? 1 : 2,
  );
  const bodyRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    // Each booking step opens at its heading; browsing dates keeps its place.
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [step]);
  const [calendar, setCalendar] = useState<BookingCalendar | null>(null);
  const [calLoading, setCalLoading] = useState(false);
  // Resolved message (transport-aware — see loadCalendar), not a bare flag, so
  // "you're offline" can win over the generic "couldn't load availability".
  const [calError, setCalError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [daySlots, setDaySlots] = useState<BookingDaySlots | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [staffPicks, setStaffPicks] = useState<StaffPicks>({});
  const [validating, setValidating] = useState(false);
  const [validatedQuote, setValidatedQuote] = useState<{
    slot: TimeSlot; day: BookingDaySlots; picks: StaffPicks;
  } | null>(null);
  const validationRequestRef = useRef(0);
  // Freeze an attempted request until a definitive rejection or selection change.
  const attemptedBookingRef = useRef<{ body: BookAppointmentBody; key: string; sessionId: number } | null>(null);
  const invalidateQuote = useCallback(() => {
    validationRequestRef.current += 1;
    setValidatedQuote(null);
    setValidating(false);
    attemptedBookingRef.current = null;
  }, []);

  // Permanent booking block (CUSTOMER_BOOKING.* — venue delisted, service
  // removed at this location, no staff, pinned pro can't perform). Replaces
  // the step UI with an honest message instead of a retry that can't succeed.
  const [blocked, setBlocked] = useState<BookingBlock | null>(null);
  // staff-pin recovery: strip every pinned professional and refetch unpinned.
  const [ignorePins, setIgnorePins] = useState(false);

  // Step 1 (choose services) local picks, seeded from the preselection — only
  // relevant when `hasStep1`. Keyed the same way business-detail.tsx keys its
  // own selection.
  const [picked, setPicked] = useState<BookingPick[]>(
    () => servicesStepPicks(payload) ?? [],
  );
  // The selection step 2's date/time/staff state was built for, so leaving
  // step 1 without changing anything keeps what was already chosen.
  const step2SelectionRef = useRef<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    pending: boolean;
    scheduledAt: string;
    /** When the last booked appointment ends; null when the response omits it. */
    endsAt: string | null;
    items: BookedItem[];
    people: StaffPerson[];
    /** What the booked appointments cost, in minor units. */
    priceMinor: number | null;
  } | null>(null);
  const successTitleRef = useRef<HTMLHeadingElement | null>(null);
  // The confirm button that held focus is gone; land on the outcome instead.
  useEffect(() => {
    if (success) successTitleRef.current?.focus({ preventScroll: true });
  }, [success]);

  // Idempotency key: one per distinct booking attempt; re-minted when the
  // date / slot / staff selection changes (so retries of an identical body
  // reuse it, but a changed body gets a fresh one).
  const idempotencyKeyRef = useRef<string>("");

  // The authoritative timezone is the calendar response's; fall back to the
  // payload's until the calendar loads.
  const timeZone = calendar?.timezone ?? payload?.timezone ?? "UTC";
  const currency = payload?.currency ?? "USD";
  const showPricing = payload?.showPricing !== false;
  const quoteLabel = dict.locationPage.requestQuote;
  const isAuthed = status === "authenticated";

  // ── Resolved services: the Step 1 picks mapped from `payload.catalog`
  //    whenever this session has a step 1, otherwise `payload.services` as
  //    handed over. Everything downstream (calendar/slots calls, totals,
  //    review) reads THIS, never payload.services directly. `payload` itself is
  //    never mutated. ──
  const resolvedServices: BookingSelectionItem[] = useMemo(() => {
    if (!payload) return [];
    if (!hasStep1) return payload.services;
    if (!payload.catalog) return [];
    const servicesById = new Map(
      payload.catalog.services.map((s) => [s.id, s]),
    );
    const bundlesById = new Map(payload.catalog.bundles.map((b) => [b.id, b]));
    return picked.flatMap((ref): BookingSelectionItem[] => {
      if (ref.type === "service") {
        const s = servicesById.get(ref.id);
        return s
          ? [
              {
                serviceId: s.id,
                name: s.name,
                priceAmountMinor: s.priceAmountMinor,
                duration: s.duration,
                // Same spread the step-1 row rendered — kept so the footer
                // total agrees with the rows the customer just ticked.
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
    });
  }, [payload, picked, hasStep1]);

  // The services actually sent to the availability endpoints — identical to
  // resolvedServices unless a staff-pin block was recovered via "book with any
  // professional", which drops every pinned team member.
  const effectiveServices: BookingSelectionItem[] = useMemo(
    () => (ignorePins ? stripPins(resolvedServices) : resolvedServices),
    [resolvedServices, ignorePins],
  );

  // Monotonic per-load-kind request ids — the "latest wins" guard also used by
  // useSearchPreview. A response only commits if it's still the most recent
  // request of its kind: bumped on every loadCalendar/loadSlots call (so a
  // slower response for a date the user has since moved on from can never
  // overwrite what's on screen for the CURRENT date), and again whenever the
  // drawer closes (so nothing from a session the user just walked away from —
  // including one about to be replaced by a new booking, see the reset effect
  // below — can land after the fact). True cancellation (AbortController) isn't
  // wired here because getBookingCalendar/getBookingSlots don't take a signal,
  // and adding one lives in src/lib/api/marketplace/booking.ts, outside this
  // slice — see BookingProvider for the complementary unmount-on-close, which
  // discards this component instance (and these refs) entirely on a real close.
  const calRequestIdRef = useRef(0);
  const slotsRequestIdRef = useRef(0);

  // Invalidate awaits on genuine unmount, payload replacement and auth hiding.
  useLayoutEffect(() => () => {
    validationRequestRef.current += 1;
    calRequestIdRef.current += 1;
    slotsRequestIdRef.current += 1;
  }, [open, payload]);

  // ── Fetch calendar (called on entering the combined step + on retry).
  //    `servicesOverride` lets the staff-pin recovery refetch unpinned in the
  //    same tick it flips `ignorePins` (before the memo above recomputes). ──
  const loadCalendar = useCallback(
    async (servicesOverride?: BookingSelectionItem[], retry = false, startDate?: string) => {
      if (!payload) return;
      const requestId = (calRequestIdRef.current += 1);
      setCalLoading(true);
      if (!retry) setCalError(null);
      try {
        const tz = payload.timezone || "UTC";
        const res = await getBookingCalendar({
          businessId: payload.businessId,
          locationId: payload.locationId,
          services: toServiceSelections(servicesOverride ?? effectiveServices),
          startDate: startDate ?? todayInTz(tz),
          daysToCheck: CAL_DAYS_TO_CHECK,
        });
        if (requestId !== calRequestIdRef.current) return; // superseded
        setCalendar((previous) => startDate && previous
          ? { ...res, calendar: [...previous.calendar, ...res.calendar.filter((day) => !previous.calendar.some((old) => old.date === day.date))] }
          : res);
        setCalError(null);
        return res;
      } catch (e) {
        if (requestId !== calRequestIdRef.current) return; // superseded
        const block = classifyBookingBlock(e);
        if (block) setBlocked(block);
        else if (startDate) toast(errorMessage(e, dict.errors, t.loadError), "warn", undefined, "error");
        else setCalError(errorMessage(e, dict.errors, t.loadError));
      } finally {
        if (requestId === calRequestIdRef.current) setCalLoading(false);
      }
    },
    [payload, effectiveServices, dict.errors, t.loadError, toast],
  );

  // Remembers the last `payload` object reference the reset effect below
  // actually processed, so a reopen with the SAME reference (e.g. after the
  // sign-in detour — see BookingProvider's closeForAuth/reopen effect) can be
  // distinguished from a brand-new `openBooking()` call, which always
  // constructs a fresh payload object at its call site.
  const resetPayloadRef = useRef<OpenBookingPayload | null>(null);

  // ── On (re)open: reset all flow state. If services were pre-selected, jump
  //    straight to the combined date/time/staff step and fetch the calendar
  //    (step 1, when this booking has one, starts with them ticked);
  //    otherwise start on step 1 (choose services) with no calendar call yet.
  //    State is mutated only inside a microtask (never synchronously in the
  //    effect body) to match the codebase's set-state-in-effect convention.
  //    Skipped entirely when `payload` is the SAME object reference already
  //    processed — i.e. the drawer reopening after an auth detour with its
  //    in-progress state (see BookingProvider) rather than a genuinely new
  //    booking. ──
  useEffect(() => {
    if (!open || !payload) return;
    if (resetPayloadRef.current === payload) return;
    let cancelled = false;
    const startsOnStep1 = payload.services.length === 0;
    const seed = servicesStepPicks(payload);
    Promise.resolve().then(() => {
      if (cancelled) return;
      resetPayloadRef.current = payload;
      setHasStep1(seed !== null);
      setStep(startsOnStep1 ? 1 : 2);
      setPicked(seed ?? []);
      step2SelectionRef.current =
        !startsOnStep1 && seed ? selectionKey(seed) : null;
      setCalendar(null);
      invalidateQuote();
      setCalError(null);
      setSelectedDate(null);
      setDaySlots(null);
      setSlotsError(null);
      setSelectedSlot(null);
      setStaffPicks({});
      setBlocked(null);
      setIgnorePins(false);
      setSubmitting(false);
      setSuccess(null);
      idempotencyKeyRef.current = "";
      // Invalidate any load still in flight from whatever this instance was
      // showing before (a prior business's session, most commonly) so its
      // response can never commit into the state we just reset.
      calRequestIdRef.current += 1;
      slotsRequestIdRef.current += 1;
      // Named explicitly: until the state above commits, this closure's
      // resolved services may still be the previous session's picks.
      if (!startsOnStep1) void loadCalendar(payload.services);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payload]);

  // ── Fetch slots when a date is chosen. ──
  const loadSlots = useCallback(
    async (
      date: string,
      servicesOverride?: BookingSelectionItem[],
      retry = false,
    ) => {
      if (!payload) return;
      invalidateQuote();
      const requestId = (slotsRequestIdRef.current += 1);
      setSlotsLoading(true);
      if (!retry) setSlotsError(null);
      setSelectedSlot(null);
      setStaffPicks({});
      try {
        const res = await getBookingSlots({
          businessId: payload.businessId,
          locationId: payload.locationId,
          services: toServiceSelections(servicesOverride ?? effectiveServices),
          date,
        });
        if (requestId !== slotsRequestIdRef.current) return; // superseded
        setDaySlots(res);
        setSlotsError(null);
      } catch (e) {
        if (requestId !== slotsRequestIdRef.current) return; // superseded
        const block = classifyBookingBlock(e);
        if (block) setBlocked(block);
        else setSlotsError(errorMessage(e, dict.errors, t.loadError));
      } finally {
        if (requestId === slotsRequestIdRef.current) setSlotsLoading(false);
      }
    },
    [payload, effectiveServices, dict.errors, t.loadError, invalidateQuote],
  );

  // ── Discard in-flight calendar/slots work the moment the drawer closes —
  //    covers the sign-in detour (BookingProvider keeps this instance mounted
  //    across it), where a real close would otherwise handle this by unmounting.
  //    A genuine close ALSO unmounts (see BookingProvider), which drops this
  //    whole instance; this effect is what protects the "closed but still
  //    mounted" window in between. ──
  useEffect(() => {
    if (!open) {
      calRequestIdRef.current += 1;
      slotsRequestIdRef.current += 1;
      validationRequestRef.current += 1;
    }
  }, [open]);

  // ── The professional pinned to each selection item (rebook / team-member
  //    flow), keyed the way slot items identify themselves. Empty once a
  //    staff-pin block is recovered via "book with any professional", since
  //    `effectiveServices` has the pins stripped by then. ──
  const pinnedStaffByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const svc of effectiveServices) {
      if (svc.teamMemberId == null) continue;
      const key =
        svc.bundleId != null ? `b${svc.bundleId}` : `s${svc.serviceId}`;
      map.set(key, svc.teamMemberId);
    }
    return map;
  }, [effectiveServices]);

  /**
   * Opening picks for a freshly chosen slot. A pinned professional is
   * PRE-SELECTED rather than left on "any available": the availability was
   * computed for them specifically, so showing "any" would misrepresent both
   * who is booked and — when they charge their own rate — what it costs.
   */
  const seedStaffPicks = useCallback(
    (slot: TimeSlot): StaffPicks => {
      const picks: StaffPicks = {};
      slot.items.forEach((item, idx) => {
        const key =
          item.type === "bundle" ? `b${item.bundleId}` : `s${item.serviceId}`;
        const pinned = pinnedStaffByKey.get(key);
        // Guard on availability: a stale pin must never select someone the
        // slot cannot actually be booked with.
        if (pinned != null && item.availableStaffIds.includes(pinned)) {
          picks[idx] = pinned;
        }
      });
      return picks;
    },
    [pinnedStaffByKey],
  );

  const reviewQuote = step === 3 ? validatedQuote : null;
  const displaySlot = reviewQuote?.slot ?? selectedSlot;
  const displayPicks = reviewQuote?.picks ?? staffPicks;
  const displayDay = reviewQuote?.day ?? daySlots;

  // ── The chosen slot re-resolved against the picked professionals. The slots
  //    response is computed staff-agnostic (longest duration, lowest price), so
  //    every figure downstream — totals, the footer pill, the review card —
  //    reads from HERE, not from the raw slot. ──
  const resolvedItems = useMemo(
    () =>
      displaySlot
        ? resolveSlotItems(
            displaySlot,
            displayPicks,
            displayDay?.staffPricing ?? {},
            displayDay?.itemStaffPricing,
          )
        : [],
    [displaySlot, displayPicks, displayDay],
  );

  // ── Derived: the visit's length from the chosen slot (falls back to the
  //    resolved services list). The footer carries the one total. ──
  const totalDuration = useMemo(() => {
    if (displaySlot) {
      return resolvedItems.reduce((a, i) => a + i.durationMinutes, 0);
    }
    return resolvedServices.reduce((a, s) => a + s.duration, 0);
  }, [displaySlot, resolvedItems, resolvedServices]);

  // ── The figures the footer shows, WITH their honesty flags.
  //    Before a slot: the menu spread of what's selected. After a slot but
  //    before every professional is chosen: the slot's own bounds, which are a
  //    floor price and a duration range — never an exact quote. Once all picks
  //    are in, the bounds collapse and it renders like a plain total. Step 1
  //    edits the selection itself, so it never reads a slot chosen for an
  //    earlier one. ──
  const footerSpread = useMemo(() => {
    if (displaySlot && step !== 1) {
      const sp = slotSpread(
        displaySlot,
        displayPicks,
        displayDay?.staffPricing ?? {},
        displayDay?.itemStaffPricing,
      );
      return formatSelectionSpread(
        {
          priceMinor: sp.priceMinor,
          priceVaries: sp.priceVaries,
          durationMinMinutes: sp.durationMinMinutes,
          durationMaxMinutes: sp.durationMaxMinutes,
          durationVaries: sp.durationVaries,
        },
        currency,
        locale,
      );
    }
    return formatSelectionSpread(
      sumServiceSpreads(resolvedServices),
      currency,
      locale,
    );
  }, [displaySlot, displayPicks, displayDay, resolvedServices, currency, locale, step]);

  const validateSequence = useCallback(async () => {
    if (!payload || !selectedSlot || !selectedDate || slotsLoading || slotsError || daySlots?.date !== selectedDate) return null;
    const requestId = ++validationRequestRef.current;
    const sessionId = getAuthenticatedSessionId();
    const selections = exactSlotSelection(selectedSlot, staffPicks);
    setValidating(true);
    try {
      const day = await getBookingSlots({
        businessId: payload.businessId, locationId: payload.locationId,
        date: selectedDate, services: selections,
      });
      if (requestId !== validationRequestRef.current || sessionId !== getAuthenticatedSessionId()) return null;
      const slot = day.businessId === payload.businessId && day.locationId === payload.locationId
        ? findExactSlot(day, selectedDate, selectedSlot.startTime, selections)
        : undefined;
      if (!slot) {
        toast(t.errors.staffUnavailable, "warn", undefined, "error");
        setStep(2);
        void loadSlots(selectedDate);
        return null;
      }
      const picks = Object.fromEntries(selections.map((item, index) => [index, item.teamMemberId!])) as StaffPicks;
      const quote = { slot, day, picks };
      setValidatedQuote(quote);
      return quote;
    } catch (error) {
      if (requestId !== validationRequestRef.current || sessionId !== getAuthenticatedSessionId()) return null;
      const block = classifyBookingBlock(error);
      if (block) setBlocked(block);
      else toast(errorMessage(error, dict.errors, t.loadError), "warn", undefined, "error");
      return null;
    } finally {
      if (requestId === validationRequestRef.current) setValidating(false);
    }
  }, [payload, selectedSlot, selectedDate, staffPicks, slotsLoading, slotsError, daySlots, loadSlots, toast, dict.errors, t.errors.staffUnavailable, t.loadError]);

  const continueToReview = async () => {
    // An unknown outcome must remain retryable even if that request booked the slot.
    if (attemptedBookingRef.current && validatedQuote) { setStep(3); return; }
    if (await validateSequence()) setStep(3);
  };

  // ── Booking submit. ──
  const doBook = useCallback(async () => {
    if (
      !payload ||
      !selectedSlot ||
      !selectedDate ||
      slotsLoading ||
      slotsError ||
      daySlots?.date !== selectedDate
    )
      return;
    const sessionId = getAuthenticatedSessionId();
    if (sessionId == null) return;
    setSubmitting(true);
    try {
      let attempt = attemptedBookingRef.current;
      // What the confirmation shows: the quote this attempt was built from.
      let booked = validatedQuote;
      if (attempt && attempt.sessionId !== sessionId) {
        attempt = null;
        attemptedBookingRef.current = null;
        idempotencyKeyRef.current = "";
      }
      if (!attempt) {
        const quote = await validateSequence();
        if (!quote || sessionId !== getAuthenticatedSessionId()) return;
        booked = quote;
        if (validatedQuote) {
          const figures = (value: typeof quote) => resolveSlotItems(value.slot, value.picks, value.day.staffPricing ?? {}, value.day.itemStaffPricing);
          if (JSON.stringify(figures(quote)) !== JSON.stringify(figures(validatedQuote))) {
            toast(t.quoteChanged, "warn");
            return;
          }
        }
        const body: BookAppointmentBody = {
          listingId: payload.listingId, locationId: payload.locationId,
          scheduledAt: zonedWallTimeToUtcISO(selectedDate, quote.slot.startTime, timeZone),
          services: quote.slot.items.map((item, index): BookingServiceItem => ({
            ...(item.type === "bundle" ? { bundleId: item.bundleId } : { serviceId: item.serviceId }),
            staffId: quote.picks[index],
          })),
        };
        if (!idempotencyKeyRef.current) idempotencyKeyRef.current = mintKey();
        attempt = { body, key: idempotencyKeyRef.current, sessionId };
        attemptedBookingRef.current = attempt;
      }
      if (attempt.sessionId !== getAuthenticatedSessionId()) return;
      // A retry has no validation await; a new attempt was guarded by its validator.
      if (attemptedBookingRef.current !== attempt) return;
      const scheduledAt = attempt.body.scheduledAt;
      const res = await bookAppointment(attempt.body, attempt.key);
      const appts = res.appointments ?? [];
      const first = appts[0];
      // A change of professional splits the visit into several appointments.
      const endsAt = appts.reduce<string | null>(
        (latest, a) =>
          a.endsAt && (!latest || Date.parse(a.endsAt) > Date.parse(latest))
            ? a.endsAt
            : latest,
        null,
      );
      // Names and durations come from the quote: a merged appointment's own
      // name joins its services and is cut at 100 characters.
      const bookedQuote = booked;
      const figures = bookedQuote
        ? resolveSlotItems(bookedQuote.slot, bookedQuote.picks, bookedQuote.day.staffPricing ?? {}, bookedQuote.day.itemStaffPricing)
        : [];
      const items: BookedItem[] = bookedQuote
        ? bookedQuote.slot.items.map((item, index) => ({
            key: `${item.type}-${item.serviceId ?? item.bundleId}-${index}`,
            name:
              (item.type === "bundle" ? item.bundleName : item.serviceName) ??
              resolvedServices[index]?.name ??
              "",
            bundle: item.type === "bundle",
            startTime: figures[index]?.startTime ?? item.startTime,
            durationMinutes: figures[index]?.durationMinutes ?? item.durationMinutes,
            staffId: bookedQuote.picks[index] ?? null,
          }))
        : appts.map((a) => ({
            key: `appointment-${a.appointmentId}`,
            name: a.serviceName,
            bundle: false,
            startTime: null,
            durationMinutes: a.duration,
            staffId: null,
          }));
      setSuccess({
        pending: (first?.status ?? "confirmed") === "pending",
        scheduledAt: first?.scheduledAt ?? scheduledAt,
        endsAt,
        items,
        people: peopleFor(
          attempt.body.services.map((service) => service.staffId),
          bookedQuote?.day.staffDirectory,
        ),
        priceMinor:
          appts.length > 0
            ? appts.reduce((sum, a) => sum + a.price, 0)
            : bookedQuote
              ? figures.reduce((sum, figure) => sum + figure.priceAmountMinor, 0)
              : null,
      });
    } catch (e) {
      // Permanent marketplace-state blocks (venue/service/staff gone) get the
      // honest blocked screen — a retry or slot change can never fix them.
      const block = classifyBookingBlock(e);
      if (block) {
        attemptedBookingRef.current = null;
        setBlocked(block);
        return; // finally still clears `submitting`
      }
      const errorKey = mapBackendCode(e, BOOKING_SUBMIT_ERROR_KEYS);
      const specific = errorKey ? t.errors[errorKey] : null;
      // Transport failures (offline / timeout / rate-limited / our fault) win
      // over a domain message: a request that never reached the server cannot
      // have been rejected for being "too soon".
      toast(errorMessage(e, dict.errors, specific), "warn", undefined, "error");
      if (errorKey) {
        invalidateQuote();
        setStep(2);
        idempotencyKeyRef.current = "";
        // Only a slot conflict or a fresh calendar block actually invalidate
        // what's on screen — the grid the user is looking at is now a lie, so
        // drop the pick and refetch it. The other recoverable codes (too
        // soon/far, outside opening hours, staff unavailable) don't invalidate
        // the grid itself; the user just needs to choose differently within
        // it, same as reschedule-modal.tsx's identical distinction.
        if (errorKey === "slotConflict" || errorKey === "calendarBlock") {
          setSelectedSlot(null);
          if (selectedDate) void loadSlots(selectedDate);
          else void loadCalendar();
        }
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    payload,
    selectedSlot,
    selectedDate,
    slotsLoading,
    slotsError,
    daySlots,
    timeZone,
    validateSequence,
    validatedQuote,
    t.quoteChanged,
    invalidateQuote,
    resolvedServices,
    t.errors,
    dict.errors,
    loadCalendar,
    loadSlots,
    toast,
  ]);

  // Hooks complete — safe to bail.
  if (!open || !payload) return null;

  const services = resolvedServices;

  // ── Handlers ──
  // Picking a date no longer transitions the step — date/time/staff all live
  // on the same combined step 2 screen; only the slots refetch + reset.
  const onPickDate = (date: string) => {
    invalidateQuote();
    setSelectedDate(date);
    idempotencyKeyRef.current = "";
    void loadSlots(date);
  };

  const onPickSlot = (slot: TimeSlot) => {
    invalidateQuote();
    if (slotsLoading || slotsError || daySlots?.date !== selectedDate) return;
    setSelectedSlot(slot);
    setStaffPicks(seedStaffPicks(slot));
    idempotencyKeyRef.current = "";
  };

  const onPickStaff = (idx: number, staffId: number | null) => {
    invalidateQuote();
    setStaffPicks((prev) => {
      if (staffId == null) {
        if (!(idx in prev)) return prev;
        const next = { ...prev };
        delete next[idx];
        return next;
      }
      return { ...prev, [idx]: staffId };
    });
    idempotencyKeyRef.current = "";
  };

  // One choice for several services: the same professional, or any available,
  // for each of them. Same semantics as `onPickStaff`, applied per index.
  const onPickStaffForAll = (indices: number[], staffId: number | null) => {
    invalidateQuote();
    setStaffPicks((prev) => {
      const next = { ...prev };
      for (const idx of indices) {
        if (staffId == null) delete next[idx];
        else next[idx] = staffId;
      }
      return next;
    });
    idempotencyKeyRef.current = "";
  };

  const togglePicked = (type: "service" | "bundle", id: number) => {
    const next = picked.some((x) => x.type === type && x.id === id)
      ? picked.filter((x) => !(x.type === type && x.id === id))
      : [...picked, { type, id }];
    setPicked(next);
    payload.onServicesChange?.(next);
  };

  // Continue from Step 1 (choose services) → Step 2 (date/time/staff). The
  // same services in the same order keep everything step 2 already holds.
  // Otherwise it needs a fresh calendar fetch for the just-picked services:
  // reset all step-2-scoped state first (mirrors the open/reset effect) so a
  // prior pass through step 2 (with a now-stale service selection) never
  // leaves behind a date/slot/staff pick — or a stale, still-clickable
  // calendar — that was never validated against the final services.
  const onContinueFromServices = () => {
    const selection = selectionKey(picked);
    if (step2SelectionRef.current === selection) {
      setStep(2);
      return;
    }
    step2SelectionRef.current = selection;
    invalidateQuote();
    setStep(2);
    setCalendar(null);
    setCalError(null);
    setSelectedDate(null);
    setDaySlots(null);
    setSlotsError(null);
    setSelectedSlot(null);
    setStaffPicks({});
    idempotencyKeyRef.current = "";
    void loadCalendar();
  };

  const onConfirm = () => {
    if (!isAuthed) {
      // Hide the drawer (and arm the reopen-after-auth flag) before navigating
      // to /auth, so it doesn't keep rendering on top of the login form during
      // the same-layout-segment navigation there.
      closeForAuth();
      openAuthModal("signin");
      return;
    }
    void doBook();
  };

  const goBack = () => {
    if (step === 3) setStep(2);
    else if (step === 2 && hasStep1) setStep(1);
  };

  // A slot alone isn't enough when the available professionals charge different
  // prices or take different times — the customer must say who.
  const awaitingStaffChoice = needsStaffChoice(
    selectedSlot,
    staffPicks,
    daySlots?.staffPricing ?? {},
    daySlots?.itemStaffPricing,
  );
  const canContinueFromSlot =
    !!selectedSlot &&
    !awaitingStaffChoice &&
    !slotsLoading &&
    !validating &&
    !slotsError &&
    daySlots?.date === selectedDate;
  const canContinueFromServices = picked.length > 0;

  const stepTitle =
    step === 1
      ? t.stepServicesTitle
      : step === 2
        ? t.stepDateTimeTitle
        : t.stepReviewTitle;
  const stepCount = hasStep1 ? 3 : 2;
  const visibleStep = hasStep1 ? step : Math.max(1, step - 1);
  const canReturnToProfile = !!payload.profileOrigin?.isAvailable();
  const backToProfile =
    canReturnToProfile && !success && (blocked || (step === 2 && !hasStep1));
  const showBack =
    !success &&
    (backToProfile || (!blocked && (step === 3 || (step === 2 && hasStep1))));
  // The venue's names, from the opener until (or unless) only the calendar has
  // them. The header carries them through every step.
  const venue =
    payload.venue ??
    (calendar
      ? { businessName: calendar.businessName, locationName: calendar.locationName }
      : null);
  // A branch named apart from its brand is worth saying on its own.
  const branchName =
    venue?.locationName &&
    venue.locationName.toLocaleLowerCase(locale) !==
      venue.businessName.toLocaleLowerCase(locale)
      ? venue.locationName
      : null;
  const venueLine = venue
    ? [venue.businessName, branchName].filter(Boolean).join(" · ")
    : "";
  // Once booked, the header states the outcome in place of where to book.
  const headerNote = success
    ? venue
      ? format(success.pending ? t.pendingBody : t.successBody, {
          business: venue.businessName,
        })
      : ""
    : venueLine;

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={`zv-sheet-backdrop ${styles.overlay}`}
        >
          <DialogPrimitive.Content
            className={`zw-modal-in ${styles.dialog}`}
            data-booking-dialog
            data-toast-scope="dialog"
            ref={setDialogRef}
            // The header note describes the dialog; without one there's nothing to point at.
            {...(headerNote ? {} : { "aria-describedby": undefined })}
            onOpenAutoFocus={(event) => {
              returnFocusRef.current =
                document.activeElement instanceof HTMLElement
                  ? document.activeElement
                  : null;
              event.preventDefault();
              dialogRef.current?.focus();
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              requestAnimationFrame(() => {
                const target = returnFocusRef.current;
                if (
                  target?.isConnected &&
                  target.getClientRects().length &&
                  !target.closest("[hidden], [inert]")
                )
                  target.focus({ preventScroll: true });
              });
            }}
            onPointerDownOutside={(event) => {
              if (
                event.target instanceof Element &&
                event.target.closest("[data-toast-host]")
              )
                event.preventDefault();
            }}
          >
            <header className={styles.header}>
              {showBack && (
                <button
                  type="button"
                  className={`tap ${styles.iconButton}`}
                  onClick={backToProfile ? returnToProfile : goBack}
                  aria-label={backToProfile ? t.backToProfile : t.back}
                  title={backToProfile ? t.backToProfile : undefined}
                  disabled={submitting || validating}
                >
                  <Icon name="back" size={20} color="currentColor" />
                </button>
              )}
              <div className={styles.headerText}>
                {/* The dialog keeps its name once booked; the outcome is the
                    heading people see. */}
                <DialogPrimitive.Title
                  className={success ? "sr-only" : `txt-balance ${styles.title}`}
                >
                  {tb.bookHeading}
                </DialogPrimitive.Title>
                {success && (
                  <h2
                    ref={successTitleRef}
                    tabIndex={-1}
                    className={`txt-balance ${styles.title}`}
                  >
                    {success.pending ? t.pendingTitle : t.successTitle}
                  </h2>
                )}
                {headerNote && (
                  <DialogPrimitive.Description className={styles.headerVenue}>
                    {headerNote}
                  </DialogPrimitive.Description>
                )}
              </div>
              <button
                type="button"
                className={`tap ${styles.iconButton}`}
                onClick={onClose}
                aria-label={tb.close}
              >
                <Icon name="x" size={20} color="currentColor" />
              </button>
            </header>

            {success ? (
              <SuccessScreen
                pending={success.pending}
                scheduledAt={success.scheduledAt}
                endsAt={success.endsAt}
                items={success.items}
                people={success.people}
                priceMinor={success.priceMinor}
                branchName={branchName}
                currency={currency}
                showPricing={showPricing}
                totalLabel={dict.appointmentDetail.totalAtVenue}
                timeZone={timeZone}
                locale={locale}
                t={t}
                tb={tb}
                onViewAppointment={() => {
                  // A booking can produce several appointments when its professional changes.
                  router.push(localeHref(locale, "appointments"));
                  onClose();
                }}
                onClose={onClose}
              />
            ) : blocked ? (
              <BlockedScreen
                block={blocked}
                services={resolvedServices}
                t={t}
                tb={tb}
                onBrowseServices={() => {
                  router.push(
                    payload.websiteSlug
                      ? localeHref(locale, payload.websiteSlug)
                      : localeHref(
                          locale,
                          "business",
                          String(payload.locationId),
                        ),
                  );
                  onClose();
                }}
                onAnyProfessional={() => {
                  const unpinned = stripPins(resolvedServices);
                  setBlocked(null);
                  setIgnorePins(true);
                  void loadCalendar(unpinned);
                  if (selectedDate) void loadSlots(selectedDate, unpinned);
                }}
                onClose={onClose}
              />
            ) : (
              <>
                <div ref={bodyRef} className={styles.body} data-booking-body>
                  <div key={step} className={styles.step}>
                    <div className={styles.stepHeading}>
                      <h2 className={`txt-balance ${styles.stepTitle}`}>
                        {stepTitle}
                      </h2>
                      <span className={styles.stepCount}>
                        <span className="sr-only">
                          {format(t.stepProgress, {
                            n: String(visibleStep),
                            total: String(stepCount),
                          })}
                        </span>
                        <span aria-hidden="true">
                          {visibleStep} / {stepCount}
                        </span>
                      </span>
                    </div>
                    <div className={styles.progress} aria-hidden="true">
                      {Array.from({ length: stepCount }, (_, index) => (
                        <span key={index} data-active={index < visibleStep} />
                      ))}
                    </div>
                    {step === 1 && payload.catalog && (
                      <ServicesStep
                        catalog={payload.catalog}
                        picked={picked}
                        currency={currency}
                        showPricing={showPricing}
                        quoteLabel={quoteLabel}
                        locale={locale}
                        tb={tb}
                        copy={dict.locationPage}
                        onToggle={togglePicked}
                      />
                    )}
                    {step === 2 && (
                      <div className={styles.availability}>
                        <DateStep
                          calendar={calendar}
                          loading={calLoading}
                          error={calError}
                          locale={locale}
                          timeZone={timeZone}
                          t={t}
                          selectedDate={selectedDate}
                          hasMore={canExtendCalendar(calendar, timeZone)}
                          onLoadMore={async () => {
                            const tail = calendar?.calendar.at(-1)?.date;
                            return !!tail && !!await loadCalendar(undefined, false, addWallDays(tail, 1));
                          }}
                          onRetry={() => void loadCalendar(undefined, true)}
                          onPickDate={onPickDate}
                        />
                        <div className={styles.timeArea}>
                          {selectedDate ? (
                            <SlotStep
                              daySlots={displayDay}
                              loading={slotsLoading}
                              error={slotsError}
                              selectedDate={selectedDate}
                              selectedSlot={selectedSlot}
                              staffPicks={displayPicks}
                              locale={locale}
                              currency={currency}
                              showPricing={showPricing}
                              quoteLabel={quoteLabel}
                              timeZone={timeZone}
                              t={t}
                              onRetry={() => {
                                if (selectedDate)
                                  void loadSlots(selectedDate, undefined, true);
                              }}
                              pinnedStaffByKey={pinnedStaffByKey}
                              fromProfessionalProfile={!!payload.profileOrigin}
                              onPickSlot={onPickSlot}
                              onPickStaff={onPickStaff}
                              onPickStaffForAll={onPickStaffForAll}
                            />
                          ) : (
                            !calError &&
                            !calLoading &&
                            calendar?.calendar.some(
                              (day) => day.status === "available",
                            ) && <p className={styles.hint}>{t.chooseDate}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {step === 3 && displaySlot && selectedDate && (
                      <ReviewStep
                        slot={displaySlot}
                        date={selectedDate}
                        staffPicks={displayPicks}
                        chosenPicks={staffPicks}
                        resolvedItems={resolvedItems}
                        daySlots={displayDay}
                        businessName={venue?.businessName ?? tb.bookHeading}
                        services={services}
                        currency={currency}
                        showPricing={showPricing}
                        locale={locale}
                        timeZone={timeZone}
                        totalDuration={totalDuration}
                        busy={submitting || validating}
                        onEditVisit={() => setStep(2)}
                        onEditServices={hasStep1 ? () => setStep(1) : undefined}
                        policy={displayDay?.bookingPolicy ?? calendar?.bookingPolicy ?? payload.bookingPolicy}
                        t={t}
                        tb={tb}
                      />
                    )}
                  </div>
                </div>
                <footer className={styles.footer}>
                  <div className={styles.footerSummary}>
                    {step === 1 && !canContinueFromServices ? (
                      <div className={styles.hint}>{t.selectServicesEmpty}</div>
                    ) : (
                      <>
                        <div className={styles.footerPrice}>
                          {showPricing && footerSpread.priceVaries && (
                            <span className={styles.from}>{tb.priceFrom} </span>
                          )}
                          {showPricing ? footerSpread.price : quoteLabel}
                        </div>
                        <div className={styles.footerMeta}>
                          {format(
                            services.length === 1
                              ? t.serviceCountOne
                              : t.serviceCount,
                            {
                              count: String(services.length),
                              duration: footerSpread.duration,
                            },
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {step < 3 ? (
                    <Button
                      kind="accent"
                      size="lg"
                      className={styles.primaryAction}
                      disabled={
                        step === 1
                          ? !canContinueFromServices
                          : !canContinueFromSlot
                      }
                      onClick={step === 1 ? onContinueFromServices : () => void continueToReview()}
                      aria-label={tb.continue}
                      aria-busy={validating}
                      style={{ position: "relative" }}
                    >
                      <span aria-hidden="true" style={{ visibility: validating ? "hidden" : "visible" }}>{tb.continue}</span>
                      <Icon name="arrowR" size={17} color="currentColor" />
                      {validating && <span aria-hidden="true" style={{ position: "absolute" }}><Spinner size={16} color="currentColor" /></span>}
                    </Button>
                  ) : (
                    <Button
                      kind="accent"
                      size="lg"
                      className={styles.primaryAction}
                      disabled={submitting || validating}
                      aria-label={isAuthed ? t.confirmBooking : t.signInToBook}
                      aria-busy={submitting}
                      onClick={onConfirm}
                      style={{
                        position: "relative",
                        opacity: submitting ? 0.7 : 1,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          visibility: submitting ? "hidden" : "visible",
                        }}
                      >
                        {isAuthed ? t.confirmBooking : t.signInToBook}
                      </span>
                      {submitting && (
                        <span
                          aria-hidden="true"
                          style={{ position: "absolute" }}
                        >
                          <Spinner size={16} color="currentColor" />
                        </span>
                      )}
                    </Button>
                  )}
                  <span role="status" className="sr-only">
                    {submitting ? t.booking : validating ? t.loading : ""}
                  </span>
                </footer>
              </>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ─────────────────────────────────────────────
// Step 1 — Choose services (reachable whenever the menu came along with no
// professional pinned). The page's menu in its own selection grammar:
// packages first, then services grouped by category.
// ─────────────────────────────────────────────
type BookingDict = ReturnType<typeof useTranslation>["dict"]["booking"];
type BusinessDict = ReturnType<typeof useTranslation>["dict"]["business"];
type LocationPageDict = ReturnType<typeof useTranslation>["dict"]["locationPage"];

/** Menus this long get the page's search; shorter ones stay a plain list. */
const SERVICE_SEARCH_MIN = 8;

/** Accent- and case-insensitive, like the location page's menu search. */
const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase();

function ServicesStep({
  catalog,
  picked,
  currency,
  showPricing,
  quoteLabel,
  locale,
  tb,
  copy,
  onToggle,
}: {
  catalog: NonNullable<OpenBookingPayload["catalog"]>;
  picked: BookingPick[];
  currency: string;
  showPricing: boolean;
  quoteLabel: string;
  locale: string;
  tb: BusinessDict;
  copy: LocationPageDict;
  onToggle: (type: "service" | "bundle", id: number) => void;
}) {
  const searchId = useId();
  const searchInput = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const isPicked = (type: "service" | "bundle", id: number) =>
    picked.some((item) => item.type === type && item.id === id);
  const groups = useMemo(() => {
    const byCategory = new Map<
      number | "uncat",
      { name: string; color: string; items: typeof catalog.services }
    >();
    for (const category of catalog.serviceCategories)
      byCategory.set(category.id, {
        name: category.name,
        color: category.color,
        items: [],
      });
    for (const service of catalog.services) {
      const key = service.categoryId ?? "uncat";
      if (!byCategory.has(key))
        byCategory.set(key, {
          name: service.category?.name ?? "",
          color: service.category?.color ?? "var(--c-400)",
          items: [],
        });
      byCategory.get(key)!.items.push(service);
    }
    return [...byCategory.values()].filter((group) => group.items.length > 0);
  }, [catalog]);
  // Searching only filters what's shown; ticked items stay in the selection.
  const searchable =
    catalog.services.length + catalog.bundles.length >= SERVICE_SEARCH_MIN;
  const needle = searchable ? normalize(query.trim()) : "";
  const matches = (name: string, description: string | null) =>
    !needle || normalize(`${name} ${description ?? ""}`).includes(needle);
  const bundles = catalog.bundles.filter(
    (bundle) =>
      matches(bundle.name, bundle.description) ||
      (!!needle &&
        bundle.services.some((service) =>
          matches(service.name, service.description),
        )),
  );
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((service) =>
        matches(service.name, service.description),
      ),
    }))
    .filter((group) => group.items.length > 0);
  const clearSearch = () => {
    setQuery("");
    searchInput.current?.focus();
  };
  return (
    <div className={styles.serviceGroups}>
      {searchable && (
        <div className={styles.serviceSearch}>
          <label htmlFor={searchId}>
            <Icon name="search" size={17} />
            <span className="sr-only">{copy.searchServices}</span>
            <input
              ref={searchInput}
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.searchServices}
              autoComplete="off"
            />
          </label>
          {query && (
            <button
              type="button"
              className={styles.searchClear}
              aria-label={copy.clearSearch}
              onClick={clearSearch}
            >
              <Icon name="x" size={18} />
            </button>
          )}
        </div>
      )}
      {needle && bundles.length === 0 && visibleGroups.length === 0 && (
        <div className={styles.searchEmpty}>
          <p className={styles.searchEmptyTitle}>{copy.noResultsTitle}</p>
          <p className={styles.hint}>{copy.noResultsBody}</p>
          <Button kind="secondary" onClick={clearSearch}>
            {copy.clearSearch}
          </Button>
        </div>
      )}
      {bundles.length > 0 && (
        <div>
          <h3 className={styles.category}>
            {tb.bundles}
            <span className={styles.categoryCount} aria-hidden="true">
              {bundles.length}
            </span>
          </h3>
          <div className={styles.serviceList}>
            {bundles.map((bundle) => (
              <ServiceCheckRow
                key={bundle.id}
                name={bundle.name}
                service={bundle}
                tag={tb.bundleTag}
                includes={bundle.services.map((service) => service.name)}
                on={isPicked("bundle", bundle.id)}
                onToggle={() => onToggle("bundle", bundle.id)}
                currency={currency}
                locale={locale}
                fromLabel={tb.priceFrom}
                showPricing={showPricing}
                quoteLabel={quoteLabel}
              />
            ))}
          </div>
        </div>
      )}
      {visibleGroups.map((group, index) => (
        <div key={index}>
          {group.name && (
            <h3 className={styles.category}>
              <span
                className={styles.categoryDot}
                style={{ background: group.color }}
                aria-hidden="true"
              />
              {group.name}
              <span className={styles.categoryCount} aria-hidden="true">
                {group.items.length}
              </span>
            </h3>
          )}
          <div className={styles.serviceList}>
            {group.items.map((service) => (
              <ServiceCheckRow
                key={service.id}
                name={service.name}
                service={service}
                on={isPicked("service", service.id)}
                onToggle={() => onToggle("service", service.id)}
                currency={currency}
                locale={locale}
                fromLabel={tb.priceFrom}
                showPricing={showPricing}
                quoteLabel={quoteLabel}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** One whole-row toggle, ending in the page's round add/check indicator. */
function ServiceCheckRow({
  name,
  service,
  tag,
  includes,
  on,
  onToggle,
  currency,
  locale,
  fromLabel,
  showPricing,
  quoteLabel,
}: {
  name: string;
  service: ServiceSpread;
  /** The package pill, for bundles. */
  tag?: string;
  /** A package's services, in order. */
  includes?: string[];
  on: boolean;
  onToggle: () => void;
  currency: string;
  locale: string;
  fromLabel: string;
  showPricing: boolean;
  quoteLabel: string;
}) {
  const meta = formatServiceSpread(service, currency, locale);
  return (
    <button
      type="button"
      className={`tap ${styles.serviceChoice}`}
      onClick={onToggle}
      aria-pressed={on}
    >
      <span className={styles.serviceText}>
        <span className={styles.serviceName}>{name}</span>
        <span className={styles.serviceMeta}>
          {tag && (
            <>
              <span className={styles.bundleTag}>{tag}</span>{" "}
            </>
          )}
          <span className={styles.serviceDuration}>{meta.duration}</span>
          {" · "}
          {showPricing && meta.priceVaries && <span>{fromLabel} </span>}
          {showPricing ? meta.price : quoteLabel}
        </span>
        {includes && includes.length > 0 && (
          <span className={styles.serviceIncludes}>{includes.join(", ")}</span>
        )}
      </span>
      <span className={styles.serviceAdd} aria-hidden="true">
        <Icon name={on ? "check" : "plus"} size={18} />
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────
// Step 2 — Date picker (part of the combined date/time/staff step)
// ─────────────────────────────────────────────

/** Calendar request size is a page size, not the venue's booking horizon. */
function canExtendCalendar(calendar: BookingCalendar | null, timeZone: string): boolean {
  if (!calendar?.calendar.length) return false;
  const maximum = calendar.bookingSettings.maxAdvanceBookingMinutes;
  if (maximum === null) return true;
  if (maximum === undefined) return false;
  const end = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(Date.now() + (maximum + 1) * 60_000 - 1));
  return calendar.calendar[calendar.calendar.length - 1].date < end;
}

function DateStep({
  calendar,
  loading,
  error,
  locale,
  timeZone,
  t,
  selectedDate,
  hasMore,
  onLoadMore,
  onRetry,
  onPickDate,
}: {
  calendar: BookingCalendar | null;
  loading: boolean;
  error: string | null;
  locale: string;
  timeZone: string;
  t: BookingDict;
  selectedDate: string | null;
  hasMore: boolean;
  onLoadMore: () => Promise<boolean>;
  onRetry: () => void;
  onPickDate: (date: string) => void;
}) {
  // Append API windows as needed while preserving the selected date and slot.
  const [page, setPage] = useState<{ start: number | null; direction: number }>(
    { start: null, direction: 0 },
  );
  const days = calendar?.calendar ?? [];
  const selectedIndex = days.findIndex((day) => day.date === selectedDate);
  const lastStart = Math.max(0, Math.floor((days.length - 1) / 7) * 7);
  const start = Math.min(
    page.start ?? Math.max(0, Math.floor(selectedIndex / 7) * 7),
    lastStart,
  );
  const visibleDays = days.slice(start, start + 7);
  const hasAvailable = days.some((day) => day.status === "available");
  const today = todayInTz(timeZone);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    // A partial final page must stay reachable after swiping the previous row.
    if (viewportRef.current) viewportRef.current.scrollLeft = 0;
  }, [start]);

  if (error && !calendar)
    return (
      <ErrorBlock
        label={error}
        retry={t.retry}
        onRetry={onRetry}
        loading={loading}
      />
    );
  if (loading && !calendar)
    return <LoadingBlock label={t.loading} kind="dates" title={t.dateLabel} />;
  if (!calendar) return null;

  return (
    <section aria-label={t.dateLabel}>
      <h3 className={styles.sectionLabel}>{t.dateLabel}</h3>
      <div className={styles.dateNavigation}>
        <button
          type="button"
          className={`tap ${styles.weekButton}`}
          disabled={start === 0 || loading}
          aria-label={t.previousDates}
          onClick={() =>
            setPage({ start: Math.max(0, start - 7), direction: -1 })
          }
        >
          <Icon name="chevL" size={18} color="currentColor" />
        </button>
        <span
          className={styles.dateRange}
          aria-live="polite"
          aria-atomic="true"
        >
          {visibleDays.length > 0 && (
            <>
              {fmtDateLabel(visibleDays[0].date, locale, timeZone)}
              <span aria-hidden="true"> – </span>
              <span className="sr-only"> / </span>
              {fmtDateLabel(
                visibleDays[visibleDays.length - 1].date,
                locale,
                timeZone,
              )}
            </>
          )}
        </span>
        <button
          type="button"
          className={`tap ${styles.weekButton}`}
          disabled={loading || (start >= lastStart && !hasMore)}
          aria-label={t.nextDates}
          aria-busy={loading}
          onClick={async () => {
            const next = start + 7;
            if (hasMore && next + 7 > days.length) {
              if (!await onLoadMore()) return;
            }
            setPage({ start: next, direction: 1 });
          }}
        >
          {loading ? <Spinner size={16} color="currentColor" /> : <Icon name="chevR" size={18} color="currentColor" />}
        </button>
      </div>
      <div ref={viewportRef} className={styles.dateViewport}>
        <div
          key={start}
          className={styles.dates}
          data-direction={page.direction}
        >
          {visibleDays.map((day) => (
            <DayCell
              key={day.date}
              day={day}
              locale={locale}
              timeZone={timeZone}
              t={t}
              selected={day.date === selectedDate}
              isToday={day.date === today}
              onPick={() => onPickDate(day.date)}
            />
          ))}
        </div>
      </div>
      {!hasAvailable && <p className={styles.hint}>{t.noAvailability}</p>}
      <span className="sr-only" role="status">{loading ? t.loading : ""}</span>
    </section>
  );
}

function DayCell({
  day,
  locale,
  timeZone,
  t,
  selected,
  isToday,
  onPick,
}: {
  day: BookingCalendarDay;
  locale: string;
  timeZone: string;
  t: BookingDict;
  selected: boolean;
  isToday: boolean;
  onPick: () => void;
}) {
  const available = day.status === "available";
  const [y, mo, d] = day.date.split("-").map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d, 12));
  const weekday = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone,
  }).format(date);
  const dayNumber = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    timeZone,
  }).format(date);
  const count =
    available && day.slotsCount != null
      ? formatCount(day.slotsCount, locale, {
          one: t.slotsCountOne,
          few: t.slotsCountLabel,
          other: t.slotsCountLabel,
        })
      : null;
  // Closed and fully booked days say so; any other reason reads as unavailable.
  const note =
    count ??
    (day.status === "closed"
      ? t.dayClosed
      : day.status === "fully_booked"
        ? t.dayFull
        : null);
  const status = note ?? (available ? null : t.dayUnavailable);
  return (
    <button
      type="button"
      className={`tap ${styles.day}`}
      disabled={!available}
      data-date={day.date}
      onClick={onPick}
      aria-pressed={selected}
      aria-label={[
        isToday ? t.todayLabel : null,
        fmtDateLabel(day.date, locale, timeZone),
        status,
      ]
        .filter(Boolean)
        .join(", ")}
      title={status ?? undefined}
    >
      <span className={styles.weekday}>{isToday ? t.todayLabel : weekday}</span>
      <span className={styles.dayNumber}>{dayNumber}</span>
      {note && <span className={styles.slotCount}>{note}</span>}
    </button>
  );
}

// ─────────────────────────────────────────────
// Step 2 — Time + staff
// ─────────────────────────────────────────────
function SlotStep({
  daySlots,
  loading,
  error,
  selectedDate,
  selectedSlot,
  staffPicks,
  locale,
  currency,
  showPricing,
  quoteLabel,
  timeZone,
  t,
  pinnedStaffByKey,
  fromProfessionalProfile,
  onRetry,
  onPickSlot,
  onPickStaff,
  onPickStaffForAll,
}: {
  daySlots: BookingDaySlots | null;
  loading: boolean;
  error: string | null;
  selectedDate: string | null;
  selectedSlot: TimeSlot | null;
  staffPicks: StaffPicks;
  locale: string;
  currency: string;
  showPricing: boolean;
  quoteLabel: string;
  timeZone: string;
  t: BookingDict;
  pinnedStaffByKey: Map<string, number>;
  fromProfessionalProfile: boolean;
  onRetry: () => void;
  onPickSlot: (slot: TimeSlot) => void;
  onPickStaff: (idx: number, staffId: number | null) => void;
  onPickStaffForAll: (indices: number[], staffId: number | null) => void;
}) {
  const [perService, setPerService] = useState(false);
  const staffHeadingId = useId();
  const staffSectionRef = useRef<HTMLDivElement | null>(null);
  // Once a time is picked, bring the professional choice into view — only as
  // far as needed, and not at all when it's already showing.
  const revealStaff = () =>
    requestAnimationFrame(() =>
      staffSectionRef.current?.scrollIntoView({
        block: "nearest",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      }),
    );
  if (error)
    return (
      <ErrorBlock
        label={error}
        retry={t.retry}
        onRetry={onRetry}
        loading={loading}
      />
    );
  if (loading)
    return (
      <LoadingBlock
        label={t.loading}
        kind="slots"
        title={
          selectedDate
            ? fmtDateLabel(selectedDate, locale, timeZone)
            : undefined
        }
      />
    );
  if (!daySlots || !selectedDate || daySlots.date !== selectedDate) return null;
  const slots = daySlots.slots ?? [];
  if (slots.length === 0)
    return <p className={styles.hint}>{t.fullyBookedDay}</p>;
  const groups: Record<SlotGroup, TimeSlot[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };
  for (const slot of slots) groups[groupForTime(slot.startTime)].push(slot);
  const groupLabel: Record<SlotGroup, string> = {
    morning: t.morning,
    afternoon: t.afternoon,
    evening: t.evening,
  };
  const staffItems = (selectedSlot?.items ?? []).flatMap((item, index) => {
    const pinned = pinnedStaffByKey.get(
      item.type === "bundle" ? `b${item.bundleId}` : `s${item.serviceId}`,
    );
    // A profile's professional is already chosen. Keep the picker available
    // after unpin recovery, or whenever that choice still needs resolving.
    if (
      fromProfessionalProfile &&
      pinned != null &&
      staffPicks[index] === pinned &&
      item.availableStaffIds.includes(pinned)
    )
      return [];
    return [{ item, index, pinned }];
  });
  // One picker covers every service when each has a picker, none is pinned,
  // nobody's price or time differs, and someone is free for all of them. Mixed
  // picks (chosen per service) always show per service.
  const staffPricing = daySlots.staffPricing ?? {};
  const itemVaries = staffItems.map(({ item, index }) =>
    itemVariesByStaff(item, staffPricing, daySlots.itemStaffPricing, index),
  );
  const staffIndices = staffItems.map(({ index }) => index);
  const sharedIds =
    staffItems.length > 1 &&
    staffItems.length === (selectedSlot?.items.length ?? 0) &&
    staffItems.every(({ pinned }) => pinned == null) &&
    !itemVaries.some(Boolean)
      ? staffItems
          .slice(1)
          .reduce<number[]>(
            (ids, { item }) => ids.filter((id) => item.availableStaffIds.includes(id)),
            staffItems[0].item.availableStaffIds,
          )
      : [];
  const canShare = sharedIds.length > 0;
  const firstPick = staffItems.length > 0 ? staffPicks[staffItems[0].index] : undefined;
  const uniformPick =
    staffItems.every(({ index }) => staffPicks[index] === firstPick) &&
    (firstPick == null || sharedIds.includes(firstPick));
  const shared = canShare && !perService && uniformPick;
  const shareAll = () => {
    onPickStaffForAll(staffIndices, firstPick != null && sharedIds.includes(firstPick) ? firstPick : null);
    setPerService(false);
  };
  return (
    <div className={styles.slotGroups}>
      <div>
        <h3 className={styles.sectionLabel}>
          {fmtDateLabel(selectedDate, locale, timeZone)}
        </h3>
        <div className={styles.slotGroups}>
          {(Object.keys(groups) as SlotGroup[]).map((group) =>
            groups[group].length > 0 ? (
              <section key={group} aria-label={groupLabel[group]}>
                <div className={styles.groupLabel}>{groupLabel[group]}</div>
                <div className={styles.slotGrid}>
                  {groups[group].map((slot) => (
                    <button
                      key={`${slot.startTime}-${slot.endTime}`}
                      type="button"
                      className={`tap zv-slot ${styles.slot}`}
                      aria-pressed={
                        selectedSlot?.startTime === slot.startTime &&
                        selectedSlot?.endTime === slot.endTime
                      }
                      onClick={() => {
                        onPickSlot(slot);
                        revealStaff();
                      }}
                    >
                      {fmtTimeLabel(
                        selectedDate,
                        slot.startTime,
                        locale,
                        timeZone,
                      )}
                    </button>
                  ))}
                </div>
              </section>
            ) : null,
          )}
        </div>
      </div>
      {selectedSlot && staffItems.length > 0 && (
        <div ref={staffSectionRef} className={styles.staffSection}>
          <div className={styles.staffSectionHead}>
            <h3 id={staffHeadingId} className={styles.sectionLabel}>{t.staffLabel}</h3>
            {canShare && (
              <button
                type="button"
                className={styles.staffMode}
                onClick={shared ? () => setPerService(true) : shareAll}
              >
                {shared ? t.staffPerService : t.staffSameForAll}
              </button>
            )}
          </div>
          {shared ? (
            <StaffPicker
              labelledBy={staffHeadingId}
              hint={t.staffSharedHint}
              staffIds={sharedIds}
              stackIds={[...new Set(staffItems.flatMap(({ item }) => item.availableStaffIds))]}
              showAny
              anyHint={t.staffAnyEach}
              picked={firstPick}
              directory={daySlots.staffDirectory}
              currency={currency}
              showPricing={showPricing}
              quoteLabel={quoteLabel}
              locale={locale}
              t={t}
              onPick={(staffId) => onPickStaffForAll(staffIndices, staffId)}
            />
          ) : (
            staffItems.map(({ item, index, pinned }, position) => {
              const itemName = item.type === "bundle" ? item.bundleName : item.serviceName;
              return <StaffPicker
                key={`${item.type}-${item.serviceId ?? item.bundleId}-${index}`}
                labelledBy={staffHeadingId}
                title={selectedSlot.items.length > 1 && itemName ? { index: index + 1, name: itemName } : undefined}
                hint={itemVaries[position] ? t.staffChoiceRequired : undefined}
                staffIds={item.availableStaffIds}
                stackIds={item.availableStaffIds}
                // Availability remains pinned unless the explicit recovery unpins it.
                // Any available is offered only when price and duration are identical.
                showAny={!itemVaries[position] && pinned == null}
                anyHint={
                  selectedSlot.items.length > 1
                    ? t.staffAnyThis
                    : format(t.staffAnyAt, { time: fmtTimeLabel(selectedDate, selectedSlot.startTime, locale, timeZone) })
                }
                picked={staffPicks[index]}
                figuresFor={
                  itemVaries[position]
                    ? (staffId) => staffFiguresForItem(item, staffId, staffPricing, daySlots.itemStaffPricing, index)
                    : undefined
                }
                directory={daySlots.staffDirectory}
                currency={currency}
                showPricing={showPricing}
                quoteLabel={quoteLabel}
                locale={locale}
                t={t}
                onPick={(staffId) => onPickStaff(index, staffId)}
              />;
            })
          )}
        </div>
      )}
    </div>
  );
}

/**
 * One single-choice group of professionals: "Any available" as a full-width
 * lead row (when offered), then the people. Options stay toggle buttons whose
 * names start with the professional's name. When figures differ by person,
 * the cards become one-column rows with the price and time aligned right.
 */
function StaffPicker({
  title,
  labelledBy,
  hint,
  staffIds,
  stackIds,
  showAny,
  anyHint,
  picked,
  figuresFor,
  directory,
  currency,
  showPricing,
  quoteLabel,
  locale,
  t,
  onPick,
}: {
  /** A numbered service heading, shown when the slot holds several services. */
  title?: { index: number; name: string };
  /** Labels the group when there is no service heading. */
  labelledBy: string;
  hint?: string;
  staffIds: number[];
  /** The people "Any available" may assign, for its avatar stack. */
  stackIds: number[];
  showAny: boolean;
  anyHint: string;
  picked: number | undefined;
  figuresFor?: (staffId: number) => { priceAmountMinor: number; durationMinutes: number };
  directory: BookingDaySlots["staffDirectory"];
  currency: string;
  showPricing: boolean;
  quoteLabel: string;
  locale: string;
  t: BookingDict;
  onPick: (staffId: number | null) => void;
}) {
  const titleId = useId();
  const isAny = picked == null;
  const stack = stackIds.slice(0, 3);
  const more = stackIds.length - stack.length;
  return (
    <section className={styles.staffPicker}>
      {title && (
        <h4 id={titleId} className={styles.staffTitle}>
          <span className={styles.staffIndex} aria-hidden="true">
            {String(title.index).padStart(2, "0")}
          </span>
          {title.name}
        </h4>
      )}
      {hint && <p className={styles.hint}>{hint}</p>}
      <div
        role="group"
        aria-labelledby={title ? titleId : labelledBy}
        className={styles.staffChoices}
        data-compare={figuresFor ? "" : undefined}
      >
        {showAny && (
          <button
            type="button"
            className={`tap ${styles.staffChoice} ${styles.staffAny}`}
            onClick={() => onPick(null)}
            aria-pressed={isAny}
          >
            <span className={styles.anyStack} aria-hidden="true">
              {stack.map((staffId) => (
                <span key={staffId}>
                  <Avatar
                    src={directory[staffId]?.image ?? undefined}
                    name={directory[staffId]?.name ?? `#${staffId}`}
                    size={30}
                  />
                </span>
              ))}
              {more > 0 && <span className={styles.anyMore}>+{more}</span>}
            </span>
            <span className={styles.staffText}>
              <span className={styles.staffName}>{t.anyAvailable}</span>
              <span className={styles.staffHint}>{anyHint}</span>
            </span>
            <span data-staff-check aria-hidden="true">
              {isAny && <Icon name="check" size={12} color="currentColor" />}
            </span>
          </button>
        )}
        {showAny && staffIds.length > 0 && (
          <p className={styles.staffOr}>{t.staffOrChoose}</p>
        )}
        {staffIds.map((staffId) => {
          const entry = directory[staffId];
          const selected = picked === staffId;
          const name = entry?.name ?? `#${staffId}`;
          const figures = figuresFor?.(staffId);
          return (
            <button
              key={staffId}
              type="button"
              className={`tap ${styles.staffChoice}`}
              onClick={() => onPick(staffId)}
              aria-pressed={selected}
            >
              <span aria-hidden="true">
                <Avatar src={entry?.image ?? undefined} name={name} size={44} />
              </span>
              <span className={styles.staffText}>
                <span className={styles.staffName}>{name}</span>
              </span>
              {figures && (
                <span className={styles.staffFigures}>
                  <span className={styles.staffPrice}>
                    {showPricing
                      ? formatMoney(figures.priceAmountMinor, currency, locale)
                      : quoteLabel}
                  </span>
                  <span className={styles.staffDuration}>
                    {formatDuration(figures.durationMinutes)}
                  </span>
                </span>
              )}
              <span data-staff-check aria-hidden="true">
                {selected && (
                  <Icon name="check" size={12} color="currentColor" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Step 3 — Review & confirm
// ─────────────────────────────────────────────
type DateParts = { weekday: string; day: string; month: string; long: string };

/** A date the way the appointment cards print it, read in `timeZone`. */
function dateParts(instant: Date, locale: string, timeZone: string): DateParts {
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone })
      .format(instant)
      .replace(/\.$/, "");
  return {
    weekday: part({ weekday: "short" }),
    day: part({ day: "numeric" }),
    month: part({ month: "short" }),
    long: part({ weekday: "long", day: "numeric", month: "long" }),
  };
}

/** The appointment cards' date badge: ink ahead, terracotta on the day. */
function DatePill({ parts, today }: { parts: DateParts; today: boolean }) {
  return (
    <span
      className={styles.datePill}
      data-today={today || undefined}
      aria-hidden="true"
    >
      <span className={styles.pillLabel}>{parts.weekday}</span>
      <span className={styles.pillDay}>{parts.day}</span>
      <span className={styles.pillLabel}>{parts.month}</span>
    </span>
  );
}

/** Who does the visit: their photo under the date pill, the name level with the date. */
function VisitPerson({ person, note }: { person: StaffPerson; note?: string }) {
  return (
    <li>
      <span className={styles.personPhoto} aria-hidden="true">
        <Avatar src={person.image ?? undefined} name={person.name} size={40} />
      </span>
      <span className={styles.personText}>
        <span className={styles.personName}>{person.name}</span>
        {note && <span className={styles.personNote}>{note}</span>}
      </span>
    </li>
  );
}

function ReviewStep({
  slot,
  date,
  staffPicks,
  chosenPicks,
  resolvedItems,
  daySlots,
  businessName,
  services,
  currency,
  showPricing,
  locale,
  timeZone,
  totalDuration,
  busy,
  onEditVisit,
  onEditServices,
  policy,
  t,
  tb,
}: {
  slot: TimeSlot;
  date: string;
  /** Who each service is booked with — every one is pinned by now. */
  staffPicks: StaffPicks;
  /** The customer's own choices; a missing entry was "Any available". */
  chosenPicks: StaffPicks;
  resolvedItems: ResolvedSlotItem[];
  daySlots: BookingDaySlots | null;
  /** Where to settle up; the header already names the venue. */
  businessName: string;
  services: OpenBookingPayload["services"];
  currency: string;
  showPricing: boolean;
  locale: string;
  timeZone: string;
  totalDuration: number;
  /** Booking or re-checking: nothing may change underneath. */
  busy: boolean;
  onEditVisit: () => void;
  /** Absent when this booking has no services step. */
  onEditServices?: () => void;
  policy: BookingPolicy | null;
  t: BookingDict;
  tb: BusinessDict;
}) {
  const visitId = useId();
  const servicesId = useId();
  const paymentId = useId();
  const directory = daySlots?.staffDirectory ?? {};
  const people = peopleFor(
    slot.items.map((_, index) => staffPicks[index]),
    directory,
  );
  // Assigned for you only when "Any available" chose them for every service
  // they'll do.
  const assignedForYou = (staffId: number) =>
    slot.items.every(
      (_, index) => staffPicks[index] !== staffId || chosenPicks[index] == null,
    );
  const staffPerService = people.length > 1;
  const timed = slot.items.length > 1;
  // The wall date is already the venue's; read it back in UTC so no offset
  // can move it onto a neighbouring day.
  const [year, month, day] = date.split("-").map(Number);
  const parts = dateParts(new Date(Date.UTC(year, month - 1, day, 12)), locale, "UTC");
  return (
    <div className={styles.review}>
      <section className={styles.visit} aria-labelledby={visitId}>
        <DatePill parts={parts} today={date === todayInTz(timeZone)} />
        <div className={styles.visitText}>
          <div className={styles.visitHead}>
            <h3 id={visitId} className={styles.visitDate}>
              <time dateTime={date}>{parts.long}</time>
            </h3>
            <button
              type="button"
              className={styles.editAction}
              onClick={onEditVisit}
              disabled={busy}
              aria-label={t.reviewChangeVisit}
            >
              {t.reviewChange}
            </button>
          </div>
          <p className={styles.visitTime}>
            {fmtTimeLabel(date, slot.startTime, locale, timeZone)} –{" "}
            {fmtTimeLabel(
              date,
              resolvedItems[resolvedItems.length - 1]?.endTime ?? slot.endTime,
              locale,
              timeZone,
            )}
            {" · "}
            {formatDuration(totalDuration)}
          </p>
        </div>
        <ul className={styles.visitPeople}>
          {people.length > 0 ? (
            people.map((person) => (
              <VisitPerson
                key={person.staffId}
                person={person}
                note={assignedForYou(person.staffId) ? t.staffAssigned : undefined}
              />
            ))
          ) : (
            <li>
              <span className={`${styles.personPhoto} ${styles.personAny}`} aria-hidden="true">
                <Icon name="users" size={18} color="currentColor" />
              </span>
              <span className={styles.personText}>
                <span className={styles.personName}>{t.anyAvailable}</span>
              </span>
            </li>
          )}
        </ul>
      </section>
      <section className={styles.schedule} aria-labelledby={servicesId}>
        <div className={styles.scheduleHead}>
          <h3 id={servicesId} className={styles.sectionLabel}>
            {t.reviewServicesTitle}
          </h3>
          {onEditServices && (
            <button
              type="button"
              className={styles.editAction}
              onClick={onEditServices}
              disabled={busy}
            >
              {t.reviewEditServices}
            </button>
          )}
        </div>
        {/* A visit of several services reads as a schedule: each starts
            when the one before it ends. The footer carries the total. */}
        <ol
          className={styles.scheduleList}
          data-timed={timed || undefined}
          data-priced={showPricing || undefined}
        >
          {slot.items.map((item, index) => {
            const resolved = resolvedItems[index];
            const startTime = resolved?.startTime ?? item.startTime;
            const staffId = staffPicks[index];
            const person = staffId == null ? undefined : directory[staffId];
            return (
              <li key={`${item.type}-${item.serviceId ?? item.bundleId}-${index}`}>
                {timed && (
                  <time className={styles.scheduleTime} dateTime={startTime}>
                    {fmtTimeLabel(date, startTime, locale, timeZone)}
                  </time>
                )}
                <span className={styles.scheduleName}>
                  {(item.type === "bundle"
                    ? item.bundleName
                    : item.serviceName) ??
                    services[index]?.name ??
                    ""}
                </span>
                <span className={styles.scheduleMeta}>
                  {item.type === "bundle" && (
                    <span className={styles.bundleTag}>{tb.bundleTag}</span>
                  )}
                  <span className={styles.scheduleDuration}>
                    {formatDuration(
                      resolved?.durationMinutes ?? item.durationMinutes,
                    )}
                  </span>
                  {staffPerService && person?.name && (
                    <span className={styles.scheduleStaff}>
                      <span aria-hidden="true">
                        <Avatar
                          src={person.image ?? undefined}
                          name={person.name}
                          size={20}
                        />
                      </span>
                      {person.name}
                    </span>
                  )}
                </span>
                {item.type === "bundle" && item.services && item.services.length > 0 && (
                  <span className={styles.scheduleIncludes}>
                    {item.services.map((service) => service.serviceName).join(", ")}
                  </span>
                )}
                {showPricing && (
                  <span className={styles.schedulePrice}>
                    {formatMoney(
                      resolved?.priceAmountMinor ?? item.priceAmountMinor,
                      currency,
                      locale,
                    )}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </section>
      <div className={styles.notices}>
        {policy && <BookingPolicyNotice policy={policy} />}
        <section className={styles.notice} aria-labelledby={paymentId}>
          <Icon name="wallet" size={20} color="var(--c-700)" />
          <div>
            <h3 id={paymentId} className={styles.noticeTitle}>
              {t.payAtVenueTitle}
            </h3>
            <p className={`txt-pretty ${styles.noticeBody}`}>
              {format(t.payAtVenueNote, { business: businessName })}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function BookingPolicyNotice({ policy }: { policy: BookingPolicy }) {
  const { dict, locale } = useTranslation();
  const titleId = useId();
  const p = dict.appointmentPage;
  const duration = (minutes: number) => {
    const unit = minutes % 1440 === 0 ? "day" : minutes % 60 === 0 ? "hour" : "minute";
    return new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "long" }).format(
      unit === "day" ? minutes / 1440 : unit === "hour" ? minutes / 60 : minutes,
    );
  };
  const combined = policy.allowCustomerCancellation && policy.allowCustomerReschedule &&
    policy.cancellationWindowMinutes === policy.rescheduleWindowMinutes;
  return <section className={styles.notice} aria-labelledby={titleId}>
    <Icon name="rebook" size={20} color="var(--c-700)" />
    <div>
      <h3 id={titleId} className={styles.noticeTitle}>{p.combinedPolicyTitle}</h3>
      {combined ? <p className={`txt-pretty ${styles.noticeBody}`}>{policy.cancellationWindowMinutes > 0
        ? format(p.combinedNotice, { duration: duration(policy.cancellationWindowMinutes) })
        : p.combinedNoNoticeRequired}</p> : <dl className={styles.noticeTerms}>
        <div><dt>{p.cancellationPolicy}</dt><dd>{!policy.allowCustomerCancellation
          ? dict.booking.cancellationUnavailable
          : policy.cancellationWindowMinutes > 0
            ? format(p.cancellationNotice, { duration: duration(policy.cancellationWindowMinutes) })
            : p.noNoticeRequired}</dd></div>
        <div><dt>{p.reschedulePolicy}</dt><dd>{!policy.allowCustomerReschedule
          ? dict.booking.reschedulingUnavailable
          : policy.rescheduleWindowMinutes > 0
            ? format(p.rescheduleNotice, { duration: duration(policy.rescheduleWindowMinutes) })
            : p.noNoticeRequired}</dd></div>
      </dl>}
    </div>
  </section>;
}

// ─────────────────────────────────────────────
// Success screen
// ─────────────────────────────────────────────
/**
 * Permanent-block screen — replaces the step UI when availability or booking
 * fails with a CUSTOMER_BOOKING.* state error (venue delisted, service removed
 * at this location, no capable staff, pinned professional can't perform).
 * Retry is deliberately absent: these can never succeed. staff-pin offers a
 * real recovery (drop the pin, refetch unpinned); everything else routes to
 * the venue's live listing.
 */
function BlockedScreen({
  block,
  services,
  t,
  tb,
  onBrowseServices,
  onAnyProfessional,
  onClose,
}: {
  block: BookingBlock;
  services: BookingSelectionItem[];
  t: BookingDict;
  tb: ReturnType<typeof useTranslation>["dict"]["business"];
  onBrowseServices: () => void;
  onAnyProfessional: () => void;
  onClose: () => void;
}) {
  const b = t.blockedScreen;
  // Name the offending service when the backend identifies it (details.
  // serviceId); a single-service booking is unambiguous even without details.
  const serviceName =
    (block.serviceId != null
      ? services.find((s) => s.serviceId === block.serviceId)?.name
      : services.length === 1
        ? services[0].name
        : null) ?? null;
  const copy = {
    business: { title: b.businessTitle, body: b.businessBody },
    "booking-off": { title: b.bookingOffTitle, body: b.bookingOffBody },
    location: { title: b.locationTitle, body: b.locationBody },
    service: {
      title: b.serviceTitle,
      body: serviceName
        ? format(b.serviceBody, { service: serviceName })
        : b.serviceBodyGeneric,
    },
    "no-staff": { title: b.noStaffTitle, body: b.noStaffBody },
    "staff-pin": { title: b.staffPinTitle, body: b.staffPinBody },
  }[block.kind];
  const isPin = block.kind === "staff-pin";

  return (
    <div className={styles.state}>
      <div className={styles.stateIcon}>
        <Icon name="info" size={30} color="currentColor" />
      </div>
      <h2 className={`txt-balance ${styles.stateTitle}`}>{copy.title}</h2>
      <p className={`txt-pretty ${styles.stateBody}`}>{copy.body}</p>
      <div className={styles.stateActions}>
        <Button
          kind="accent"
          className={styles.primaryAction}
          onClick={isPin ? onAnyProfessional : onBrowseServices}
        >
          {isPin ? b.anyProfessional : b.browseServices}
        </Button>
        <Button kind="secondary" onClick={onClose}>
          {tb.close}
        </Button>
      </div>
    </div>
  );
}

function SuccessScreen({
  pending,
  scheduledAt,
  endsAt,
  items,
  people,
  priceMinor,
  branchName,
  currency,
  showPricing,
  totalLabel,
  timeZone,
  locale,
  t,
  tb,
  onViewAppointment,
  onClose,
}: {
  pending: boolean;
  scheduledAt: string;
  endsAt: string | null;
  items: BookedItem[];
  people: StaffPerson[];
  priceMinor: number | null;
  /** The location, when it's named apart from the business in the header. */
  branchName: string | null;
  currency: string;
  showPricing: boolean;
  totalLabel: string;
  timeZone: string;
  locale: string;
  t: BookingDict;
  tb: BusinessDict;
  onViewAppointment: () => void;
  onClose: () => void;
}) {
  const visitId = useId();
  const servicesId = useId();
  const start = new Date(scheduledAt);
  const parts = dateParts(start, locale, timeZone);
  const clock = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }).format(new Date(iso));
  const wallDate = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(start);
  const totalDuration = items.reduce((sum, item) => sum + item.durationMinutes, 0);
  const timed = items.length > 1;
  const staffNameFor = (staffId: number | null) =>
    people.length > 1
      ? people.find((person) => person.staffId === staffId)?.name
      : undefined;

  return (
    <>
      <div className={styles.body}>
        <div className={styles.success}>
          <div className={styles.stateArtwork}>
            <BookingSuccessArt pending={pending} />
          </div>
          <section
            className={`${styles.visit} ${styles.successVisit}`}
            aria-labelledby={visitId}
          >
            <DatePill parts={parts} today={wallDate === todayInTz(timeZone)} />
            <div className={styles.visitText}>
              <h3 id={visitId} className={styles.visitDate}>
                <time dateTime={scheduledAt}>{parts.long}</time>
              </h3>
              <p className={styles.visitTime}>
                {clock(scheduledAt)}
                {endsAt && <> – {clock(endsAt)}</>}
                {totalDuration > 0 && (
                  <>
                    {" · "}
                    {formatDuration(totalDuration)}
                  </>
                )}
              </p>
            </div>
            {people.length > 0 && (
              <ul className={styles.visitPeople}>
                {people.map((person) => (
                  <VisitPerson key={person.staffId} person={person} />
                ))}
              </ul>
            )}
            {branchName && (
              <p className={styles.visitPlace}>
                <span
                  className={`${styles.personPhoto} ${styles.visitIcon}`}
                  aria-hidden="true"
                >
                  <Icon name="pin" size={18} color="currentColor" />
                </span>
                <span className={styles.personText}>
                  <span className={styles.personName}>{branchName}</span>
                </span>
              </p>
            )}
          </section>
          {items.length > 0 && (
            <section className={styles.successSchedule} aria-labelledby={servicesId}>
              <h3 id={servicesId} className={styles.sectionLabel}>
                {t.reviewServicesTitle}
              </h3>
              <ol className={styles.bookedList} data-timed={timed || undefined}>
                {items.map((item) => {
                  const staffName = staffNameFor(item.staffId);
                  return (
                    <li key={item.key}>
                      {timed && item.startTime && (
                        <time className={styles.bookedTime} dateTime={item.startTime}>
                          {fmtTimeLabel(wallDate, item.startTime, locale, timeZone)}
                        </time>
                      )}
                      <span className={styles.bookedName}>{item.name}</span>
                      <span className={styles.bookedDuration}>
                        {formatDuration(item.durationMinutes)}
                      </span>
                      {(item.bundle || staffName) && (
                        <span className={styles.bookedMeta}>
                          {item.bundle && (
                            <span className={styles.bundleTag}>{tb.bundleTag}</span>
                          )}
                          {staffName}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
              {showPricing && priceMinor != null && (
                <p className={styles.bookedTotal}>
                  <span>{totalLabel}</span>
                  <span>{formatMoney(priceMinor, currency, locale)}</span>
                </p>
              )}
            </section>
          )}
        </div>
      </div>
      {/* The steps' action bar stays: the next step sits where Confirm was,
          in reach however far the summary scrolls. */}
      <footer className={`${styles.footer} ${styles.successFooter}`}>
        <Button
          kind="secondary"
          size="lg"
          className={styles.secondaryAction}
          onClick={onClose}
        >
          {t.close}
        </Button>
        <Button
          kind="accent"
          size="lg"
          className={styles.primaryAction}
          onClick={onViewAppointment}
        >
          {t.viewAppointment}
        </Button>
      </footer>
    </>
  );
}

// ─────────────────────────────────────────────
// Shared small blocks
// ─────────────────────────────────────────────
function LoadingBlock({
  label,
  kind,
  title,
}: {
  label: string;
  kind: "dates" | "slots";
  title?: string;
}) {
  return (
    <div aria-busy="true">
      {title && <div className={styles.sectionLabel}>{title}</div>}
      <div aria-hidden="true">
        {kind === "dates" ? (
          <div className={styles.skeletonNavigation}>
            <Skeleton w={44} h={44} r={99} />
            <Skeleton w="55%" h={18} />
            <Skeleton w={44} h={44} r={99} />
          </div>
        ) : (
          <Skeleton w={64} h={18} style={{ marginBottom: 10 }} />
        )}
        <div className={kind === "dates" ? styles.dateViewport : undefined}>
          <div
            className={
              kind === "dates" ? styles.skeletonDates : styles.slotGrid
            }
          >
            {Array.from({ length: kind === "dates" ? 7 : 10 }, (_, index) => (
              <Skeleton
                key={index}
                h={kind === "dates" ? 88 : 46}
                r={kind === "dates" ? 16 : 14}
              />
            ))}
          </div>
        </div>
      </div>
      <p role="status" className="sr-only">
        {label}
      </p>
    </div>
  );
}

function ErrorBlock({
  label,
  retry,
  onRetry,
  loading,
}: {
  label: string;
  retry: string;
  onRetry: () => void;
  loading: boolean;
}) {
  return (
    <div className={styles.error}>
      <p className="txt-pretty">{label}</p>
      <Button kind="secondary" onClick={onRetry} loading={loading}>
        {retry}
      </Button>
    </div>
  );
}
