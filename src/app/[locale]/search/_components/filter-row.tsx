"use client";

import { Chip } from "@/components/ui/chip";
import { CatDot } from "@/components/ui/cat-dot";
import { taxonomyLabel, toCat } from "@/lib/marketplace/card-mappers";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/dictionaries";
import type { Industry } from "@/lib/api/marketplace/types";

export interface FilterRowProps {
  industries: Industry[];
  /** Active industry slug, or null for "All". */
  activeSlug: string | null;
  onSelectIndustry: (slug: string | null) => void;
  openNow: boolean;
  onToggleOpenNow: () => void;
  availableToday: boolean;
  onToggleAvailableToday: () => void;
  /** Applied refinement count — shown as a badge on the Filters button. */
  activeFilterCount: number;
  onOpenFilters: () => void;
}

// Filter chip row — "All" + the first industries from the taxonomy, the two
// quick toggles, and the button opening the full filters panel. Open-now is a
// shortcut into the same MapFilters set the panel edits, so the chip and the
// panel's switch always agree.
export function FilterRow({
  industries,
  activeSlug,
  onSelectIndustry,
  openNow,
  onToggleOpenNow,
  availableToday,
  onToggleAvailableToday,
  activeFilterCount,
  onOpenFilters,
}: FilterRowProps) {
  const { dict, locale } = useTranslation();
  const t = dict.search;
  const cats = industries.slice(0, 6);

  return (
    <div className="zw-scroll-x" style={{ gap: 8, padding: "2px 2px 4px" }}>
      <Chip active={!activeSlug} onClick={() => onSelectIndustry(null)}>
        {t.filterAll}
      </Chip>
      {cats.map((c) => (
        <Chip
          key={c.id}
          active={activeSlug === c.slug}
          onClick={() =>
            onSelectIndustry(activeSlug === c.slug ? null : c.slug)
          }
        >
          <CatDot cat={toCat(c)} size={6} />
          {taxonomyLabel(c, locale)}
        </Chip>
      ))}
      <span
        aria-hidden="true"
        style={{
          width: 1,
          background: "rgba(28,28,26,0.10)",
          flexShrink: 0,
          margin: "4px 2px",
        }}
      />
      <Chip active={openNow} onClick={onToggleOpenNow}>
        {t.filterOpenNow}
      </Chip>
      <Chip active={availableToday} onClick={onToggleAvailableToday}>
        {t.filterAvailableToday}
      </Chip>
      <Chip
        active={activeFilterCount > 0}
        onClick={onOpenFilters}
        icon="sliders"
        ariaLabel={
          activeFilterCount > 0
            ? format(t.filters.activeLabel, { count: String(activeFilterCount) })
            : t.filters.title
        }
      >
        {t.filters.title}
        {activeFilterCount > 0 && (
          <span
            aria-hidden="true"
            style={{
              minWidth: 17,
              height: 17,
              padding: "0 4px",
              borderRadius: 999,
              background: "#fff",
              color: "var(--c-ink)",
              fontSize: 11,
              fontWeight: 700,
              lineHeight: "17px",
              textAlign: "center",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {activeFilterCount}
          </span>
        )}
      </Chip>
    </div>
  );
}
