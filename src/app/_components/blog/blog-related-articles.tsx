import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { categoryLabelKey, formatReadingTime } from "@/lib/blog";
import { Icon } from "@/components/ui/icon";
import { BlogImage } from "./blog-image";
import { BlogMeta } from "./blog-meta";
import type { BlogCardVM } from "./types";
import styles from "./blog-related-articles.module.css";

/** Image-led previews of the next articles to read. */
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
          {posts.map((post, index) => {
            const compact = posts.length > 2 && index > 0;
            const square = compact && index === 1;
            const imageRatio = compact ? (square ? 1 : 4 / 3) : 3 / 2;
            const sizes = compact
              ? "(max-width: 600px) 112px, (max-width: 920px) calc(50vw - 34px), (max-width: 1024px) calc(50vw - 42px), (max-width: 1456px) calc(25vw - 38px), 326px"
              : posts.length > 2
                ? "(max-width: 600px) calc(100vw - 32px), (max-width: 920px) calc(52.381vw - 35.62px), (max-width: 1024px) calc(52.381vw - 44px), (max-width: 1456px) calc(50vw - 44px), 684px"
                : "(max-width: 600px) calc(100vw - 32px), (max-width: 920px) calc(50vw - 34px), (max-width: 1024px) calc(50vw - 42px), (max-width: 1456px) calc(50vw - 44px), 684px";
            const category = post.category
              ? blog[categoryLabelKey(post.category)]
              : "";

            return (
              <li key={post.id} className={compact ? styles.supporting : styles.lead} data-image={square ? "square" : "landscape"}>
                <Link href={localeHref(locale, "blog", post.slug)} className={styles.item}>
                  <span className={styles.thumbnail} aria-hidden="true">
                    <BlogImage image={post.coverImage} alt="" aspectRatio={imageRatio} maxWidth={compact ? 960 : 1600} sizes={sizes} className={styles.image} />
                  </span>
                  <div className={styles.copy}>
                    {category && <span className={styles.category}>{category}</span>}
                    <h3 className={styles.title}>{post.title}</h3>
                    {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
                    <div className={styles.footer}>
                      <BlogMeta date={post.dateLabel} read={formatReadingTime(post.readingMinutes, locale)} />
                      <span className={styles.arrow} aria-hidden="true"><Icon name="arrowR" size={18} /></span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
