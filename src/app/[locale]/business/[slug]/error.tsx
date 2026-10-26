"use client";

import { useEffect, useTransition } from "react";
import { PageError } from "@/components/ui/page-error";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";

/** Operational failures stay distinct from a verified missing business. */
export default function BusinessDetailError({
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
        secondary={{ label: dict.business.browseBusinesses, href: localeHref(locale, "search") }}
        focusOnMount
      />
      <p role="status" aria-atomic="true" className="sr-only">
        {isPending ? t.pageRecovery.retrying : ""}
      </p>
    </>
  );
}
