"use client";

/**
 * The map's filters panel — the web twin of the mobile app's filters sheet
 * (`components/search/filters-sheet.tsx`). Same sections in the same order,
 * same semantics: edits are a DRAFT until "Show N places", so the map behind
 * stays put while the user is still deciding, and the CTA counts matches
 * against the exact set the screen will render.
 *
 * The web differences are presentational only: a centered dialog instead of a
 * bottom sheet, and a `<details>`-free manual disclosure for the tag block so
 * the collapsed peek can be animated with plain CSS.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/dictionaries";
import type { LocationCard, VenueTagDictionaries } from "@/lib/api/marketplace/types";
import {
  applyMapFilters,
  countActiveFilters,
  DISTANCE_STEPS,
  EMPTY_FILTERS,
  RATING_STEPS,
  SORT_KEYS,
  TAG_GROUPS,
  toggleTag,
  type MapFilters,
  type SortKey,
} from "@/lib/search/filters";

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
  const dialogRef = useRef<HTMLDivElement>(null);

  // Escape closes, and focus moves into the dialog so the panel is operable
  // from the keyboard the moment it appears.
  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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

  const draftCount = countActiveFilters(draft);

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
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(28,28,26,0.45)",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        tabIndex={-1}
        className="zv-fade"
        style={{
          width: "min(520px, 100%)",
          maxHeight: "min(86vh, 760px)",
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
            padding: "18px 20px 10px",
          }}
        >
          <span
            style={{
              fontSize: 21,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              color: "var(--c-900)",
            }}
          >
            {t.title}
          </span>
          <button
            type="button"
            className="tap"
            onClick={onClose}
            aria-label={t.close}
            style={{
              width: 32,
              height: 32,
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
        <div
          className="zw-scroll-y"
          style={{ flex: 1, padding: "0 20px 24px", minHeight: 0 }}
        >
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
          />

          {tagGroups.length > 0 && (
            <>
              <GroupLabel>{t.features}</GroupLabel>
              <div
                style={{
                  borderLeft: "1px solid rgba(28,28,26,0.12)",
                  paddingLeft: 16,
                  maxHeight: featuresOpen ? 2000 : 176,
                  overflow: "hidden",
                  // Height is animated against a generous cap rather than a
                  // measured value — the block is short enough that the eased
                  // overshoot isn't perceptible, and it needs no layout probe.
                  transition: "max-height .32s var(--ease-soft)",
                  maskImage: featuresOpen
                    ? undefined
                    : "linear-gradient(to bottom, #000 60%, transparent 100%)",
                }}
              >
                {tagGroups.map((group, i) => (
                  <div key={group.key}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10.5,
                        fontWeight: 600,
                        letterSpacing: "0.09em",
                        textTransform: "uppercase",
                        color: "var(--c-500)",
                        marginTop: i === 0 ? 2 : 18,
                        marginBottom: 9,
                      }}
                    >
                      {sectionLabel[group.dict]}
                    </div>
                    <ChipWrap tight>
                      {dictionaries[group.dict].map((tag) => (
                        <Choice
                          key={tag.id}
                          label={tagLabels[group.dict][tag.slug] ?? tag.name}
                          selected={draft[group.key].includes(tag.id)}
                          onClick={() =>
                            setDraft((d) => toggleTag(d, group.key, tag.id))
                          }
                        />
                      ))}
                    </ChipWrap>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="tap"
                onClick={() => setFeaturesOpen((o) => !o)}
                style={{
                  marginTop: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: "transparent",
                  border: 0,
                  padding: "4px 0",
                  cursor: "pointer",
                  fontSize: 13,
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
                    transition: "transform .25s var(--ease-soft)",
                  }}
                >
                  <Icon name="chevD" size={16} color="var(--c-600)" />
                </span>
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 20px",
            borderTop: "1px solid rgba(28,28,26,0.08)",
            background: "var(--c-canvas)",
          }}
        >
          <Button
            kind="ghost"
            size="md"
            onClick={() => setDraft(EMPTY_FILTERS)}
            disabled={draftCount === 0}
          >
            {t.reset}
          </Button>
          <div style={{ flex: 1 }} />
          {/* At zero matches the honest CTA is no CTA — Reset is the way out. */}
          <Button
            kind="primary"
            size="md"
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
      </div>
    </div>
  );
}

// ── Small presentational pieces ─────────────────────────────────────────────

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
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

function ChipWrap({
  children,
  tight,
}: {
  children: React.ReactNode;
  tight?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: tight ? 7 : 8,
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
}: {
  label: string;
  icon?: "star";
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="tap"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "8px 13px",
        borderRadius: 999,
        cursor: "pointer",
        fontSize: 13.5,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        fontFamily: "inherit",
        background: selected ? "var(--c-ink)" : "#fff",
        color: selected ? "#fff" : "var(--c-800)",
        border: selected
          ? "1px solid var(--c-ink)"
          : "1px solid rgba(28,28,26,0.12)",
      }}
    >
      {icon === "star" && (
        <Icon name="star" size={13} color={selected ? "#fff" : "var(--c-700)"} />
      )}
      {label}
    </button>
  );
}

function ToggleRow({
  label,
  help,
  checked,
  onChange,
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: help ? "flex-start" : "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "11px 0",
        borderBottom: "1px solid rgba(28,28,26,0.07)",
        cursor: "pointer",
      }}
    >
      <span style={{ display: "grid", gap: 2 }}>
        <span style={{ fontSize: 14.5, fontWeight: 500, color: "var(--c-900)" }}>
          {label}
        </span>
        {help && (
          <span style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--c-600)" }}>
            {help}
          </span>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          width: 18,
          height: 18,
          accentColor: "var(--c-ink)",
          cursor: "pointer",
          flexShrink: 0,
          marginTop: help ? 2 : 0,
        }}
      />
    </label>
  );
}
