"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Button, Icon, Img, useToast } from "@/components/ui";
import { TextareaField } from "@/components/ui/textarea-field";
import { format } from "@/i18n/format";
import { useTranslation } from "@/i18n/useTranslation";
import { createTicket } from "@/lib/api/marketplace/support";
import type { AppointmentDetail, TicketCategory } from "@/lib/api/marketplace/types";
import { getPlainTextApiError, plainTextErrorMessage, SUPPORT_MESSAGE_MAX_LENGTH, validatePlainText } from "@/lib/validation/free-text";
import { apptTime, apptTimeZone } from "../vm";
import { ActionModal } from "./action-modal";
import { apptMiniProps, staffDisplayName } from "./shared";
import styles from "./report-modal.module.css";

/** Customer-initiated report, carrying the owned appointment's actual identity. */
export function ReportModal({ appointment, onClose }: {
  appointment: AppointmentDetail;
  onClose: () => void;
}) {
  const { dict, locale } = useTranslation();
  const t = dict.appointmentPage;
  const toast = useToast();
  const messageId = useId();
  const categoryName = useId();
  const repliesId = useId();
  const [category, setCategory] = useState<TicketCategory>("bug");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const inFlight = useRef(false);
  const closing = useRef(false);
  const onClosing = useCallback(() => { closing.current = true; }, []);

  const mini = apptMiniProps(appointment);
  const timeZone = apptTimeZone(appointment.location?.timezone, appointment.business?.timezone);
  const date = new Intl.DateTimeFormat(locale, {
    day: "numeric", month: "short", year: "numeric", timeZone,
  }).format(new Date(appointment.scheduled_at));
  const places = [mini.business, appointment.location?.name]
    .filter((name, index, values) => name && values.indexOf(name) === index);
  const professionals = (appointment.staff_users ?? []).map(staffDisplayName).filter(Boolean);

  const close = () => {
    if (inFlight.current || closing.current) return;
    closing.current = true;
    onClose();
  };

  const submit = async () => {
    const cleanMessage = message.trim();
    if (inFlight.current || closing.current) return;
    if (validatePlainText(message, { required: true, maxLength: SUPPORT_MESSAGE_MAX_LENGTH })) {
      messageRef.current?.focus();
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setMessageError(null);
    const when = new Intl.DateTimeFormat(locale, {
      dateStyle: "medium", timeStyle: "short",
      timeZone: apptTimeZone(appointment.location?.timezone, appointment.business?.timezone),
    }).format(new Date(appointment.scheduled_at));
    const label = [appointment.bookedItemName, appointment.business?.name,
      appointment.location?.name, when].filter(Boolean).join(" · ");
    try {
      await createTicket({
        category,
        message: cleanMessage,
        context: {
          type: "appointment",
          label: Array.from(label).slice(0, 300).join(""),
          appointmentUuid: appointment.uuid,
          ...(appointment.business?.id != null ? { businessId: appointment.business.id } : {}),
          ...(appointment.location?.id != null ? { locationId: appointment.location.id } : {}),
        },
      });
      toast(t.reportSuccess, "check");
      onClose();
    } catch (e) {
      const reason = getPlainTextApiError(e);
      if (reason) {
        setMessageError(plainTextErrorMessage(reason, dict.textarea, SUPPORT_MESSAGE_MAX_LENGTH, locale));
        requestAnimationFrame(() => messageRef.current?.focus());
      } else {
        toast(t.reportError, "warn", undefined, "error");
      }
      setSubmitting(false);
      inFlight.current = false;
    }
  };

  return <ActionModal title={t.reportTitle} width={540} className={styles.modal}
    onClose={onClose} dismissible={!submitting} onClosing={onClosing}
    footer={<div className={styles.actions}>
      <Button kind="secondary" size="lg" onClick={close} disabled={submitting}>{dict.booking.close}</Button>
      <Button kind="accent" size="lg" loading={submitting}
        disabled={validatePlainText(message, { required: true, maxLength: SUPPORT_MESSAGE_MAX_LENGTH }) !== null}
        style={{ border: "none", color: "var(--c-50)" }} onClick={() => void submit()}>{t.reportSubmit}</Button>
    </div>}>
    <div className={styles.booking}>
      <Img src={mini.photo ?? undefined} alt="" className={styles.photo}
        label={<Icon name="pin" size={22} color="var(--c-600)" />} />
      <div className={styles.summary}>
        <h2>{mini.serviceLine}</h2>
        {appointment.additionalItemsCount > 0 && <p className={styles.more}>
          {format(t.moreItems, { n: String(appointment.additionalItemsCount) })}
        </p>}
        {places.map((name) => <p key={name}>{name}</p>)}
        {professionals.length > 0 && <p>{professionals.join(", ")}</p>}
      </div>
      <p className={styles.schedule}>
        <span className={styles.date}>
          <Icon name="cal" size={16} color="var(--c-600)" />
          <time dateTime={appointment.scheduled_at}>{date}</time>
        </span>
        <span>{apptTime(appointment.scheduled_at, locale, timeZone)} – {apptTime(appointment.ends_at, locale, timeZone)}</span>
      </p>
    </div>

    <p className={styles.intro}>{t.reportIntro}</p>
    <fieldset className={styles.topics} disabled={submitting}>
      <legend>{t.reportTopic}</legend>
      <div className={styles.choices} data-category={category}>
        {(["bug", "question"] as const).map((value) => <label className={styles.choice} key={value}>
          <input className="sr-only" type="radio" name={categoryName} value={value}
            checked={category === value} onChange={() => setCategory(value)} />
          <span>{value === "bug" ? t.reportProblem : t.reportQuestion}</span>
        </label>)}
      </div>
    </fieldset>
    <TextareaField id={messageId} ref={messageRef} className={styles.message}
      label={t.reportMessage} value={message} error={messageError}
      disabled={submitting} maxLength={SUPPORT_MESSAGE_MAX_LENGTH} rows={4} required
      style={{ minHeight: 128 }} aria-describedby={repliesId}
      onChange={(event) => { setMessage(event.target.value); setMessageError(null); }} />
    <p id={repliesId} className={styles.replies}>{t.reportReplies}</p>
  </ActionModal>;
}
