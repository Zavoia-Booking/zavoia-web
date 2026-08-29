"use client";

import { useEffect } from "react";

import Link from "next/link";
import { Button, Icon } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";

/**
 * Tailored error boundary for the business detail page — the main
 * conversion route, so a broken render shouldn't just dead-end a visitor who
 * came here to book. Alongside retry, offers a way to keep browsing instead.
 *
 * This sits ABOVE, and does not replace, the 404-vs-500 split already in
 * page.tsx: a real 404 (dead slug) is caught there and rendered inline as
 * `BusinessNotFound` — it returns, it never throws, so it never reaches this
 * boundary. Only genuine failures (backend down, timeout, a render bug in
 * `BusinessDetail`) land here, which is why the render is CACHED — see the
 * comment on `BusinessDetailPage` — and rethrown rather than resolved into a
 * "not found" answer that would freeze into the ISR cache during an outage.
 */
export default function BusinessDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { dict, locale } = useTranslation();
  const t = dict.errors;
  // Rendered errors are deliberately generic, but an unrendered error is not
  // the same as an unrecorded one: without this the app hides every crash from
  // the user AND from whoever operates it. `digest` is the only handle that
  // ties this back to the matching server-side log entry.
  useEffect(() => {
    console.error(error);
  }, [error]);


  return (
    <main
      className="zw-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "clamp(70px, 11vw, 150px) var(--gutter)",
        minHeight: "60vh",
      }}
    >
      <span
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "var(--c-shade)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 22,
        }}
      >
        <Icon name="building" size={26} color="var(--c-500)" />
      </span>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12.5,
          fontWeight: 600,
          letterSpacing: "0.16em",
          color: "var(--p-600)",
        }}
      >
        {t.pageKicker}
      </div>
      <h1
        className="txt-balance"
        style={{
          margin: "14px 0 0",
          fontSize: "clamp(28px, 4vw, 46px)",
          fontWeight: 600,
          letterSpacing: "-0.04em",
          lineHeight: 1.04,
          color: "var(--c-900)",
        }}
      >
        {t.pageTitle}
      </h1>
      <p
        className="txt-pretty"
        style={{
          margin: "16px 0 0",
          fontSize: 16,
          lineHeight: 1.6,
          color: "var(--c-600)",
          maxWidth: 420,
        }}
      >
        {t.pageBody}
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginTop: 28,
          justifyContent: "center",
        }}
      >
        <Button kind="primary" size="lg" onClick={reset}>
          {t.retry}
        </Button>
        <Link href={localeHref(locale, "search")}>
          <Button kind="secondary" size="lg">
            {dict.business.browseBusinesses}
          </Button>
        </Link>
      </div>
    </main>
  );
}
