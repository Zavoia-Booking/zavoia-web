"use client";

import { useState, type CSSProperties, type ImgHTMLAttributes } from "react";
import { useTranslation } from "@/i18n/useTranslation";

export interface ImgProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  src?: string;
  alt?: string;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

// Image with the shared pending treatment and stripe fallback if it fails.
// Ported from docs/icons.jsx (ZImg). Default placeholder label comes from
// i18n common.photo unless an explicit label is supplied.
export function Img(props: ImgProps) {
  return <ImageSource key={props.src ?? ""} {...props} />;
}

function ImageSource({ src, alt = "", label, className, style, onLoad, onError, ...rest }: ImgProps) {
  const { dict } = useTranslation();
  const [err, setErr] = useState(false);
  const [ok, setOk] = useState(false);
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
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={(event) => { setErr(true); onError?.(event); }}
      onLoad={(event) => { setOk(true); onLoad?.(event); }}
      ref={(el) => {
        if (el && el.complete && el.naturalWidth > 0) setOk(true);
      }}
      className={["zw-img", ok ? "zw-img--in" : "zv-skel", className].filter(Boolean).join(" ")}
      loading="lazy"
      decoding="async"
      style={{ display: "block", objectFit: "cover", ...style }}
      {...rest}
    />
  );
}
