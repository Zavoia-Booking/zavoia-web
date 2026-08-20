"use client";

import { useState } from "react";
import { Button, Spinner, useToast } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { dictionaries } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import { ApiError } from "@/lib/api/http";
import { cancelAppointment } from "@/lib/api/marketplace/appointments";
import type { AppointmentDetail } from "@/lib/api/marketplace/types";
import { ActionModal, ApptMini } from "./action-modal";
import { apptMiniProps } from "./shared";

/**
 * Turn a namespaced backend error code into copy the customer can act on.
 * Codes arrive as "APPOINTMENTS.E07" — matched in full, since bare suffixes
 * collide across namespaces. Unrecognised codes keep the generic retry line.
 */
function cancelErrorMessage(
  code: string | undefined,
  t: (typeof dictionaries)[Locale]["appointmentActions"]["cancel"],
): string {
  switch (code) {
    // The notice window lapsed — most likely while this modal sat open.
    case "APPOINTMENTS.E07":
      return t.windowPassed;
    case "APPOINTMENTS.E06":
      return t.notAllowed;
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
 * Cancel-appointment modal. Ports `ZwCancelModal`
 * (web-appointment-actions.jsx:233-256) onto the live cancel endpoint.
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
  const [error, setError] = useState<string | null>(null);

  const mini = apptMiniProps(appointment, dict.common.photo);

  const confirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await cancelAppointment({ uuid: appointment.uuid });
      toast(t.successToast, "check");
      await onChanged?.();
      onClose();
    } catch (e) {
      const code = e instanceof ApiError ? e.code : undefined;
      setError(cancelErrorMessage(code, t));
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
          {error}
        </p>
      )}
    </ActionModal>
  );
}
