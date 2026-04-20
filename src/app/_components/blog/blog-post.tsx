import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import type { Post } from "@/sanity/types";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { urlForImage } from "@/sanity/image";
import { PortableTextRenderer } from "./portable-text-renderer";

export function BlogPost({ locale, post }: { locale: Locale; post: Post }) {
  const dict = dictionaries[locale];
  const title = post.title[locale] ?? "";
  const body = post.body?.[locale];

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <nav className="text-sm text-zinc-500">
        <Link href={localeHref(locale)} className="hover:underline">
          {dict.breadcrumbHome}
        </Link>
        <span className="mx-2">/</span>
        <Link href={localeHref(locale, "blog")} className="hover:underline">
          {dict.blog.listHeading}
        </Link>
      </nav>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h1>
      <time className="mt-2 block text-sm text-zinc-500">
        {new Date(post.publishedAt).toLocaleDateString(locale)}
      </time>

      {post.coverImage?.asset && (
        <div className="mt-6">
          <Image
            src={urlForImage(post.coverImage).width(1200).height(630).url()}
            alt={post.coverImage.alt || ""}
            width={1200}
            height={630}
            className="rounded-lg object-cover"
            priority
          />
        </div>
      )}

      {body && body.length > 0 && (
        <div className="prose prose-zinc mt-8 max-w-none">
          <PortableTextRenderer blocks={body} />
        </div>
      )}

      <div className="mt-12">
        <Link
          href={localeHref(locale, "blog")}
          className="text-sm text-zinc-600 hover:underline"
        >
          ← {dict.blog.backToList}
        </Link>
      </div>
    </article>
  );
}
