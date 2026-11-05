"use client";

import { useState, type CSSProperties } from "react";
import { getImageProps } from "next/image";
import { canOptimizePublicImage } from "@/lib/image-sources";

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: number;
  ring?: boolean;
  loading?: "eager" | "lazy";
  /** Without a photo, Saved's two-initial monogram ("ET") instead of one letter. */
  monogram?: boolean;
  /** The adjacent text already names this person or brand: empty alt, so a link isn't named twice. */
  decorative?: boolean;
}

export function Avatar(props: AvatarProps) {
  return <AvatarSource key={props.src ?? ""} {...props} />;
}

/** First and last initials, so "Elena Test" reads ET rather than a lone E. */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = Array.from(words[0] ?? "?")[0] ?? "?";
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] ?? "" : "";
  return (first + last).toUpperCase();
}

function AvatarSource({ src, name = "?", size = 40, ring = false, monogram = false, loading, decorative = false }: AvatarProps) {
  const [err, setErr] = useState(false);
  const [useOriginal, setUseOriginal] = useState(false);
  const initial = monogram ? initialsOf(name || "?") : (name || "?").trim()[0]?.toUpperCase() || "?";
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    background: monogram ? "linear-gradient(150deg, var(--c-shade), var(--c-mist))" : "var(--c-200)",
    color: monogram ? "var(--c-800)" : "var(--c-700)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    fontSize: size * (monogram ? 0.3 : 0.42),
    letterSpacing: monogram ? "-0.02em" : undefined,
    flexShrink: 0,
    overflow: "hidden",
    boxShadow: ring ? "0 0 0 2px var(--c-canvas), 0 0 0 3px var(--c-300)" : "none",
  };
  if (!src || err) {
    return (
      <div style={style} aria-label={decorative ? undefined : name} aria-hidden={decorative || undefined}>
        {initial}
      </div>
    );
  }
  const alt = decorative ? "" : name;
  // A fixed square: the optimizer serves 1x and 2x copies instead of the full upload.
  const props = !useOriginal && canOptimizePublicImage(src)
    ? getImageProps({ src, alt, width: size, height: size }).props
    : null;
  // SVGs pass through unoptimized, without a srcset; only a real copy can fall back.
  const optimized = props?.srcSet ? props : null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={optimized?.src ?? src}
      srcSet={optimized?.srcSet}
      alt={alt}
      title={decorative ? undefined : name}
      loading={loading}
      // An optimizer failure retries the original before falling back to initials.
      onError={() => optimized ? setUseOriginal(true) : setErr(true)}
      ref={(el) => {
        // The optimizer's copy can fail before hydration attaches onError.
        if (optimized && el?.complete && el.naturalWidth === 0 && el.currentSrc) setUseOriginal(true);
      }}
      style={{ ...style, objectFit: "cover" }}
    />
  );
}
