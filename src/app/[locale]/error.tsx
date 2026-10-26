"use client";

import { useEffect, useTransition } from "react";
import { PageError } from "@/components/ui/page-error";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";

/** Last-resort recovery for routes without a more specific boundary. */
export default function RouteError({
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
        secondary={{ label: t.pageRecovery.home, href: localeHref(locale) }}
        focusOnMount
      />
      <p role="status" aria-atomic="true" className="sr-only">
        {isPending ? t.pageRecovery.retrying : ""}
      </p>
    </>
  );
}
