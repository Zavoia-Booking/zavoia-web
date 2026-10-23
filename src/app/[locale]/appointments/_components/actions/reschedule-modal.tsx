"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Button, Icon, Skeleton, useToast } from "@/components/ui";
import { InlineError } from "@/components/ui/inline-error";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/format";
import { ApiError } from "@/lib/api/http";
import {
  getRescheduleCalendar,
  getRescheduleSlots,
  rescheduleAppointment,
} from "@/lib/api/marketplace/appointments";
import type {
  AppointmentDetail,
  BookingCalendar,
  BookingCalendarDay,
  BookingDaySlots,
  TimeSlot,
} from "@/lib/api/marketplace/types";
import { todayInTz, zonedWallTimeToUtcISO } from "@/lib/booking";
import { ActionModal, ApptMini } from "./action-modal";
import { apptMiniProps, type AppointmentChange } from "./shared";
import styles from "./action-fields.module.css";
import { useAppointmentClock } from "../use-appointment-clock";

const CAL_DAYS_TO_CHECK = 30;

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

type SlotGroup = "morning" | "afternoon" | "evening";

function groupForTime(start: string): SlotGroup {
  const h = Number(start.split(":")[0]);
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

/** Localized "Mon, Jan 5"-style label, anchored at noon UTC to avoid drift. */
function fmtDateLabel(date: string, locale: string): string {
  const [y, mo, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(dt);
}

/** Localized time label for an HH:mm wall-clock value in the location tz. */
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

/** Combined "Mon, Jan 5 · 2:30 PM" descriptor for the footer / current note. */
function fmtWhen(date: string, time: string, locale: string, timeZone: string) {
  return `${fmtDateLabel(date, locale)} · ${fmtTimeLabel(date, time, locale, timeZone)}`;
}

/** Localized "Mon, Jan 5 · 2:30 PM" for an absolute ISO instant. */
function fmtIsoWhen(iso: string, locale: string, timeZone: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

/**
 * Turn a namespaced backend error code into copy the customer can act on.
 * Anything unrecognised falls back to the generic retry line — a wrong specific
 * message is worse than an honest vague one.
 */
function rescheduleErrorMessage(
  code: string | undefined,
  t: Dictionary["appointmentActions"]["reschedule"],
  bookingErrors: Dictionary["booking"]["errors"],
): string {
  switch (code) {
    // The notice window lapsed — most likely while this modal sat open.
    case "APPOINTMENTS.E12":
      return t.windowPassed;
    case "APPOINTMENTS.E08":
      return t.notAllowed;
    case "APPOINTMENTS.E09":
      return t.alreadyStarted;
    case "APPOINTMENTS.E10":
      return t.noLongerReschedulable;
    case "MARKETPLACE_BOOKING.E08":
      return bookingErrors.tooSoon;
    case "MARKETPLACE_BOOKING.E09":
      return bookingErrors.tooFar;
    case "MARKETPLACE_BOOKING.E11":
      return bookingErrors.outsideHours;
    default:
      return t.error;
  }
}

/**
 * Availability enforces the same eligibility rules as the final submit, so an
 * APPOINTMENTS.* refusal (window passed, reschedule disabled…) shows its real
 * reason instead of a retry prompt that can never succeed.
 */
function availabilityErrorLabel(
  e: unknown,
  t: Dictionary["appointmentActions"]["reschedule"],
  tb: Dictionary["booking"],
): string {
  const code = e instanceof ApiError ? e.code : undefined;
  return code?.startsWith("APPOINTMENTS.")
    ? rescheduleErrorMessage(code, t, tb.errors)
    : tb.loadError;
}

/**
 * Reschedule modal. Ports `ZwRescheduleModal`
 * (web-appointment-actions.jsx:170-227), using authenticated reschedule
 * availability and BookingDrawer's date-strip → grouped-slot UX.
 *
 * Availability uses the owned appointment's saved staff and duration. Catalog
 * identities may have changed since booking and are not required by the API.
 */
type RescheduleModalProps = {
  appointment: AppointmentDetail;
  onClose: () => void;
  onChanged?: (change?: AppointmentChange) => void | Promise<void>;
};

export function RescheduleModal(props: RescheduleModalProps) {
  return <RescheduleSession key={props.appointment.uuid} {...props} />;
}

function RescheduleSession({
  appointment,
  onClose,
  onChanged,
}: RescheduleModalProps) {
  const { dict, locale } = useTranslation();
  const t = dict.appointmentActions.reschedule;
  const tb = dict.booking;
  const toast = useToast();
  const now = useAppointmentClock();

  const mini = apptMiniProps(appointment, dict.common.photo);

  const supported = !!appointment.uuid;

  // ── Flow state ──
  const [calendar, setCalendar] = useState<BookingCalendar | null>(null);
  const [calLoading, setCalLoading] = useState(true);
  // Error copy for the date/slot sections; null = no error.
  const [calError, setCalError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [daySlots, setDaySlots] = useState<BookingDaySlots | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const calendarRequestId = useRef(0);
  const slotsRequestId = useRef(0);

  useEffect(() => () => {
    calendarRequestId.current += 1;
    slotsRequestId.current += 1;
  }, []);

  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const closingRef = useRef(false);
  const handleClosing = useCallback(() => { closingRef.current = true; }, []);

  // Slot times are wall-clock in the LOCATION's zone (business is only its
  // fallback). The calendar response is authoritative once loaded; before
  // that, the detail payload's resolved zone picks the calendar's start date.
  // Kept separate so the calendar's arrival doesn't refire the request.
  const requestTimeZone =
    appointment.location?.timezone ??
    appointment.business?.timezone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone ??
    "UTC";
  const timeZone = calendar?.timezone ?? requestTimeZone;
  const [rangeStart, setRangeStart] = useState(() => todayInTz(requestTimeZone));
  const rangeEnd = addDays(rangeStart, CAL_DAYS_TO_CHECK - 1);
  const nextRangeStart = addDays(rangeStart, CAL_DAYS_TO_CHECK);
  const maxAdvance = calendar?.bookingSettings.maxAdvanceBookingMinutes;
  const lastBookableDate = maxAdvance == null ? null : new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone,
  }).format(new Date(now.getTime() + maxAdvance * 60_000));

  const currentNote = format(dict.appointmentPage.currentAppointment, {
    when: fmtIsoWhen(appointment.scheduled_at, locale, timeZone),
  });

  // ── Step 1: fetch calendar. ──
  const loadCalendar = useCallback(async (retry = false) => {
    if (!supported) {
      return;
    }
    const requestId = ++calendarRequestId.current;
    setCalLoading(true);
    if (!retry) setCalError(null);
    try {
      const res = await getRescheduleCalendar({
        uuid: appointment.uuid,
        startDate: rangeStart,
        daysToCheck: CAL_DAYS_TO_CHECK,
      });
      if (requestId !== calendarRequestId.current) return;
      setCalendar(res);
      setCalError(null);
    } catch (e) {
      if (requestId !== calendarRequestId.current) return;
      setCalError(availabilityErrorLabel(e, t, tb));
    } finally {
      if (requestId === calendarRequestId.current) setCalLoading(false);
    }
  }, [supported, rangeStart, appointment.uuid, t, tb]);

  // ── Step 2: fetch slots for a chosen date. ──
  const loadSlots = useCallback(
    async (date: string, retry = false) => {
      if (!supported) {
        return;
      }
      const requestId = ++slotsRequestId.current;
      setSlotsLoading(true);
      if (!retry) setSlotsError(null);
      setSelectedSlot(null);
      try {
        const res = await getRescheduleSlots({
          uuid: appointment.uuid,
          date,
        });
        if (requestId !== slotsRequestId.current) return;
        setDaySlots(res);
        setSlotsError(null);
      } catch (e) {
        if (requestId !== slotsRequestId.current) return;
        setSlotsError(availabilityErrorLabel(e, t, tb));
      } finally {
        if (requestId === slotsRequestId.current) setSlotsLoading(false);
      }
    },
    [supported, appointment.uuid, t, tb],
  );

  // ── On mount: fetch the calendar (microtask, matching the codebase idiom). ──
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      void loadCalendar();
    });
    return () => {
      cancelled = true;
    };
  }, [supported, loadCalendar]);

  const onPickDate = (date: string) => {
    if (submitting || calLoading) return;
    setSelectedDate(date);
    setSubmitError(null);
    void loadSlots(date);
  };

  const changeRange = (days: number) => {
    if (calLoading || submitting) return;
    ++calendarRequestId.current;
    ++slotsRequestId.current;
    setSelectedDate(null);
    setSelectedSlot(null);
    setDaySlots(null);
    setSlotsLoading(false);
    setSlotsError(null);
    setSubmitError(null);
    setCalError(null);
    setCalendar(null);
    setCalLoading(true);
    setRangeStart(addDays(rangeStart, days));
  };

  const ready = !!selectedSlot && !!selectedDate && !slotsLoading && !slotsError && daySlots?.date === selectedDate;

  const confirm = async () => {
    if (!ready || inFlightRef.current || closingRef.current || !selectedDate || !selectedSlot) return;
    inFlightRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const newScheduledAt = zonedWallTimeToUtcISO(
        selectedDate,
        selectedSlot.startTime,
        timeZone,
      );
      const result = await rescheduleAppointment({
        uuid: appointment.uuid,
        newScheduledAt,
      });
      toast(
        format(t.successToast, {
          when: fmtWhen(selectedDate, selectedSlot.startTime, locale, timeZone),
        }),
        "cal",
      );
      onClose();
      void onChanged?.({ status: result.status, scheduled_at: result.scheduledAt, ends_at: result.endsAt });
    } catch (e) {
      // Codes arrive NAMESPACED ("APPOINTMENTS.E12"), and the two namespaces
      // collide on bare suffixes — APPOINTMENTS.E08 is "reschedule disabled"
      // while MARKETPLACE_BOOKING.E08 is "too soon". Always match in full.
      const code = e instanceof ApiError ? e.code : undefined;
      // Slot just taken / blocked out → refetch the day's slots so the grid is honest.
      if (
        (code === "MARKETPLACE_BOOKING.E10" || code === "MARKETPLACE_BOOKING.E14") &&
        selectedDate
      ) {
        setSubmitError(tb.errors.slotConflict);
        setSelectedSlot(null);
        void loadSlots(selectedDate);
      } else {
        setSubmitError(rescheduleErrorMessage(code, t, tb.errors));
      }
      setSubmitting(false);
      inFlightRef.current = false;
    }
  };

  // ── Footer ──
  const footer = (
    <>
      <div style={{ flex: 1, minWidth: 0 }}>
        {ready && selectedDate && selectedSlot ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--c-900)" }}>
              {fmtWhen(selectedDate, selectedSlot.startTime, locale, timeZone)}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                color: "var(--c-600)",
                marginTop: 1,
              }}
            >
              {t.newTimeLabel}
            </div>
          </>
        ) : (
          <span style={{ fontSize: 13, color: "var(--c-600)" }}>
            {t.pickSlot}
          </span>
        )}
      </div>
      <Button
        kind="primary"
        size="lg"
        loading={submitting}
        disabled={!ready || submitting}
        onClick={() => void confirm()}
      >
        {t.confirm}
      </Button>
    </>
  );

  return (
    <ActionModal
      title={t.title}
      subtitle={format(t.sub, { business: mini.business })}
      onClose={onClose}
      width={520}
      dismissible={!submitting}
      onClosing={handleClosing}
      footer={supported ? footer : undefined}
    >
      <ApptMini {...mini} />

      {!supported ? (
        // Missing item identity cannot be recovered by retrying availability.
        <p
          className="txt-pretty"
          style={{
            margin: "18px 0 0",
            fontSize: 14,
            lineHeight: 1.55,
            color: "var(--c-600)",
          }}
        >
          {t.unsupported}
        </p>
      ) : (
        <>
          {/* Current-time pill */}
          <div
            style={{
              marginTop: 16,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12.5,
              color: "var(--c-600)",
              background: "var(--c-50)",
              border: "1px solid rgba(28,28,26,0.07)",
              borderRadius: 999,
              padding: "7px 13px",
            }}
          >
            <Icon name="clock" size={13} color="var(--c-500)" />
            {currentNote}
          </div>

          {/* Date section */}
          <div style={{ marginTop: 22 }}>
            <div style={dateSectionLabel}>{t.dateLabel}</div>
            <div className={styles.calendarNavigation}>
              <Button kind="secondary" size="sm" aria-label={dict.appointmentPage.previousDates}
                disabled={submitting || calLoading || rangeStart <= todayInTz(timeZone)}
                onClick={() => changeRange(-CAL_DAYS_TO_CHECK)} style={{ minHeight: 44 }}>
                <Icon name="back" size={16} />
              </Button>
              <span className={styles.calendarRange} aria-live="polite">
                {format(dict.appointmentPage.dateRange, {
                  from: fmtDateLabel(rangeStart, locale),
                  to: fmtDateLabel(rangeEnd, locale),
                })}
              </span>
              <Button kind="secondary" size="sm" aria-label={dict.appointmentPage.nextDates}
                disabled={submitting || calLoading || (lastBookableDate != null && nextRangeStart > lastBookableDate)}
                onClick={() => changeRange(CAL_DAYS_TO_CHECK)} style={{ minHeight: 44 }}>
                <Icon name="chevR" size={16} />
              </Button>
            </div>
            {calError && !calendar ? (
              <ErrorBlock
                label={calError}
                retry={tb.retry}
                onRetry={() => void loadCalendar(true)}
                loading={calLoading}
              />
            ) : calLoading && !calendar ? (
              <LoadingBlock label={tb.loading} kind="dates" />
            ) : calendar ? (
              <DateGrid
                days={calendar.calendar}
                selectedDate={selectedDate}
                locale={locale}
                noAvailability={tb.noAvailability}
                onPick={onPickDate}
                disabled={submitting}
              />
            ) : null}
          </div>

          {/* Slot section */}
          {selectedDate && (
            <div style={{ marginTop: 20 }}>
              <div style={dateSectionLabel}>
                {fmtDateLabel(selectedDate, locale)}
              </div>
              {slotsError ? (
                <ErrorBlock
                  label={slotsError}
                  retry={tb.retry}
                  onRetry={() => void loadSlots(selectedDate, true)}
                  loading={slotsLoading}
                />
              ) : slotsLoading ? (
                <LoadingBlock label={tb.loading} kind="slots" />
              ) : (
                <SlotGrid
                  daySlots={daySlots?.date === selectedDate ? daySlots : null}
                  selectedDate={selectedDate}
                  selectedSlot={selectedSlot}
                  locale={locale}
                  timeZone={timeZone}
                  fullyBooked={tb.fullyBookedDay}
                  labels={{
                    morning: tb.morning,
                    afternoon: tb.afternoon,
                    evening: tb.evening,
                  }}
                  disabled={submitting}
                  onPick={(slot) => {
                    if (!slotsLoading && !slotsError && daySlots?.date === selectedDate) setSelectedSlot(slot);
                  }}
                />
              )}
            </div>
          )}

          {submitError && (
            <InlineError style={{ margin: "16px 0 0" }}>
              {submitError}
            </InlineError>
          )}
        </>
      )}
    </ActionModal>
  );
}

// ─────────────────────────────────────────────
// Date grid (selectable days)
// ─────────────────────────────────────────────
function DateGrid({
  days,
  selectedDate,
  locale,
  noAvailability,
  onPick,
  disabled,
}: {
  days: BookingCalendarDay[];
  selectedDate: string | null;
  locale: string;
  noAvailability: string;
  onPick: (date: string) => void;
  disabled: boolean;
}) {
  const hasAvailable = days.some((d) => d.status === "available");
  if (!hasAvailable) {
    return (
      <p
        className="txt-pretty"
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.6,
          color: "var(--c-600)",
        }}
      >
        {noAvailability}
      </p>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))",
        gap: 8,
      }}
    >
      {days.map((d) => {
        const available = d.status === "available";
        const on = selectedDate === d.date;
        const [y, mo, dd] = d.date.split("-").map(Number);
        const dt = new Date(Date.UTC(y, mo - 1, dd, 12, 0, 0));
        const dow = new Intl.DateTimeFormat(locale, {
          weekday: "short",
          timeZone: "UTC",
        }).format(dt);
        const dayNum = new Intl.DateTimeFormat(locale, {
          day: "numeric",
          timeZone: "UTC",
        }).format(dt);
        return (
          <button
            key={d.date}
            type="button"
            className="tap"
            disabled={disabled || !available}
            aria-pressed={on}
            aria-label={fmtDateLabel(d.date, locale)}
            onClick={() => onPick(d.date)}
            title={!available ? d.reason ?? d.status : undefined}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "10px 0 9px",
              height: 62,
              borderRadius: 14,
              cursor: available ? "pointer" : "default",
              opacity: available ? 1 : 0.35,
              background: on ? "var(--c-ink)" : "#fff",
              border: on
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
                color: on ? "rgba(255,255,255,0.85)" : "var(--c-600)",
              }}
            >
              {dow}
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                color: on ? "#fff" : "var(--c-900)",
              }}
            >
              {dayNum}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Slot grid (grouped morning / afternoon / evening)
// ─────────────────────────────────────────────
function SlotGrid({
  daySlots,
  selectedDate,
  selectedSlot,
  locale,
  timeZone,
  fullyBooked,
  labels,
  onPick,
  disabled,
}: {
  daySlots: BookingDaySlots | null;
  selectedDate: string;
  selectedSlot: TimeSlot | null;
  locale: string;
  timeZone: string;
  fullyBooked: string;
  labels: Record<SlotGroup, string>;
  onPick: (slot: TimeSlot) => void;
  disabled: boolean;
}) {
  if (!daySlots) return null;
  const slots = daySlots.slots ?? [];
  if (slots.length === 0) {
    return (
      <div style={{ fontSize: 13.5, color: "var(--c-600)", padding: "14px 2px" }}>
        {fullyBooked}
      </div>
    );
  }

  const groups: Record<SlotGroup, TimeSlot[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };
  for (const s of slots) groups[groupForTime(s.startTime)].push(s);

  const isSelected = (s: TimeSlot) =>
    selectedSlot?.startTime === s.startTime &&
    selectedSlot?.endTime === s.endTime;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {(Object.keys(groups) as SlotGroup[]).map((g) =>
        groups[g].length > 0 ? (
          <div key={g}>
            <div style={dateSectionLabel}>{labels[g]}</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(86px, 1fr))",
                gap: 8,
              }}
            >
              {groups[g].map((s) => {
                const on = isSelected(s);
                return (
                  <button
                    key={`${s.startTime}-${s.endTime}`}
                    type="button"
                    disabled={disabled}
                    aria-pressed={on}
                    className="tap zv-slot"
                    onClick={() => onPick(s)}
                    style={{
                      padding: "10px 0",
                      height: 44,
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
                    {fmtTimeLabel(selectedDate, s.startTime, locale, timeZone)}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null,
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Shared small blocks
// ─────────────────────────────────────────────
function LoadingBlock({ label, kind }: { label: string; kind: "dates" | "slots" }) {
  return (
    <div aria-busy="true">
      <div aria-hidden="true">
        {kind === "slots" && <Skeleton w={64} h={20.25} r={4} style={{ marginBottom: 10 }} />}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fill, minmax(${kind === "dates" ? 64 : 86}px, 1fr))`,
            gap: 8,
          }}
        >
          {Array.from({ length: kind === "dates" ? CAL_DAYS_TO_CHECK : 8 }, (_, index) => (
            <Skeleton key={index} h={kind === "dates" ? 62 : 44} r={kind === "dates" ? 14 : 11} />
          ))}
        </div>
      </div>
      <p role="status" className="sr-only">{label}</p>
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        padding: "28px 0",
        textAlign: "center",
      }}
    >
      <InlineError
        className="txt-pretty"
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.5,
          maxWidth: 280,
        }}
      >
        {label}
      </InlineError>
      <Button kind="secondary" size="md" onClick={onRetry} loading={loading}>
        {retry}
      </Button>
    </div>
  );
}

const dateSectionLabel: CSSProperties = {
  fontSize: 13.5,
  fontWeight: 600,
  color: "var(--c-800)",
  marginBottom: 10,
};
