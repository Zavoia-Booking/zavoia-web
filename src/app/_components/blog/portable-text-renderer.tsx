import {
  PortableText,
  type PortableTextBlockComponent,
  type PortableTextComponents,
} from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { urlForImage } from "@/sanity/image";
import { BLOG_IMAGE_SIZES } from "@/lib/blog/images";
import { BlogImage } from "./blog-image";
import styles from "./blog-prose.module.css";

export interface PortableTextRendererProps {
  blocks: PortableTextBlock[];
  // Match the article's precomputed ids, including repeated heading text.
  headingIds: Map<string, string>;
  imageSizes?: string;
}

const HEADING_SCROLL_MARGIN = "calc(var(--nav-h) + 28px)";

// Sanity includes the source size in its asset URL and emits a rect parameter
// for an authored crop. Use that exact crop to reserve space without imposing
// a landscape frame on portraits, diagrams or screenshots.
export function imageDimensions(src: string | undefined) {
  if (!src) return undefined;
  const url = new URL(src);
  const dimensions = url.pathname.match(/-(\d+)x(\d+)\.[^/.]+$/);
  if (!dimensions) return undefined;

  const rect = url.searchParams.get("rect")?.split(",").map(Number);
  const width = rect?.length === 4 ? rect[2] : Number(dimensions[1]);
  const height = rect?.length === 4 ? rect[3] : Number(dimensions[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return undefined;
  }
  return { width, height };
}

function buildComponents(headingIds: Map<string, string>, imageSizes: string): PortableTextComponents {
  const heading = (Tag: "h2" | "h3" | "h4" | "h5" | "h6"): PortableTextBlockComponent =>
    function ArticleHeading({ value, children }) {
      return (
        <Tag
          id={headingIds.get(value._key ?? "")}
          className="txt-balance"
          tabIndex={-1}
          style={{ scrollMarginTop: HEADING_SCROLL_MARGIN }}
        >
          {children}
        </Tag>
      );
    };

  return {
    block: {
      normal: ({ children }) => <p className="txt-pretty">{children}</p>,
      // Older authored H1s become sections beneath the article's own H1.
      h1: heading("h2"),
      h2: heading("h2"),
      h3: heading("h3"),
      h4: heading("h4"),
      h5: heading("h5"),
      h6: heading("h6"),
      blockquote: ({ children }) => (
        <blockquote className="txt-pretty">{children}</blockquote>
      ),
    },
    list: {
      bullet: ({ children }) => <ul>{children}</ul>,
      number: ({ children }) => <ol>{children}</ol>,
    },
    listItem: {
      bullet: ({ children }) => <li>{children}</li>,
      number: ({ children }) => <li>{children}</li>,
    },
    marks: {
      strong: ({ children }) => <strong>{children}</strong>,
      em: ({ children }) => <em>{children}</em>,
      link: ({ value, children }) => {
        const href = (value as { href?: string })?.href ?? "";
        const external = /^https?:\/\//.test(href);
        return (
          <a
            href={href}
            {...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {children}
          </a>
        );
      },
    },
    types: {
      image: ({ value }) => {
        const src = value?.asset
          ? urlForImage(value).width(1600).url()
          : undefined;
        const dimensions = imageDimensions(src);
        const caption = (value as { caption?: string })?.caption;
        return (
          <figure className={styles.figure}>
            <div
              className={styles.imageFrame}
              style={dimensions ? { aspectRatio: `${dimensions.width} / ${dimensions.height}` } : undefined}
            >
              <BlogImage
                image={value}
                alt={value?.decorative ? "" : value?.alt?.trim() || ""}
                sizes={imageSizes}
                maxWidth={2200}
                style={{
                  width: "100%",
                  height: dimensions ? "100%" : "auto",
                  objectFit: "contain",
                }}
              />
            </div>
            {caption && <figcaption>{caption}</figcaption>}
          </figure>
        );
      },
    },
  };
}

export function PortableTextRenderer({
  blocks,
  headingIds,
  imageSizes = BLOG_IMAGE_SIZES.body,
}: PortableTextRendererProps) {
  return (
    <div className={styles.prose}>
      <PortableText value={blocks} components={buildComponents(headingIds, imageSizes)} />
    </div>
  );
}
