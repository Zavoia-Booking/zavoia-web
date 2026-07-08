import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import type { Post } from "@/sanity/types";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import {
  categoryAccent,
  categoryLabelKey,
  formatReadingTime,
  readingMinutes,
} from "@/lib/blog";
import { urlForImage } from "@/sanity/image";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Img } from "@/components/ui/image";
import { CatChip } from "./cat-chip";
import { BlogMeta } from "./blog-meta";
import { BlogCard } from "./blog-card";
import { ReadingChrome } from "./reading-chrome";
import { Toc } from "./toc";
import { RelatedSectionTitle } from "./related-section-title";
import { PortableTextRenderer } from "./portable-text-renderer";
import { collectHeadings, firstParagraphKey } from "./vm";
import type { BlogCardVM } from "./types";

// Editorial post page. Ported from ZwBlogPost (web-blog.jsx:514-621).
// Author omissions vs. the prototype (no author data exists in Sanity):
//  - Header byline (avatar / name / role, web-blog.jsx:547-554): the meta row,
//    its top border and spacing are kept, but only the date · read line renders.
//  - CTA band (web-blog.jsx:584-596): the avatar/name/bio are dropped; a short
//    lead line + a "More from the Journal" link to /blog remain.
export function BlogPost({
  locale,
  post,
  related,
}: {
  locale: Locale;
  post: Post;
  related: BlogCardVM[];
}) {
  const dict = dictionaries[locale];

  const body = post.body?.[locale] ?? [];
  const headings = collectHeadings(body);
  const headingIds = new Map(headings.map((h) => [h.key, h.id]));
  const firstKey = firstParagraphKey(body);

  const minutes = readingMinutes(body);
  const dateLabel = new Date(post.publishedAt).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const accent = categoryAccent(post.category);
  const categoryLabel = post.category
    ? dict.blog[categoryLabelKey(post.category) as keyof typeof dict.blog]
    : "";
  const title = post.title[locale] ?? "";
  const excerpt = post.excerpt?.[locale] ?? "";

  const cover = post.coverImage?.asset
    ? urlForImage(post.coverImage).width(1600).height(686).url()
    : undefined;

  const breadcrumbItems = [
    { label: dict.breadcrumbHome, href: localeHref(locale) },
    { label: dict.blog.breadcrumbJournal, href: localeHref(locale, "blog") },
    ...(categoryLabel ? [{ label: categoryLabel }] : []),
  ];

  return (
    <div className="zw-post-shell">
      <ReadingChrome title={title} />

      <article>
        <header
          className="zw-container"
          style={{ paddingTop: "clamp(36px, 4.5vw, 60px)" }}
        >
          <div className="zw-post-head">
            <Breadcrumb items={breadcrumbItems} />

            {categoryLabel && (
              <div style={{ marginTop: 24 }}>
                <CatChip label={categoryLabel} accent={accent} />
              </div>
            )}

            <h1
              className="txt-balance"
              style={{
                margin: "14px 0 0",
                fontSize: "clamp(32px, 4.2vw, 54px)",
                fontWeight: 600,
                letterSpacing: "-0.042em",
                lineHeight: 1.02,
                color: "var(--c-900)",
              }}
            >
              {title}
            </h1>

            {excerpt && (
              <p
                className="txt-pretty"
                style={{
                  margin: "20px 0 0",
                  fontSize: "clamp(16px, 1.5vw, 19px)",
                  lineHeight: 1.6,
                  color: "var(--c-600)",
                  maxWidth: 680,
                }}
              >
                {excerpt}
              </p>
            )}

            {/* Meta row — byline omitted (no author data), date · read only */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 28,
                paddingTop: 24,
                borderTop: "1px solid rgba(28,28,26,0.08)",
              }}
            >
              <BlogMeta date={dateLabel} read={formatReadingTime(minutes)} />
            </div>
          </div>
        </header>

        {/* Hero */}
        <div
          className="zw-container"
          style={{ paddingTop: "clamp(28px, 3.5vw, 44px)" }}
        >
          <div
            className="zw-zoom-parent"
            style={{
              borderRadius: "var(--r-2xl)",
              overflow: "hidden",
              aspectRatio: "21 / 9",
              background: "var(--c-300)",
              boxShadow: "var(--sh-md)",
            }}
          >
            <div className="zw-zoom-wrap" style={{ width: "100%", height: "100%" }}>
              <Img
                src={cover}
                alt={post.coverImage?.alt || title}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>
        </div>

        {/* Body + sticky TOC */}
        <div
          className="zw-container"
          style={{ paddingTop: "clamp(36px, 4.5vw, 56px)" }}
        >
          <div className="zw-post-grid">
            <div className="zw-post-main">
              <PortableTextRenderer
                blocks={body}
                headingIds={headingIds}
                firstParagraphKey={firstKey}
              />

              {/* Tags */}
              <div
                style={{
                  marginTop: 40,
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {[`#${post.category ?? "journal"}`, "#zavoia"].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      color: "var(--c-600)",
                      background: "var(--c-shade)",
                      borderRadius: 999,
                      padding: "7px 13px",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA band — author bio omitted (no author data) */}
              <div
                style={{
                  marginTop: 28,
                  padding: "24px 26px",
                  borderRadius: "var(--r-xl)",
                  background: "var(--c-shade)",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ flex: 1, minWidth: 200 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 15.5,
                      fontWeight: 600,
                      color: "var(--c-900)",
                      letterSpacing: "-0.015em",
                    }}
                  >
                    {dict.blog.relatedStories}
                  </span>
                  <span
                    style={{
                      display: "block",
                      marginTop: 3,
                      fontSize: 13,
                      color: "var(--c-600)",
                      lineHeight: 1.5,
                    }}
                  >
                    {dict.blog.listDescription}
                  </span>
                </span>
                <Link
                  href={localeHref(locale, "blog")}
                  className="tap zw-btn"
                  style={{
                    background: "#fff",
                    color: "var(--c-900)",
                    border: "1px solid rgba(28,28,26,0.14)",
                    padding: "8px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: "var(--r-full)",
                    letterSpacing: "-0.01em",
                    whiteSpace: "nowrap",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    justifyContent: "center",
                  }}
                >
                  {dict.blog.moreFromJournal}
                </Link>
              </div>
            </div>

            <aside className="zw-post-aside">
              <Toc
                headings={headings.map((h) => ({ id: h.id, text: h.text }))}
                label={dict.blog.inThisArticle}
              />
            </aside>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section
          className="zw-container"
          style={{ paddingTop: "clamp(56px, 7vw, 88px)" }}
        >
          <RelatedSectionTitle
            kicker={dict.blog.keepReading}
            title={dict.blog.relatedStories}
            action={dict.blog.allStories}
            href={localeHref(locale, "blog")}
          />
          <div className="zw-mgrid" data-cols="3">
            {related.map((vm) => (
              <BlogCard
                key={vm.id}
                locale={locale}
                post={vm}
                categoryLabel={
                  vm.category
                    ? dict.blog[
                        categoryLabelKey(vm.category) as keyof typeof dict.blog
                      ]
                    : ""
                }
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
