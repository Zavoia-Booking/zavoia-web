import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import type { Post } from "@/sanity/types";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { categoryLabelKey, formatReadingTime, readingMinutes } from "@/lib/blog";
import { urlForImage } from "@/sanity/image";
import { blogPostStructuredData, serializeJsonLd } from "@/lib/seo/page-structured-data";
import { Img } from "@/components/ui/image";
import { Icon } from "@/components/ui/icon";
import { BlogMeta } from "./blog-meta";
import { BlogRelatedArticles } from "./blog-related-articles";
import { ArticleActions, ReadingChrome } from "./reading-chrome";
import { Toc } from "./toc";
import { PortableTextRenderer } from "./portable-text-renderer";
import { collectHeadings } from "./vm";
import type { BlogCardVM } from "./types";
import styles from "./blog-post.module.css";

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
  const headingIds = new Map(headings.map((heading) => [heading.key, heading.id]));
  const minutes = readingMinutes(body);
  const dateLabel = new Date(post.publishedAt).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const categoryLabel = post.category
    ? dict.blog[categoryLabelKey(post.category) as keyof typeof dict.blog]
    : "";
  const title = post.title[locale] ?? "";
  const excerpt = post.excerpt?.[locale] ?? "";
  const cover = post.coverImage?.asset
    ? urlForImage(post.coverImage).width(1200).height(800).fit("crop").url()
    : undefined;
  const faqItems = (post.faq ?? []).flatMap((item) => {
    const q = item.question?.[locale];
    const a = item.answer?.[locale];
    return q && a ? [{ q, a }] : [];
  });
  const tocHeadings = [
    ...headings.map((heading) => ({ id: heading.id, text: heading.text, level: heading.level })),
    ...(faqItems.length > 0 ? [{ id: "faq", text: dict.blog.faqTitle, level: 2 as const }] : []),
  ];
  const hasContents = tocHeadings.length >= 3;
  const faqJsonLd =
    faqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }
      : null;
  const postSlug = post.slug[locale]?.current;
  const articleJsonLd = postSlug
    ? blogPostStructuredData({
        locale,
        path: localeHref(locale, "blog", postSlug),
        headline: title,
        description: excerpt,
        datePublished: post.publishedAt,
        image: cover,
      })
    : null;
  return (
    <main className={styles.shell} data-toc={hasContents}>
      {articleJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }}
        />
      )}
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd) }}
        />
      )}
      <ReadingChrome articleId="blog-article" />
      <article id="blog-article">
        <header className={`zw-container ${styles.header}`}>
          <div className={styles.readingFrame}>
            <nav className={styles.navigation} aria-label={dict.blog.breadcrumbLabel}>
              <Link href={localeHref(locale, "blog")} className={styles.backLink}>
                <Icon name="back" size={17} />{dict.blog.backToList}
              </Link>
              {categoryLabel && <>
                <span className={styles.navigationSeparator} aria-hidden="true">/</span>
                <Link className={styles.categoryLink} href={`${localeHref(locale, "blog")}?category=${post.category}`}>{categoryLabel}</Link>
              </>}
            </nav>
            <div className={styles.opening} data-cover={Boolean(cover)}>
              <div className={styles.head}>
                <h1 className={`txt-balance ${styles.title}`}>{title}</h1>
                {excerpt && <p className={`txt-pretty ${styles.excerpt}`}>{excerpt}</p>}
                <div className={styles.metadata}>
                  <BlogMeta date={dateLabel} read={formatReadingTime(minutes, locale)} />
                  <ArticleActions title={title} />
                </div>
              </div>
              {cover && <figure className={styles.cover}>
                <Img src={cover} alt={post.coverImage?.alt || title} loading="eager" fetchPriority="high" style={{ width: "100%", height: "100%" }} />
              </figure>}
            </div>
          </div>
        </header>
        <div className={`zw-container ${styles.bodyFrame}`}>
          <div className={styles.readingFrame}>
            <div className={styles.readingGrid}>
              {hasContents && (
                <aside className={styles.contents}>
                  <Toc headings={tocHeadings} label={dict.blog.inThisArticle} />
                </aside>
              )}
              <div className={styles.body}>
                <PortableTextRenderer blocks={body} headingIds={headingIds} />
                {faqItems.length > 0 && (
                  <section id="faq" className={styles.faq} tabIndex={-1}>
                    <h2 className="txt-balance">{dict.blog.faqTitle}</h2>
                    {faqItems.map((item, index) => (
                      <div key={index} className={styles.faqItem}>
                        <h3>{item.q}</h3>
                        <p>{item.a}</p>
                      </div>
                    ))}
                  </section>
                )}
                {related.length === 0 && (
                  <div className={styles.ending}>
                    <Link href={localeHref(locale, "blog")} className={styles.archiveLink}>
                      <Icon name="back" size={16} />
                      {dict.blog.backToList}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
      {related.length > 0 && <BlogRelatedArticles locale={locale} posts={related} />}
    </main>
  );
}
