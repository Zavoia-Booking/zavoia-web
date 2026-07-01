"use client";

import { useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import {
  CATEGORY_ORDER,
  categoryLabelKey,
  type BlogTab,
} from "@/lib/blog";
import { Kicker } from "@/components/ui/kicker";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import type { Dictionary } from "@/i18n/dictionaries";
import { BlogTabs } from "./blog-tabs";
import { BlogFeatured } from "./blog-featured";
import { BlogCard } from "./blog-card";
import { Pagination } from "./pagination";
import { Newsletter } from "./newsletter";
import type { BlogCardVM } from "./types";

const PAGE_SIZE = 6;

type BlogDict = Dictionary["blog"];

// Resolve the display label for a tab/category id against dict.blog.
function tabLabel(blog: BlogDict, id: BlogTab): string {
  return blog[categoryLabelKey(id) as keyof BlogDict] as string;
}

// The Journal — list page. Ported from ZwBlogList (docs/web-blog.jsx:268-363).
// Receives a serialized view-model (no Portable Text body). Filtering + paging
// run client-side; the first post of the active filter is the lead feature on
// page 0.
export function BlogList({
  locale,
  posts,
}: {
  locale: Locale;
  posts: BlogCardVM[];
}) {
  const dict = dictionaries[locale];
  const [cat, setCat] = useState<BlogTab>("all");
  const [page, setPage] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Reset paging whenever the active filter changes. Done by adjusting state
  // during render (React's recommended pattern) rather than in an effect, so
  // there's no extra commit/flash on filter change.
  const [pageCat, setPageCat] = useState<BlogTab>(cat);
  if (pageCat !== cat) {
    setPageCat(cat);
    setPage(0);
  }

  const cats = useMemo(
    () => [
      { id: "all" as BlogTab, label: tabLabel(dict.blog, "all") },
      ...CATEGORY_ORDER.map((id) => ({
        id: id as BlogTab,
        label: tabLabel(dict.blog, id),
      })),
    ],
    [dict],
  );

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: posts.length };
    for (const id of CATEGORY_ORDER) {
      m[id] = posts.filter((p) => p.category === id).length;
    }
    return m;
  }, [posts]);

  const filtered = useMemo(
    () => (cat === "all" ? posts : posts.filter((p) => p.category === cat)),
    [cat, posts],
  );

  const [featured, ...rest] = filtered;
  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = rest.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );
  const showFeatured = !!featured && safePage === 0;

  const changePage = (p: number) => {
    setPage(p);
    requestAnimationFrame(() => {
      const el = resultsRef.current;
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - 92;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    });
  };

  // Label resolved per card's own category (not the active tab).
  const labelFor = (vm: BlogCardVM): string =>
    vm.category ? tabLabel(dict.blog, vm.category) : tabLabel(dict.blog, "all");

  return (
    <div data-screen-label="Blog — list">
      <header
        className="zw-container"
        style={{ paddingTop: "clamp(36px, 5vw, 64px)" }}
      >
        <div style={{ marginBottom: "clamp(22px, 3vw, 36px)" }}>
          <Breadcrumb
            items={[
              { label: dict.breadcrumbHome, href: localeHref(locale) },
              { label: dict.blog.breadcrumbJournal },
            ]}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: 760 }}>
            <Kicker style={{ marginBottom: 16 }}>{dict.blog.kicker}</Kicker>
            <h1
              className="txt-balance"
              style={{
                margin: 0,
                fontSize: "clamp(38px, 5vw, 66px)",
                fontWeight: 600,
                letterSpacing: "-0.045em",
                lineHeight: 0.96,
                color: "var(--c-900)",
              }}
            >
              {dict.blog.heading}
            </h1>
            <p
              className="txt-pretty"
              style={{
                margin: "20px 0 0",
                fontSize: "clamp(15.5px, 1.4vw, 18px)",
                lineHeight: 1.6,
                color: "var(--c-600)",
                maxWidth: 540,
              }}
            >
              {dict.blog.intro}
            </p>
          </div>
          <div
            className="zw-only-desktop"
            style={{
              textAlign: "right",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--c-500)",
              lineHeight: 1.9,
            }}
          >
            <div>{dict.blog.updatedWeekly}</div>
            <div style={{ color: "var(--c-400)" }}>
              {posts.length} {dict.blog.storiesLabel}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "clamp(28px, 3.2vw, 44px)" }}>
          <BlogTabs
            cats={cats}
            counts={counts}
            active={cat}
            onChange={setCat}
          />
        </div>
      </header>

      <div
        className="zw-container"
        ref={resultsRef}
        style={{ paddingTop: "clamp(28px, 3.4vw, 44px)" }}
      >
        {showFeatured && featured && (
          <BlogFeatured
            key={`f-${cat}`}
            locale={locale}
            post={featured}
            categoryLabel={labelFor(featured)}
          />
        )}
        {!featured && (
          <p
            style={{
              textAlign: "center",
              color: "var(--c-600)",
              padding: "40px 0",
            }}
          >
            {dict.blog.nothingHere}
          </p>
        )}
        {pageItems.length > 0 && (
          <div
            className="zw-mgrid"
            data-cols="3"
            style={{
              marginTop: showFeatured ? "clamp(20px, 2.4vw, 32px)" : 0,
            }}
          >
            {pageItems.map((p) => (
              <BlogCard
                key={`${cat}-${p.id}`}
                locale={locale}
                post={p}
                categoryLabel={labelFor(p)}
              />
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="zw-pag-wrap">
            <span className="zw-pag-count">
              {dict.blog.pageLabel}&nbsp;
              <b>{String(safePage + 1).padStart(2, "0")}</b>&nbsp;
              {dict.blog.ofLabel} {String(totalPages).padStart(2, "0")} ·{" "}
              {filtered.length} {dict.blog.storiesLabel}
            </span>
            <Pagination
              page={safePage}
              totalPages={totalPages}
              onChange={changePage}
            />
          </div>
        )}
      </div>

      <Newsletter />
    </div>
  );
}
