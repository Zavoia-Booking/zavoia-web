"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { Button, Icon, Spinner, useToast } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/dictionaries";
import { ApiError } from "@/lib/api/http";
import {
  getBookingCalendar,
  getBookingSlots,
} from "@/lib/api/marketplace/booking";
import { rescheduleAppointment } from "@/lib/api/marketplace/appointments";
import type {
  AppointmentDetail,
  BookingCalendar,
  BookingCalendarDay,
  BookingDaySlots,
  ServiceSelection,
  TimeSlot,
} from "@/lib/api/marketplace/types";
import { todayInTz, zonedWallTimeToUtcISO } from "@/lib/booking";
import { ActionModal, ApptMini } from "./action-modal";
import { apptMiniProps, primaryStaff } from "./shared";

const CAL_DAYS_TO_CHECK = 30;

type SlotGroup = "morning" | "afternoon" | "evening";

function groupForTime(start: string): SlotGroup {
  const h = Number(start.split(":")[0]);
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

/** Localized "Mon, Jan 5"-style label, anchored at noon UTC to avoid drift. */
function fmtDateLabel(date: string, locale: string, timeZone: string): string {
  const [y, mo, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
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
  return `${fmtDateLabel(date, locale, timeZone)} · ${fmtTimeLabel(date, time, locale, timeZone)}`;
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
 * Reschedule modal. Ports `ZwRescheduleModal`
 * (web-appointment-actions.jsx:170-227) but driven by the LIVE booking calendar
 * + slots endpoints, replicating BookingDrawer's date-strip → grouped-slot UX.
 *
 * Service-selection derivation: the appointment exposes only `service.id`
 * (numeric) and `bundle.uuid` (NO numeric id). `ServiceSelection.bundleId` is
 * numeric, so a bundle (or otherwise non-service) appointment can NOT be
 * rescheduled from detail data alone — we render a graceful inline message
 * instead of sending a malformed body.
 *
 * Reschedule window note: API window is in MINUTES → converted to hours.
 */
export function RescheduleModal({
  appointment,
  onClose,
  onChanged,
}: {
  appointment: AppointmentDetail;
  onClose: () => void;
  onChanged?: () => void | Promise<void>;
}) {
  const { dict, locale } = useTranslation();
  const t = dict.appointmentActions.reschedule;
  const tb = dict.booking;
  const toast = useToast();

  const mini = apptMiniProps(appointment, dict.common.photo);

  // Only a single-service appointment with a numeric serviceId + numeric ids is
  // reschedulable from detail data. Bundles expose only a uuid → not supported.
  const serviceId = appointment.service?.id ?? null;
  const businessId = appointment.business?.id ?? null;
  const locationId = appointment.location?.id ?? null;
  const pinnedStaffId = primaryStaff(appointment)?.teamMemberId;

  const supported =
    serviceId != null && businessId != null && locationId != null;

  const services: ServiceSelection[] | null = useMemo(() => {
    if (!supported || serviceId == null) return null;
    return [
      {
        serviceId,
        ...(pinnedStaffId != null ? { teamMemberId: pinnedStaffId } : {}),
      },
    ];
  }, [supported, serviceId, pinnedStaffId]);

  // ── Flow state ──
  const [calendar, setCalendar] = useState<BookingCalendar | null>(null);
  const [calLoading, setCalLoading] = useState(false);
  const [calError, setCalError] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [daySlots, setDaySlots] = useState<BookingDaySlots | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Authoritative tz: appointment business → calendar response → resolved zone.
  const timeZone =
    appointment.business?.timezone ??
    calendar?.timezone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone ??
    "UTC";

  const windowHours = Math.round(
    (appointment.location?.rescheduleWindowMinutes ?? 1440) / 60,
  );
  const currentNote = format(t.currentNote, {
    when: fmtIsoWhen(appointment.scheduled_at, locale, timeZone),
    hours: String(windowHours),
  });

  // ── Step 1: fetch calendar. ──
  const loadCalendar = useCallback(async () => {
    if (!supported || businessId == null || locationId == null || !services) {
      return;
    }
    setCalLoading(true);
    setCalError(false);
    try {
      const res = await getBookingCalendar({
        businessId,
        locationId,
        services,
        startDate: todayInTz(timeZone),
        daysToCheck: CAL_DAYS_TO_CHECK,
        ...(pinnedStaffId != null ? { teamMemberId: pinnedStaffId } : {}),
      });
      setCalendar(res);
    } catch {
      setCalError(true);
    } finally {
      setCalLoading(false);
    }
  }, [supported, businessId, locationId, services, timeZone, pinnedStaffId]);

  // ── Step 2: fetch slots for a chosen date. ──
  const loadSlots = useCallback(
    async (date: string) => {
      if (!supported || businessId == null || locationId == null || !services) {
        return;
      }
      setSlotsLoading(true);
      setSlotsError(false);
      setSelectedSlot(null);
      try {
        const res = await getBookingSlots({
          businessId,
          locationId,
          services,
          date,
          ...(pinnedStaffId != null ? { teamMemberId: pinnedStaffId } : {}),
        });
        setDaySlots(res);
      } catch {
        setSlotsError(true);
      } finally {
        setSlotsLoading(false);
      }
    },
    [supported, businessId, locationId, services, pinnedStaffId, setSelectedSlot],
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
    setSelectedDate(date);
    void loadSlots(date);
  };

  const ready = !!selectedSlot && !!selectedDate;

  const confirm = async () => {
    if (!ready || submitting || !selectedDate || !selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const newScheduledAt = zonedWallTimeToUtcISO(
        selectedDate,
        selectedSlot.startTime,
        timeZone,
      );
      await rescheduleAppointment({
        uuid: appointment.uuid,
        newScheduledAt,
      });
      toast(
        format(t.successToast, {
          when: fmtWhen(selectedDate, selectedSlot.startTime, locale, timeZone),
        }),
        "cal",
      );
      await onChanged?.();
      onClose();
    } catch (e) {
      const code = e instanceof ApiError ? e.code : undefined;
      // Slot just taken / no longer available → refetch the day's slots.
      if ((code === "E10" || code === "E14") && selectedDate) {
        setSubmitError(tb.errors.slotConflict);
        setSelectedSlot(null);
        void loadSlots(selectedDate);
      } else {
        setSubmitError(t.error);
      }
      setSubmitting(false);
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
          <span style={{ fontSize: 13, color: "var(--c-500)" }}>
            {t.pickSlot}
          </span>
        )}
      </div>
      <Button
        kind="primary"
        size="lg"
        disabled={!ready || submitting}
        onClick={() => void confirm()}
      >
        {submitting ? <Spinner size={16} /> : t.confirm}
      </Button>
    </>
  );

  return (
    <ActionModal
      title={t.title}
      subtitle={format(t.sub, { business: mini.business })}
      onClose={onClose}
      width={520}
      footer={supported ? footer : undefined}
    >
      <ApptMini {...mini} />

      {!supported ? (
        // Bundle / non-service appointment: no numeric serviceId derivable.
        <p
          className="txt-pretty"
          style={{
            margin: "18px 0 0",
            fontSize: 14,
            lineHeight: 1.55,
            color: "var(--c-600)",
          }}
        >
          {tb.errors.generic}
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
            {calLoading && !calendar ? (
              <LoadingBlock label={tb.loading} />
            ) : calError && !calendar ? (
              <ErrorBlock
                label={tb.loadError}
                retry={tb.retry}
                onRetry={() => void loadCalendar()}
              />
            ) : calendar ? (
              <DateGrid
                days={calendar.calendar}
                selectedDate={selectedDate}
                locale={locale}
                timeZone={timeZone}
                noAvailability={tb.noAvailability}
                onPick={onPickDate}
              />
            ) : null}
          </div>

          {/* Slot section */}
          {selectedDate && (
            <div style={{ marginTop: 20 }}>
              <div style={dateSectionLabel}>
                {fmtDateLabel(selectedDate, locale, timeZone)}
              </div>
              {slotsLoading && !daySlots ? (
                <LoadingBlock label={tb.loading} />
              ) : slotsError ? (
                <ErrorBlock
                  label={tb.loadError}
                  retry={tb.retry}
                  onRetry={() => void loadSlots(selectedDate)}
                />
              ) : (
                <SlotGrid
                  daySlots={daySlots}
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
                  onPick={setSelectedSlot}
                />
              )}
            </div>
          )}

          {submitError && (
            <p
              role="alert"
              style={{
                margin: "16px 0 0",
                fontSize: 13,
                lineHeight: 1.4,
                color: "var(--s-error-600)",
              }}
            >
              {submitError}
            </p>
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
  timeZone,
  noAvailability,
  onPick,
}: {
  days: BookingCalendarDay[];
  selectedDate: string | null;
  locale: string;
  timeZone: string;
  noAvailability: string;
  onPick: (date: string) => void;
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
          timeZone,
        }).format(dt);
        const dayNum = new Intl.DateTimeFormat(locale, {
          day: "numeric",
          timeZone,
        }).format(dt);
        return (
          <button
            key={d.date}
            type="button"
            className="tap"
            disabled={!available}
            onClick={() => onPick(d.date)}
            title={!available ? d.reason ?? d.status : undefined}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "10px 0 9px",
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
                color: on ? "rgba(255,255,255,0.7)" : "var(--c-500)",
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
}: {
  daySlots: BookingDaySlots | null;
  selectedDate: string;
  selectedSlot: TimeSlot | null;
  locale: string;
  timeZone: string;
  fullyBooked: string;
  labels: Record<SlotGroup, string>;
  onPick: (slot: TimeSlot) => void;
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
                    className="tap zv-slot"
                    onClick={() => onPick(s)}
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
function LoadingBlock({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "32px 0",
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
        padding: "28px 0",
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

const dateSectionLabel: CSSProperties = {
  fontSize: 13.5,
  fontWeight: 600,
  color: "var(--c-800)",
  marginBottom: 10,
};
