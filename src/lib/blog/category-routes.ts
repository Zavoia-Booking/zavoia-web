import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import type { BlogCategory } from "@/sanity/types";

/** Public category names are independent of the stable IDs stored in Sanity. */
export const BLOG_CATEGORY_SLUGS = {
  en: { guides: "guides", business: "for-business", product: "product-news" },
  ro: { guides: "ghiduri", business: "pentru-afaceri", product: "noutati-produs" },
} as const satisfies Record<Locale, Record<BlogCategory, string>>;

export function categoryPath(locale: Locale, category: BlogCategory): string {
  return localeHref(locale, "blog", BLOG_CATEGORY_SLUGS[locale][category]);
}

export function categoryFromSlug(slug: string): BlogCategory | undefined {
  for (const slugs of Object.values(BLOG_CATEGORY_SLUGS)) {
    for (const [category, value] of Object.entries(slugs)) {
      if (value === slug) return category as BlogCategory;
    }
  }
  return undefined;
}

export function isCanonicalCategorySlug(locale: Locale, slug: string): boolean {
  const category = categoryFromSlug(slug);
  return category !== undefined && BLOG_CATEGORY_SLUGS[locale][category] === slug;
}

/** Keep article slugs from being shadowed by one of the fixed category routes. */
export function isReservedBlogSlug(value: string): boolean {
  return categoryFromSlug(value.trim().toLowerCase()) !== undefined;
}
