"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { formatReadingTime } from "@/lib/blog";
import { BLOG_IMAGE_SIZES } from "@/lib/blog/images";
import { useTranslation } from "@/i18n/useTranslation";
import { Icon } from "@/components/ui/icon";
import { BlogImage } from "./blog-image";
import { CatChip } from "./cat-chip";
import { BlogMeta } from "./blog-meta";
import type { BlogCardVM } from "./types";
import styles from "./blog-list.module.css";

export interface BlogFeaturedProps {
  locale: Locale;
  post: BlogCardVM;
  categoryLabel: string;
}

/** The most recent article in the active category, with a quieter reading lead. */
export function BlogFeatured({ locale, post, categoryLabel }: BlogFeaturedProps) {
  const { dict } = useTranslation();
  return (
    <Link href={localeHref(locale, "blog", post.slug)} className={styles.feature}>
      <div className={styles.featureMedia} aria-hidden="true">
        <BlogImage image={post.coverImage} alt="" aspectRatio={3 / 2} maxWidth={1600} sizes={BLOG_IMAGE_SIZES.feature} className={styles.featureImage} loading="eager" fetchPriority="high" />
      </div>
      <div className={styles.featureBody}>
        {categoryLabel && <CatChip label={categoryLabel} />}
        <h2 className={styles.featureTitle} data-length={post.title.length < 25 ? "short" : post.title.length > 60 ? "long" : "medium"}>{post.title}</h2>
        {post.excerpt && <p className={styles.featureDescription}>{post.excerpt}</p>}
        <div className={styles.featureFooter}>
          <BlogMeta date={post.dateLabel} read={formatReadingTime(post.readingMinutes, locale)} />
          <span className={styles.readAction}>
            {dict.blog.readStory}
            <span className={styles.readArrow} aria-hidden="true"><Icon name="arrowR" size={17} /></span>
          </span>
        </div>
      </div>
    </Link>
  );
}
