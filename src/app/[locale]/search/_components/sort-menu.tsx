"use client";

import { useState, type CSSProperties } from "react";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/i18n/useTranslation";
import { EMPTY_FILTERS, SORT_KEYS, type SortKey } from "@/lib/search/filters";

export interface SortMenuProps {
  sort: SortKey;
  setSort: (s: SortKey) => void;
  /** Hides "Closest" when there's no anchor to measure distance from. */
  allowClosest: boolean;
}

// Sort dropdown — the quick-access twin of the filters panel's SORT BY section.
// Both write the same `MapFilters.sort`, so the two controls can never disagree.
// Keys match the mobile app's (closest · top rated · newest).
export function SortMenu({ sort, setSort, allowClosest }: SortMenuProps) {
  const { dict } = useTranslation();
  const t = dict.search;
  const [open, setOpen] = useState(false);

  const label: Record<SortKey, string> = {
    closest: t.filters.sort.closest,
    rating: t.filters.sort.topRated,
    newest: t.filters.sort.newest,
  };
  const opts = SORT_KEYS.filter(
    (id) => id !== "closest" || allowClosest,
  ).map((id) => ({ id, label: label[id] }));
  const current = opts.find((o) => o.id === sort);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="tap"
        onClick={() => setOpen((o) => !o)}
        aria-label={t.sortLabel}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "transparent",
          border: 0,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--c-700)",
          padding: "6px 2px",
        }}
      >
        <Icon name="sliders" size={14} color="var(--c-700)" />
        {current?.label ?? t.sortLabel}
        <Icon name="chevD" size={13} color="var(--c-600)" />
      </button>
      {open && (
        <div
          className="zv-fade"
          style={{
            position: "absolute",
            right: 0,
            top: "110%",
            zIndex: 30,
            background: "#fff",
            borderRadius: 14,
            boxShadow: "var(--sh-lg)",
            border: "1px solid rgba(28,28,26,0.07)",
            padding: 6,
            minWidth: 170,
          }}
        >
          {opts.map((o) => {
            const rowStyle: CSSProperties = {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              border: 0,
              background: "transparent",
              cursor: "pointer",
              padding: "9px 12px",
              borderRadius: 9,
              fontSize: 13.5,
              fontWeight: o.id === sort ? 600 : 500,
              color: "var(--c-900)",
            };
            return (
              <button
                type="button"
                key={o.id}
                className="tap zw-hover-row"
                onClick={() => {
                  setSort(o.id === sort ? EMPTY_FILTERS.sort : o.id);
                  setOpen(false);
                }}
                style={rowStyle}
              >
                {o.label}
                {o.id === sort && (
                  <Icon name="check" size={14} color="var(--p-600)" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
