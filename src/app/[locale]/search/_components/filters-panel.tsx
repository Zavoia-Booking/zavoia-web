"use client";

/**
 * The map's filters panel — the web twin of the mobile app's filters sheet
 * (`components/search/filters-sheet.tsx`). Same sections in the same order,
 * same semantics: edits are a DRAFT until "Show N places", so the map behind
 * stays put while the user is still deciding, and the CTA counts matches
 * against the exact set the screen will render.
 *
 * The web uses the same accessible dialog foundation as the search overlay.
 * Feature previews keep only fully visible choices interactive until expanded.
 */

import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/ui/inline-error";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/format";
import type { LocationCard, VenueTagDictionaries } from "@/lib/api/marketplace/types";
import {
  applyMapFilters,
  DISTANCE_STEPS,
  EMPTY_FILTERS,
  RATING_STEPS,
  SORT_KEYS,
  TAG_GROUPS,
  toggleTag,
  type MapFilters,
  type SortKey,
} from "@/lib/search/filters";
import styles from "./filters-panel.module.css";

const FEATURES_PREVIEW_HEIGHT = 176;
const FEATURES_FADE_HEIGHT = 64;

export interface FiltersPanelProps {
  open: boolean;
  onClose: () => void;
  /** The applied set; seeded into the draft on each open. */
  filters: MapFilters;
  onApply: (next: MapFilters) => void;
  /** The unfiltered result set — the CTA counts matches against it. */
  listings: LocationCard[];
  distanceFor: (l: LocationCard) => number | undefined;
  dictionaries: VenueTagDictionaries;
  dictionariesLoading: boolean;
  dictionariesFailed: boolean;
  dictionariesLoaded: boolean;
  onRetryDictionaries: () => void;
}

/**
 * The body is a separate component mounted only while the panel is open, so
 * "reset the draft on each open" is a fresh `useState` initializer rather than
 * a setState-in-effect: opening the panel IS the remount.
 */
export function FiltersPanel({ open, ...rest }: FiltersPanelProps) {
  if (!open) return null;
  return <FiltersPanelBody {...rest} />;
}

function FiltersPanelBody({
  onClose,
  filters,
  onApply,
  listings,
  distanceFor,
  dictionaries,
  dictionariesLoading,
  dictionariesFailed,
  dictionariesLoaded,
  onRetryDictionaries,
}: Omit<FiltersPanelProps, "open">) {
  const { dict } = useTranslation();
  const t = dict.search.filters;
  const tagLabels = dict.venueTags;

  const [draft, setDraft] = useState<MapFilters>(filters);
  // Collapsed by default — but collapsing must never hide applied picks, so a
  // group with active tags opens the FEATURES block expanded.
  const [featuresOpen, setFeaturesOpen] = useState(() =>
    TAG_GROUPS.some((g) => filters[g.key].length > 0),
  );
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const featuresId = useId();
  const featuresToggleRef = useRef<HTMLButtonElement>(null);

  const set = useCallback(
    (patch: Partial<MapFilters>) => setDraft((d) => ({ ...d, ...patch })),
    [],
  );

  // Match count for the CTA — the same single refinement stage the screen runs,
  // so the number on the button is the number of cards that appear.
  const matchCount = useMemo(
    () => applyMapFilters(listings, draft, distanceFor).length,
    [listings, draft, distanceFor],
  );

  const tagGroups = useMemo(
    () => TAG_GROUPS.filter((g) => dictionaries[g.dict].length > 0),
    [dictionaries],
  );

  const sortLabel: Record<SortKey, string> = {
    closest: t.sort.closest,
    rating: t.sort.topRated,
    newest: t.sort.newest,
  };
  const sectionLabel: Record<(typeof TAG_GROUPS)[number]["dict"], string> = {
    amenities: t.sections.amenities,
    paymentMethods: t.sections.payment,
    languages: t.sections.languages,
  };

  return (
    <DialogPrimitive.Root open onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(28,28,26,0.45)",
        cursor: "pointer",
        backdropFilter: "blur(2px)",
      }}
    >
      <DialogPrimitive.Content
        aria-describedby={undefined}
        onOpenAutoFocus={() => {
          returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus({ preventScroll: true });
        }}
        className="zv-fade"
        style={{
          width: "min(520px, 100%)",
          cursor: "default",
          maxHeight: "min(86dvh, 760px)",
          background: "var(--c-canvas)",
          borderRadius: 24,
          boxShadow: "var(--sh-xl)",
          border: "1px solid rgba(28,28,26,0.07)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          outline: "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px 6px",
          }}
        >
          <DialogPrimitive.Title asChild>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              color: "var(--c-900)",
            }}
          >
            {t.title}
          </h2>
          </DialogPrimitive.Title>
          <button
            type="button"
            className="tap"
            onClick={onClose}
            aria-label={t.close}
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              border: 0,
              background: "transparent",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="x" size={18} color="var(--c-800)" />
          </button>
        </div>

        {/* Body */}
        <div className={styles.bodyWrap}>
        <div className={styles.body}>
          <GroupLabel>{t.sortBy}</GroupLabel>
          <ChipWrap>
            {SORT_KEYS.map((key) => (
              <Choice
                key={key}
                label={sortLabel[key]}
                selected={draft.sort === key}
                onClick={() => set({ sort: key })}
              />
            ))}
          </ChipWrap>

          <GroupLabel>{t.minRating}</GroupLabel>
          <ChipWrap>
            <Choice
              label={t.any}
              selected={draft.minRating == null}
              onClick={() => set({ minRating: null })}
            />
            {RATING_STEPS.map((r) => (
              <Choice
                key={r}
                label={`${r.toFixed(1)}+`}
                icon="star"
                selected={draft.minRating === r}
                onClick={() => set({ minRating: r })}
              />
            ))}
          </ChipWrap>

          <GroupLabel>{t.distance}</GroupLabel>
          <ChipWrap>
            {DISTANCE_STEPS.map((km) => (
              <Choice
                key={km}
                label={`< ${km} km`}
                selected={draft.maxDistanceKm === km}
                onClick={() => set({ maxDistanceKm: km })}
              />
            ))}
            <Choice
              label={t.any}
              selected={draft.maxDistanceKm == null}
              onClick={() => set({ maxDistanceKm: null })}
            />
          </ChipWrap>

          <GroupLabel>{t.availability}</GroupLabel>
          <ToggleRow
            label={t.openNow}
            checked={draft.openNow}
            onChange={(v) => set({ openNow: v })}
          />
          <ToggleRow
            label={t.open247}
            help={t.open247Help}
            checked={draft.open247}
            onChange={(v) => set({ open247: v })}
            last
          />

          {!dictionariesLoaded && <>
            <GroupLabel>{t.features}</GroupLabel>
            <span role="status" className="sr-only">{dictionariesLoading ? dict.search.updating : ""}</span>
            {dictionariesFailed ? <div style={{ display: "grid", gap: 12 }}>
              <InlineError>{t.loadError}</InlineError>
              <Button kind="secondary" size="sm" loading={dictionariesLoading} onClick={onRetryDictionaries} style={{ justifySelf: "start" }}>{dict.search.retry}</Button>
            </div> : <div className={styles.featuresViewport} aria-busy={dictionariesLoading}>
              <div className={styles.featuresClip} aria-hidden="true">
                {TAG_GROUPS.map(group => <div key={group.key} className={styles.featureGroup}>
                  <div className={styles.featureHeading}>{sectionLabel[group.dict]}</div>
                  <ChipWrap><Skeleton w="34%" h={38} r={999} /><Skeleton w="45%" h={38} r={999} /></ChipWrap>
                </div>)}
              </div>
              <div className={styles.featuresFade} aria-hidden="true" />
            </div>}
          </>}
          {tagGroups.length > 0 && (
            <>
              <GroupLabel>{t.features}</GroupLabel>
              <FeaturePreview id={featuresId} expanded={featuresOpen} toggleRef={featuresToggleRef}>
                {tagGroups.map(group => (
                  <div key={group.key} className={styles.featureGroup}>
                    <div className={styles.featureHeading}>
                      {sectionLabel[group.dict]}
                    </div>
                    <ChipWrap>
                      {dictionaries[group.dict].map((tag) => (
                        <Choice
                          key={tag.id}
                          label={tagLabels[group.dict][tag.slug] ?? tag.name}
                          selected={draft[group.key].includes(tag.id)}
                          feature
                          onClick={() =>
                            setDraft((d) => toggleTag(d, group.key, tag.id))
                          }
                        />
                      ))}
                    </ChipWrap>
                  </div>
                ))}
              </FeaturePreview>
            </>
          )}
          {(tagGroups.length > 0 || (!dictionariesLoaded && !dictionariesFailed)) && (
              <button
                ref={featuresToggleRef}
                type="button"
                className={`${styles.featuresToggle} tap`}
                disabled={!dictionariesLoaded}
                aria-expanded={featuresOpen}
                aria-controls={tagGroups.length > 0 ? featuresId : undefined}
                onClick={() => setFeaturesOpen((o) => !o)}
                style={{
                  alignItems: "center",
                  gap: 6,
                  background: "transparent",
                  border: 0,
                  padding: "10px 6px 10px 0",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--c-700)",
                  fontFamily: "inherit",
                }}
              >
                {featuresOpen ? t.showLess : t.showAllFeatures}
                <span
                  style={{
                    display: "inline-flex",
                    transform: featuresOpen ? "rotate(180deg)" : "none",
                    transition: "transform 260ms var(--ease-out)",
                  }}
                >
                  <Icon name="chevD" size={16} color="var(--c-600)" />
                </span>
              </button>
          )}
        </div>
        <div className={styles.bodyFade} aria-hidden="true" />
        </div>

        {/* Footer */}
        <div
          className={styles.footer}
          style={{
            display: "flex",
            alignItems: "center",
            borderTop: "1px solid rgba(28,28,26,0.08)",
            background: "var(--c-canvas)",
          }}
        >
          <Button
            kind="secondary"
            size="md"
            style={{ height: 42, padding: "0 var(--filter-reset-padding, 22px)", fontSize: 15, fontWeight: 700, flexShrink: 0, borderColor: matchCount === 0 ? "rgba(28,28,26,0.35)" : "rgba(28,28,26,0.12)" }}
            onClick={() => { onApply(EMPTY_FILTERS); onClose(); }}
          >
            {t.reset}
          </Button>
          {/* At zero matches the honest CTA is no CTA — Reset is the way out. */}
          <Button
            kind="accent"
            size="md"
            style={{ height: 48, flex: 1, minWidth: 0, padding: "0 12px", fontSize: 16, fontWeight: 700, whiteSpace: "normal", lineHeight: 1.2, ...(matchCount === 0 ? { background: "var(--c-200)", borderColor: "var(--c-200)", color: "var(--c-600)", opacity: 1 } : {}) }}
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            disabled={matchCount === 0}
          >
            {matchCount === 0
              ? t.noMatchesCta
              : format(matchCount === 1 ? t.showPlacesOne : t.showPlaces, {
                  count: String(matchCount),
                })}
          </Button>
        </div>
      </DialogPrimitive.Content>
      </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ── Small presentational pieces ─────────────────────────────────────────────

function FeaturePreview({
  id,
  expanded,
  toggleRef,
  children,
}: {
  id: string;
  expanded: boolean;
  toggleRef: RefObject<HTMLButtonElement | null>;
  children: ReactNode;
}) {
  const clipRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  // This component mounts inside the portal, so its measured elements exist
  // even when the dialog opens after the feature vocabulary has already loaded.
  useLayoutEffect(() => {
    const clip = clipRef.current;
    const content = contentRef.current;
    if (!clip || !content) return;
    const measure = () => {
      const overflowing = content.scrollHeight > FEATURES_PREVIEW_HEIGHT + 8;
      clip.style.maxHeight = expanded || !overflowing ? "none" : `${FEATURES_PREVIEW_HEIGHT}px`;
      if (fadeRef.current) fadeRef.current.hidden = expanded || !overflowing;
      if (toggleRef.current) toggleRef.current.hidden = !overflowing;
      const top = content.getBoundingClientRect().top;
      const visibleHeight = FEATURES_PREVIEW_HEIGHT - FEATURES_FADE_HEIGHT;
      for (const choice of content.querySelectorAll<HTMLButtonElement>("[data-feature-choice]")) {
        const hidden = !expanded && overflowing && choice.getBoundingClientRect().bottom - top > visibleHeight + .5;
        choice.inert = hidden;
        choice.tabIndex = hidden ? -1 : 0;
        choice.setAttribute("aria-hidden", String(hidden));
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    observer.observe(clip);
    return () => observer.disconnect();
  }, [expanded, children, toggleRef]);

  return (
    <div className={styles.featuresViewport}>
      <div ref={clipRef} id={id} className={styles.featuresClip}>
        <div ref={contentRef}>{children}</div>
      </div>
      <div ref={fadeRef} className={styles.featuresFade} aria-hidden="true" />
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--c-600)",
        marginTop: 22,
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function ChipWrap({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      {children}
    </div>
  );
}

function Choice({
  label,
  icon,
  selected,
  onClick,
  feature = false,
}: {
  label: string;
  icon?: "star";
  selected: boolean;
  onClick: () => void;
  feature?: boolean;
}) {
  return (
    <button
      type="button"
      className="tap"
      onClick={(event) => { if (!event.currentTarget.inert) onClick(); }}
      data-feature-choice={feature || undefined}
      aria-pressed={selected}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 38,
        maxWidth: "100%",
        padding: "0 16px",
        borderRadius: 999,
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 700,
        fontFamily: "inherit",
        background: selected ? "var(--c-ink)" : "#fff",
        color: selected ? "#fff" : "var(--c-800)",
        border: selected
          ? "1px solid var(--c-ink)"
          : "1px solid rgba(28,28,26,0.10)",
      }}
    >
      {icon === "star" && (
        <Icon name="star" size={13} color={selected ? "#fff" : "var(--c-700)"} />
      )}
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </button>
  );
}

function ToggleRow({
  label,
  help,
  checked,
  onChange,
  last = false,
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  const labelId = useId();
  const helpId = useId();
  return (
    <div className={styles.toggleRow} data-last={last || undefined}>
      <span className={styles.toggleText}>
        <span id={labelId} className={styles.toggleLabel}>
          {label}
        </span>
        {help && (
          <span id={helpId} className={styles.toggleHelp}>
            {help}
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={help ? helpId : undefined}
        className={`${styles.switchButton} tap`}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.switchTrack} aria-hidden="true">
          <span className={styles.switchThumb} />
        </span>
      </button>
    </div>
  );
}
