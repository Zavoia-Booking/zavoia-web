"use client";

import Link from "next/link";
import { Button, Icon } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import type { Locale } from "@/i18n/locales";

/**
 * Business-detail not-found state. Ported from ZwBizNotFound — used when the
 * route :id is invalid or `getListing` fails (e.g. backend down at build time).
 */
export function BusinessNotFound({ locale }: { locale: Locale }) {
  const { dict } = useTranslation();
  const t = dict.business;

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
        <Icon name="pin" size={26} color="var(--c-500)" />
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
        {t.notFoundKicker}
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
        {t.notFoundTitle}
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
        {t.notFoundBody}
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
        <Link href={localeHref(locale, "search")}>
          <Button kind="primary" size="lg">
            {t.browseBusinesses}
          </Button>
        </Link>
        <Link href={localeHref(locale)}>
          <Button kind="secondary" size="lg">
            {t.backToExplore}
          </Button>
        </Link>
      </div>
    </main>
  );
}
