"use client";

import { pageWindow } from "@/lib/blog";
import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import type { BlogTab } from "@/lib/blog/categories";
import { blogIndexHref } from "@/lib/blog/listing";
import { useTranslation } from "@/i18n/useTranslation";
import { Icon } from "@/components/ui/icon";
import styles from "./blog-list.module.css";

export interface PaginationProps {
  locale: Locale;
  category: BlogTab;
  page: number;
  totalPages: number;
}

export function Pagination({ locale, category, page, totalPages }: PaginationProps) {
  const { dict } = useTranslation();
  if (totalPages <= 1) return null;
  const href = (next: number) => `${blogIndexHref(locale, category, next)}#blog-results`;
  const previous = <><Icon name="chevL" size={16} /><span className={styles.pageLabel}>{dict.blog.prev}</span></>;
  const next = <><span className={styles.pageLabel}>{dict.blog.next}</span><Icon name="chevR" size={16} /></>;
  const arrowClass = `${styles.pageButton} ${styles.pageArrow}`;

  return (
    <nav className={styles.pagination} aria-label={dict.blog.paginationLabel}>
      {page > 0 ? (
        <Link href={href(page - 1)} className={arrowClass} aria-label={dict.blog.prev} rel="prev">{previous}</Link>
      ) : <span className={arrowClass} aria-disabled="true" aria-label={dict.blog.prev}>{previous}</span>}
      {pageWindow(page, totalPages).map((number, index) => number === "gap" ? (
        <span key={`gap-${index}`} className={styles.pageGap} aria-hidden="true">…</span>
      ) : (
        number === page ? <span
          key={number}
          className={styles.pageButton}
          data-number=""
          aria-current="page"
          aria-label={`${dict.blog.pageLabel} ${number + 1}`}
        >{String(number + 1).padStart(2, "0")}</span> : <Link
          key={number}
          href={href(number)}
          className={styles.pageButton}
          data-number=""
          aria-label={`${dict.blog.pageLabel} ${number + 1}`}
        >
          {String(number + 1).padStart(2, "0")}
        </Link>
      ))}
      {page < totalPages - 1 ? (
        <Link href={href(page + 1)} className={arrowClass} aria-label={dict.blog.next} rel="next">{next}</Link>
      ) : <span className={arrowClass} aria-disabled="true" aria-label={dict.blog.next}>{next}</span>}
    </nav>
  );
}
