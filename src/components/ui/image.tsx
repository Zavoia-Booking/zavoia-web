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
}

// Image with the shared pending treatment and stripe fallback if it fails.
// Ported from docs/icons.jsx (ZImg). Default placeholder label comes from
// i18n common.photo unless an explicit label is supplied.
export function Img(props: ImgProps) {
  return <ImageSource key={props.src ?? ""} {...props} />;
}

function ImageSource({ src, alt = "", title, label, className, style, onLoad, onError, sizes, loading = "lazy", fetchPriority, ...rest }: ImgProps) {
  const { dict } = useTranslation();
  const [err, setErr] = useState(false);
  const [ok, setOk] = useState(false);
  const [useOriginal, setUseOriginal] = useState(false);
  const placeholderLabel = label ?? dict.common.photo;

  if (err || !src) {
    return (
      <div
        className={["zv-stripe", className].filter(Boolean).join(" ")}
        style={{ ...style, display: "flex", alignItems: "center", justifyContent: "center" }}
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
  // Card containers already reserve their aspect ratio. Opt in with their actual
  // display sizes and keep the shared skeleton/error treatment around the img.
  const optimized = !useOriginal && sizes && !rest.srcSet && canOptimizePublicImage(src)
    ? getImageProps({ src, alt, fill: true, sizes, loading, fetchPriority }).props
    : null;
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
        onError?.(event);
      }}
      onLoad={(event) => { setOk(true); onLoad?.(event); }}
      ref={(el) => {
        if (!el?.complete) return;
        if (el.naturalWidth > 0) {
          setOk(true);
        } else if (el.currentSrc) {
          // A server-rendered image can fail before hydration attaches onError.
          if (optimized) setUseOriginal(true);
          else setErr(true);
        }
      }}
      className={["zw-img", ok ? "zw-img--in" : "zv-skel", className].filter(Boolean).join(" ")}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      style={{ ...optimized?.style, display: "block", objectFit: "cover", ...style }}
      {...rest}
    />
  );
}
