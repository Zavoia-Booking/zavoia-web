import { client } from "./client";
import { isSanityConfigured } from "./env";
import type { Post, PostListItem } from "./types";
import type { Locale } from "@/i18n/locales";
import { getPostTranslation } from "@/lib/blog/alternates";

// The client uses the published perspective. Scheduling must also be checked
// for direct URLs, not just listings and sitemap entries.
const PUBLISHED_POST = `_type == "post" && defined(publishedAt) && dateTime(publishedAt) <= dateTime(now())`;

const POST_LIST_FIELDS = `
  _id,
  title,
  slug,
  category,
  excerpt,
  body,
  coverImage,
  publishedAt
`;

const POST_DETAIL_FIELDS = `
  _id,
  title,
  slug,
  category,
  excerpt,
  body,
  coverImage,
  faq,
  publishedAt,
  seo
`;

export async function listPosts(): Promise<PostListItem[]> {
  if (!isSanityConfigured) return [];
  return client.fetch<PostListItem[]>(
    `*[${PUBLISHED_POST}]
      | order(publishedAt desc) { ${POST_LIST_FIELDS} }`,
    {},
    { next: { tags: ["post"] } },
  );
}

export async function getPostBySlug(
  locale: Locale,
  slug: string,
): Promise<Post | null> {
  if (!isSanityConfigured) return null;
  const post = await client.fetch<Post | null>(
    `*[${PUBLISHED_POST} && slug[$locale].current == $slug][0] { ${POST_DETAIL_FIELDS} }`,
    { locale, slug },
    { next: { tags: ["post", `post:${slug}`] } },
  );
  return post && getPostTranslation(post, locale) ? post : null;
}

export async function listPostSlugs(locale: Locale): Promise<string[]> {
  if (!isSanityConfigured) return [];
  const posts = await client.fetch<Array<Pick<Post, "title" | "slug">>>(
    `*[${PUBLISHED_POST} && defined(slug[$locale].current)] { title, slug }`,
    { locale },
    { next: { tags: ["post"] } },
  );
  return posts.flatMap((post) => {
    const translation = getPostTranslation(post, locale);
    return translation ? [translation.slug] : [];
  });
}

export async function listPostsForSitemap(): Promise<
  Array<Pick<Post, "_id" | "title" | "slug" | "publishedAt">>
> {
  if (!isSanityConfigured) return [];
  return client.fetch(
    `*[${PUBLISHED_POST}] { _id, title, slug, publishedAt }`,
    {},
    { next: { tags: ["post"] } },
  );
}
