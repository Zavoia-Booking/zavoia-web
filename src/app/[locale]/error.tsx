"use client";

import { useEffect } from "react";

import Link from "next/link";
import { Button, Icon } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";

/**
 * General error boundary for everything under `[locale]` that doesn't have
 * its own tailored one (see `business/[slug]/error.tsx` and
 * `appointments/error.tsx`). This single file covers the other ~25 route
 * segments that previously fell through to Next's bare, unbranded, English-
 * only default error page.
 *
 * Anatomy copied from `BusinessNotFound` (60px icon circle, mono kicker,
 * headline, body, actions) so a crash still looks like the rest of the app
 * rather than a dead end. `error.message`/`digest` are deliberately not
 * rendered — per the error.js docs, errors forwarded from Server Components
 * carry only a generic message, so surfacing it would add noise, not
 * information, for this fallback's purpose.
 */
export default function RouteError({
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
        <Icon name="warn" size={26} color="var(--c-500)" />
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
