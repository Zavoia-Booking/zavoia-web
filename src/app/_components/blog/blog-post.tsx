import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import type { Post } from "@/sanity/types";
import { dictionaries } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { localeHref } from "@/i18n/routes";
import { categoryLabelKey, formatReadingTime, readingMinutes } from "@/lib/blog";
import { resolveBlogAuthor } from "@/lib/blog/author";
import { getPostModifiedAt } from "@/lib/blog/dates";
import { getBlogCoverAlt } from "@/lib/blog/image-alt";
import { BLOG_IMAGE_SIZES, blogImageUrl } from "@/lib/blog/images";
import { getArticleLinkHref } from "@/lib/blog/useful-links";
import { blogIndexHref } from "@/lib/blog/listing";
import { blogBreadcrumbStructuredData, blogPostStructuredData, serializeJsonLd } from "@/lib/seo/page-structured-data";
import { Icon } from "@/components/ui/icon";
import { ArticleExtras } from "./article-extras";
import { BlogRelatedArticles } from "./blog-related-articles";
import { BlogImage } from "./blog-image";
import { ArticleActions, ReadingChrome } from "./reading-chrome";
import { Toc } from "./toc";
import { PortableTextRenderer } from "./portable-text-renderer";
import { collectHeadings } from "./vm";
import { preloadSignatureFont } from "../for-business/signature-font";
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
  preloadSignatureFont();
  const dict = dictionaries[locale];
  const body = post.body?.[locale] ?? [];
  const headings = collectHeadings(body);
  const headingIds = new Map(headings.map((heading) => [heading.key, heading.id]));
  const minutes = readingMinutes(body);
  const author = resolveBlogAuthor(post.author);
  const hasCustomAuthor = typeof post.author?.name === "string" && post.author.name.trim().length > 0;
  const byline = format(hasCustomAuthor ? dict.blog.byline : dict.blog.defaultByline, { author: author.name });
  const modifiedAt = getPostModifiedAt(post);
  const dateLabel = new Date(post.publishedAt).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const categoryLabel = post.category
    ? dict.blog[categoryLabelKey(post.category)]
    : "";
  const title = post.title[locale] ?? "";
  const excerpt = post.excerpt?.[locale] ?? "";
  const cover = blogImageUrl(post.coverImage, { width: 1600 });
  const articleImages = [16 / 9, 4 / 3, 1].flatMap((aspectRatio) => {
    const image = blogImageUrl(post.coverImage, { width: 1600, aspectRatio });
    return image ? [image.url] : [];
  });
  const faqItems = (post.faq ?? []).flatMap((item) => {
    const q = item.question?.[locale]?.trim();
    const a = item.answer?.[locale]?.trim();
    return q && a ? [{ q, a }] : [];
  });
  const usefulLinks = (post.usefulLinks ?? []).flatMap(item => {
    const label = item.label?.[locale]?.trim();
    const href = getArticleLinkHref(item.href?.[locale]);
    return label && href ? [{ key: item._key, label, href }] : [];
  });
  // Authored headings and appended sections share one anchor namespace.
  const headingAnchors = new Set(headings.map((heading) => heading.id));
  const sectionAnchor = (base: string) => {
    let id = base;
    for (let suffix = 2; headingAnchors.has(id); suffix++) id = `${base}-${suffix}`;
    headingAnchors.add(id);
    return id;
  };
  const faqId = sectionAnchor("faq");
  const linksId = sectionAnchor("useful-links");
  const tocHeadings = [
    ...headings.map((heading) => ({ id: heading.id, text: heading.text, level: heading.level })),
    ...(faqItems.length > 0 ? [{ id: faqId, text: dict.blog.faqTitle, level: 2 as const }] : []),
    ...(usefulLinks.length > 0 ? [{ id: linksId, text: dict.blog.usefulLinksTitle, level: 2 as const }] : []),
  ];
  const hasContents = tocHeadings.length >= 2;
  const postSlug = post.slug[locale]?.current;
  const postPath = postSlug ? localeHref(locale, "blog", postSlug) : undefined;
  const breadcrumbs = postPath ? blogBreadcrumbStructuredData([
    { name: dict.blog.heading, path: blogIndexHref(locale) },
    ...(post.category ? [{ name: categoryLabel, path: blogIndexHref(locale, post.category) }] : []),
    { name: title, path: postPath },
  ]) : null;
  const articleJsonLd = postPath
    ? blogPostStructuredData({
        locale,
        path: postPath,
        headline: title,
        description: excerpt,
        articleSection: categoryLabel,
        datePublished: post.publishedAt,
        dateModified: modifiedAt,
        image: articleImages,
        author,
        faqItems,
        breadcrumbs,
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
      <ReadingChrome articleId="blog-article" />
      <article id="blog-article">
        <div className={styles.heroRegion}>
          <header className={`zw-container ${styles.articleFrame} ${styles.header}`}>
            <nav className={styles.navigation} aria-label={dict.blog.breadcrumbLabel}>
              <Link href={localeHref(locale, "blog")} className={styles.backLink}>
                <Icon name="back" size={17} />{dict.blog.backToList}
              </Link>
            </nav>
            <div className={styles.opening} data-cover={Boolean(cover)}>
              <div className={styles.head}>
                <div className={styles.publication}>
                  {categoryLabel && <Link className={styles.categoryLink} href={blogIndexHref(locale, post.category)}>{categoryLabel}</Link>}
                  <dl className={styles.articleDetails}>
                    <div>
                      <dt className="sr-only">{dict.blog.publishedLabel}</dt>
                      <dd><time dateTime={post.publishedAt}>{dateLabel}</time></dd>
                    </div>
                    <div>
                      <dt className="sr-only">{dict.blog.readingTimeLabel}</dt>
                      <dd>{formatReadingTime(minutes, locale)}</dd>
                    </div>
                    {modifiedAt && <div className={styles.updatedDetail}>
                      <dt>{dict.blog.updatedLabel}</dt>
                      <dd><time dateTime={modifiedAt}>{new Date(modifiedAt).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}</time></dd>
                    </div>}
                  </dl>
                </div>
                <h1 className={`txt-balance ${styles.title}`} data-length={title.length < 25 ? "short" : title.length > 60 ? "long" : "medium"}>{title}</h1>
                {excerpt && <p className={`txt-pretty ${styles.excerpt}`}>{excerpt}</p>}
                <div className={styles.storyInfo}>
                  <p className={styles.byline}>{author.url
                    ? <a href={author.url} className={styles.authorLink} rel="author">{byline}</a>
                    : byline}</p>
                  <ArticleActions title={title} path={postPath} />
                </div>
              </div>
              {cover && <figure className={styles.cover}>
                <BlogImage
                  image={post.coverImage}
                  alt={getBlogCoverAlt(post.coverImage, locale)}
                  sizes={BLOG_IMAGE_SIZES.cover}
                  maxWidth={1600}
                  loading="eager"
                  fetchPriority="high"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectPosition: post.coverImage?.hotspot
                      ? `${post.coverImage.hotspot.x * 100}% ${post.coverImage.hotspot.y * 100}%`
                      : "center",
                  }}
                />
              </figure>}
            </div>
          </header>
        </div>
        <div className={`zw-container ${styles.articleFrame} ${styles.bodyFrame}`}>
          <div className={`${styles.editorialGrid} ${styles.readingGrid}`}>
            {hasContents && (
              <aside className={styles.contents}>
                <Toc headings={tocHeadings} label={dict.blog.inThisArticle} />
              </aside>
            )}
            <div className={styles.body}>
              <PortableTextRenderer blocks={body} headingIds={headingIds} imageSizes={hasContents ? BLOG_IMAGE_SIZES.body : BLOG_IMAGE_SIZES.full} />
              {related.length === 0 && faqItems.length === 0 && usefulLinks.length === 0 && (
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
        <ArticleExtras locale={locale} faqId={faqId} linksId={linksId} questions={faqItems} links={usefulLinks} />
      </article>
      {related.length > 0 && <BlogRelatedArticles locale={locale} posts={related} />}
    </main>
  );
}
