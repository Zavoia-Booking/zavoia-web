"use client";

import { useEffect, useTransition, type CSSProperties } from "react";
import { PageError } from "@/components/ui/page-error";

/**
 * A root-layout crash removes the app's providers and global stylesheet.
 * Keep recovery provider-free, with its own document, theme and home anchor.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        className="zv-global-error"
        style={{
          "--c-50": "oklch(99% 0.004 70)",
          "--c-600": "oklch(48% 0.008 70)",
          "--c-800": "oklch(25% 0.005 70)",
          "--c-900": "oklch(15% 0.004 70)",
          "--c-canvas": "#FAFAF7",
          "--c-shade": "#F0EEE4",
          "--c-mist": "#E8E3D8",
          "--c-ink": "#1C1C1A",
          "--p-500": "oklch(53% 0.15 38)",
          "--gutter": "20px",
          "--r-full": "9999px",
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          alignItems: "center",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          background: "var(--c-canvas)",
          color: "var(--c-ink)",
        } as CSSProperties}
      >
        <title>Zavoia</title>
        <style>{`
          .zv-global-error *, .zv-global-error *::before, .zv-global-error *::after { box-sizing: border-box; }
          .zv-global-error button, .zv-global-error a { font-family: inherit; }
          .zv-global-error :focus-visible { outline: 2px solid var(--c-ink); outline-offset: 4px; }
          .zv-global-error .zv-spin { animation: global-error-spin 900ms linear infinite; }
          .zv-global-error .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
          @keyframes global-error-spin { to { transform: rotate(360deg); } }
          @media (prefers-reduced-motion: reduce) { .zv-global-error .zv-spin { animation: none; } }
        `}</style>
        <PageError
          title="We couldn't load this page / Nu am putut încărca pagina"
          description="Try loading it again, or return to the home page. Încearcă să o încarci din nou sau revino la pagina principală."
          primary={{
            label: "Try again / Încearcă din nou",
            onClick: () => startTransition(retry),
            loading: isPending,
          }}
          secondary={{ label: "Home / Acasă", href: "/", fullReload: true }}
          focusOnMount
        />
        <p role="status" aria-atomic="true" className="sr-only">
          {isPending ? "Loading / Se încarcă" : ""}
        </p>
      </body>
    </html>
  );
}
