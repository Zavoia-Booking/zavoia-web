import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { CATEGORY_ORDER, type BlogTab } from "./categories";
import { categoryPath } from "./category-routes";

export const BLOG_PAGE_SIZE = 6;
export type BlogSearchParams = Record<string, string | string[] | undefined>;

/** Page numbers are one-based in URLs and zero-based in the view model. */
export function parseBlogQuery(query: BlogSearchParams): { category: BlogTab; page: number } | null {
  const { category = "all", page = "1" } = query;
  if (typeof category !== "string" || typeof page !== "string") return null;
  if (category !== "all" && !CATEGORY_ORDER.some((id) => id === category)) return null;
  if (!/^[1-9]\d*$/.test(page)) return null;
  const number = Number(page);
  if (!Number.isSafeInteger(number)) return null;
  return { category: category as BlogTab, page: number - 1 };
}

/** Canonical archive URLs omit page one, the all filter and tracking parameters. */
export function blogIndexHref(locale: Locale, category: BlogTab = "all", page = 0): string {
  const query = new URLSearchParams();
  if (page > 0) query.set("page", String(page + 1));
  const search = query.toString();
  const path = category === "all" ? localeHref(locale, "blog") : categoryPath(locale, category);
  return `${path}${search ? `?${search}` : ""}`;
}

export function paginateBlogPosts<T extends { category?: string }>(posts: T[], category: BlogTab, page: number) {
  const counts: Record<string, number> = { all: posts.length };
  for (const id of CATEGORY_ORDER) counts[id] = posts.filter((post) => post.category === id).length;
  const filtered = category === "all" ? posts : posts.filter((post) => post.category === category);
  const [featured, ...rest] = filtered;
  const totalPages = Math.max(1, Math.ceil(rest.length / BLOG_PAGE_SIZE));
  if (page < 0 || !Number.isSafeInteger(page) || page >= totalPages) return null;
  return {
    category,
    page,
    counts,
    total: filtered.length,
    totalPages,
    featured: page === 0 ? featured : undefined,
    items: rest.slice(page * BLOG_PAGE_SIZE, (page + 1) * BLOG_PAGE_SIZE),
  };
}
