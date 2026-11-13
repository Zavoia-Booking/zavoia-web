"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { categoryAccent, formatReadingTime } from "@/lib/blog";
import { urlForImage } from "@/sanity/image";
import { useTranslation } from "@/i18n/useTranslation";
import { Icon } from "@/components/ui/icon";
import { Img } from "@/components/ui/image";
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
  const cover = post.coverImage?.asset
    ? urlForImage(post.coverImage).width(960).height(720).url()
    : undefined;

  return (
    <Link href={localeHref(locale, "blog", post.slug)} className={styles.feature} data-feature-grid="">
      <div className={styles.featureMedia}>
        <Img src={cover} alt={post.coverImage?.alt || post.title} className={styles.featureImage} loading="eager" fetchPriority="high" />
      </div>
      <div className={styles.featureBody}>
        {categoryLabel && <CatChip label={categoryLabel} accent={categoryAccent(post.category)} />}
        <h2 className={styles.featureTitle}>{post.title}</h2>
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
