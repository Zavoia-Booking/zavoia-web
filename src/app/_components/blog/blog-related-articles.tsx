import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { categoryLabelKey, formatReadingTime } from "@/lib/blog";
import { urlForImage } from "@/sanity/image";
import { Icon } from "@/components/ui/icon";
import { Img } from "@/components/ui/image";
import { BlogMeta } from "./blog-meta";
import type { BlogCardVM } from "./types";
import styles from "./blog-related-articles.module.css";

/** Existing related articles, presented as a compact reading list. */
export function BlogRelatedArticles({ locale, posts }: { locale: Locale; posts: BlogCardVM[] }) {
  if (posts.length === 0) return null;
  const { blog } = dictionaries[locale];

  return (
    <section className={`zw-container ${styles.section}`}>
      <div className={styles.frame}>
      <div className={styles.heading}>
        <h2>{blog.relatedStories}</h2>
        <Link href={localeHref(locale, "blog")} className={styles.archiveLink}>
          {blog.allStories}<Icon name="arrowR" size={17} />
        </Link>
      </div>
      <ul className={styles.items} data-count={posts.length}>
        {posts.map((post) => {
          const cover = post.coverImage?.asset
            ? urlForImage(post.coverImage).width(192).height(192).fit("crop").url()
            : undefined;
          const category = post.category
            ? blog[categoryLabelKey(post.category) as keyof typeof blog]
            : "";

          return (
            <li key={post.id}>
              <Link href={localeHref(locale, "blog", post.slug)} className={styles.item}>
                <span className={styles.thumbnail} aria-hidden="true">
                  <Img src={cover} alt="" className={styles.image} />
                </span>
                <div className={styles.copy}>
                  {category && <span className={styles.category}>{category}</span>}
                  <h3 className={styles.title}>{post.title}</h3>
                  <span className={styles.metadata}>
                    <BlogMeta date={post.dateLabel} read={formatReadingTime(post.readingMinutes, locale)} />
                  </span>
                </div>
                <span className={styles.arrow} aria-hidden="true"><Icon name="arrowR" size={18} /></span>
              </Link>
            </li>
          );
        })}
      </ul>
      </div>
    </section>
  );
}
