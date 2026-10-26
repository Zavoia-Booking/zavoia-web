"use client";

import {
  useCallback,
  useEffect,
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
import { format } from "@/i18n/format";
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
  SlotItem,
  TimeSlot,
} from "@/lib/api/marketplace/types";
import type { BookingSelectionItem, OpenBookingPayload } from "./types";
import { addWallDays, todayInTz, zonedWallTimeToUtcISO } from "./tz";
import { useBooking } from "./useBooking";
import { exactSlotSelection, findExactSlot } from "./sequence";

export interface BookingDrawerProps {
  open: boolean;
  payload: OpenBookingPayload | null;
  onClose: () => void;
}

type Step = 1 | 2 | 3;
type StaffPicks = Record<number, number>; // slot-item index → chosen staffId

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

  // Whether this session actually has a reachable step 1 — true only when the
  // drawer was opened with an empty `services` list. Captured once per open
  // (see the reset effect below) so it doesn't flicker as local picks change.
  const [hasStep1, setHasStep1] = useState(payload?.services.length === 0);

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

  // Step 1 (choose services) local picks — only relevant when `hasStep1`.
  // Keyed the same way business-detail.tsx keys its own selection.
  const [picked, setPicked] = useState<
    Array<{ type: "service" | "bundle"; id: number }>
  >([]);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    pending: boolean;
    scheduledAt: string;
    serviceNames: string[];
  } | null>(null);

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

  // ── Resolved services: `payload.services` when non-empty, otherwise the
  //    Step 1 picks mapped from `payload.catalog`. Everything downstream
  //    (calendar/slots calls, totals, review) reads THIS, never payload.services
  //    directly. `payload` itself is never mutated. ──
  const resolvedServices: BookingSelectionItem[] = useMemo(() => {
    if (!payload) return [];
    if (payload.services.length > 0) return payload.services;
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
  }, [payload, picked]);

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
  //    straight to the combined date/time/staff step and fetch the calendar;
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
    Promise.resolve().then(() => {
      if (cancelled) return;
      resetPayloadRef.current = payload;
      setHasStep1(startsOnStep1);
      setStep(startsOnStep1 ? 1 : 2);
      setPicked([]);
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
      if (!startsOnStep1) void loadCalendar();
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

  // ── Derived: totals from the chosen slot (falls back to the resolved
  //    services list, so the step 1 running total also reads from here). ──
  const totalMinor = useMemo(() => {
    if (displaySlot) {
      return resolvedItems.reduce((a, i) => a + i.priceAmountMinor, 0);
    }
    return resolvedServices.reduce((a, s) => a + s.priceAmountMinor, 0);
  }, [displaySlot, resolvedItems, resolvedServices]);

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
  //    are in, the bounds collapse and it renders like a plain total. ──
  const footerSpread = useMemo(() => {
    if (displaySlot) {
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
  }, [displaySlot, displayPicks, displayDay, resolvedServices, currency, locale]);

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
      if (attempt && attempt.sessionId !== sessionId) {
        attempt = null;
        attemptedBookingRef.current = null;
        idempotencyKeyRef.current = "";
      }
      if (!attempt) {
        const quote = await validateSequence();
        if (!quote || sessionId !== getAuthenticatedSessionId()) return;
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
      setSuccess({
        pending: (first?.status ?? "confirmed") === "pending",
        scheduledAt: first?.scheduledAt ?? scheduledAt,
        serviceNames:
          appts.length > 0
            ? appts.map((a) => a.serviceName)
            : resolvedServices.map((s) => s.name),
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

  const togglePicked = (type: "service" | "bundle", id: number) => {
    setPicked((prev) =>
      prev.some((x) => x.type === type && x.id === id)
        ? prev.filter((x) => !(x.type === type && x.id === id))
        : [...prev, { type, id }],
    );
  };

  // Continue from Step 1 (choose services) → Step 2 (date/time/staff), which
  // now needs a fresh calendar fetch for the just-picked services. Reset all
  // step-2-scoped state first (mirrors the open/reset effect) so a prior pass
  // through step 2 (with a now-stale service selection) never leaves behind a
  // date/slot/staff pick — or a stale, still-clickable calendar — that was
  // never validated against the final services.
  const onContinueFromServices = () => {
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
            aria-describedby={undefined}
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
              <DialogPrimitive.Title className={`txt-balance ${styles.title}`}>
                {tb.bookHeading}
              </DialogPrimitive.Title>
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
                serviceNames={success.serviceNames}
                businessName={calendar?.businessName ?? tb.bookHeading}
                timeZone={timeZone}
                locale={locale}
                t={t}
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
                    {calendar && step !== 3 && (
                      <div className={styles.venueSummary}>
                        <Icon name="pin" size={18} color="var(--c-600)" />
                        <div>
                          <div className={styles.businessName}>
                            {calendar.businessName}
                          </div>
                          {calendar.locationName &&
                            calendar.locationName !== calendar.businessName && (
                              <div className={styles.locationName}>
                                {calendar.locationName}
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                    {step === 1 && payload.catalog && (
                      <ServicesStep
                        catalog={payload.catalog}
                        picked={picked}
                        currency={currency}
                        showPricing={showPricing}
                        quoteLabel={quoteLabel}
                        locale={locale}
                        tb={tb}
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
                        resolvedItems={resolvedItems}
                        daySlots={displayDay}
                        calendar={calendar}
                        services={services}
                        currency={currency}
                        showPricing={showPricing}
                        quoteLabel={quoteLabel}
                        locale={locale}
                        timeZone={timeZone}
                        totalMinor={totalMinor}
                        totalDuration={totalDuration}
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
// Step 1 — Choose services (only reachable when payload.services was empty
// on open). Checkbox list of services grouped by category, plus bundles.
// ─────────────────────────────────────────────
type BookingDict = ReturnType<typeof useTranslation>["dict"]["booking"];
type BusinessDict = ReturnType<typeof useTranslation>["dict"]["business"];

function ServicesStep({
  catalog,
  picked,
  currency,
  showPricing,
  quoteLabel,
  locale,
  tb,
  onToggle,
}: {
  catalog: NonNullable<OpenBookingPayload["catalog"]>;
  picked: Array<{ type: "service" | "bundle"; id: number }>;
  currency: string;
  showPricing: boolean;
  quoteLabel: string;
  locale: string;
  tb: BusinessDict;
  onToggle: (type: "service" | "bundle", id: number) => void;
}) {
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
  return (
    <div className={styles.serviceGroups}>
      {groups.map((group, index) => (
        <div key={index}>
          {group.name && (
            <div className={styles.category}>
              <span style={{ background: group.color }} />
              {group.name}
            </div>
          )}
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
      ))}
      {catalog.bundles.length > 0 && (
        <div>
          <div className={styles.category}>{tb.bundles}</div>
          {catalog.bundles.map((bundle) => (
            <ServiceCheckRow
              key={bundle.id}
              name={bundle.name}
              service={bundle}
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
      )}
    </div>
  );
}

function ServiceCheckRow({
  name,
  service,
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
      <span className={styles.serviceCheck} aria-hidden="true">
        {on && <Icon name="check" size={13} color="currentColor" />}
      </span>
      <span className={styles.serviceText}>
        <span className={styles.serviceName}>{name}</span>
        <span className={styles.serviceMeta}>
          {meta.duration} ·{" "}
          {showPricing && meta.priceVaries && <span>{fromLabel} </span>}
          {showPricing ? meta.price : quoteLabel}
        </span>
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
  onPick,
}: {
  day: BookingCalendarDay;
  locale: string;
  timeZone: string;
  t: BookingDict;
  selected: boolean;
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
      ? format(t.slotsCountLabel, { count: String(day.slotsCount) })
      : null;
  return (
    <button
      type="button"
      className={`tap ${styles.day}`}
      disabled={!available}
      data-date={day.date}
      onClick={onPick}
      aria-pressed={selected}
      aria-label={fmtDateLabel(day.date, locale, timeZone)}
      title={count ?? (!available ? (day.reason ?? day.status) : undefined)}
    >
      <span className={styles.weekday}>{weekday}</span>
      <span className={styles.dayNumber}>{dayNumber}</span>
      {count && <span className={styles.slotCount}>{count}</span>}
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
}) {
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
                      onClick={() => onPickSlot(slot)}
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
        <div className={styles.staffSection}>
          {staffItems.map(({ item, index, pinned }) => (
            <StaffPicker
              key={`${item.type}-${item.serviceId ?? item.bundleId}-${index}`}
              item={item}
              idx={index}
              picked={staffPicks[index]}
              directory={daySlots.staffDirectory}
              showItemLabel={selectedSlot.items.length > 1}
              varies={itemVariesByStaff(item, daySlots.staffPricing ?? {}, daySlots.itemStaffPricing, index)}
              pinned={pinned}
              staffPricing={daySlots.staffPricing ?? {}}
              itemStaffPricing={daySlots.itemStaffPricing}
              currency={currency}
              showPricing={showPricing}
              quoteLabel={quoteLabel}
              locale={locale}
              t={t}
              onPick={onPickStaff}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StaffPicker({
  item,
  idx,
  picked,
  directory,
  showItemLabel,
  varies,
  pinned,
  staffPricing,
  itemStaffPricing,
  currency,
  showPricing,
  quoteLabel,
  locale,
  t,
  onPick,
}: {
  item: SlotItem;
  idx: number;
  picked: number | undefined;
  directory: BookingDaySlots["staffDirectory"];
  showItemLabel: boolean;
  varies: boolean;
  pinned: number | undefined;
  staffPricing: BookingDaySlots["staffPricing"];
  itemStaffPricing?: BookingDaySlots["itemStaffPricing"];
  currency: string;
  showPricing: boolean;
  quoteLabel: string;
  locale: string;
  t: BookingDict;
  onPick: (idx: number, staffId: number | null) => void;
}) {
  const itemName = item.type === "bundle" ? item.bundleName : item.serviceName;
  const isAny = picked == null;
  return (
    <section>
      <h3 className={styles.sectionLabel}>
        {showItemLabel && itemName
          ? `${t.staffLabel} · ${itemName}`
          : t.staffLabel}
      </h3>
      {varies && (
        <p className={styles.hint} style={{ marginBottom: 12 }}>
          {t.staffChoiceRequired}
        </p>
      )}
      <div className={styles.staffChoices}>
        {/* Availability remains pinned unless the explicit recovery unpins it.
            Any available is offered only when price and duration are identical. */}
        {!varies && pinned == null && (
          <button
            type="button"
            className={`tap ${styles.staffChoice}`}
            onClick={() => onPick(idx, null)}
            aria-pressed={isAny}
          >
            <span className={styles.anyAvatar} aria-hidden="true">
              <Icon name="sparkle" size={20} color="currentColor" />
            </span>
            <span className={styles.staffText}>
              <span className={styles.staffName}>{t.anyAvailable}</span>
            </span>
            <span data-staff-check aria-hidden="true">
              {isAny && <Icon name="check" size={12} color="currentColor" />}
            </span>
          </button>
        )}
        {item.availableStaffIds.map((staffId) => {
          const entry = directory[staffId];
          const selected = picked === staffId;
          const name = entry?.name ?? `#${staffId}`;
          const figures = varies
            ? staffFiguresForItem(item, staffId, staffPricing, itemStaffPricing, idx)
            : null;
          return (
            <button
              key={staffId}
              type="button"
              className={`tap ${styles.staffChoice}`}
              onClick={() => onPick(idx, staffId)}
              aria-pressed={selected}
            >
              <span aria-hidden="true">
                <Avatar src={entry?.image ?? undefined} name={name} size={44} />
              </span>
              <span className={styles.staffText}>
                <span className={styles.staffName}>{name}</span>
                {figures && (
                  <span className={styles.staffFigures}>
                    {formatDuration(figures.durationMinutes)} ·{" "}
                    {showPricing
                      ? formatMoney(figures.priceAmountMinor, currency, locale)
                      : quoteLabel}
                  </span>
                )}
              </span>
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
function ReviewStep({
  slot,
  date,
  staffPicks,
  resolvedItems,
  daySlots,
  calendar,
  services,
  currency,
  showPricing,
  quoteLabel,
  locale,
  timeZone,
  totalMinor,
  totalDuration,
  policy,
  t,
  tb,
}: {
  slot: TimeSlot;
  date: string;
  staffPicks: StaffPicks;
  resolvedItems: ResolvedSlotItem[];
  daySlots: BookingDaySlots | null;
  calendar: BookingCalendar | null;
  services: OpenBookingPayload["services"];
  currency: string;
  showPricing: boolean;
  quoteLabel: string;
  locale: string;
  timeZone: string;
  totalMinor: number;
  totalDuration: number;
  policy: BookingPolicy | null;
  t: BookingDict;
  tb: BusinessDict;
}) {
  const staffIds = [
    ...new Set(
      slot.items.flatMap((_, index) =>
        staffPicks[index] == null ? [] : [staffPicks[index]],
      ),
    ),
  ];
  const staffNames = staffIds
    .map((staffId) => daySlots?.staffDirectory[staffId]?.name ?? null)
    .filter((name): name is string => !!name);
  return (
    <div className={styles.review}>
      <div className={styles.visitDetails}>
        <Row icon="cal">
          <strong>{fmtDateLabel(date, locale, timeZone)}</strong>
          <br />
          {fmtTimeLabel(date, slot.startTime, locale, timeZone)} –{" "}
          {fmtTimeLabel(
            date,
            resolvedItems[resolvedItems.length - 1]?.endTime ?? slot.endTime,
            locale,
            timeZone,
          )}
        </Row>
        <Row icon="user">
          {staffNames.length > 0 ? staffNames.join(", ") : t.anyAvailable}
        </Row>
        <Row icon="pin">
          {(calendar?.businessName ?? tb.bookHeading) +
            (calendar?.locationName ? ` · ${calendar.locationName}` : "")}
        </Row>
      </div>
      <div className={styles.receipt}>
        <div className={styles.receiptItems}>
          {slot.items.map((item, index) => (
            <div
              key={`${item.type}-${item.serviceId ?? item.bundleId}-${index}`}
              className={styles.receiptRow}
            >
              <div>
                <div className={styles.serviceName}>
                  {(item.type === "bundle"
                    ? item.bundleName
                    : item.serviceName) ??
                    services[index]?.name ??
                    ""}
                </div>
                <div className={styles.serviceMeta}>
                  {formatDuration(
                    resolvedItems[index]?.durationMinutes ??
                      item.durationMinutes,
                  )}
                </div>
              </div>
              <span className={styles.receiptAmount}>
                {showPricing
                  ? formatMoney(
                      resolvedItems[index]?.priceAmountMinor ??
                        item.priceAmountMinor,
                      currency,
                      locale,
                    )
                  : quoteLabel}
              </span>
            </div>
          ))}
        </div>
        <div className={styles.receiptTotal}>
          <div>
            <span style={{ textTransform: "capitalize" }}>{tb.totalLabel}</span>
            <div className={styles.serviceMeta}>
              {formatDuration(totalDuration)}
            </div>
          </div>
          <strong>
            {showPricing
              ? formatMoney(totalMinor, currency, locale)
              : quoteLabel}
          </strong>
        </div>
      </div>
      {policy && <BookingPolicyNotice policy={policy} />}
      <div className={styles.paymentNotice}>
        <Icon name="wallet" size={20} color="var(--c-700)" />
        <div>
          <strong>{t.payAtVenueTitle}</strong>
          <p className="txt-pretty">
            {format(t.payAtVenueNote, {
              business: calendar?.businessName ?? tb.bookHeading,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

function BookingPolicyNotice({ policy }: { policy: BookingPolicy }) {
  const { dict, locale } = useTranslation();
  const p = dict.appointmentPage;
  const duration = (minutes: number) => {
    const unit = minutes % 1440 === 0 ? "day" : minutes % 60 === 0 ? "hour" : "minute";
    return new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "long" }).format(
      unit === "day" ? minutes / 1440 : unit === "hour" ? minutes / 60 : minutes,
    );
  };
  const combined = policy.allowCustomerCancellation && policy.allowCustomerReschedule &&
    policy.cancellationWindowMinutes === policy.rescheduleWindowMinutes;
  return <section className={styles.policyNotice} aria-label={p.combinedPolicyTitle}>
    <h3 className={styles.sectionLabel}>{p.combinedPolicyTitle}</h3>
    {combined ? <p className={styles.hint}>{policy.cancellationWindowMinutes > 0
      ? format(p.combinedNotice, { duration: duration(policy.cancellationWindowMinutes) })
      : p.combinedNoNoticeRequired}</p> : <dl>
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
  </section>;
}

function Row({
  icon,
  children,
}: {
  icon: "cal" | "user" | "pin";
  children: React.ReactNode;
}) {
  return (
    <div className={styles.detailRow}>
      <Icon name={icon} size={18} color="var(--c-600)" />
      <span>{children}</span>
    </div>
  );
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
  serviceNames,
  businessName,
  timeZone,
  locale,
  t,
  onViewAppointment,
  onClose,
}: {
  pending: boolean;
  scheduledAt: string;
  serviceNames: string[];
  businessName: string;
  timeZone: string;
  locale: string;
  t: BookingDict;
  onViewAppointment: () => void;
  onClose: () => void;
}) {
  const when = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(scheduledAt));

  return (
    <div className={styles.state}>
      <div className={styles.stateIcon} data-success="true">
        <Icon name="check" size={32} color="currentColor" />
      </div>
      <h2 className={`txt-balance ${styles.stateTitle}`}>
        {pending ? t.pendingTitle : t.successTitle}
      </h2>
      <p className={`txt-pretty ${styles.stateBody}`}>
        {format(pending ? t.pendingBody : t.successBody, {
          services: serviceNames.join(" + "),
          business: businessName,
        })}
      </p>
      <div className={styles.stateDate}>{when}</div>
      <div className={styles.stateActions}>
        <Button
          kind="accent"
          className={styles.primaryAction}
          onClick={onViewAppointment}
        >
          {t.viewAppointment}
        </Button>
        <Button kind="secondary" onClick={onClose}>
          {t.close}
        </Button>
      </div>
    </div>
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
