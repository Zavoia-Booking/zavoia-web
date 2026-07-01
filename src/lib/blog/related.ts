import type { BlogCategory } from "@/sanity/types";

// Select related posts. Same-category posts (excluding the current one) come
// first; if there are fewer than `count`, fill from the remaining posts
// (excluding current and already-selected). Mirrors web-blog.jsx:517-521.
export function selectRelated<
  T extends { _id: string; category?: BlogCategory },
>(posts: T[], current: T, count = 3): T[] {
  const sameCat = posts
    .filter((p) => p._id !== current._id && p.category === current.category)
    .slice(0, count);

  if (sameCat.length >= count) return sameCat;

  const fill = posts
    .filter((p) => p._id !== current._id && !sameCat.includes(p))
    .slice(0, count - sameCat.length);

  return [...sameCat, ...fill];
}
