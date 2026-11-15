import type { PostAuthor } from "@/sanity/types";
import { getArticleLinkHref } from "./useful-links";

/** The existing byline for posts without their own confirmed author details. */
export const BLOG_AUTHOR = "Carmen";

/** Use the same confirmed author identity in the visible byline and metadata. */
export function resolveBlogAuthor(author?: PostAuthor): PostAuthor {
  const name = typeof author?.name === "string" ? author.name.trim() : "";
  if (!name) return { name: BLOG_AUTHOR };

  const href = getArticleLinkHref(author?.url);
  const url = href && /^https?:\/\//i.test(href) ? href : undefined;
  return { name, ...(url && { url }) };
}
