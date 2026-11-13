"use client";

import { useMemo, useRef, useSyncExternalStore } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import type { Locale } from "@/i18n/locales";
import { CATEGORY_ORDER, categoryLabelKey, type BlogTab } from "@/lib/blog";
import type { Dictionary } from "@/i18n/dictionaries";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { BlogTabs } from "./blog-tabs";
import { BlogFeatured } from "./blog-featured";
import { BlogCard } from "./blog-card";
import { Pagination } from "./pagination";
import type { BlogCardVM } from "./types";
import styles from "./blog-list.module.css";

const PAGE_SIZE = 6;
const QUERY_CHANGED = "zavoia:blog-query-changed";
type BlogDict = Dictionary["blog"];

function tabLabel(blog: BlogDict, id: BlogTab): string {
  return blog[categoryLabelKey(id) as keyof BlogDict] as string;
}

function subscribeQuery(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(QUERY_CHANGED, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(QUERY_CHANGED, onChange);
  };
}

function browserQuery() { return window.location.search; }
function serverQuery() { return ""; }

function queryCategory(query: URLSearchParams): BlogTab {
  const category = query.get("category");
  return CATEGORY_ORDER.find((id) => id === category) ?? "all";
}

function queryPage(query: URLSearchParams): number {
  const value = query.get("page");
  if (!value || !/^[1-9]\d*$/.test(value)) return 0;
  const page = Number(value);
  return Number.isSafeInteger(page) ? page - 1 : 0;
}

/** Native history preserves the current pathname, unrelated parameters and hash. */
function updateQuery(category: BlogTab, page: number) {
  const url = new URL(window.location.href);
  if (category === "all") url.searchParams.delete("category");
  else url.searchParams.set("category", category);
  if (page === 0) url.searchParams.delete("page");
  else url.searchParams.set("page", String(page + 1));
  if (url.href === window.location.href) return;
  window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
  window.dispatchEvent(new Event(QUERY_CHANGED));
}

/** Keep the complete default index server-rendered; hydrate URL refinements locally. */
export function BlogList({ locale, posts, pending = false }: {
  locale: Locale;
  posts: BlogCardVM[];
  pending?: boolean;
}) {
  const { dict } = useTranslation();
  const search = useSyncExternalStore(subscribeQuery, browserQuery, serverQuery);
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const category = queryCategory(query);
  const page = queryPage(query);
  const resultsRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => [
    { id: "all" as BlogTab, label: tabLabel(dict.blog, "all") },
    ...CATEGORY_ORDER.map((id) => ({ id, label: tabLabel(dict.blog, id) })),
  ], [dict.blog]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: posts.length };
    for (const id of CATEGORY_ORDER) result[id] = posts.filter((post) => post.category === id).length;
    return result;
  }, [posts]);

  const filtered = useMemo(
    () => category === "all" ? posts : posts.filter((post) => post.category === category),
    [category, posts],
  );
  const [featured, ...rest] = filtered;
  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = rest.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const showFeatured = !!featured && safePage === 0;
  const countLabel = filtered.length === 1 ? dict.blog.storySingular : dict.blog.storiesLabel;
  const labelFor = (post: BlogCardVM) => post.category ? tabLabel(dict.blog, post.category) : "";

  const changePage = (next: number) => {
    updateQuery(category, next);
    requestAnimationFrame(() => {
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      resultsRef.current?.scrollIntoView({ block: "start", behavior });
    });
  };

  return (
    <main className={styles.page} data-screen-label="Blog — list" aria-busy={pending || undefined}>
      <header className={`zw-container ${styles.header}`}>
        <h1 className={styles.heading}>{dict.blog.heading}</h1>
        <p className={styles.intro}>{dict.blog.intro}</p>
        <BlogTabs
          cats={categories}
          counts={counts}
          active={category}
          onChange={(next) => updateQuery(next, 0)}
          pending={pending}
        />
      </header>
      <div className={`zw-container ${styles.results}`} ref={resultsRef}>
        <span className="sr-only" role="status" aria-atomic="true">
          {!pending && `${filtered.length} ${countLabel}. ${dict.blog.pageLabel} ${safePage + 1} ${dict.blog.ofLabel} ${totalPages}.`}
        </span>
        {pending ? <BlogResultsSkeleton /> : (
          <>
            {showFeatured && featured && <BlogFeatured locale={locale} post={featured} categoryLabel={labelFor(featured)} />}
            {!featured && (
              <div className={styles.empty}>
                {category === "all" ? <p>{dict.blog.empty}</p> : (
                  <>
                    <h2>{dict.blog.emptyCategoryTitle}</h2>
                    <p>{dict.blog.emptyCategoryBody}</p>
                    <button type="button" className={styles.resetFilter} onClick={() => updateQuery("all", 0)}>
                      {dict.blog.showAll}<Icon name="arrowR" size={17} />
                    </button>
                  </>
                )}
              </div>
            )}
            {pageItems.length > 0 && (
              <div className={`zw-mgrid ${styles.grid}`} data-cols="3" data-has-feature={showFeatured}>
                {pageItems.map((post) => <BlogCard key={post.id} locale={locale} post={post} categoryLabel={labelFor(post)} headingLevel={2} />)}
              </div>
            )}
            {totalPages > 1 && (
              <div className={styles.paginationRow}>
                <span className={styles.pageCount}>
                  {dict.blog.pageLabel} <b>{safePage + 1}</b> {dict.blog.ofLabel} {totalPages} · {filtered.length} {countLabel}
                </span>
                <Pagination page={safePage} totalPages={totalPages} onChange={changePage} />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

/** Pending content shares the resolved feature and card geometry. */
function BlogResultsSkeleton() {
  return (
    <div aria-hidden="true">
      <div className={styles.feature} data-feature-grid="">
        <div className={styles.featureMedia}><Skeleton h="100%" r={0} style={{ position: "absolute", inset: 0 }} /></div>
        <div className={styles.featureBody}>
          <Skeleton w={94} h={21} />
          <Skeleton h="calc(clamp(28px, 3.1vw, 44px) * 2.24)" style={{ marginTop: 18 }} />
          <Skeleton h={54} style={{ marginTop: 18 }} />
          <div className={styles.featureFooter}><Skeleton w="48%" h={20} /><Skeleton w={120} h={36} r={18} /></div>
        </div>
      </div>
      <div className={`zw-mgrid ${styles.grid}`} data-cols="3">
        {Array.from({ length: PAGE_SIZE }, (_, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.cardMedia}><Skeleton h="100%" r={0} /></div>
            <div className={styles.cardBody}>
              <div className={styles.cardCopy}>
                <Skeleton w={94} h={21} /><Skeleton h={54} style={{ marginTop: 12 }} /><Skeleton h={70} style={{ marginTop: 12 }} />
              </div>
              <div className={styles.cardFooter}><Skeleton w="72%" h={20} /><Skeleton w={28} h={32} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
