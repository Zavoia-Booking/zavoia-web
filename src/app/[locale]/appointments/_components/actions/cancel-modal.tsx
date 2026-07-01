"use client";

import { useState } from "react";
import { Button, Icon, Spinner, useToast } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/dictionaries";
import { cancelAppointment } from "@/lib/api/marketplace/appointments";
import type { AppointmentDetail } from "@/lib/api/marketplace/types";
import { ActionModal, ApptMini } from "./action-modal";
import { apptMiniProps } from "./shared";

/**
 * Cancel-appointment modal. Ports `ZwCancelModal`
 * (web-appointment-actions.jsx:233-256) onto the live cancel endpoint.
 *
 * Window note: the API exposes `cancellationWindowMinutes` in MINUTES; the copy
 * wants hours, so we round minutes → hours.
 */
export function CancelModal({
  appointment,
  onClose,
  onChanged,
}: {
  appointment: AppointmentDetail;
  onClose: () => void;
  onChanged?: () => void | Promise<void>;
}) {
  const { dict } = useTranslation();
  const t = dict.appointmentActions.cancel;
  const toast = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const mini = apptMiniProps(appointment, dict.common.photo);
  const windowHours = Math.round(
    (appointment.location?.cancellationWindowMinutes ?? 1440) / 60,
  );

  const confirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(false);
    try {
      await cancelAppointment({ uuid: appointment.uuid });
      toast(t.successToast, "check");
      await onChanged?.();
      onClose();
    } catch {
      setError(true);
      setSubmitting(false);
    }
  };

  return (
    <ActionModal title={t.title} onClose={onClose} width={440}
      footer={
        <>
          <Button
            kind="secondary"
            size="lg"
            onClick={onClose}
            disabled={submitting}
            style={{ flex: 1 }}
          >
            {t.keep}
          </Button>
          <Button
            kind="accent"
            size="lg"
            onClick={() => void confirm()}
            disabled={submitting}
            style={{
              flex: 1,
              background: "var(--s-error-600)",
              border: "1px solid var(--s-error-600)",
            }}
          >
            {submitting ? <Spinner size={16} /> : t.confirm}
          </Button>
        </>
      }
    >
      <ApptMini {...mini} />

      <div
        className="txt-pretty"
        style={{
          marginTop: 18,
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          fontSize: 14,
          lineHeight: 1.55,
          color: "var(--c-700)",
        }}
      >
        <Icon
          name="shield"
          size={18}
          color="var(--s-success-600)"
          style={{ flexShrink: 0, marginTop: 1 }}
        />
        <span>{format(t.windowNote, { hours: String(windowHours) })}</span>
      </div>

      {error && (
        <p
          role="alert"
          style={{
            margin: "14px 0 0",
            fontSize: 13,
            lineHeight: 1.4,
            color: "var(--s-error-600)",
          }}
        >
          {t.error}
        </p>
      )}
    </ActionModal>
  );
}
