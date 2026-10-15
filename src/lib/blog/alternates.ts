import { LOCALES, type Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import type { Post } from "@/sanity/types";

type TranslatablePost = Pick<Post, "title" | "slug">;

/** Matches the existing blog listing rule. Body/excerpt remain optional in
 * the CMS schema; publication scheduling is enforced by the server queries.
 */
export function getPostTranslation(post: TranslatablePost, locale: Locale): { title: string; slug: string } | null {
  const title = post.title?.[locale];
  const slug = post.slug?.[locale]?.current;
  return title?.trim() && slug?.trim() ? { title, slug } : null;
}

/** One source for a post's localized metadata and language-navigation URLs. */
export function getPostAlternates(post: TranslatablePost): Partial<Record<Locale, string>> {
  const languages: Partial<Record<Locale, string>> = {};
  for (const locale of LOCALES) {
    const translation = getPostTranslation(post, locale);
    if (translation) languages[locale] = localeHref(locale, "blog", translation.slug);
  }
  return languages;
}
