import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  LOCALES,
  DEFAULT_LOCALE,
  isLocale,
} from "@/i18n/locales";
import { getPostBySlug, listPostSlugs, listPosts } from "@/sanity/queries";
import { localeHref } from "@/i18n/routes";
import { OPEN_GRAPH_LOCALES, defaultSocialImage } from "@/lib/site";
import { urlForImage } from "@/sanity/image";
import { dictionaries } from "@/i18n/dictionaries";
import { getPostAlternates, getPostTranslation, selectRelated } from "@/lib/blog";
import { LocaleRouteAlternates } from "@/i18n/locale-navigation";
import type { PostListItem } from "@/sanity/types";
import { BlogPost } from "@/app/_components/blog/blog-post";
import { notFoundMetadata } from "@/app/_components/not-found/metadata";
import { toBlogCardVM } from "@/app/_components/blog/vm";
import type { BlogCardVM } from "@/app/_components/blog/types";

// One-hour floor plus tag invalidation: `getPostBySlug` is tagged `post` and
// `post:<slug>`, and the Sanity webhook flushes both on publish. Posts are
// prerendered at build from `generateStaticParams`; a post created later is
// rendered on first request and cached from then on (dynamicParams).
export const revalidate = 3600;
export const dynamicParams = true;

// A Sanity outage at build time must not fail the whole `next build` — every
// marketplace route returns `[]` from `generateStaticParams` for the same
// reason (see `business/[slug]/page.tsx`). Here that means falling back to
// prerendering no posts rather than aborting the build; `dynamicParams` stays
// true (the default), so a post is still rendered and cached on first
// request once Sanity recovers.
export async function generateStaticParams() {
  try {
    const triples = await Promise.all(
      LOCALES.map(async (locale) => {
        const slugs = await listPostSlugs(locale);
        return slugs.map((slug) => ({ locale, slug }));
      }),
    );
    return triples.flat();
  } catch {
    return [];
  }
}

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  if (!isLocale(localeParam)) return {};
  const post = await getPostBySlug(localeParam, slug);
  if (!post) return notFoundMetadata(localeParam);

  const title =
    post.seo?.title?.[localeParam] || post.title[localeParam] || "";
  const description =
    post.seo?.description?.[localeParam] ||
    post.excerpt?.[localeParam] ||
    "";

  const canonical = localeHref(localeParam, "blog", slug);

  const languages = getPostAlternates(post);
  // Link previews use a 1200 x 630 framing of the visible cover, with its alt
  // text. The image builder never upscales, so no pixel size is declared.
  const shareImage = post.coverImage?.asset
    ? {
        url: urlForImage(post.coverImage).width(1200).height(630).url(),
        alt: post.coverImage.alt || post.title[localeParam] || title,
      }
    : defaultSocialImage(localeParam);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { ...languages, "x-default": languages[DEFAULT_LOCALE] ?? canonical },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      siteName: "Zavoia",
      locale: OPEN_GRAPH_LOCALES[localeParam],
      // Only languages this post is translated into are alternates.
      alternateLocale: LOCALES.filter((language) => language !== localeParam && languages[language])
        .map((language) => OPEN_GRAPH_LOCALES[language]),
      publishedTime: post.publishedAt,
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImage],
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
  const translatedPosts = allPosts.filter((candidate) => getPostTranslation(candidate, localeParam));
  const related = selectRelated<PostListItem>(translatedPosts, current, 3);
  const relatedVMs: BlogCardVM[] = related.flatMap((p) => {
    const vm = toBlogCardVM(p, localeParam);
    return vm ? [vm] : [];
  });

  return (
    <>
      <LocaleRouteAlternates
        pathname={localeHref(localeParam, "blog", slug)}
        alternates={getPostAlternates(post)}
        currentLocale={localeParam}
        label={dictionaries[localeParam].language.label}
        localeNames={dictionaries[localeParam].localeNames}
      />
      <BlogPost locale={localeParam} post={post} related={relatedVMs} />
    </>
  );
}
