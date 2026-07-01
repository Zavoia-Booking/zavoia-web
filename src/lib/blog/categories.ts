import type { BlogCategory } from "@/sanity/types";

// Synthetic "all" tab id sits in front of the real categories in the UI.
export type BlogTab = "all" | BlogCategory;

// Tab order after the "All" tab. Mirrors web-blog.jsx ordering.
export const CATEGORY_ORDER: BlogCategory[] = ["guides", "business", "product"];

// Per-category accent colour. Mirrors web-blog.jsx:8-13.
export function categoryAccent(cat: BlogCategory | undefined): string {
  switch (cat) {
    case "guides":
      return "var(--p-500)";
    case "business":
      return "var(--s-info-600)";
    case "product":
      return "var(--s-success-600)";
    default:
      return "var(--p-500)";
  }
}

// i18n label key per tab id. Components resolve these against `dict.blog`.
export const CATEGORY_LABEL_KEY: Record<BlogTab, string> = {
  all: "catAll",
  guides: "catGuides",
  business: "catBusiness",
  product: "catProduct",
};

export function categoryLabelKey(cat: BlogTab): string {
  return CATEGORY_LABEL_KEY[cat];
}
