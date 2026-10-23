"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/format";
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
import styles from "./tag-rail.module.css";

/**
 * The map's browse rail — a short teaser of suggested tags floating over the
 * map, plus a "More" chip that opens the full catalog.
 *
 * Browse suggestions become a removable selection once a service, industry or
 * text search is applied. The selection sits alone in the center of the row.
 *
 * Ported from the RN app's `CategoryChipRow`.
 */

export interface TagRailProps {
  industries: Industry[];
  /** Jump the search to one tag (clearing any free text). */
  onPick: (industry: Industry, tagId: number) => void;
  /** Opens the full tag catalog. */
  onMore: () => void;
  activeSelection?: { label: string; industrySlug?: string };
  onClear: () => void;
  /**
   * The expanded mobile sheet owns the screen, so map controls step aside.
   */
  hidden?: boolean;
}

export function TagRail({
  industries,
  onPick,
  onMore,
  activeSelection,
  onClear,
  hidden = false,
}: TagRailProps) {
  const { dict, locale } = useTranslation();
  const t = dict.search;
  const railRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const measurementRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const selectionRef = useRef<HTMLButtonElement>(null);
  const selectFocusRef = useRef(false);
  const restoreFocusRef = useRef(false);
  const [visibleCount, setVisibleCount] = useState(0);
  // Keep the last label for the outgoing visual layer. It becomes inert and
  // leaves the accessibility tree as soon as the actual selection is cleared.
  const [displaySelection, setDisplaySelection] = useState(activeSelection);
  if (activeSelection && (
    activeSelection.label !== displaySelection?.label
    || activeSelection.industrySlug !== displaySelection?.industrySlug
  )) setDisplaySelection(activeSelection);

  useLayoutEffect(() => {
    const target = !activeSelection && restoreFocusRef.current ? moreRef
      : activeSelection && (selectFocusRef.current || rowRef.current?.contains(document.activeElement)) ? selectionRef
      : null;
    if (!target) return;
    restoreFocusRef.current = false;
    selectFocusRef.current = false;
    // Let the browser apply the incoming layer's inert/visibility changes and
    // finish the navigation's own focus handling before handing focus across.
    const frame = requestAnimationFrame(() => {
      if (!target.current?.closest("[inert]")) target.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [activeSelection]);

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
    () => industryTeaserChips(industries, daySeed).map(({ industry, tag }) => ({
      industry,
      tag,
      slug: resolveIndustrySlug(industry.slug),
      label: taxonomyLabel(tag, locale, dict.industryTags),
    })),
    [industries, daySeed, locale, dict.industryTags],
  );
  const hasRail = chips.length > 0 || !!activeSelection;

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    // Capture input from the catalog/header too. Keyboard changes are instant;
    // pointer changes use interruptible CSS transitions, without render timers.
    const pointer = () => { rail.dataset.input = "pointer"; };
    const keyboard = () => { rail.dataset.input = "keyboard"; };
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("keydown", keyboard, true);
    return () => {
      document.removeEventListener("pointerdown", pointer, true);
      document.removeEventListener("keydown", keyboard, true);
    };
  }, [hasRail]);

  useLayoutEffect(() => {
    const row = rowRef.current;
    const measurement = measurementRef.current;
    if (!row || !measurement) return;
    const measure = () => {
      const style = getComputedStyle(row);
      const available = row.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const gap = parseFloat(style.columnGap);
      const widths = Array.from(measurement.children, child => child.getBoundingClientRect().width);
      // Reserve More first, then expose a prefix of the same shuffled order.
      // Measuring localized labels also handles zoom and late-loading fonts.
      let used = widths[widths.length - 1] ?? 0;
      let count = 0;
      for (const width of widths.slice(0, -1)) {
        if (used + gap + width > available) break;
        used += gap + width;
        count += 1;
      }
      const buttons = Array.from(row.querySelectorAll("button"));
      const focusedIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
      if (focusedIndex >= count && focusedIndex < buttons.length - 1) {
        buttons[buttons.length - 1]?.focus({ preventScroll: true });
      }
      setVisibleCount(previous => previous === count ? previous : count);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    observer.observe(measurement);
    return () => observer.disconnect();
  }, [chips, t.browseMore]);

  if (!hasRail) return null;

  return (
    <div
      ref={railRef}
      className={styles.rail}
      data-service-rail
      data-hidden={hidden}
      role="group"
      aria-label={dict.searchOverlay.browseByIndustry}
      aria-hidden={hidden}
      inert={hidden}
    >
      <div
        ref={rowRef}
        className={`${styles.layer} ${styles.suggestions}`}
        data-active={!activeSelection}
        aria-hidden={!!activeSelection}
        inert={!!activeSelection}
      >
        {chips.slice(0, visibleCount).map(({ industry, tag, slug, label }) => {
          return (
            <button
              key={`${industry.id}-${tag.id}`}
              type="button"
              className="tap"
              onClick={() => {
                selectFocusRef.current = true;
                onPick(industry, tag.id);
              }}
              style={chipStyle}
            >
              <Icon name={industryIcon(slug)} size={14} color={industryAccent(slug)} />
              {label}
            </button>
          );
        })}
        <button ref={moreRef} type="button" className="tap" aria-haspopup="dialog" onClick={onMore} style={chipStyle}>
          <Icon name="grid" size={14} color="var(--c-600)" />
          {t.browseMore}
        </button>
      </div>
      <div
        className={`${styles.layer} ${styles.selection}`}
        data-active={!!activeSelection}
        aria-hidden={!activeSelection}
        inert={!activeSelection}
      >
        {displaySelection && <button
          ref={selectionRef}
          type="button"
          className={`tap ${styles.selectionButton}`}
          data-selection-clear
          aria-label={format(t.clearSelection, { selection: displaySelection.label })}
          onClick={() => {
            restoreFocusRef.current = true;
            onClear();
          }}
          style={{ ...chipStyle, height: 44, minWidth: 0, maxWidth: "min(520px, 100%)", flexShrink: 1, fontWeight: 600, color: "var(--c-900)" }}
        >
          <Icon name={displaySelection.industrySlug ? industryIcon(displaySelection.industrySlug) : "search"} size={16} color={displaySelection.industrySlug ? industryAccent(displaySelection.industrySlug) : "var(--c-600)"} style={{ flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displaySelection.label}</span>
          <Icon name="x" size={16} style={{ flexShrink: 0, marginLeft: 4 }} />
        </button>}
      </div>
      <div
        ref={measurementRef}
        aria-hidden="true"
        inert
        style={{ position: "absolute", top: 0, left: 0, display: "flex", width: "max-content", gap: 8, visibility: "hidden", pointerEvents: "none" }}
      >
        {chips.map(({ industry, tag, slug, label }) => (
          <span key={`${industry.id}-${tag.id}`} style={chipStyle}>
            <Icon name={industryIcon(slug)} size={14} color={industryAccent(slug)} />
            {label}
          </span>
        ))}
        <span style={chipStyle}><Icon name="grid" size={14} />{t.browseMore}</span>
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
