import type { BlogCategory, SanityImage } from "@/sanity/types";

// Serializable view-model for a blog card. Built server-side in
// blog/page.tsx (where the Portable Text `body` is available to compute
// reading time) and passed to the client BlogList. `body` is intentionally
// dropped so it never crosses the server/client boundary.
export type BlogCardVM = {
  id: string; // _id
  slug: string; // post.slug[locale]?.current ?? ""
  title: string; // post.title[locale] ?? ""
  excerpt: string; // post.excerpt?.[locale] ?? ""
  coverImage?: SanityImage; // passed through for client-side url building
  category?: BlogCategory;
  dateLabel: string; // formatted from publishedAt
  readingMinutes: number; // readingMinutes(post.body?.[locale])
};
