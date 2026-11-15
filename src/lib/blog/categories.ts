import type { BlogCategory } from "@/sanity/types";

// The complete archive sits alongside the three editorial categories.
export type BlogTab = "all" | BlogCategory;

// Editorial category order after the complete archive.
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

// Archive label keys, resolved against `dict.blog`.
export const CATEGORY_LABEL_KEY = {
  all: "catAll",
  guides: "catGuides",
  business: "catBusiness",
  product: "catProduct",
} as const satisfies Record<BlogTab, string>;

export function categoryLabelKey(cat: BlogTab) {
  return CATEGORY_LABEL_KEY[cat];
}
