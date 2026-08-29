import "@/styles/globals.css";
import { fontVariables } from "@/styles/fonts";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";

/**
 * Last-resort 404: a URL that matches no route at all.
 *
 * Everything that knows what it was looking for handles its own miss in-page,
 * with the right locale and the right copy — /<slug> shows the claim page,
 * /business/<slug> and /brand/<slug> show the listing not-found state. This
 * file only catches what the router itself could not place.
 *
 * Two constraints, both verified against Next 16.2.4 rather than assumed:
 *
 *  1. Segment-level `not-found.tsx` files are never reached in this app — the
 *     root layout is itself a dynamic segment (`app/[locale]/layout.tsx`), the
 *     case the Next docs flag as making a composed 404 harder — so every
 *     `notFound()` in the tree lands here. Adding per-segment boundaries back
 *     would produce dead files, not nicer 404s.
 *  2. Client components are silently dropped inside this boundary, and a
 *     dynamic API (`headers()`, `cookies()`) throws "static to dynamic at
 *     runtime" when the miss happens inside a cached route. So: no design-system
 *     components, no `next/link`, no request data — plain markup, plain anchors,
 *     and the default locale, since there is no supported way to learn the real
 *     one here.
 */
export default function NotFound() {
  const t = dictionaries[DEFAULT_LOCALE].notFound.generic;

  return (
    <main
      className={fontVariables}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "100dvh",
        padding: "clamp(56px, 9vw, 120px) 22px",
        background: "#fff",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.16em",
          color: "var(--p-600)",
        }}
      >
        {t.kicker}
      </span>
      <h1
        style={{
          margin: "16px 0 0",
          fontSize: "clamp(30px, 4.6vw, 50px)",
          fontWeight: 600,
          letterSpacing: "-0.04em",
          lineHeight: 1.05,
          color: "var(--c-900)",
          maxWidth: 640,
        }}
      >
        {t.title}
      </h1>
      <p
        style={{
          margin: "18px 0 0",
          fontSize: 16.5,
          lineHeight: 1.6,
          color: "var(--c-600)",
          maxWidth: 520,
        }}
      >
        {t.body}
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginTop: 30,
          justifyContent: "center",
        }}
      >
        <a
          href={localeHref(DEFAULT_LOCALE)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "15px 28px",
            borderRadius: 999,
            fontSize: 16,
            fontWeight: 600,
            textDecoration: "none",
            background: "var(--p-500)",
            color: "#fff",
            border: "1px solid var(--p-500)",
          }}
        >
          {t.home}
        </a>
        <a
          href={localeHref(DEFAULT_LOCALE, "search")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "15px 28px",
            borderRadius: 999,
            fontSize: 16,
            fontWeight: 600,
            textDecoration: "none",
            background: "#fff",
            color: "var(--c-900)",
            border: "1px solid rgba(28,28,26,0.14)",
          }}
        >
          {t.explore}
        </a>
      </div>
    </main>
  );
}
