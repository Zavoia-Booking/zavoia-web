"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import { useCallback, useRef, useState } from "react";
import { Avatar, Button, Icon, Img, useToast } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/format";
import { ApiError } from "@/lib/api/http";
import { cancelAppointment } from "@/lib/api/marketplace/appointments";
import type { AppointmentDetail } from "@/lib/api/marketplace/types";
import { formatDuration } from "@/lib/format/money-time";
import { apptDateParts, apptTime, apptTimeZone } from "../vm";
import { ActionModal } from "./action-modal";
import { apptMiniProps, staffDisplayName, type AppointmentChange } from "./shared";
import styles from "./cancel-modal.module.css";

/**
 * Turn a namespaced backend error code into copy the customer can act on.
 * Codes arrive as "APPOINTMENTS.E07" — matched in full, since bare suffixes
 * collide across namespaces. Unrecognised codes keep the generic retry line.
 */
function cancelErrorMessage(
  code: string | undefined,
  t: Dictionary["appointmentActions"]["cancel"],
  businessName: string,
): string {
  switch (code) {
    // The notice window lapsed — most likely while this modal sat open.
    case "APPOINTMENTS.E07":
      return format(t.windowPassed, { businessName });
    case "APPOINTMENTS.E06":
      return format(t.notAllowed, { businessName });
    case "APPOINTMENTS.E03":
      return t.alreadyCancelled;
    case "APPOINTMENTS.E04":
    case "APPOINTMENTS.E05":
      return t.noLongerCancellable;
    default:
      return t.error;
  }
}

/**
 * Confirm cancellation with the booked service, place, staff and venue-local time.
 * The mutation and its authoritative policy checks remain server-owned.
 */
export function CancelModal({
  appointment,
  onClose,
  onChanged,
}: {
  appointment: AppointmentDetail;
  onClose: () => void;
  onChanged?: (change?: AppointmentChange) => void | Promise<void>;
}) {
  const { dict, locale } = useTranslation();
  const t = dict.appointmentActions.cancel;
  const pending = appointment.status === "pending";
  const toast = useToast();

  const [submitting, setSubmitting] = useState(false);
  const inFlightRef = useRef(false);
  const closingRef = useRef(false);
  const handleClosing = useCallback(() => { closingRef.current = true; }, []);

  const mini = apptMiniProps(appointment);
  const businessName = appointment.business?.name?.trim()
    || appointment.location?.name?.trim()
    || dict.appointmentPage.contactBusinessFallback;
  const timeZone = apptTimeZone(appointment.location?.timezone, appointment.business?.timezone);
  const dateParts = apptDateParts(appointment.scheduled_at, locale, timeZone);
  const date = new Intl.DateTimeFormat(locale, {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone,
  }).format(new Date(appointment.scheduled_at));
  const place = [mini.business, appointment.location?.name]
    .filter((name, index, values) => name && values.indexOf(name) === index);
  const professionals = (appointment.staff_users ?? []).flatMap((member) => {
    const name = staffDisplayName(member);
    return name ? [{ ...member, name }] : [];
  });

  const confirm = async () => {
    if (inFlightRef.current || closingRef.current) return;
    inFlightRef.current = true;
    setSubmitting(true);
    try {
      const result = await cancelAppointment({ uuid: appointment.uuid });
      toast(pending ? dict.appointmentPage.cancelRequestSuccess : t.successToast, "check");
      onClose();
      void onChanged?.({ status: result.status, cancellation_reason: result.cancellation_reason });
    } catch (e) {
      const code = e instanceof ApiError ? e.code : undefined;
      toast(cancelErrorMessage(code, t, businessName), "warn", undefined, "error");
      setSubmitting(false);
      inFlightRef.current = false;
    }
  };

  return (
    <ActionModal title={pending ? dict.appointmentPage.cancelRequestTitle : t.title} onClose={onClose}
      width={540} className={styles.modal}
      dismissible={!submitting} onClosing={handleClosing}
      footer={
        <div className={styles.actions}>
          <Button
            kind="secondary"
            size="lg"
            onClick={() => { closingRef.current = true; onClose(); }}
            disabled={submitting}
          >
            {t.keep}
          </Button>
          <Button
            loading={submitting}
            kind="accent"
            size="lg"
            onClick={() => void confirm()}
            disabled={submitting}
            style={{
              background: "var(--s-error-600)",
              border: "none",
              color: "var(--c-50)",
            }}
          >
            {pending ? dict.appointmentPage.cancelRequest : t.confirm}
          </Button>
        </div>
      }
    >
      <div className={styles.booking}>
        <Img src={mini.photo ?? undefined} alt="" className={styles.photo}
          label={<Icon name="pin" size={24} color="var(--c-600)" />} />
        <div className={styles.service}>
          <h2>{mini.serviceLine}</h2>
          {appointment.additionalServices.map((name, index) => <p className={styles.additionalService} key={`${index}:${name}`}>+ {name}</p>)}
          {place.map((name) => <p className={styles.place} key={name}>{name}</p>)}
        </div>
      </div>

      <div className={styles.schedule}>
        <div className={styles.dateBadge} aria-hidden="true">
          <span>{dateParts.dow}</span>
          <strong>{dateParts.day}</strong>
          <span>{dateParts.mon}</span>
        </div>
        <div className={styles.when}>
          <time className={styles.date} dateTime={appointment.scheduled_at}>{date}</time>
          <div className={styles.timeRange}>
            <span>
              <time dateTime={appointment.scheduled_at}>{apptTime(appointment.scheduled_at, locale, timeZone)}</time>
              {" – "}
              <time dateTime={appointment.ends_at}>{apptTime(appointment.ends_at, locale, timeZone)}</time>
            </span>
            <span className={styles.duration}>{formatDuration(Number(appointment.duration))}</span>
          </div>
        </div>
      </div>

      {professionals.length > 0 && (
        <ul className={styles.professionals} aria-label={dict.appointmentDetail.sections.with}>
          {professionals.map((member) => <li key={member.teamMemberId}>
            <Avatar src={member.profileImage ?? undefined} name={member.name} size={28} />
            <span>{member.name}</span>
          </li>)}
        </ul>
      )}
    </ActionModal>
  );
}
