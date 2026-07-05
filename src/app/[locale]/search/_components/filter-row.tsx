"use client";

import { Chip } from "@/components/ui/chip";
import { CatDot } from "@/components/ui/cat-dot";
import { taxonomyLabel, toCat } from "@/lib/marketplace/card-mappers";
import { useTranslation } from "@/i18n/useTranslation";
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
}

// Filter chip row — "All" + the first industries from the taxonomy, plus
// Open-now / Available-today toggles. Ported from ZwFilterRow.
export function FilterRow({
  industries,
  activeSlug,
  onSelectIndustry,
  openNow,
  onToggleOpenNow,
  availableToday,
  onToggleAvailableToday,
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
    </div>
  );
}
