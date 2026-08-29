"use client";

import { useEffect } from "react";

import Link from "next/link";
import { Button, Icon } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";

/**
 * Tailored error boundary for /appointments — the one place a visitor comes
 * to check something they need right now (an upcoming booking's time or
 * place), so the fallback leads with retry rather than an alternate route.
 *
 * The page itself renders a locale-only static shell (`dynamicParams =
 * false`, no request-time API) — every appointment is fetched client-side in
 * `AppointmentsContent` after hydration. This boundary only ever catches a
 * failure from that client-side render, never a server/build-time one.
 */
export default function AppointmentsError({
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
        <Icon name="cal" size={26} color="var(--c-500)" />
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
        <Link href={localeHref(locale)}>
          <Button kind="secondary" size="lg">
            {t.backHome}
          </Button>
        </Link>
      </div>
    </main>
  );
}
