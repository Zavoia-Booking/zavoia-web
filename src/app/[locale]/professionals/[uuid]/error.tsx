"use client";

import { useEffect, useTransition } from "react";
import { PageError } from "@/components/ui/page-error";
import { localeHref } from "@/i18n/routes";
import { useTranslation } from "@/i18n/useTranslation";

export default function ProfessionalError({ error, retry }: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { dict, locale } = useTranslation();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <PageError
        title={dict.errors.pageTitle}
        description={dict.errors.pageRecovery.body}
        primary={{ label: dict.errors.retry, onClick: () => startTransition(retry), loading: isPending }}
        secondary={{ label: dict.business.browseBusinesses, href: localeHref(locale, "search") }}
        focusOnMount
      />
      <p role="status" aria-atomic="true" className="sr-only">
        {isPending ? dict.errors.pageRecovery.retrying : ""}
      </p>
    </>
  );
}
