"use client";

import { useEffect } from "react";

/**
 * Root-layout crash boundary. `[locale]/layout.tsx` IS the app's root layout
 * (there is no `app/layout.tsx` — the app has only one top-level segment,
 * `[locale]`, per the not-found.tsx comment on this same constraint), so this
 * is the one file in the tree that catches a throw from the root layout
 * itself (its providers, its `<html>`/`<body>`, anything above where
 * `[locale]/error.tsx` can reach).
 *
 * Per the error.js docs: global-error "replaces the root layout... when
 * active", must define its own `<html>`/`<body>`, and cannot export
 * `metadata`/`generateMetadata` (error boundaries must be Client Components).
 * Concretely here that also means no `I18nProvider` — nothing above this
 * point survived — so this can't call `useTranslation()` or read a locale.
 * That's why this is the one screen in the app that shows both languages at
 * once, in plain inline styles, importing nothing from the design system.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // The root layout crashed — the most severe failure the app has, and the
  // least likely to be reproducible. Record it even though nothing about it
  // is shown here.
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          display: "flex",
          minHeight: "100dvh",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          background: "#fff",
          color: "#1c1c1a",
        }}
      >
        <title>Zavoia</title>
        <div style={{ textAlign: "center", maxWidth: 440 }}>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(24px, 4vw, 34px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            Something went wrong.
            <br />
            Ceva nu a mers bine.
          </h1>
          <p
            style={{
              margin: "16px 0 0",
              fontSize: 15.5,
              lineHeight: 1.6,
              color: "#5c5c58",
            }}
          >
            We hit an unexpected error loading this page. Please try again.
            <br />
            Am întâmpinat o eroare neașteptată la încărcarea paginii.
            Încearcă din nou.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 26,
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "13px 26px",
                fontSize: 15.5,
                fontWeight: 600,
                borderRadius: 999,
                border: "1px solid #1c1c1a",
                background: "#1c1c1a",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Try again / Încearcă din nou
            </button>
            {/*
              A plain anchor, not next/link: the root layout just crashed, so
              the router this boundary is rendered beside may be part of what
              broke. A full document load is the recovery that cannot itself
              fail — which is the whole job of this screen.
            */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "13px 26px",
                fontSize: 15.5,
                fontWeight: 600,
                borderRadius: 999,
                textDecoration: "none",
                border: "1px solid rgba(28,28,26,0.14)",
                color: "#1c1c1a",
              }}
            >
              Home / Acasă
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
