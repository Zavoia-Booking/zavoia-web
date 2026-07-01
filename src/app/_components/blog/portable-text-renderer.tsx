import {
  PortableText,
  type PortableTextComponents,
} from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { urlForImage } from "@/sanity/image";
import { Icon } from "@/components/ui/icon";
import { Img } from "@/components/ui/image";

export interface PortableTextRendererProps {
  blocks: PortableTextBlock[];
  // _key -> anchor id, computed once in blog-post.tsx so the prose headings
  // match the TOC links exactly (immune to duplicate heading text).
  headingIds: Map<string, string>;
  // _key of the first paragraph block — receives the drop-cap.
  firstParagraphKey?: string;
}

const HEADING_SCROLL_MARGIN = "calc(var(--nav-h) + 28px)";

// Rich editorial prose renderer. Ported from ZwBlogProse (web-blog.jsx:368-435):
// drop-cap lead paragraph, anchored h2/h3, serif pull-quote, check-bullet
// lists and zoomable figures. Heading ids come from the precomputed map keyed
// by block `_key`, never re-slugged here, so prose and TOC stay in lockstep.
function buildComponents(
  headingIds: Map<string, string>,
  firstKey?: string,
): PortableTextComponents {
  return {
    block: {
      normal: ({ value, children }) => {
        const isFirst = (value as { _key?: string })._key === firstKey;
        return (
          <p
            className={"txt-pretty" + (isFirst ? " zw-dropcap" : "")}
            style={{
              margin: "0 0 22px",
              fontSize: 16.5,
              lineHeight: 1.72,
              color: "var(--c-700)",
              letterSpacing: "-0.008em",
            }}
          >
            {children}
          </p>
        );
      },
      h2: ({ value, children }) => (
        <h2
          id={headingIds.get((value as { _key?: string })._key ?? "")}
          className="txt-balance"
          style={{
            margin: "44px 0 14px",
            fontSize: "clamp(21px, 2vw, 26px)",
            fontWeight: 600,
            letterSpacing: "-0.026em",
            lineHeight: 1.2,
            color: "var(--c-900)",
            scrollMarginTop: HEADING_SCROLL_MARGIN,
          }}
        >
          {children}
        </h2>
      ),
      h3: ({ value, children }) => (
        <h3
          id={headingIds.get((value as { _key?: string })._key ?? "")}
          className="txt-balance"
          style={{
            margin: "34px 0 12px",
            fontSize: "clamp(18px, 1.7vw, 22px)",
            fontWeight: 600,
            letterSpacing: "-0.024em",
            lineHeight: 1.25,
            color: "var(--c-900)",
            scrollMarginTop: HEADING_SCROLL_MARGIN,
          }}
        >
          {children}
        </h3>
      ),
      blockquote: ({ children }) => (
        <figure style={{ margin: "40px 0", padding: "0 0 0 4px", position: "relative" }}>
          <span
            aria-hidden="true"
            style={{
              display: "block",
              fontFamily: "Georgia, serif",
              fontSize: 64,
              lineHeight: 0.6,
              color: "var(--p-200)",
              height: 30,
              marginBottom: 6,
            }}
          >
            {"“"}
          </span>
          <blockquote
            className="txt-pretty"
            style={{
              margin: 0,
              fontSize: "clamp(20px, 2vw, 25px)",
              fontWeight: 500,
              letterSpacing: "-0.024em",
              lineHeight: 1.4,
              color: "var(--c-900)",
            }}
          >
            {children}
          </blockquote>
        </figure>
      ),
    },
    list: {
      bullet: ({ children }) => (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 22px",
            display: "flex",
            flexDirection: "column",
            gap: 13,
          }}
        >
          {children}
        </ul>
      ),
      number: ({ children }) => (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 22px",
            display: "flex",
            flexDirection: "column",
            gap: 13,
          }}
        >
          {children}
        </ul>
      ),
    },
    listItem: {
      bullet: ({ children }) => (
        <li style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
          <span
            aria-hidden="true"
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "var(--p-100)",
              flexShrink: 0,
              marginTop: 3,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="check" size={11} color="var(--p-600)" />
          </span>
          <span
            style={{
              fontSize: 16.5,
              lineHeight: 1.6,
              color: "var(--c-700)",
              letterSpacing: "-0.008em",
            }}
          >
            {children}
          </span>
        </li>
      ),
      number: ({ children }) => (
        <li style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
          <span
            aria-hidden="true"
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "var(--p-100)",
              flexShrink: 0,
              marginTop: 3,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="check" size={11} color="var(--p-600)" />
          </span>
          <span
            style={{
              fontSize: 16.5,
              lineHeight: 1.6,
              color: "var(--c-700)",
              letterSpacing: "-0.008em",
            }}
          >
            {children}
          </span>
        </li>
      ),
    },
    marks: {
      strong: ({ children }) => (
        <strong style={{ fontWeight: 600, color: "var(--c-900)" }}>
          {children}
        </strong>
      ),
      em: ({ children }) => <em>{children}</em>,
      link: ({ value, children }) => {
        const href = (value as { href?: string })?.href ?? "";
        const external = /^https?:\/\//.test(href);
        return (
          <a
            href={href}
            className="zw-link"
            style={{ color: "var(--p-600)", textDecoration: "none" }}
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
        const caption = (value as { caption?: string })?.caption;
        return (
          <figure style={{ margin: "40px 0" }}>
            <div
              className="zw-zoom-wrap"
              style={{
                borderRadius: "var(--r-xl)",
                overflow: "hidden",
                aspectRatio: "16 / 9",
                background: "var(--c-300)",
                boxShadow: "var(--sh-md)",
              }}
            >
              <Img
                src={src}
                alt={value?.alt || ""}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            {caption && (
              <figcaption
                style={{
                  marginTop: 12,
                  paddingLeft: 14,
                  borderLeft: "2px solid var(--c-300)",
                  fontSize: 12.5,
                  color: "var(--c-500)",
                  lineHeight: 1.5,
                }}
              >
                {caption}
              </figcaption>
            )}
          </figure>
        );
      },
    },
  };
}

export function PortableTextRenderer({
  blocks,
  headingIds,
  firstParagraphKey,
}: PortableTextRendererProps) {
  return (
    <PortableText
      value={blocks}
      components={buildComponents(headingIds, firstParagraphKey)}
    />
  );
}
