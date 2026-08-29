"use client";

import Link from "next/link";
import { Button, Icon } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import { format } from "@/i18n/dictionaries";
import { BUSINESS_APP_URL } from "@/lib/env";

/**
 * "This page could be yours" — what /<slug> shows when no published website
 * lives at that address.
 *
 * It renders from the page component rather than a `not-found.tsx` boundary,
 * deliberately: segment-level not-found boundaries are never reached in this
 * app (the root layout is itself a dynamic segment) and client components are
 * dropped inside the one boundary that is. Rendering in-page keeps the real
 * design system — and gives the component the locale and the slug, which a
 * boundary receives no way to learn.
 *
 * The trade-off is the status code: this answers 200, not 404. The route's
 * metadata carries `noindex`, so the URL stays out of the index either way.
 */
export function ClaimPage({ slug }: { slug: string }) {
  const { locale, dict } = useTranslation();
  const t = dict.notFound.claim;

  return (
    <main
      className="zw-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "clamp(64px, 10vw, 130px) var(--gutter)",
        minHeight: "70vh",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 14px",
          borderRadius: "var(--r-full)",
          background: "var(--c-shade)",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--p-600)",
        }}
      >
        <Icon name="sparkle" size={14} color="var(--p-600)" />
        {t.kicker}
      </span>

      <h1
        className="txt-balance"
        style={{
          margin: "22px 0 0",
          fontSize: "clamp(30px, 4.6vw, 52px)",
          fontWeight: 600,
          letterSpacing: "-0.04em",
          lineHeight: 1.04,
          color: "var(--c-900)",
        }}
      >
        {t.title}
      </h1>

      {/* The address itself, shown the way it would read once claimed. */}
      <div
        style={{
          marginTop: 18,
          padding: "10px 18px",
          borderRadius: "var(--r-full)",
          border: "1px dashed rgba(28,28,26,0.22)",
          fontFamily: "var(--font-mono)",
          fontSize: "clamp(13px, 2.2vw, 16px)",
          color: "var(--c-700)",
          maxWidth: "100%",
          overflowWrap: "anywhere",
        }}
      >
        zavoia.com/{slug}
      </div>

      <p
        className="txt-pretty"
        style={{
          margin: "20px 0 0",
          fontSize: 16.5,
          lineHeight: 1.6,
          color: "var(--c-600)",
          maxWidth: 520,
        }}
      >
        {format(t.body, { slug })}
      </p>

      <ul
        style={{
          listStyle: "none",
          margin: "26px 0 0",
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          textAlign: "left",
        }}
      >
        {t.bullets.map((bullet) => (
          <li
            key={bullet}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 15,
              color: "var(--c-700)",
            }}
          >
            <Icon name="check" size={17} color="var(--p-600)" />
            {bullet}
          </li>
        ))}
      </ul>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginTop: 30,
          justifyContent: "center",
        }}
      >
        <a href={`${BUSINESS_APP_URL}/register`} rel="noopener">
          <Button kind="accent" size="lg">
            {t.primary}
            <Icon name="arrowR" size={17} color="#fff" />
          </Button>
        </a>
        <Link href={localeHref(locale, "for-business")}>
          <Button kind="secondary" size="lg">
            {t.secondary}
          </Button>
        </Link>
      </div>

      <Link
        href={localeHref(locale, "search")}
        className="tap"
        style={{
          marginTop: 22,
          fontSize: 14,
          color: "var(--c-500)",
          textDecoration: "underline",
          textUnderlineOffset: 3,
        }}
      >
        {t.explore}
      </Link>
    </main>
  );
}
