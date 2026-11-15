import { DEFAULT_LOCALE, isLocale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { categoryFromSlug, categoryPath } from "./category-routes";
import { parseBlogQuery } from "./listing";

/** Normalize known archive addresses before rendering, preserving attribution. */
export function blogRedirect(pathname: string, search: URLSearchParams): string | undefined {
  const segments = pathname.split("/").filter(Boolean);
  const locale = isLocale(segments[0]) ? segments.shift()! : DEFAULT_LOCALE;
  if (!isLocale(locale) || segments[0] !== "blog" || segments.length > 2) return undefined;

  const categories = search.getAll("category");
  const pages = search.getAll("page");
  if (categories.length > 1 || pages.length > 1) return undefined;
  const query = parseBlogQuery({ category: categories[0], page: pages[0] });
  if (!query) return undefined;

  const category = segments.length === 2 ? categoryFromSlug(segments[1]) : query.category;
  // Article URLs and unknown names belong to the article/not-found routes.
  if (!category) return undefined;
  if (segments.length === 2 && categories[0] && query.category !== "all" && query.category !== category) return undefined;

  const target = category === "all" ? localeHref(locale, "blog") : categoryPath(locale, category);
  if (pathname === target && !categories.length && pages[0] !== "1") return undefined;

  const next = new URLSearchParams(search);
  next.delete("category");
  if (query.page === 0) next.delete("page");
  const suffix = next.toString();
  return `${target}${suffix ? `?${suffix}` : ""}`;
}
