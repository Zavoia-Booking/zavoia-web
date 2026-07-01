import type { PortableTextBlock } from "@portabletext/types";
import type { Locale } from "@/i18n/locales";
import type { PostListItem } from "@/sanity/types";
import { headingSlug, readingMinutes } from "@/lib/blog";
import type { BlogCardVM } from "./types";

// Build a serializable BlogCardVM from a Sanity post for a given locale.
// Posts without a slug or title for the locale are skipped by the caller
// (this returns null in that case). `body` is read here only to compute
// reading time, then dropped so it never crosses the server/client boundary.
// Shared by blog/page.tsx (list) and blog/[slug]/page.tsx (related), keeping
// the dateLabel format and reading-time derivation identical in both places.
export function toBlogCardVM(
  post: Pick<
    PostListItem,
    | "_id"
    | "title"
    | "slug"
    | "excerpt"
    | "coverImage"
    | "publishedAt"
    | "category"
    | "body"
  >,
  locale: Locale,
): BlogCardVM | null {
  const slug = post.slug[locale]?.current;
  const title = post.title[locale];
  if (!slug || !title) return null;

  const dateLabel = new Date(post.publishedAt).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return {
    id: post._id,
    slug,
    title,
    excerpt: post.excerpt?.[locale] ?? "",
    coverImage: post.coverImage,
    category: post.category,
    dateLabel,
    readingMinutes: readingMinutes(post.body?.[locale]),
  };
}

export type HeadingItem = {
  key: string;
  id: string;
  text: string;
  level: 2 | 3;
};

// Walk the Portable Text body once, collecting h2/h3 headings in document
// order. Computes the anchor id with headingSlug and dedupes collisions by
// appending -2, -3, … so every id is unique even when heading text repeats.
// Returned in order; callers derive both the `_key -> id` map (for the prose
// renderer) and the `{ id, text }` list (for the TOC) from this single source.
export function collectHeadings(
  blocks: PortableTextBlock[] | undefined,
): HeadingItem[] {
  if (!blocks || blocks.length === 0) return [];

  const seen = new Map<string, number>();
  const out: HeadingItem[] = [];

  for (const block of blocks) {
    if (!block || block._type !== "block") continue;
    const style = (block as { style?: string }).style;
    if (style !== "h2" && style !== "h3") continue;

    const children = (block as PortableTextBlock).children;
    const text = Array.isArray(children)
      ? children
          .map((c) =>
            c &&
            typeof c === "object" &&
            "text" in c &&
            typeof (c as { text?: unknown }).text === "string"
              ? (c as { text: string }).text
              : "",
          )
          .join("")
      : "";

    const base = headingSlug(text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const id = count === 0 ? base : `${base}-${count + 1}`;

    out.push({
      key: (block as { _key: string })._key,
      id,
      text,
      level: style === "h2" ? 2 : 3,
    });
  }

  return out;
}

// `_key` of the first body paragraph (style "normal" or unset). The prose
// renderer adds the drop-cap to this paragraph only. Returns undefined when
// the body opens with a non-paragraph block (heading, image, …).
export function firstParagraphKey(
  blocks: PortableTextBlock[] | undefined,
): string | undefined {
  if (!blocks) return undefined;
  for (const block of blocks) {
    if (!block || block._type !== "block") continue;
    const style = (block as { style?: string }).style;
    if (style === "normal" || style === undefined) {
      return (block as { _key: string })._key;
    }
  }
  return undefined;
}
