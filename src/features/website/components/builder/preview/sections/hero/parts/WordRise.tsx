import { Fragment, useContext, type CSSProperties, type ElementType } from "react";
import { StaticPreviewContext } from "../../../shared/hooks";

/** Headline split into per-word masks that rise into place (mirrors the design's SplitReveal). Renders an
 *  <h1> on a website and a presentational <div> in thumbnails; pass `as="span"` to compose several lines
 *  inside an outer heading (poster / portal). */
export function WordRise({
  text,
  base,
  step,
  className,
  style,
  as,
  ariaLabel,
}: {
  text: string;
  base: number;
  step: number;
  className?: string;
  style?: CSSProperties;
  as?: ElementType;
  ariaLabel?: string;
}) {
  const staticPreview = useContext(StaticPreviewContext);
  const Tag = as ?? (staticPreview ? "div" : "h1");
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <Tag className={className} style={style} aria-label={ariaLabel}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="mc-rev-word">
            <span style={{ animationDelay: `${base + i * step}ms` }}>{w}</span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </Tag>
  );
}
