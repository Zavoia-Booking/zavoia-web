import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { categoryAccent, formatReadingTime } from "@/lib/blog";
import { urlForImage } from "@/sanity/image";
import { Icon } from "@/components/ui/icon";
import { Img } from "@/components/ui/image";
import type { BlogCardVM } from "./types";

export interface BlogCardProps {
  locale: Locale;
  post: BlogCardVM;
  categoryLabel: string;
}

// Editorial grid card. Ported from ZwBlogCard (docs/web-blog.jsx:218-266).
// Differences from the prototype:
//  - The card root is a real next/link <Link> to the post (better SSR/SEO)
//    instead of the role=button/onClick affordance.
//  - The footer omits the author avatar/name (no author data exists). It keeps
//    the full-bleed top border, renders only the date on the left, the flex
//    spacer, and the circular go-arrow on the right.
// This component uses no client-only APIs so it can be rendered from either a
// server or a client parent — slice 3's "related" grid reuses it server-side.
export function BlogCard({ locale, post, categoryLabel }: BlogCardProps) {
  const accent = categoryAccent(post.category);
  const readLabel = formatReadingTime(post.readingMinutes).replace(" read", "");
  const cover = post.coverImage?.asset
    ? urlForImage(post.coverImage).width(640).height(360).url()
    : undefined;

  return (
    <Link
      href={localeHref(locale, "blog", post.slug)}
      className="zw-hover-lift zw-zoom-parent"
      style={{
        background: "#fff",
        border: "1px solid rgba(28,28,26,0.06)",
        borderRadius: "var(--card-r, 18px)",
        overflow: "hidden",
        boxShadow: "var(--sh-sm)",
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        className="zw-zoom-wrap"
        style={{
          position: "relative",
          aspectRatio: "16 / 9",
          background: "var(--c-300)",
        }}
      >
        <Img
          src={cover}
          alt={post.coverImage?.alt || post.title}
          style={{ width: "100%", height: "100%" }}
        />
        <span className="zw-bcard-cat">
          <span
            aria-hidden="true"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: accent,
            }}
          />
          {categoryLabel}
        </span>
        <span className="zw-readtag">
          <Icon name="clock" size={11} color="#fff" />
          {readLabel}
        </span>
      </div>
      <div
        style={{
          padding: "17px 20px 18px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <h3
          className="txt-balance"
          style={{
            margin: 0,
            fontSize: 18.5,
            fontWeight: 600,
            letterSpacing: "-0.024em",
            lineHeight: 1.22,
            color: "var(--c-900)",
          }}
        >
          <span className="zw-card-title">{post.title}</span>
        </h3>
        {post.excerpt && (
          <p
            className="txt-pretty"
            style={{
              margin: "9px 0 0",
              fontSize: 13.5,
              lineHeight: 1.55,
              color: "var(--c-600)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {post.excerpt}
          </p>
        )}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 15,
            marginLeft: -20,
            marginRight: -20,
            paddingLeft: 20,
            paddingRight: 20,
            borderTop: "1px solid rgba(28,28,26,0.06)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 12.5,
              color: "var(--c-500)",
              whiteSpace: "nowrap",
            }}
          >
            {post.dateLabel}
          </span>
          <span style={{ flex: 1 }} />
          <span className="zw-bcard-go" aria-hidden="true">
            <Icon name="arrowR" size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}
