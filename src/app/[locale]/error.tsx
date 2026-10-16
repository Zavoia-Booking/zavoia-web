"use client";

import { useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { Button, Spinner } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import styles from "./error.module.css";

/**
 * Last-resort recovery for routes without a more specific error boundary.
 * Keep error details in the console and use Next's retry to refetch as well
 * as rerender. A loading failure does not establish that a page is missing.
 */
export default function RouteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { dict, locale } = useTranslation();
  const t = dict.errors;
  const heading = useRef<HTMLHeadingElement>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
    heading.current?.focus();
  }, [error]);

  return (
    <main
      className={`zw-container ${styles.page}`}
      aria-labelledby="page-error-title"
      aria-describedby="page-error-description"
    >
      <div className={styles.content}>
        <h1
          ref={heading}
          id="page-error-title"
          className={`txt-balance ${styles.title}`}
          tabIndex={-1}
        >
          {t.pageTitle}
        </h1>
        <p id="page-error-description" className={`txt-pretty ${styles.description}`}>
          {t.pageRecovery.body}
        </p>
        <div className={styles.actions}>
          <Button
            kind="primary"
            className={styles.action}
            onClick={() => startTransition(retry)}
            disabled={isPending}
            aria-busy={isPending}
            aria-label={t.retry}
            style={{
              minHeight: 48,
              padding: "13px 24px",
              fontSize: 14,
              lineHeight: "20px",
              opacity: 1,
              cursor: isPending ? "wait" : "pointer",
            }}
          >
            {isPending ? (
              <span aria-hidden="true">
                <Spinner size={16} color="#fff" />
              </span>
            ) : t.retry}
          </Button>
          <Link
            href={localeHref(locale)}
            className={`tap ${styles.action} ${styles.secondary}`}
          >
            {t.pageRecovery.home}
          </Link>
        </div>
        <p role="status" aria-atomic="true" className="sr-only">
          {isPending ? t.pageRecovery.retrying : ""}
        </p>
      </div>
    </main>
  );
}
