"use client";

import { Button } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";

/**
 * Error boundary for the published microsite.
 *
 * The page is ISR-cached, so a transient upstream failure (backend down, 500,
 * timeout) is deliberately rethrown rather than shown as "no site here" — a
 * render that throws is never stored, so an outage can't freeze a wrong answer
 * into the cache for the whole revalidate window.
 *
 * Scope, measured rather than assumed: this covers a failure during a
 * CLIENT-side navigation into the route, where React can catch it and offer the
 * retry. A cold slug rendered on the server during an outage never reaches here
 * — with no `loading.tsx` nothing has streamed yet, so Next answers a bare 500.
 * That is the accepted cost of never caching a wrong answer.
 */
export default function MicrositeError({ reset }: { reset: () => void }) {
  const { dict } = useTranslation();

  return (
    <main
      className="zw-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 18,
        padding: "clamp(70px, 11vw, 150px) var(--gutter)",
        minHeight: "60vh",
      }}
    >
      <p style={{ margin: 0, fontSize: 17, color: "var(--c-700)" }}>
        {dict.account.toasts.genericError}
      </p>
      <Button onClick={reset}>{dict.search.retry}</Button>
    </main>
  );
}
