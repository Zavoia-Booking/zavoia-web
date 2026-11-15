"use client";

import Link, { useLinkStatus } from "next/link";
import { CATEGORY_ORDER, categoryLabelKey, type BlogTab } from "@/lib/blog";
import { blogIndexHref } from "@/lib/blog/listing";
import type { Locale } from "@/i18n/locales";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/format";
import { Spinner } from "@/components/ui/spinner";
import { Icon } from "@/components/ui/icon";
import { BlogCategoryArtwork } from "./category-artwork";
import styles from "./blog-category-nav.module.css";

interface BlogCategoryNavProps {
  locale: Locale;
  active: BlogTab;
}

function CategoryLinkIndicator({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  const { dict } = useTranslation();
  return (
    <>
      <span className={styles.linkIcon} aria-hidden="true">
        {pending ? <Spinner size={18} color="currentColor" /> : <Icon name="arrowR" size={18} />}
      </span>
      <span className="sr-only" role="status" aria-atomic="true">
        {pending ? format(dict.blog.navigationPending, { category: label }) : ""}
      </span>
    </>
  );
}

/** Illustrated destinations below the archive, excluding its selected category. */
export function BlogCategoryNav({ locale, active }: BlogCategoryNavProps) {
  const { dict } = useTranslation();
  const categories = CATEGORY_ORDER.filter((category) => category !== active);

  return (
    <nav className={styles.directory} aria-label={dict.blog.categoryNavigationLabel}>
      <ul className={styles.directoryList} data-count={categories.length}>
        {categories.map((category) => {
          const label = dict.blog[categoryLabelKey(category)];
          const titleId = `blog-category-${category}-title`;
          const summaryId = `blog-category-${category}-summary`;
          return (
            <li key={category}>
              <Link
                href={blogIndexHref(locale, category)}
                className={styles.directoryLink}
                aria-labelledby={titleId}
                aria-describedby={summaryId}
              >
                <span className={styles.artwork} aria-hidden="true">
                  <BlogCategoryArtwork category={category} />
                </span>
                <div className={styles.directoryCopy}>
                  <div className={styles.titleRow}>
                    <h2 id={titleId} className={styles.title}>{label}</h2>
                    <CategoryLinkIndicator label={label} />
                  </div>
                  <p id={summaryId} className={styles.description}>{dict.blog.categoryPages[category].summary}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
