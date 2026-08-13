"use client";

// Bundled faces the microsite's fixed body/label stacks reference by family name
// ("Geist Variable" / "Geist Mono Variable") — same packages admin-dashboard bundles.
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";

import { useMemo } from "react";
import { LivePreview } from "@/features/website/components/builder/preview/Microsite";
import { fontStylesheetFor } from "@/features/website/components/builder/theme";
import { buildMicrositeRender } from "@/features/website/publicWebsite";
import type { MicrositeLocale } from "@/features/website/i18n/translate";
import type { PublicWebsite } from "@/lib/api/marketplace/types";

/**
 * Client shell for the published business microsite.
 *
 * The copied renderer was built for the dashboard's full-page preview dialog, whose
 * scroll chrome (nav frost, marquee glide, editorial footer reveal) rides the nearest
 * scrollable ancestor via findScrollParent. The viewport-height scroller below
 * recreates exactly that environment on the public page, so the sticky nav, pinned
 * footer and scroll-driven effects behave 1:1 with the builder preview.
 */
export function BusinessMicrosite({
  site,
  locale,
}: {
  site: PublicWebsite;
  locale: MicrositeLocale;
}) {
  const { layout, data } = useMemo(
    () => buildMicrositeRender(site, locale),
    [site, locale],
  );

  // Premium display faces load exactly like the dashboard preview: a lazy,
  // selection-driven Google Fonts stylesheet (bundled faces need no link).
  const fontHref = fontStylesheetFor(data.fontKey);

  return (
    <main style={{ height: "100dvh", overflowY: "auto", overflowX: "hidden" }}>
      {fontHref && (
        <>
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          {/* precedence opts into React 19 hoisting so the stylesheet lands in <head>. */}
          <link rel="stylesheet" href={fontHref} precedence="default" />
        </>
      )}
      <LivePreview layout={layout} data={data} chrome />
    </main>
  );
}
