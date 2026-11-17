"use client";

import { useState, type CSSProperties, type ImgHTMLAttributes, type ReactNode } from "react";
import { getImageProps } from "next/image";
import { useTranslation } from "@/i18n/useTranslation";
import { canOptimizePublicImage } from "@/lib/image-sources";

export interface ImgProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  src?: string;
  alt?: string;
  label?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Also called when an image has already settled before its load event attaches. */
  onReady?: (image: HTMLImageElement) => void;
  onFailure?: () => void;
}

// Image with the shared pending treatment and stripe fallback if it fails.
// Ported from docs/icons.jsx (ZImg). Default placeholder label comes from
// i18n common.photo unless an explicit label is supplied.
export function Img(props: ImgProps) {
  return <ImageSource key={props.src ?? ""} {...props} />;
}

function ImageSource({ src, alt = "", title, label, className, style, onLoad, onError, onReady, onFailure, sizes, loading = "lazy", fetchPriority, ...rest }: ImgProps) {
  const { dict } = useTranslation();
  const [err, setErr] = useState(false);
  const [ok, setOk] = useState(false);
  const [useOriginal, setUseOriginal] = useState(false);
  const placeholderLabel = label ?? dict.common.photo;
  // Frame geometry belongs to this image mode, even when the optimizer fails
  // and the original source or placeholder replaces its responsive request.
  const framed = src && sizes && !rest.srcSet && canOptimizePublicImage(src)
    ? getImageProps({ src, alt, fill: true, sizes, loading, fetchPriority }).props
    : null;
  const optimized = !useOriginal ? framed : null;

  if (err || !src) {
    return (
      <div
        className={["zv-stripe", className].filter(Boolean).join(" ")}
        style={{ ...framed?.style, ...style, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--c-600)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {placeholderLabel}
        </span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={optimized?.src ?? src}
      srcSet={optimized?.srcSet}
      sizes={sizes}
      alt={alt}
      title={title ?? (alt || undefined)}
      onError={(event) => {
        if (optimized) {
          setOk(false);
          setUseOriginal(true);
          return;
        }
        setErr(true);
        onFailure?.();
        onError?.(event);
      }}
      onLoad={(event) => { setOk(true); onReady?.(event.currentTarget); onLoad?.(event); }}
      ref={(el) => {
        if (!el?.complete) return;
        if (el.naturalWidth > 0) {
          setOk(true);
          onReady?.(el);
        } else if (el.currentSrc) {
          // A server-rendered image can fail before hydration attaches onError.
          if (optimized) setUseOriginal(true);
          else {
            setErr(true);
            onFailure?.();
          }
        }
      }}
      className={["zw-img", ok ? "zw-img--in" : "zv-skel", className].filter(Boolean).join(" ")}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      style={{ ...framed?.style, display: "block", objectFit: "cover", ...style }}
      {...rest}
    />
  );
}
