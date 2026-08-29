import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  LOCALES,
  isLocale,
  DEFAULT_LOCALE,
  type Locale,
} from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { listPosts } from "@/sanity/queries";
import { BlogList } from "@/app/_components/blog/blog-list";
import { toBlogCardVM } from "@/app/_components/blog/vm";
import type { BlogCardVM } from "@/app/_components/blog/types";

// Cached with a one-hour floor. The Sanity queries carry the `post` tag and
// /api/revalidate flushes it on publish, so an edit is live within seconds —
// `revalidate = 0` used to opt this route out of caching entirely, which left
// that webhook with nothing to invalidate.
export const revalidate = 3600;

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = dictionaries[locale];

  const languages = Object.fromEntries(
    LOCALES.map((l) => [l, localeHref(l, "blog")]),
  ) as Record<Locale, string>;

  return {
    title: dict.blog.listTitle,
    description: dict.blog.listDescription,
    alternates: {
      canonical: localeHref(locale, "blog"),
      languages: { ...languages, "x-default": languages[DEFAULT_LOCALE] },
    },
  };
}

export default async function BlogIndex({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const posts = await listPosts();

  // Build serializable view-models via the shared helper. `body` is only read
  // there (server-side) to compute reading time, then dropped so it never
  // crosses to the client. Posts missing a slug/title for the locale are
  // skipped (helper returns null).
  const vm: BlogCardVM[] = posts.flatMap((post) => {
    const card = toBlogCardVM(post, locale);
    return card ? [card] : [];
  });

  return <BlogList locale={locale} posts={vm} />;
}
