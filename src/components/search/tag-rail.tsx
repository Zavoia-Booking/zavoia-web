"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/i18n/useTranslation";
import { taxonomyLabel } from "@/lib/marketplace/card-mappers";
import {
  industryAccent,
  industryIcon,
  resolveIndustrySlug,
} from "@/lib/marketplace/industry-visuals";
import {
  currentDaySeed,
  industryTeaserChips,
} from "@/lib/marketplace/industry-teaser";
import type { Industry } from "@/lib/api/marketplace/types";

/**
 * The map's browse rail — a short teaser of suggested tags floating over the
 * map, plus a "More" chip that opens the full catalog.
 *
 * Discovery only. It carries NO applied state: the search bar names the active
 * pick and refinements live behind the filters button, so a chip here is a jump
 * (it replaces the query), never a toggle. The parent hides the rail entirely
 * once a search is running — see `active` — because at that point the bar
 * already says what is being searched and the rail has nothing to add.
 *
 * Ported from the RN app's `CategoryChipRow`.
 */

/** The rail teases this many tags; the full 70+ catalog lives behind "More". */
const TEASER_COUNT = 5;
/** The header's clock — rail, pill and filter button move together on it. */
const TRANSITION_MS = 200;
const EASE = "cubic-bezier(.23, 1, .32, 1)";

export interface TagRailProps {
  industries: Industry[];
  /** Jump the search to one tag (clearing any free text). */
  onPick: (industry: Industry, tagId: number) => void;
  /** Opens the full tag catalog. */
  onMore: () => void;
  /**
   * A search is running. The rail steps aside — height to 0, faded, lifted 8px
   * — rather than sitting there competing with the query the user just made.
   */
  hidden?: boolean;
}

export function TagRail({
  industries,
  onPick,
  onMore,
  hidden = false,
}: TagRailProps) {
  const { dict, locale } = useTranslation();
  const t = dict.search;

  // The shuffle is seeded on the day number, so a server rendering just before
  // midnight and a client hydrating just after would disagree. The server (and
  // the hydrating pass) render seed 0 — a fixed, valid order — and the real
  // day's order lands on the first client pass, one paint later, before anyone
  // can read the rail.
  const daySeed = useSyncExternalStore(
    subscribeNever,
    currentDaySeed,
    serverDaySeed,
  );

  const chips = useMemo(
    () => industryTeaserChips(industries, daySeed).slice(0, TEASER_COUNT),
    [industries, daySeed],
  );

  if (chips.length === 0) return null;

  return (
    <div
      // Collapsing the height (not just the opacity) is what lets whatever sits
      // under the rail close the gap on the same clock.
      style={{
        maxHeight: hidden ? 0 : 48,
        opacity: hidden ? 0 : 1,
        transform: `translateY(${hidden ? -8 : 0}px)`,
        overflow: "hidden",
        transition: `max-height ${TRANSITION_MS}ms ${EASE}, opacity ${TRANSITION_MS}ms ${EASE}, transform ${TRANSITION_MS}ms ${EASE}`,
        pointerEvents: hidden ? "none" : "auto",
      }}
      aria-hidden={hidden}
    >
      <div
        className="zw-scroll-x"
        // Full-bleed: the rail scrolls off both edges rather than ending in a
        // hard margin, so it reads as a strip over the map, not a boxed row.
        style={{ gap: 8, padding: "6px 12px 8px" }}
      >
        {chips.map(({ industry, tag }) => {
          const slug = resolveIndustrySlug(industry.slug);
          return (
            <button
              key={tag.id}
              type="button"
              className="tap"
              onClick={() => onPick(industry, tag.id)}
              style={chipStyle}
            >
              <Icon name={industryIcon(slug)} size={14} color={industryAccent(slug)} />
              {taxonomyLabel(tag, locale)}
            </button>
          );
        })}
        <button type="button" className="tap" onClick={onMore} style={chipStyle}>
          <Icon name="grid" size={14} color="var(--c-600)" />
          {t.browseMore}
        </button>
      </div>
    </div>
  );
}

/** The rail's order never changes after mount, so there is nothing to watch. */
const subscribeNever = () => () => {};
/** A fixed seed for the server pass, so SSR and hydration always agree. */
const serverDaySeed = () => 0;

const chipStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  height: 34,
  padding: "0 12px",
  borderRadius: 9999,
  background: "#FEFBF9",
  border: "1px solid rgba(28,28,26,0.05)",
  boxShadow: "var(--sh-md)",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--c-700)",
  whiteSpace: "nowrap",
  flexShrink: 0,
  cursor: "pointer",
} as const;
