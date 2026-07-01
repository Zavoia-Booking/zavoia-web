"use client";

import { pageWindow } from "@/lib/blog";
import { useTranslation } from "@/i18n/useTranslation";
import { Icon } from "@/components/ui/icon";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}

// Numbered pagination with a windowed ellipsis. Ported from ZwPagination
// (docs/web-blog.jsx:125-149), using the slice-1 `pageWindow` helper. Page
// indices are 0-based. Returns null when there is a single page.
export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const { dict } = useTranslation();
  if (totalPages <= 1) return null;

  const go = (p: number) => {
    if (p >= 0 && p < totalPages && p !== page) onChange(p);
  };

  return (
    <nav className="zw-pag" aria-label="Stories pagination">
      <button
        type="button"
        className="zw-pag-btn zw-pag-arrow"
        onClick={() => go(page - 1)}
        disabled={page === 0}
        aria-label={dict.blog.prev}
      >
        <Icon name="chevL" size={15} />
        <span className="zw-pag-lbl">{dict.blog.prev}</span>
      </button>
      {pageWindow(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span key={`g${i}`} className="zw-pag-gap" aria-hidden="true">
            ···
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className="zw-pag-btn"
            data-on={p === page ? "1" : "0"}
            aria-current={p === page ? "page" : undefined}
            aria-label={`${dict.blog.pageLabel} ${p + 1}`}
            onClick={() => go(p)}
          >
            {String(p + 1).padStart(2, "0")}
          </button>
        ),
      )}
      <button
        type="button"
        className="zw-pag-btn zw-pag-arrow"
        onClick={() => go(page + 1)}
        disabled={page === totalPages - 1}
        aria-label={dict.blog.next}
      >
        <span className="zw-pag-lbl">{dict.blog.next}</span>
        <Icon name="chevR" size={15} />
      </button>
    </nav>
  );
}
