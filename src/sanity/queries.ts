import { client } from "./client";
import { isSanityConfigured } from "./env";
import type { Post, PostListItem } from "./types";

const POST_LIST_FIELDS = `
  _id,
  title,
  slug,
  excerpt,
  coverImage,
  publishedAt
`;

const POST_DETAIL_FIELDS = `
  _id,
  title,
  slug,
  excerpt,
  body,
  coverImage,
  publishedAt,
  seo
`;

export async function listPosts(): Promise<PostListItem[]> {
  if (!isSanityConfigured) return [];
  return client.fetch<PostListItem[]>(
    `*[_type == "post" && defined(publishedAt) && publishedAt <= now()]
      | order(publishedAt desc) { ${POST_LIST_FIELDS} }`,
    {},
    { next: { tags: ["post"] } },
  );
}

export async function getPostBySlug(
  locale: string,
  slug: string,
): Promise<Post | null> {
  if (!isSanityConfigured) return null;
  return client.fetch<Post | null>(
    `*[_type == "post" && slug[$locale].current == $slug][0] { ${POST_DETAIL_FIELDS} }`,
    { locale, slug },
    { next: { tags: ["post", `post:${slug}`] } },
  );
}

export async function listPostSlugs(locale: string): Promise<string[]> {
  if (!isSanityConfigured) return [];
  return client.fetch<string[]>(
    `*[_type == "post" && defined(slug[$locale].current) && publishedAt <= now()][].slug[$locale].current`,
    { locale },
    { next: { tags: ["post"] } },
  );
}

export async function listPostsForSitemap(): Promise<
  Array<{
    _id: string;
    slug: Record<string, { current: string } | undefined>;
    publishedAt: string;
  }>
> {
  if (!isSanityConfigured) return [];
  return client.fetch(
    `*[_type == "post" && defined(publishedAt) && publishedAt <= now()] {
      _id, slug, publishedAt
    }`,
    {},
    { next: { tags: ["post"] } },
  );
}
