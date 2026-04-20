import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import type { PostListItem } from "@/sanity/types";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { urlForImage } from "@/sanity/image";

export function BlogList({
  locale,
  posts,
}: {
  locale: Locale;
  posts: PostListItem[];
}) {
  const dict = dictionaries[locale];

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        {dict.blog.listHeading}
      </h1>
      <p className="mt-3 text-zinc-600">{dict.blog.listIntro}</p>

      {posts.length === 0 ? (
        <p className="mt-10 text-zinc-500">{dict.blog.empty}</p>
      ) : (
        <ul className="mt-10 space-y-8">
          {posts.map((post, index) => {
            const slug = post.slug[locale]?.current;
            const title = post.title[locale];
            if (!slug || !title) return null;

            return (
              <li key={post._id} className="flex gap-4">
                {post.coverImage?.asset && (
                  <Image
                    src={urlForImage(post.coverImage)
                      .width(240)
                      .height(135)
                      .url()}
                    alt={post.coverImage.alt || ""}
                    width={240}
                    height={135}
                    className="h-[90px] w-[160px] shrink-0 rounded-md object-cover"
                    priority={index === 0}
                  />
                )}
                <div className="min-w-0">
                  <h2 className="text-lg font-medium">
                    <Link
                      href={localeHref(locale, "blog", slug)}
                      className="hover:underline"
                    >
                      {title}
                    </Link>
                  </h2>
                  {post.excerpt?.[locale] && (
                    <p className="mt-1 text-sm text-zinc-600">
                      {post.excerpt[locale]}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-zinc-400">
                    {new Date(post.publishedAt).toLocaleDateString(locale)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
