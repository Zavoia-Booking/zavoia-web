"use client";

import { useEffect, useTransition } from "react";
import { PageError } from "@/components/ui/page-error";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";

/** Render crashes use the same recovery screen as blocking request failures. */
export default function AppointmentsError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { dict, locale } = useTranslation();
  const t = dict.errors;
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <PageError
        title={t.pageTitle}
        description={t.pageRecovery.body}
        primary={{ label: t.retry, onClick: () => startTransition(retry), loading: isPending }}
        secondary={{
          label: dict.appointmentDetail.backToAppointments,
          href: localeHref(locale, "appointments"),
        }}
        focusOnMount
      />
      <p role="status" aria-atomic="true" className="sr-only">
        {isPending ? t.pageRecovery.retrying : ""}
      </p>
    </>
  );
}
