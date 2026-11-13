"use client";

import { pageWindow } from "@/lib/blog";
import { useTranslation } from "@/i18n/useTranslation";
import { Icon } from "@/components/ui/icon";
import styles from "./blog-list.module.css";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const { dict } = useTranslation();
  if (totalPages <= 1) return null;
  const go = (next: number) => {
    if (next >= 0 && next < totalPages && next !== page) onChange(next);
  };

  return (
    <nav className={styles.pagination} aria-label={dict.blog.paginationLabel}>
      <button
        type="button"
        className={`${styles.pageButton} ${styles.pageArrow}`}
        onClick={() => go(page - 1)}
        disabled={page === 0}
        aria-label={dict.blog.prev}
      >
        <Icon name="chevL" size={16} />
        <span className={styles.pageLabel}>{dict.blog.prev}</span>
      </button>
      {pageWindow(page, totalPages).map((number, index) => number === "gap" ? (
        <span key={`gap-${index}`} className={styles.pageGap} aria-hidden="true">…</span>
      ) : (
        <button
          key={number}
          type="button"
          className={styles.pageButton}
          data-number=""
          aria-current={number === page ? "page" : undefined}
          aria-label={`${dict.blog.pageLabel} ${number + 1}`}
          onClick={() => go(number)}
        >
          {String(number + 1).padStart(2, "0")}
        </button>
      ))}
      <button
        type="button"
        className={`${styles.pageButton} ${styles.pageArrow}`}
        onClick={() => go(page + 1)}
        disabled={page === totalPages - 1}
        aria-label={dict.blog.next}
      >
        <span className={styles.pageLabel}>{dict.blog.next}</span>
        <Icon name="chevR" size={16} />
      </button>
    </nav>
  );
}
