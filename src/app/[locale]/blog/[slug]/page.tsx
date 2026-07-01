import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  LOCALES,
  DEFAULT_LOCALE,
  isLocale,
  type Locale,
} from "@/i18n/locales";
import { getPostBySlug, listPostSlugs, listPosts } from "@/sanity/queries";
import { localeHref } from "@/i18n/routes";
import { selectRelated } from "@/lib/blog";
import type { PostListItem } from "@/sanity/types";
import { BlogPost } from "@/app/_components/blog/blog-post";
import { toBlogCardVM } from "@/app/_components/blog/vm";
import type { BlogCardVM } from "@/app/_components/blog/types";

export const revalidate = 0;
export const dynamicParams = true;

export async function generateStaticParams() {
  const triples = await Promise.all(
    LOCALES.map(async (locale) => {
      const slugs = await listPostSlugs(locale);
      return slugs.map((slug) => ({ locale, slug }));
    }),
  );
  return triples.flat();
}

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  if (!isLocale(localeParam)) return {};
  const post = await getPostBySlug(localeParam, slug);
  if (!post) return {};

  const title =
    post.seo?.title?.[localeParam] || post.title[localeParam] || "";
  const description =
    post.seo?.description?.[localeParam] ||
    post.excerpt?.[localeParam] ||
    "";

  const canonical = localeHref(localeParam, "blog", slug);

  const languages: Partial<Record<Locale, string>> = {};
  for (const l of LOCALES) {
    const localizedSlug = post.slug[l]?.current;
    if (localizedSlug) {
      languages[l] = localeHref(l, "blog", localizedSlug);
    }
  }

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { ...languages, "x-default": languages[DEFAULT_LOCALE] },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      locale: localeParam,
      publishedTime: post.publishedAt,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  if (!isLocale(localeParam)) notFound();
  const post = await getPostBySlug(localeParam, slug);
  if (!post) notFound();

  // Related: same-category first, then fill — excluding the current post by _id.
  const allPosts = await listPosts();
  // selectRelated only reads `_id`/`category`; a minimal current stand-in is
  // enough to exclude the open post and prefer same-category neighbours.
  const current = { _id: post._id, category: post.category } as PostListItem;
  const related = selectRelated<PostListItem>(allPosts, current, 3);
  const relatedVMs: BlogCardVM[] = related.flatMap((p) => {
    const vm = toBlogCardVM(p, localeParam);
    return vm ? [vm] : [];
  });

  return <BlogPost locale={localeParam} post={post} related={relatedVMs} />;
}
