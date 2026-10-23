"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Button, useToast } from "@/components/ui";
import { InlineError } from "@/components/ui/inline-error";
import { useTranslation } from "@/i18n/useTranslation";
import { createTicket } from "@/lib/api/marketplace/support";
import type { AppointmentDetail, TicketCategory } from "@/lib/api/marketplace/types";
import { apptTimeZone } from "../vm";
import { ActionModal, ApptMini } from "./action-modal";
import { apptMiniProps } from "./shared";
import styles from "./action-fields.module.css";

/** Customer-initiated report, carrying the owned appointment's actual identity. */
export function ReportModal({ appointment, onClose }: {
  appointment: AppointmentDetail;
  onClose: () => void;
}) {
  const { dict, locale } = useTranslation();
  const t = dict.appointmentPage;
  const support = dict.account.support;
  const toast = useToast();
  const messageId = useId();
  const [category, setCategory] = useState<TicketCategory>("question");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const closing = useRef(false);
  const onClosing = useCallback(() => { closing.current = true; }, []);

  const submit = async () => {
    const cleanMessage = message.trim();
    if (!cleanMessage || inFlight.current || closing.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
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
    } catch {
      setError(t.reportError);
      setSubmitting(false);
      inFlight.current = false;
    }
  };

  return <ActionModal title={t.reportTitle} subtitle={t.reportIntro}
    onClose={onClose} dismissible={!submitting} onClosing={onClosing}
    footer={<>
      <Button kind="secondary" onClick={onClose} disabled={submitting}>{support.new.cancel}</Button>
      <Button loading={submitting} disabled={!message.trim()} onClick={() => void submit()}>{t.reportSubmit}</Button>
    </>}>
    <ApptMini {...apptMiniProps(appointment, dict.common.photo)} />
    <label className={styles.field}>
      <span className={styles.label}>{support.new.categoryLabel}</span>
      <select className={styles.input} value={category} disabled={submitting}
        onChange={(event) => setCategory(event.target.value as TicketCategory)}>
        <option value="question">{support.category.question}</option>
        <option value="bug">{support.category.bug}</option>
      </select>
    </label>
    <label className={styles.field} htmlFor={messageId}>
      <span className={styles.label}>{t.reportMessage}</span>
    </label>
    <textarea id={messageId} className={styles.input} value={message}
      disabled={submitting} maxLength={9500} rows={5}
      onChange={(event) => setMessage(event.target.value)} placeholder={t.reportPlaceholder} />
    {error && <InlineError style={{ marginTop: 12 }}>{error}</InlineError>}
  </ActionModal>;
}
