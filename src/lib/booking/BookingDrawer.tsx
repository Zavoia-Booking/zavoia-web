"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Icon, Spinner } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { formatDuration, formatMoney } from "@/lib/format/money-time";
import { useAuth } from "@/lib/auth/useAuth";
import { useAuthModal } from "@/components/shell/auth-modal-provider";
import { ApiError } from "@/lib/api/http";
import {
  getBookingCalendar,
  getBookingSlots,
} from "@/lib/api/marketplace/booking";
import { bookAppointment } from "@/lib/api/marketplace/appointments";
import type {
  BookingCalendar,
  BookingCalendarDay,
  BookingDaySlots,
  BookingPolicy,
  BookingServiceItem,
  ServiceSelection,
  SlotItem,
  TimeSlot,
} from "@/lib/api/marketplace/types";
import type { BookingSelectionItem, OpenBookingPayload } from "./types";
import { todayInTz, zonedWallTimeToUtcISO } from "./tz";
import { useBooking } from "./useBooking";

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
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `bk-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Map resolved booking selection items into calendar/slots ServiceSelection[]. */
function toServiceSelections(services: BookingSelectionItem[]): ServiceSelection[] {
  return services.map((s) => ({
    ...(s.bundleId != null
      ? { bundleId: s.bundleId }
      : { serviceId: s.serviceId }),
    ...(s.teamMemberId != null ? { teamMemberId: s.teamMemberId } : {}),
  }));
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
 * Map an ApiError.code to {message, backTo} (which step to send the user to).
 * Step 1 (choose services) no longer exists as an error-recovery target — date
 * lives on the combined step 2 now, so every recoverable error sends the user
 * back to step 2 (refreshing calendar/slots as appropriate).
 */
function mapErrorCode(
  code: string | undefined,
  errors: {
    tooSoon: string;
    tooFar: string;
    slotConflict: string;
    outsideHours: string;
    calendarBlock: string;
    staffUnavailable: string;
    generic: string;
  },
): { message: string; backTo: Step | null } {
  switch (code) {
    case "E08":
      return { message: errors.tooSoon, backTo: 2 };
    case "E09":
      return { message: errors.tooFar, backTo: 2 };
    case "E10":
      return { message: errors.slotConflict, backTo: 2 };
    case "E11":
      return { message: errors.outsideHours, backTo: 2 };
    case "E14":
      return { message: errors.calendarBlock, backTo: 2 };
    case "E15":
      return { message: errors.staffUnavailable, backTo: 2 };
    default:
      return { message: errors.generic, backTo: null };
  }
}

/**
 * Cancellation/reschedule trust-card copy, derived ONLY from the location's
 * real `BookingPolicy` (never `calendar.bookingSettings`, which carries no
 * allow-flags) — mirrors business-detail.tsx's `cancellationLine` correctness
 * logic (no policy / not allowed → neutral wording; window <= 0 → "anytime";
 * else → a concrete deadline date) but produces a concrete calendar deadline
 * (the drawer already knows the exact appointment instant) instead of a
 * relative "up to X before" sentence, and covers reschedule too.
 *
 * When both cancellation and reschedule are allowed with the same effective
 * window (both "anytime", or the same minute count), they're combined into
 * one line; otherwise each is reported individually.
 */
function policyDeadlineLabel(
  scheduledMs: number,
  windowMinutes: number,
  locale: string,
  timeZone: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
  }).format(new Date(scheduledMs - windowMinutes * 60_000));
}

function cancellationRescheduleLines(
  policy: BookingPolicy | null,
  scheduledMs: number,
  locale: string,
  timeZone: string,
  t: BookingDict,
): string[] {
  const canCancel = !!policy?.allowCustomerCancellation;
  const canReschedule = !!policy?.allowCustomerReschedule;

  if (!canCancel && !canReschedule) {
    return [t.noFreeCancellationOrReschedule];
  }

  if (canCancel && canReschedule) {
    const cMin = policy!.cancellationWindowMinutes;
    const rMin = policy!.rescheduleWindowMinutes;
    const sameWindow =
      (cMin <= 0 && rMin <= 0) || (cMin > 0 && rMin > 0 && cMin === rMin);
    if (sameWindow) {
      if (cMin <= 0) return [t.cancellationRescheduleAnytime];
      return [
        format(t.cancellationRescheduleDeadline, {
          date: policyDeadlineLabel(scheduledMs, cMin, locale, timeZone),
        }),
      ];
    }
  }

  const lines: string[] = [];
  if (canCancel) {
    const cMin = policy!.cancellationWindowMinutes;
    lines.push(
      cMin <= 0
        ? t.cancellationAnytime
        : format(t.cancellationDeadline, {
            date: policyDeadlineLabel(scheduledMs, cMin, locale, timeZone),
          }),
    );
  } else {
    lines.push(t.noFreeCancellation);
  }
  if (canReschedule) {
    const rMin = policy!.rescheduleWindowMinutes;
    lines.push(
      rMin <= 0
        ? t.rescheduleAnytime
        : format(t.rescheduleDeadline, {
            date: policyDeadlineLabel(scheduledMs, rMin, locale, timeZone),
          }),
    );
  } else {
    lines.push(t.noFreeReschedule);
  }
  return lines;
}

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
  const { closeForAuth } = useBooking();
  const t = dict.booking;
  const tb = dict.business;

  // Whether this session actually has a reachable step 1 — true only when the
  // drawer was opened with an empty `services` list. Captured once per open
  // (see the reset effect below) so it doesn't flicker as local picks change.
  const [hasStep1, setHasStep1] = useState(false);

  // ── Flow state ──
  const [step, setStep] = useState<Step>(1);
  const [calendar, setCalendar] = useState<BookingCalendar | null>(null);
  const [calLoading, setCalLoading] = useState(false);
  const [calError, setCalError] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [daySlots, setDaySlots] = useState<BookingDaySlots | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [staffPicks, setStaffPicks] = useState<StaffPicks>({});

  // Step 1 (choose services) local picks — only relevant when `hasStep1`.
  // Keyed the same way business-detail.tsx keys its own selection.
  const [picked, setPicked] = useState<
    Array<{ type: "service" | "bundle"; id: number }>
  >([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    pending: boolean;
    scheduledAt: string;
    serviceNames: string[];
    appointmentUuid?: string;
  } | null>(null);

  // Idempotency key: one per distinct booking attempt; re-minted when the
  // date / slot / staff selection changes (so retries of an identical body
  // reuse it, but a changed body gets a fresh one).
  const idempotencyKeyRef = useRef<string>("");

  // The authoritative timezone is the calendar response's; fall back to the
  // payload's until the calendar loads.
  const timeZone = calendar?.timezone ?? payload?.timezone ?? "UTC";
  const currency = payload?.currency ?? "USD";
  const isAuthed = status === "authenticated";

  // ── Resolved services: `payload.services` when non-empty, otherwise the
  //    Step 1 picks mapped from `payload.catalog`. Everything downstream
  //    (calendar/slots calls, totals, review) reads THIS, never payload.services
  //    directly. `payload` itself is never mutated. ──
  const resolvedServices: BookingSelectionItem[] = useMemo(() => {
    if (!payload) return [];
    if (payload.services.length > 0) return payload.services;
    if (!payload.catalog) return [];
    const servicesById = new Map(payload.catalog.services.map((s) => [s.id, s]));
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
            },
          ]
        : [];
    });
  }, [payload, picked]);

  // ── Fetch calendar (called on entering the combined step + on retry). ──
  const loadCalendar = useCallback(async () => {
    if (!payload) return;
    setCalLoading(true);
    setCalError(false);
    try {
      const tz = payload.timezone || "UTC";
      const res = await getBookingCalendar({
        businessId: payload.businessId,
        locationId: payload.locationId,
        services: toServiceSelections(resolvedServices),
        startDate: todayInTz(tz),
        daysToCheck: CAL_DAYS_TO_CHECK,
      });
      setCalendar(res);
    } catch {
      setCalError(true);
    } finally {
      setCalLoading(false);
    }
  }, [payload, resolvedServices]);

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
      setCalError(false);
      setSelectedDate(null);
      setDaySlots(null);
      setSlotsError(false);
      setSelectedSlot(null);
      setStaffPicks({});
      setSubmitting(false);
      setSubmitError(null);
      setSuccess(null);
      idempotencyKeyRef.current = "";
      if (!startsOnStep1) void loadCalendar();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payload]);

  // ── Fetch slots when a date is chosen. ──
  const loadSlots = useCallback(
    async (date: string) => {
      if (!payload) return;
      setSlotsLoading(true);
      setSlotsError(false);
      setSelectedSlot(null);
      setStaffPicks({});
      try {
        const res = await getBookingSlots({
          businessId: payload.businessId,
          locationId: payload.locationId,
          services: toServiceSelections(resolvedServices),
          date,
        });
        setDaySlots(res);
      } catch {
        setSlotsError(true);
      } finally {
        setSlotsLoading(false);
      }
    },
    [payload, resolvedServices],
  );

  // ── Escape to close. ──
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // ── Scroll lock while open. ──
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ── Derived: totals from the chosen slot (falls back to the resolved
  //    services list, so the step 1 running total also reads from here). ──
  const totalMinor = useMemo(() => {
    if (selectedSlot) return selectedSlot.totalPriceAmountMinor;
    return resolvedServices.reduce((a, s) => a + s.priceAmountMinor, 0);
  }, [selectedSlot, resolvedServices]);

  const totalDuration = useMemo(() => {
    if (selectedSlot) {
      return selectedSlot.items.reduce((a, i) => a + i.durationMinutes, 0);
    }
    return resolvedServices.reduce((a, s) => a + s.duration, 0);
  }, [selectedSlot, resolvedServices]);

  // Resolve the staffId for a given slot item index.
  const resolveStaffId = useCallback(
    (item: SlotItem, idx: number): number => {
      return (
        staffPicks[idx] ??
        item.defaultStaffId ??
        item.availableStaffIds[0]
      );
    },
    [staffPicks],
  );

  // ── Booking submit. ──
  const doBook = useCallback(async () => {
    if (!payload || !selectedSlot || !selectedDate) return;
    if (!idempotencyKeyRef.current) idempotencyKeyRef.current = mintKey();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const scheduledAt = zonedWallTimeToUtcISO(
        selectedDate,
        selectedSlot.startTime,
        timeZone,
      );
      const services: BookingServiceItem[] = selectedSlot.items.map(
        (item, idx) => ({
          ...(item.type === "bundle"
            ? { bundleId: item.bundleId }
            : { serviceId: item.serviceId }),
          staffId: resolveStaffId(item, idx),
        }),
      );
      const res = await bookAppointment(
        {
          listingId: payload.listingId,
          locationId: payload.locationId,
          scheduledAt,
          services,
        },
        idempotencyKeyRef.current,
      );
      const appts = res.appointments ?? [];
      const first = appts[0];
      setSuccess({
        pending: (first?.status ?? "confirmed") === "pending",
        scheduledAt: first?.scheduledAt ?? scheduledAt,
        serviceNames:
          appts.length > 0
            ? appts.map((a) => a.serviceName)
            : resolvedServices.map((s) => s.name),
        appointmentUuid: first?.appointmentUuid,
      });
    } catch (e) {
      const code = e instanceof ApiError ? e.code : undefined;
      const { message, backTo } = mapErrorCode(code, t.errors);
      setSubmitError(message);
      if (backTo === 2) {
        setStep(2);
        // Conflicts / staff / date issues: refetch slots so the grid is
        // fresh (calendar-level errors also land here — the combined step
        // renders both the date grid and the slot grid).
        idempotencyKeyRef.current = "";
        setSelectedSlot(null);
        if (selectedDate) void loadSlots(selectedDate);
        else void loadCalendar();
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    payload,
    selectedSlot,
    selectedDate,
    timeZone,
    resolveStaffId,
    resolvedServices,
    t.errors,
    loadCalendar,
    loadSlots,
  ]);

  // Hooks complete — safe to bail.
  if (!open || !payload) return null;

  const services = resolvedServices;

  // ── Handlers ──
  // Picking a date no longer transitions the step — date/time/staff all live
  // on the same combined step 2 screen; only the slots refetch + reset.
  const onPickDate = (date: string) => {
    setSelectedDate(date);
    idempotencyKeyRef.current = "";
    void loadSlots(date);
  };

  const onPickSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStaffPicks({});
    idempotencyKeyRef.current = "";
  };

  const onPickStaff = (idx: number, staffId: number | null) => {
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
    setStep(2);
    setCalendar(null);
    setCalError(false);
    setSelectedDate(null);
    setDaySlots(null);
    setSlotsError(false);
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
    setSubmitError(null);
    if (step === 3) setStep(2);
    else if (step === 2 && hasStep1) setStep(1);
  };

  const canContinueFromSlot = !!selectedSlot;
  const canContinueFromServices = picked.length > 0;

  // ── Styles shared across steps ──
  const stepLabel: CSSProperties = {
    fontSize: 19,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: "var(--c-900)",
    marginTop: 4,
  };
  const stepPill: CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--p-600)",
  };
  const sectionLabel: CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--c-500)",
    marginBottom: 9,
  };

  const stepTitle =
    step === 1
      ? t.stepServicesTitle
      : step === 2
        ? t.stepDateTimeTitle
        : t.stepReviewTitle;

  // Back button: shown on step 3 always, on step 2 only when a step 1 was
  // actually reachable this session, never on step 1.
  const showBack = !success && (step === 3 || (step === 2 && hasStep1));

  return (
    <div
      className="zv-sheet-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={tb.bookHeading}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 250,
        background: "rgba(28,28,26,0.42)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        className="zw-modal-in"
        style={{
          width: "min(478px, 100%)",
          maxHeight: "calc(100vh - 40px)",
          background: "var(--c-canvas)",
          boxShadow: "var(--sh-lg)",
          borderRadius: 24,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderBottom: "1px solid rgba(28,28,26,0.07)",
            background: "#fff",
            flexShrink: 0,
          }}
        >
          {showBack && (
            <button
              type="button"
              className="tap"
              onClick={goBack}
              aria-label={t.back}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "1px solid rgba(28,28,26,0.10)",
                background: "#fff",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="back" size={15} color="var(--c-800)" />
            </button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15.5,
                fontWeight: 600,
                color: "var(--c-900)",
                letterSpacing: "-0.015em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {calendar?.businessName ?? tb.bookHeading}
            </div>
            {(calendar?.locationName || !success) && (
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--c-500)",
                  marginTop: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {calendar?.locationName ?? tb.book}
              </div>
            )}
          </div>
          <button
            type="button"
            className="tap"
            onClick={onClose}
            aria-label={tb.close}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: 0,
              background: "var(--c-100)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="x" size={15} color="var(--c-800)" />
          </button>
        </div>

        {success ? (
          <SuccessScreen
            pending={success.pending}
            scheduledAt={success.scheduledAt}
            serviceNames={success.serviceNames}
            businessName={calendar?.businessName ?? tb.bookHeading}
            timeZone={timeZone}
            locale={locale}
            bookingPolicy={payload.bookingPolicy}
            t={t}
            onViewAppointment={() => {
              const href = success.appointmentUuid
                ? localeHref(locale, "appointments", success.appointmentUuid)
                : localeHref(locale, "appointments");
              router.push(href);
              onClose();
            }}
            onClose={onClose}
          />
        ) : (
          <>
            {/* Body */}
            <div
              className="zw-scroll-y"
              style={{ flex: 1, padding: "22px 20px 28px" }}
            >
              <div
                className="zv-tab-in"
                key={step}
                style={{ display: "flex", flexDirection: "column", gap: 18 }}
              >
                <div>
                  <div style={stepPill}>
                    {format(t.stepProgress, {
                      n: String(step),
                      total: "3",
                    })}
                  </div>
                  <div style={stepLabel}>{stepTitle}</div>
                </div>

                {/* STEP 1 — CHOOSE SERVICES (only reachable when the drawer
                    opened with an empty payload.services). */}
                {step === 1 && payload.catalog && (
                  <ServicesStep
                    catalog={payload.catalog}
                    picked={picked}
                    currency={currency}
                    locale={locale}
                    tb={tb}
                    onToggle={togglePicked}
                  />
                )}

                {/* STEP 2 — DATE + TIME + STAFF, all on one scrollable step. */}
                {step === 2 && (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 22 }}
                  >
                    <DateStep
                      calendar={calendar}
                      loading={calLoading}
                      error={calError}
                      locale={locale}
                      timeZone={timeZone}
                      sectionLabel={sectionLabel}
                      t={t}
                      selectedDate={selectedDate}
                      onRetry={() => void loadCalendar()}
                      onPickDate={onPickDate}
                    />
                    {selectedDate && (
                      <SlotStep
                        daySlots={daySlots}
                        loading={slotsLoading}
                        error={slotsError}
                        selectedDate={selectedDate}
                        selectedSlot={selectedSlot}
                        staffPicks={staffPicks}
                        locale={locale}
                        timeZone={timeZone}
                        sectionLabel={sectionLabel}
                        t={t}
                        onRetry={() => {
                          if (selectedDate) void loadSlots(selectedDate);
                        }}
                        onPickSlot={onPickSlot}
                        onPickStaff={onPickStaff}
                      />
                    )}
                  </div>
                )}

                {/* STEP 3 — REVIEW */}
                {step === 3 && selectedSlot && selectedDate && (
                  <ReviewStep
                    slot={selectedSlot}
                    date={selectedDate}
                    staffPicks={staffPicks}
                    daySlots={daySlots}
                    calendar={calendar}
                    bookingPolicy={payload.bookingPolicy}
                    services={services}
                    currency={currency}
                    locale={locale}
                    timeZone={timeZone}
                    totalMinor={totalMinor}
                    totalDuration={totalDuration}
                    submitError={submitError}
                    t={t}
                    tb={tb}
                  />
                )}
              </div>
            </div>

            {/* Footer CTA */}
            <div
              style={{
                padding: "14px 20px calc(14px + env(safe-area-inset-bottom))",
                borderTop: "1px solid rgba(28,28,26,0.07)",
                background: "#fff",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {step === 1 && !canContinueFromServices ? (
                  <div style={{ fontSize: 13, color: "var(--c-500)" }}>
                    {t.selectServicesEmpty}
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        fontSize: 14.5,
                        fontWeight: 700,
                        color: "var(--c-900)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatMoney(totalMinor, currency, locale)}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10.5,
                        color: "var(--c-600)",
                        marginTop: 1,
                      }}
                    >
                      {format(t.serviceCount, {
                        count: String(services.length),
                        duration: formatDuration(totalDuration),
                      })}
                    </div>
                  </>
                )}
              </div>

              {step === 1 && (
                <Button
                  kind="primary"
                  size="lg"
                  disabled={!canContinueFromServices}
                  onClick={onContinueFromServices}
                >
                  {tb.continue}
                  <Icon name="arrowR" size={15} color="#fff" />
                </Button>
              )}

              {step === 2 && (
                <Button
                  kind="primary"
                  size="lg"
                  disabled={!canContinueFromSlot}
                  onClick={() => setStep(3)}
                >
                  {tb.continue}
                  <Icon name="arrowR" size={15} color="#fff" />
                </Button>
              )}

              {step === 3 && (
                <Button
                  kind="accent"
                  size="lg"
                  disabled={submitting}
                  onClick={onConfirm}
                  style={{ opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting
                    ? t.booking
                    : isAuthed
                      ? t.confirmBooking
                      : t.signInToBook}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
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
  locale,
  tb,
  onToggle,
}: {
  catalog: NonNullable<OpenBookingPayload["catalog"]>;
  picked: Array<{ type: "service" | "bundle"; id: number }>;
  currency: string;
  locale: string;
  tb: BusinessDict;
  onToggle: (type: "service" | "bundle", id: number) => void;
}) {
  const isPicked = (type: "service" | "bundle", id: number) =>
    picked.some((x) => x.type === type && x.id === id);

  const groups = useMemo(() => {
    const byCat = new Map<
      number | "uncat",
      { name: string; color: string; items: typeof catalog.services }
    >();
    for (const c of catalog.serviceCategories) {
      byCat.set(c.id, { name: c.name, color: c.color, items: [] });
    }
    for (const s of catalog.services) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog.serviceCategories, catalog.services]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.name && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: 4,
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--c-500)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: g.color,
                }}
              />
              {g.name}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {g.items.map((it) => (
              <ServiceCheckRow
                key={it.id}
                name={it.name}
                duration={it.duration}
                priceAmountMinor={it.priceAmountMinor}
                on={isPicked("service", it.id)}
                onToggle={() => onToggle("service", it.id)}
                currency={currency}
                locale={locale}
              />
            ))}
          </div>
        </div>
      ))}

      {catalog.bundles.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--c-500)",
            }}
          >
            {tb.bundles}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {catalog.bundles.map((b) => (
              <ServiceCheckRow
                key={b.id}
                name={b.name}
                duration={b.duration}
                priceAmountMinor={b.priceAmountMinor}
                on={isPicked("bundle", b.id)}
                onToggle={() => onToggle("bundle", b.id)}
                currency={currency}
                locale={locale}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * One checkbox row for the Step 1 services/bundles picker. Visual style
 * matches docs/web-booking.jsx's ZwBookingDrawer step-1 row: a 22×22
 * rounded-square checkbox that fills with `var(--p-500)` + a check icon when
 * on — distinct from the circular add/remove toggle used on the business
 * detail page's own service list.
 */
function ServiceCheckRow({
  name,
  duration,
  priceAmountMinor,
  on,
  onToggle,
  currency,
  locale,
}: {
  name: string;
  duration: number;
  priceAmountMinor: number;
  on: boolean;
  onToggle: () => void;
  currency: string;
  locale: string;
}) {
  return (
    <button
      type="button"
      className="tap"
      onClick={onToggle}
      aria-pressed={on}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        padding: "13px 12px",
        background: on ? "#fff" : "transparent",
        border: on
          ? "1px solid rgba(28,28,26,0.14)"
          : "1px solid transparent",
        borderRadius: 14,
        boxShadow: on ? "var(--sh-sm)" : "inset 0 -1px 0 rgba(28,28,26,0.05)",
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          flexShrink: 0,
          border: on ? 0 : "1.5px solid rgba(28,28,26,0.25)",
          background: on ? "var(--p-500)" : "transparent",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {on && <Icon name="check" size={13} color="#fff" />}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: 14.5,
            fontWeight: 600,
            color: "var(--c-900)",
          }}
        >
          {name}
        </span>
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            color: "var(--c-600)",
            marginTop: 3,
          }}
        >
          {formatDuration(duration)} ·{" "}
          {formatMoney(priceAmountMinor, currency, locale)}
        </span>
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────
// Step 2 — Date picker (part of the combined date/time/staff step)
// ─────────────────────────────────────────────

function DateStep({
  calendar,
  loading,
  error,
  locale,
  timeZone,
  sectionLabel,
  t,
  selectedDate,
  onRetry,
  onPickDate,
}: {
  calendar: BookingCalendar | null;
  loading: boolean;
  error: boolean;
  locale: string;
  timeZone: string;
  sectionLabel: CSSProperties;
  t: BookingDict;
  selectedDate: string | null;
  onRetry: () => void;
  onPickDate: (date: string) => void;
}) {
  if (loading && !calendar) return <LoadingBlock label={t.loading} />;
  if (error && !calendar)
    return <ErrorBlock label={t.loadError} retry={t.retry} onRetry={onRetry} />;
  if (!calendar) return null;

  const days = calendar.calendar;
  const hasAvailable = days.some((d) => d.status === "available");

  if (!hasAvailable) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p
          className="txt-pretty"
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--c-600)",
          }}
        >
          {t.noAvailability}
        </p>
        {calendar.nextAvailableDate && (
          <button
            type="button"
            className="tap"
            onClick={() => onPickDate(calendar.nextAvailableDate as string)}
            style={{
              alignSelf: "flex-start",
              padding: "11px 18px",
              borderRadius: "var(--r-full)",
              border: "1px solid var(--c-ink)",
              background: "var(--c-ink)",
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {format(t.nextAvailable, {
              date: fmtDateLabel(calendar.nextAvailableDate, locale, timeZone),
            })}
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={sectionLabel}>{t.dateLabel}</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))",
          gap: 8,
        }}
      >
        {days.map((d) => (
          <DayCell
            key={d.date}
            day={d}
            locale={locale}
            timeZone={timeZone}
            t={t}
            selected={d.date === selectedDate}
            onPick={() => onPickDate(d.date)}
          />
        ))}
      </div>
    </div>
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
  const dt = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  const dow = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone,
  }).format(dt);
  const dayNum = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    timeZone,
  }).format(dt);

  return (
    <button
      type="button"
      className="tap"
      disabled={!available}
      onClick={onPick}
      aria-pressed={selected}
      title={!available ? day.reason ?? day.status : undefined}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        padding: "10px 0 9px",
        borderRadius: 14,
        cursor: available ? "pointer" : "default",
        opacity: available ? 1 : 0.35,
        background: selected ? "var(--c-ink)" : "#fff",
        border: selected
          ? "1px solid var(--c-ink)"
          : "1px solid rgba(28,28,26,0.10)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: selected ? "#fff" : "var(--c-500)",
        }}
      >
        {dow}
      </span>
      <span
        style={{
          fontSize: 16,
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
          color: selected ? "#fff" : "var(--c-900)",
        }}
      >
        {dayNum}
      </span>
      {available && day.slotsCount != null && (
        <span
          style={{
            fontSize: 8.5,
            fontWeight: 600,
            color: selected ? "#fff" : "var(--s-success-600)",
            lineHeight: 1,
          }}
        >
          {format(t.slotsCountLabel, { count: String(day.slotsCount) })}
        </span>
      )}
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
  timeZone,
  sectionLabel,
  t,
  onRetry,
  onPickSlot,
  onPickStaff,
}: {
  daySlots: BookingDaySlots | null;
  loading: boolean;
  error: boolean;
  selectedDate: string | null;
  selectedSlot: TimeSlot | null;
  staffPicks: StaffPicks;
  locale: string;
  timeZone: string;
  sectionLabel: CSSProperties;
  t: BookingDict;
  onRetry: () => void;
  onPickSlot: (slot: TimeSlot) => void;
  onPickStaff: (idx: number, staffId: number | null) => void;
}) {
  if (loading && !daySlots) return <LoadingBlock label={t.loading} />;
  if (error && !daySlots)
    return <ErrorBlock label={t.loadError} retry={t.retry} onRetry={onRetry} />;
  if (!daySlots || !selectedDate) return null;

  const slots = daySlots.slots ?? [];
  if (slots.length === 0) {
    return (
      <div
        style={{
          fontSize: 13.5,
          color: "var(--c-600)",
          padding: "14px 2px",
        }}
      >
        {t.fullyBookedDay}
      </div>
    );
  }

  const groups: Record<SlotGroup, TimeSlot[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };
  for (const s of slots) groups[groupForTime(s.startTime)].push(s);

  const groupLabel: Record<SlotGroup, string> = {
    morning: t.morning,
    afternoon: t.afternoon,
    evening: t.evening,
  };

  const isSelected = (s: TimeSlot) =>
    selectedSlot?.startTime === s.startTime &&
    selectedSlot?.endTime === s.endTime;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <div style={sectionLabel}>
          {fmtDateLabel(selectedDate, locale, timeZone)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(Object.keys(groups) as SlotGroup[]).map((g) =>
            groups[g].length > 0 ? (
              <div key={g}>
                <div style={sectionLabel}>{groupLabel[g]}</div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(86px, 1fr))",
                    gap: 8,
                  }}
                >
                  {groups[g].map((s) => {
                    const on = isSelected(s);
                    return (
                      <button
                        key={`${s.startTime}-${s.endTime}`}
                        type="button"
                        className="tap zv-slot"
                        onClick={() => onPickSlot(s)}
                        style={{
                          padding: "10px 0",
                          borderRadius: 11,
                          cursor: "pointer",
                          fontFamily: "var(--font-mono)",
                          fontSize: 12.5,
                          fontWeight: 600,
                          background: on ? "var(--c-ink)" : "#fff",
                          color: on ? "#fff" : "var(--c-900)",
                          border: on
                            ? "1px solid var(--c-ink)"
                            : "1px solid rgba(28,28,26,0.10)",
                        }}
                      >
                        {fmtTimeLabel(
                          selectedDate,
                          s.startTime,
                          locale,
                          timeZone,
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null,
          )}
        </div>
      </div>

      {/* Per-item staff picker (only once a slot is chosen) */}
      {selectedSlot && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {selectedSlot.items.map((item, idx) => (
            <StaffPicker
              key={`${item.type}-${item.serviceId ?? item.bundleId}-${idx}`}
              item={item}
              idx={idx}
              picked={staffPicks[idx]}
              directory={daySlots.staffDirectory}
              showItemLabel={selectedSlot.items.length > 1}
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
  t,
  onPick,
}: {
  item: SlotItem;
  idx: number;
  picked: number | undefined;
  directory: BookingDaySlots["staffDirectory"];
  showItemLabel: boolean;
  t: BookingDict;
  onPick: (idx: number, staffId: number | null) => void;
}) {
  const itemName =
    item.type === "bundle" ? item.bundleName : item.serviceName;
  const isAny = picked == null;
  return (
    <div>
      <div
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: "var(--c-800)",
          marginBottom: 10,
        }}
      >
        {showItemLabel && itemName ? `${t.staffLabel} · ${itemName}` : t.staffLabel}
      </div>
      <div className="zw-scroll-x" style={{ gap: 10, paddingBottom: 4 }}>
        {/* Any available */}
        <button
          type="button"
          className="tap"
          onClick={() => onPick(idx, null)}
          aria-pressed={isAny}
          style={{
            ...staffChip(isAny),
          }}
        >
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: isAny ? "rgba(255,255,255,0.16)" : "var(--c-200)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon
              name="sparkle"
              size={17}
              color={isAny ? "#fff" : "var(--c-700)"}
            />
          </span>
          <span style={staffChipLabel(isAny)}>{t.anyAvailable}</span>
        </button>

        {item.availableStaffIds.map((sid) => {
          const entry = directory[sid];
          const on = picked === sid;
          const name = entry?.name ?? `#${sid}`;
          return (
            <button
              key={sid}
              type="button"
              className="tap"
              onClick={() => onPick(idx, sid)}
              aria-pressed={on}
              style={{ ...staffChip(on) }}
            >
              {entry?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entry.image}
                  alt=""
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <Avatar name={name} size={40} />
              )}
              <span style={staffChipLabel(on)}>{name.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function staffChip(on: boolean): CSSProperties {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 7,
    minWidth: 86,
    flexShrink: 0,
    cursor: "pointer",
    padding: "12px 8px 10px",
    background: on ? "var(--c-ink)" : "#fff",
    border: on ? "1px solid var(--c-ink)" : "1px solid rgba(28,28,26,0.10)",
    borderRadius: 16,
  };
}
function staffChipLabel(on: boolean): CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 600,
    textAlign: "center",
    lineHeight: 1.25,
    color: on ? "#fff" : "var(--c-800)",
    maxWidth: 84,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };
}

// ─────────────────────────────────────────────
// Step 3 — Review & confirm
// ─────────────────────────────────────────────
function ReviewStep({
  slot,
  date,
  staffPicks,
  daySlots,
  calendar,
  bookingPolicy,
  services,
  currency,
  locale,
  timeZone,
  totalMinor,
  totalDuration,
  submitError,
  t,
  tb,
}: {
  slot: TimeSlot;
  date: string;
  staffPicks: StaffPicks;
  daySlots: BookingDaySlots | null;
  calendar: BookingCalendar | null;
  bookingPolicy: BookingPolicy | null;
  services: OpenBookingPayload["services"];
  currency: string;
  locale: string;
  timeZone: string;
  totalMinor: number;
  totalDuration: number;
  submitError: string | null;
  t: BookingDict;
  tb: ReturnType<typeof useTranslation>["dict"]["business"];
}) {
  // Concrete free-cancellation/reschedule deadline(s) = scheduled instant
  // minus the real policy window(s) — never a fabricated fallback window.
  const scheduledMs = new Date(
    zonedWallTimeToUtcISO(date, slot.startTime, timeZone),
  ).getTime();
  const policyLines = cancellationRescheduleLines(
    bookingPolicy,
    scheduledMs,
    locale,
    timeZone,
    t,
  );

  const staffNames = slot.items
    .map((item, idx) => {
      const sid = staffPicks[idx];
      if (sid == null) return null;
      return daySlots?.staffDirectory[sid]?.name ?? null;
    })
    .filter((n): n is string => !!n);

  const card: CSSProperties = {
    background: "#fff",
    border: "1px solid rgba(28,28,26,0.08)",
    borderRadius: 18,
    boxShadow: "var(--sh-sm)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Itemized summary */}
      <div
        style={{
          ...card,
          padding: "18px 18px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 13,
        }}
      >
        {slot.items.map((item, idx) => {
          const name =
            (item.type === "bundle" ? item.bundleName : item.serviceName) ??
            services[idx]?.name ??
            "";
          return (
            <div
              key={`${item.type}-${item.serviceId ?? item.bundleId}-${idx}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14.5,
                    fontWeight: 600,
                    color: "var(--c-900)",
                  }}
                >
                  {name}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    color: "var(--c-600)",
                    marginTop: 2,
                  }}
                >
                  {formatDuration(item.durationMinutes)}
                </div>
              </div>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--c-900)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatMoney(item.priceAmountMinor, currency, locale)}
              </span>
            </div>
          );
        })}
        <div
          style={{
            borderTop: "1px solid rgba(28,28,26,0.07)",
            paddingTop: 13,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span
            style={{ fontSize: 13.5, fontWeight: 700, color: "var(--c-700)" }}
          >
            <span style={{ textTransform: "capitalize" }}>{tb.totalLabel}</span>{" "}
            · {formatDuration(totalDuration)}
          </span>
          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--c-900)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatMoney(totalMinor, currency, locale)}
          </span>
        </div>
      </div>

      {/* Date / time / staff / location */}
      <div
        style={{
          ...card,
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 11,
        }}
      >
        <Row icon="cal">
          <span style={{ fontWeight: 700 }}>
            {fmtDateLabel(date, locale, timeZone)} ·{" "}
            {fmtTimeLabel(date, slot.startTime, locale, timeZone)}
          </span>
        </Row>
        <Row icon="user">
          {staffNames.length > 0 ? staffNames.join(", ") : t.anyAvailable}
        </Row>
        <Row icon="pin">
          {(calendar?.businessName ?? tb.bookHeading) +
            (calendar?.locationName ? ` · ${calendar.locationName}` : "")}
        </Row>
      </div>

      {/* Trust card */}
      <div style={{ ...card, padding: "4px 18px" }}>
        {policyLines.map((line, i) => (
          <TrustRow
            key={i}
            icon="shield"
            title={i === 0 ? t.freeCancellationTitle : t.rescheduleTitle}
            sub={line}
            first={i === 0}
          />
        ))}
        <TrustRow
          icon="wallet"
          title={t.payAtVenueTitle}
          sub={format(t.payAtVenueNote, {
            business: calendar?.businessName ?? tb.bookHeading,
          })}
        />
      </div>

      {submitError && (
        <p
          role="alert"
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.4,
            color: "var(--s-error-600)",
          }}
        >
          {submitError}
        </p>
      )}
    </div>
  );
}

function Row({
  icon,
  children,
}: {
  icon: "cal" | "user" | "pin";
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Icon name={icon} size={16} color="var(--p-600)" />
      <span style={{ fontSize: 14, color: "var(--c-800)", minWidth: 0 }}>
        {children}
      </span>
    </div>
  );
}

function TrustRow({
  icon,
  title,
  sub,
  first,
}: {
  icon: "shield" | "wallet";
  title: string;
  sub: string;
  first?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 0",
        borderTop: first ? 0 : "1px solid rgba(28,28,26,0.06)",
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "var(--s-success-100)",
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={14} color="var(--s-success-600)" />
      </span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--c-900)",
            letterSpacing: "-0.005em",
          }}
        >
          {title}
        </div>
        <div
          className="txt-pretty"
          style={{
            fontSize: 12,
            lineHeight: 1.35,
            color: "var(--c-600)",
            marginTop: 1,
          }}
        >
          {sub}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Success screen
// ─────────────────────────────────────────────
function SuccessScreen({
  pending,
  scheduledAt,
  serviceNames,
  businessName,
  timeZone,
  locale,
  bookingPolicy,
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
  bookingPolicy: BookingPolicy | null;
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

  // Concrete free-cancellation/reschedule deadline(s), derived only from the
  // real BookingPolicy — never a fabricated fallback window.
  const policyLines = cancellationRescheduleLines(
    bookingPolicy,
    new Date(scheduledAt).getTime(),
    locale,
    timeZone,
    t,
  );

  return (
    <div
      className="zv-tab-in"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "32px 28px",
      }}
    >
      <div
        className="zv-ring-pulse"
        style={{
          width: 86,
          height: 86,
          borderRadius: "50%",
          background: "var(--p-500)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow:
            "0 1px 2px rgba(201,74,42,0.06), 0 14px 36px rgba(201,74,42,0.16)",
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            fill="none"
            stroke="#fff"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="24"
            strokeDashoffset="24"
            style={{
              animation: "zv-draw-check .5s .25s var(--ease-out) forwards",
            }}
          />
        </svg>
      </div>
      <h2
        style={{
          margin: "26px 0 0",
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          color: "var(--c-900)",
        }}
      >
        {pending ? t.pendingTitle : t.successTitle}
      </h2>
      <p
        className="txt-pretty"
        style={{
          margin: "10px 0 0",
          fontSize: 14.5,
          lineHeight: 1.55,
          color: "var(--c-600)",
          maxWidth: 320,
        }}
      >
        {format(pending ? t.pendingBody : t.successBody, {
          services: serviceNames.join(" + "),
          business: businessName,
        })}
      </p>
      <div
        style={{
          marginTop: 22,
          background: "var(--c-50)",
          border: "1px solid rgba(28,28,26,0.08)",
          borderRadius: 16,
          padding: "16px 22px",
          minWidth: 260,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--c-900)",
          }}
        >
          {when}
        </div>
      </div>
      {policyLines.length > 0 && (
        <div
          style={{
            marginTop: 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontSize: 12.5,
            color: "var(--c-500)",
            textAlign: "center",
          }}
        >
          <Icon name="shield" size={13} color="var(--s-success-600)" />
          {policyLines.join(" ")}
        </div>
      )}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 28,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <Button kind="primary" size="md" onClick={onViewAppointment}>
          {t.viewAppointment}
        </Button>
        <Button kind="secondary" size="md" onClick={onClose}>
          {t.close}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Shared small blocks
// ─────────────────────────────────────────────
function LoadingBlock({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "40px 0",
        color: "var(--c-600)",
        fontSize: 13.5,
      }}
    >
      <Spinner size={22} />
      {label}
    </div>
  );
}

function ErrorBlock({
  label,
  retry,
  onRetry,
}: {
  label: string;
  retry: string;
  onRetry: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        padding: "32px 0",
        textAlign: "center",
      }}
    >
      <p
        className="txt-pretty"
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.5,
          color: "var(--c-600)",
          maxWidth: 280,
        }}
      >
        {label}
      </p>
      <Button kind="secondary" size="md" onClick={onRetry}>
        {retry}
      </Button>
    </div>
  );
}
