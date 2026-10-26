"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Avatar, Button, Icon, Img, Skeleton, useToast } from "@/components/ui";
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
import { ActionModal } from "./action-modal";
import { apptMiniProps, staffDisplayName, type AppointmentChange } from "./shared";
import styles from "./reschedule-modal.module.css";
import { useAppointmentClock } from "../use-appointment-clock";
import { apptTime } from "../vm";

const CAL_DAYS_TO_CHECK = 30;
const VISIBLE_DAYS = 7;
const LAST_DATE_PAGE = Math.floor((CAL_DAYS_TO_CHECK - 1) / VISIBLE_DAYS) * VISIBLE_DAYS;

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
  return apptTime(iso, locale, timeZone);
}

/** Combined date and 24-hour time for the footer / current note. */
function fmtWhen(date: string, time: string, locale: string, timeZone: string) {
  return `${fmtDateLabel(date, locale)} · ${fmtTimeLabel(date, time, locale, timeZone)}`;
}

/** Localized date and 24-hour time for an absolute ISO instant. */
function fmtIsoWhen(iso: string, locale: string, timeZone: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
  }).format(new Date(iso)) + ` · ${apptTime(iso, locale, timeZone)}`;
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
  businessName: string,
): string {
  switch (code) {
    // The notice window lapsed — most likely while this modal sat open.
    case "APPOINTMENTS.E12":
      return format(t.windowPassed, { businessName });
    case "APPOINTMENTS.E08":
      return format(t.notAllowed, { businessName });
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
  businessName: string,
): string {
  const code = e instanceof ApiError ? e.code : undefined;
  return code?.startsWith("APPOINTMENTS.")
    ? rescheduleErrorMessage(code, t, tb.errors, businessName)
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
  const businessName = appointment.business?.name?.trim()
    || appointment.location?.name?.trim()
    || dict.appointmentPage.contactBusinessFallback;

  const supported = !!appointment.uuid;

  // ── Flow state ──
  const [calendar, setCalendar] = useState<BookingCalendar | null>(null);
  const [calLoading, setCalLoading] = useState(true);
  // Failed availability stays unavailable until its explicit retry succeeds.
  // Request feedback is announced once per failed request in the toast.
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
  // Presentation pages stay inside the server's authoritative 30-day window.
  const [datePage, setDatePage] = useState(0);
  const [weekDirection, setWeekDirection] = useState<-1 | 1 | null>(null);
  const timeAreaRef = useRef<HTMLDivElement>(null);
  const visibleStart = addDays(rangeStart, datePage);
  const visibleEnd = addDays(rangeStart, Math.min(datePage + VISIBLE_DAYS - 1, CAL_DAYS_TO_CHECK - 1));
  const nextVisibleStart = addDays(rangeStart, Math.min(datePage + VISIBLE_DAYS, CAL_DAYS_TO_CHECK));
  const visibleDays = calendar?.calendar.filter((day) => day.date >= visibleStart && day.date <= visibleEnd) ?? [];
  const maxAdvance = calendar?.bookingSettings.maxAdvanceBookingMinutes;
  const lastBookableDate = maxAdvance == null ? null : new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone,
  }).format(new Date(now.getTime() + maxAdvance * 60_000));

  const currentNote = format(dict.appointmentPage.currentAppointment, {
    when: fmtIsoWhen(appointment.scheduled_at, locale, timeZone),
  });
  const places = [mini.business, appointment.location?.name]
    .filter((name, index, values) => name && values.indexOf(name) === index);
  const professionals = (appointment.staff_users ?? []).flatMap((member) => {
    const name = staffDisplayName(member);
    return name ? [{ ...member, name }] : [];
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
      const message = availabilityErrorLabel(e, t, tb, businessName);
      setCalError(message);
      if (!closingRef.current) {
        toast(message, "warn", undefined, "error");
      }
    } finally {
      if (requestId === calendarRequestId.current) setCalLoading(false);
    }
  }, [supported, rangeStart, appointment.uuid, t, tb, businessName, toast]);

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
        const message = availabilityErrorLabel(e, t, tb, businessName);
        setSlotsError(message);
        if (!closingRef.current) {
          toast(message, "warn", undefined, "error");
        }
      } finally {
        if (requestId === slotsRequestId.current) setSlotsLoading(false);
      }
    },
    [supported, appointment.uuid, t, tb, businessName, toast],
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
    void loadSlots(date);
  };

  const clearDateSelection = () => {
    ++slotsRequestId.current;
    setSelectedDate(null);
    setSelectedSlot(null);
    setDaySlots(null);
    setSlotsLoading(false);
    setSlotsError(null);
  };

  const changeRange = (days: number) => {
    if (calLoading || submitting) return;
    ++calendarRequestId.current;
    clearDateSelection();
    setCalError(null);
    setCalendar(null);
    setCalLoading(true);
    setRangeStart(addDays(rangeStart, days));
    setDatePage(days < 0 ? LAST_DATE_PAGE : 0);
  };

  const changeDatePage = (direction: -1 | 1) => {
    if (calLoading || submitting) return;
    // Reserve the visible space before clearing slots so the body retains its
    // scroll position while the next week renders.
    const timeArea = timeAreaRef.current;
    const body = timeArea?.closest<HTMLElement>(".zw-scroll-y");
    if (timeArea && body) {
      const minHeight = Math.max(0,
        body.getBoundingClientRect().bottom - timeArea.getBoundingClientRect().top,
      );
      timeArea.style.minHeight = `${minHeight}px`;
    }
    setWeekDirection(direction);
    const nextPage = datePage + direction * VISIBLE_DAYS;
    if (nextPage < 0 || nextPage >= CAL_DAYS_TO_CHECK) {
      changeRange(direction * CAL_DAYS_TO_CHECK);
      return;
    }
    clearDateSelection();
    setDatePage(nextPage);
  };

  const ready = !!selectedSlot && !!selectedDate && !slotsLoading && !slotsError && daySlots?.date === selectedDate;
  const weekContentKey = `${visibleStart}:${!calendar ? calError ? "error" : "loading" : "dates"}`;

  const confirm = async () => {
    if (!ready || inFlightRef.current || closingRef.current || !selectedDate || !selectedSlot) return;
    inFlightRef.current = true;
    setSubmitting(true);
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
        toast(tb.errors.slotConflict, "warn", undefined, "error");
        setSelectedSlot(null);
        void loadSlots(selectedDate);
      } else {
        toast(rescheduleErrorMessage(code, t, tb.errors, businessName), "warn", undefined, "error");
      }
      setSubmitting(false);
      inFlightRef.current = false;
    }
  };

  // ── Footer ──
  const footer = (
    <div className={styles.footer}>
      <div className={styles.selection} role="status" aria-live="polite" aria-atomic="true">
        {ready && selectedDate && selectedSlot ? (
          <>
            <span className={styles.selectionLabel}>{t.newTimeLabel}</span>
            <span className={styles.selectionValue}>
              {fmtWhen(selectedDate, selectedSlot.startTime, locale, timeZone)}
            </span>
          </>
        ) : (
          <span className={styles.selectionHint}>{t.pickSlot}</span>
        )}
      </div>
      <Button
        kind="accent"
        size="lg"
        className={styles.confirm}
        style={{ border: "none", color: "var(--c-50)" }}
        loading={submitting}
        disabled={!ready || submitting}
        onClick={() => void confirm()}
      >
        {t.confirm}
      </Button>
    </div>
  );

  return (
    <ActionModal
      title={t.title}
      onClose={onClose}
      width={540}
      className={styles.modal}
      dismissible={!submitting}
      onClosing={handleClosing}
      footer={supported ? footer : undefined}
    >
      <div className={styles.booking}>
        <Img src={mini.photo ?? undefined} alt="" className={styles.photo}
          label={<Icon name="pin" size={24} color="var(--c-600)" />} />
        <div className={styles.summary}>
          <h2>{mini.serviceLine}</h2>
          {appointment.additionalItemsCount > 0 && <p className={styles.more}>
            {format(dict.appointmentPage.moreItems, { n: String(appointment.additionalItemsCount) })}
          </p>}
          {places.map((name, index) => <p className={index === 0 ? styles.business : undefined} key={name}>{name}</p>)}
        </div>
      </div>

      {professionals.length > 0 && (
        <ul className={styles.professionals} aria-label={dict.appointmentDetail.sections.with}>
          {professionals.map((member) => (
            <li key={member.teamMemberId}>
              <Avatar src={member.profileImage ?? undefined} name={member.name} size={44} />
              <div className={styles.professionalDetails}>
                <span className={styles.professionalName}>{member.name}</span>
                {member.professionalTitle?.trim() && <span className={styles.professionalTitle}>{member.professionalTitle}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!supported ? (
        // Missing item identity cannot be recovered by retrying availability.
        <p className={`txt-pretty ${styles.unsupported}`}>
          {t.unsupported}
        </p>
      ) : (
        <>
          <p className={styles.current}>
            <Icon name="cal" size={16} />
            <span>{currentNote}</span>
          </p>

          {/* Date section */}
          <section className={styles.dateSection} aria-label={t.dateLabel}>
            <h3 className={styles.sectionLabel}>{t.dateLabel}</h3>
            <div className={styles.calendarNavigation}>
              <Button kind="secondary" size="sm" aria-label={dict.appointmentPage.previousDates}
                disabled={submitting || calLoading || (datePage === 0 && rangeStart <= todayInTz(timeZone))}
                onClick={() => changeDatePage(-1)} className={styles.calendarArrow}>
                <Icon name="back" size={16} />
              </Button>
              <span className={styles.calendarRange} aria-live="polite">
                <span key={visibleStart} className={styles.weekMotion} data-week-direction={weekDirection ?? undefined}>
                  {format(dict.appointmentPage.dateRange, {
                    from: fmtDateLabel(visibleStart, locale),
                    to: fmtDateLabel(visibleEnd, locale),
                  })}
                </span>
              </span>
              <Button kind="secondary" size="sm" aria-label={dict.appointmentPage.nextDates}
                disabled={submitting || calLoading || (lastBookableDate != null && nextVisibleStart > lastBookableDate)}
                onClick={() => changeDatePage(1)} className={styles.calendarArrow}>
                <Icon name="chevR" size={16} />
              </Button>
            </div>
            <div className={styles.weekViewport}>
              <div key={weekContentKey} className={styles.weekMotion} data-week-direction={weekDirection ?? undefined}>
                {calError && !calendar ? (
                  <RetryBlock
                    retry={tb.retry}
                    onRetry={() => void loadCalendar(true)}
                    loading={calLoading}
                  />
                ) : calLoading && !calendar ? (
                  <LoadingBlock label={tb.loading} kind="dates" />
                ) : calendar ? (
                  <DateGrid
                    days={visibleDays}
                    selectedDate={selectedDate}
                    locale={locale}
                    noAvailability={dict.appointmentPage.noDatesInRange}
                    onPick={onPickDate}
                    disabled={submitting}
                  />
                ) : null}
              </div>
            </div>
          </section>

          {/* Slot section */}
          <div ref={timeAreaRef} className={styles.timeArea}>
            {!selectedDate && !calLoading && calendar && visibleDays.some((day) => day.status === "available") && (
              <p className={styles.hint}>{dict.appointmentPage.chooseDateHint}</p>
            )}
            {selectedDate && (
              <section className={styles.timeSection} aria-label={fmtDateLabel(selectedDate, locale)}>
                <h3 className={styles.sectionLabel}>
                  {fmtDateLabel(selectedDate, locale)}
                </h3>
                {slotsError ? (
                  <RetryBlock
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
              </section>
            )}
          </div>

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
  return (
    <>
    <div className={styles.dateStrip}>
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
            className={`tap ${styles.dateTile}`}
            disabled={disabled || !available}
            data-available={available}
            aria-pressed={on}
            aria-label={fmtDateLabel(d.date, locale)}
            onClick={() => onPick(d.date)}
            title={!available ? d.reason ?? d.status : undefined}
          >
            <span className={styles.weekday}>
              {dow}
            </span>
            <span className={styles.dayNumber}>
              {dayNum}
            </span>
          </button>
        );
      })}
    </div>
    {!hasAvailable && <p className={styles.hint}>{noAvailability}</p>}
    </>
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
      <p className={styles.emptySlots}>
        {fullyBooked}
      </p>
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
    <div className={styles.slotGroups}>
      {(Object.keys(groups) as SlotGroup[]).map((g) =>
        groups[g].length > 0 ? (
          <div key={g}>
            <h4 className={styles.groupLabel}>{labels[g]}</h4>
            <div className={styles.slots}>
              {groups[g].map((s) => {
                const on = isSelected(s);
                return (
                  <button
                    key={`${s.startTime}-${s.endTime}`}
                    type="button"
                    disabled={disabled}
                    aria-pressed={on}
                    className={`tap zv-slot ${styles.slot}`}
                    onClick={() => onPick(s)}
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
        {kind === "slots" && <Skeleton w={64} h={18} r={4} style={{ marginBottom: 10 }} />}
        <div
          className={kind === "dates" ? styles.dateStrip : styles.slots}
        >
          {Array.from({ length: kind === "dates" ? VISIBLE_DAYS : 8 }, (_, index) => (
            <Skeleton key={index} className={kind === "dates" ? styles.dateTile : undefined} h={kind === "dates" ? "var(--reschedule-date-height)" : 46} r={kind === "dates" ? 16 : 12} />
          ))}
        </div>
      </div>
      <p role="status" className="sr-only">{label}</p>
    </div>
  );
}
function RetryBlock({
  retry,
  onRetry,
  loading,
}: {
  retry: string;
  onRetry: () => void;
  loading: boolean;
}) {
  return (
    <div className={styles.retry}>
      <Button kind="secondary" size="md" onClick={onRetry} loading={loading}>
        {retry}
      </Button>
    </div>
  );
}
