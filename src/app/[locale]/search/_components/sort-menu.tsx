"use client";

import { useState, type CSSProperties } from "react";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/i18n/useTranslation";

export type SortId = "rec" | "rating" | "near";

export interface SortMenuProps {
  sort: SortId;
  setSort: (s: SortId) => void;
  /** Hides "Nearest" when there's no lat/lng to sort by. */
  allowNearest: boolean;
}

// Sort dropdown — ported from ZwSortMenu (docs/web-search.jsx). Labels i18n'd.
// "rec" is the unlabelled default (server relevance order): the trigger shows
// the generic "Sort" label and re-clicking the active option clears back to it.
export function SortMenu({ sort, setSort, allowNearest }: SortMenuProps) {
  const { dict } = useTranslation();
  const t = dict.search;
  const [open, setOpen] = useState(false);

  const opts: { id: SortId; label: string }[] = [
    { id: "rating", label: t.sortTopRated },
    ...(allowNearest
      ? [{ id: "near" as SortId, label: t.sortNearest }]
      : []),
  ];
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
                  setSort(o.id === sort ? "rec" : o.id);
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
