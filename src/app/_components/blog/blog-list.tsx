"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import type { Locale } from "@/i18n/locales";
import { categoryLabelKey, type BlogTab } from "@/lib/blog";
import type { Dictionary } from "@/i18n/dictionaries";
import { Icon } from "@/components/ui/icon";
import { blogIndexHref } from "@/lib/blog/listing";
import { BlogCategoryNav } from "./blog-category-nav";
import { BlogCategoryArtwork } from "./category-artwork";
import { BlogFeatured } from "./blog-featured";
import { BlogCard } from "./blog-card";
import { Pagination } from "./pagination";
import type { BlogCardVM } from "./types";
import styles from "./blog-list.module.css";

type BlogDict = Dictionary["blog"];

function categoryLabel(blog: BlogDict, id: BlogTab): string {
  return blog[categoryLabelKey(id)];
}

/** The server selects the requested archive; the client enhances its navigation. */
export function BlogList({ locale, listing }: {
  locale: Locale;
  listing: {
    category: BlogTab;
    page: number;
    counts: Record<string, number>;
    total: number;
    totalPages: number;
    featured?: BlogCardVM;
    items: BlogCardVM[];
  };
}) {
  const { dict } = useTranslation();
  const { category, page, total, totalPages, featured, items } = listing;
  const pageCopy = category === "all" ? dict.blog : dict.blog.categoryPages[category];

  const countLabel = total === 1 ? dict.blog.storySingular : dict.blog.storiesLabel;
  const labelFor = (post: BlogCardVM) => post.category ? categoryLabel(dict.blog, post.category) : "";

  return (
    <main className={styles.page} data-screen-label="Blog — list">
      <header className={`zw-container ${styles.header}`}>
        {category !== "all" && (
          <Link href={blogIndexHref(locale)} className={styles.backLink}>
            <Icon name="chevL" size={16} />{dict.blog.backToList}
          </Link>
        )}
        {category === "all" ? (
          <div className={styles.masthead}>
            <h1 className={styles.heading}>{pageCopy.heading}</h1>
            <p className={styles.intro}>{pageCopy.intro}</p>
          </div>
        ) : (
          <div className={styles.categoryMasthead}>
            <div className={styles.categoryHeading}>
              <h1 className={styles.heading}>{pageCopy.heading}</h1>
              <p className={styles.intro}>{pageCopy.intro}</p>
            </div>
            <div className={styles.categoryArtwork} aria-hidden="true">
              <BlogCategoryArtwork category={category} />
            </div>
          </div>
        )}
      </header>
      <div id="blog-results" className={`zw-container ${styles.results}`}>
        <span className="sr-only" role="status" aria-atomic="true">
          {`${total} ${countLabel}. ${dict.blog.pageLabel} ${page + 1} ${dict.blog.ofLabel} ${totalPages}.`}
        </span>
        {featured && <BlogFeatured locale={locale} post={featured} categoryLabel={labelFor(featured)} />}
        {total === 0 && (
          <div className={styles.empty}>
            {category === "all" ? <p>{dict.blog.empty}</p> : (
              <>
                <h2>{dict.blog.emptyCategoryTitle}</h2>
                <p>{dict.blog.emptyCategoryBody}</p>
                <Link href={blogIndexHref(locale)} className={styles.resetFilter}>
                  {dict.blog.showAll}<Icon name="arrowR" size={17} />
                </Link>
              </>
            )}
          </div>
        )}
        {items.length > 0 && (
          <ul className={styles.grid} data-has-feature={!!featured}>
            {items.map((post) => (
              <li key={post.id} className={styles.cardEntry}>
                <BlogCard locale={locale} post={post} categoryLabel={labelFor(post)} headingLevel={2} />
              </li>
            ))}
          </ul>
        )}
        {totalPages > 1 && (
          <div className={styles.paginationRow}>
            <span className={styles.pageCount}>
              {dict.blog.pageLabel} <b>{page + 1}</b> {dict.blog.ofLabel} {totalPages} · {total} {countLabel}
            </span>
            <Pagination locale={locale} category={category} page={page} totalPages={totalPages} />
          </div>
        )}
        <BlogCategoryNav locale={locale} active={category} />
      </div>
    </main>
  );
}
