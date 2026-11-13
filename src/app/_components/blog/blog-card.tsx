import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { categoryAccent, formatReadingTime } from "@/lib/blog";
import { urlForImage } from "@/sanity/image";
import { Icon } from "@/components/ui/icon";
import { Img } from "@/components/ui/image";
import { BlogMeta } from "./blog-meta";
import { CatChip } from "./cat-chip";
import type { BlogCardVM } from "./types";
import styles from "./blog-list.module.css";

export interface BlogCardProps {
  locale: Locale;
  post: BlogCardVM;
  categoryLabel: string;
  headingLevel?: 2 | 3;
}

/** A single article link, shared by the Journal and related-article lists. */
export function BlogCard({ locale, post, categoryLabel, headingLevel = 3 }: BlogCardProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const cover = post.coverImage?.asset
    ? urlForImage(post.coverImage).width(640).height(360).url()
    : undefined;

  return (
    <Link href={localeHref(locale, "blog", post.slug)} className={styles.card}>
      <div className={styles.cardMedia}>
        <Img src={cover} alt={post.coverImage?.alt || post.title} className={styles.cardImage} />
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardCopy}>
          {categoryLabel && <CatChip label={categoryLabel} accent={categoryAccent(post.category)} />}
          <Heading className={styles.cardTitle}>{post.title}</Heading>
          {post.excerpt && <p className={styles.cardDescription}>{post.excerpt}</p>}
        </div>
        <div className={styles.cardFooter}>
          <BlogMeta date={post.dateLabel} read={formatReadingTime(post.readingMinutes, locale)} />
          <span className={styles.cardArrow} aria-hidden="true"><Icon name="arrowR" size={18} /></span>
        </div>
      </div>
    </Link>
  );
}
