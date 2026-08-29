"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";

/**
 * Inline failure notice for a data-backed home band whose server-side fetch
 * failed — as opposed to one that succeeded with zero rows. Without this,
 * a failed band and a genuinely empty one are pixel-identical: both just
 * vanish (CategoryRail/EditorsPick return null; BrandsSection's own "empty"
 * copy is for a real empty result, not an outage) and a backend hiccup on
 * the highest-traffic page reads as "we have nothing here".
 *
 * `router.refresh()` re-runs the page's server components — including the
 * failed fetch — in place, without a full reload or losing state elsewhere
 * on the page (e.g. the hero's in-progress typewriter).
 */
export function SectionFailed({
  paddingTop,
  onRetry,
}: {
  paddingTop: number;
  /**
   * For a band that fetches on the CLIENT. `router.refresh()` re-runs server
   * components only, so it would do nothing for those — they pass their own
   * refetch here instead.
   */
  onRetry?: () => void;
}) {
  const router = useRouter();
  const { dict } = useTranslation();
  const e = dict.errors;

  return (
    <section className="zw-container" style={{ paddingTop }}>
      <p style={{ margin: 0, fontSize: 14, color: "var(--c-600)" }}>
        {e.sectionFailed}{" "}
        <button
          type="button"
          className="tap"
          onClick={() => (onRetry ? onRetry() : router.refresh())}
          style={{
            background: "transparent",
            border: 0,
            padding: 0,
            cursor: "pointer",
            fontWeight: 600,
            color: "var(--c-900)",
            textDecoration: "underline",
          }}
        >
          {e.reload}
        </button>
      </p>
    </section>
  );
}
