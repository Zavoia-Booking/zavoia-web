"use client";

import { useRef, type MouseEvent } from "react";
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

export interface BlogFeaturedProps {
  locale: Locale;
  post: BlogCardVM;
  categoryLabel: string;
}

// Lead feature card. Ported from ZwBlogFeatured (docs/web-blog.jsx:154-216).
// Differences from the prototype:
//  - The root is a real next/link <Link> to the post (SSR/SEO) rather than the
//    role=button/onClick affordance.
//  - The footer omits the author avatar/name (no author data). The byline slot
//    now holds the BlogMeta (date · read); the "Read story" affordance with the
//    dual-arrow go button is unchanged on the right.
export function BlogFeatured({ locale, post, categoryLabel }: BlogFeaturedProps) {
  const { dict } = useTranslation();
  const accent = categoryAccent(post.category);
  const mediaRef = useRef<HTMLSpanElement>(null);

  const onMove = (e: MouseEvent<HTMLSpanElement>) => {
    const el = mediaRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty(
      "--spot-x",
      `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`,
    );
    el.style.setProperty(
      "--spot-y",
      `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`,
    );
  };

  const cover = post.coverImage?.asset
    ? urlForImage(post.coverImage).width(960).height(720).url()
    : undefined;

  return (
    <Link
      href={localeHref(locale, "blog", post.slug)}
      className="zw-feat zw-hover-lift zw-zoom-parent"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.18fr) minmax(0, 1fr)",
        background: "#fff",
        border: "1px solid rgba(28,28,26,0.06)",
        borderRadius: "var(--r-2xl)",
        overflow: "hidden",
        boxShadow: "var(--sh-md)",
        textDecoration: "none",
        color: "inherit",
      }}
      data-feature-grid=""
    >
      <span
        ref={mediaRef}
        className="zw-zoom-wrap zw-feat-media"
        onMouseMove={onMove}
        style={{
          display: "block",
          position: "relative",
          minHeight: 360,
          background: "var(--c-300)",
        }}
      >
        <Img
          src={cover}
          alt={post.coverImage?.alt || post.title}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
        <span className="zw-feat-scrim" aria-hidden="true" />
        <span className="zw-feat-spot" aria-hidden="true" />
        <span className="zw-feat-pill">
          <span
            className="zw-feat-pulse"
            style={{ color: accent }}
            aria-hidden="true"
          >
            <span className="zw-feat-pulse-dot" />
          </span>
          {dict.blog.latestStory}
        </span>
      </span>
      <span
        className="zw-feat-body"
        style={{
          padding: "clamp(28px, 3.6vw, 52px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CatChip label={categoryLabel} accent={accent} />
        <h2
          style={{
            margin: "20px 0 0",
            fontSize: "clamp(25px, 2.9vw, 37px)",
            fontWeight: 600,
            letterSpacing: "-0.034em",
            lineHeight: 1.08,
            color: "var(--c-900)",
          }}
          className="txt-balance"
        >
          <span className="zw-feat-title">{post.title}</span>
        </h2>
        {post.excerpt && (
          <p
            className="txt-pretty"
            style={{
              margin: "16px 0 0",
              fontSize: 15.5,
              lineHeight: 1.6,
              color: "var(--c-600)",
            }}
          >
            {post.excerpt}
          </p>
        )}
        <span
          style={{
            marginTop: "auto",
            paddingTop: 28,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ flex: 1, minWidth: 0 }}>
            <BlogMeta
              date={post.dateLabel}
              read={formatReadingTime(post.readingMinutes)}
              size={12.5}
            />
          </span>
          <span
            className="zw-feat-readline"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              flexShrink: 0,
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--c-900)",
              letterSpacing: "-0.01em",
            }}
          >
            <span className="zw-feat-readlbl">{dict.blog.readStory}</span>
            <span className="zw-feat-go">
              <span className="zw-feat-go-a" aria-hidden="true">
                <Icon name="arrowR" size={16} color="#fff" />
              </span>
              <span className="zw-feat-go-b" aria-hidden="true">
                <Icon name="arrowR" size={16} color="#fff" />
              </span>
            </span>
          </span>
        </span>
      </span>
    </Link>
  );
}
