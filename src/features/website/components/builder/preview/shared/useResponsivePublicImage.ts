import { useState } from "react";
import { getImageProps } from "next/image";
import { canOptimizePublicImage } from "@/lib/image-sources";

/** Generate responsive sources without replacing the renderer's CSS geometry. */
export function useResponsivePublicImage(src: string | null | undefined, sizes: string, srcSet?: string) {
  const [originalSource, setOriginalSource] = useState<string | null>(null);
  const optimized = src && src !== originalSource && !srcSet && canOptimizePublicImage(src)
    ? getImageProps({ src, alt: "", fill: true, sizes }).props
    : null;

  const retryOriginal = () => {
    if (!src || !optimized?.srcSet) return false;
    setOriginalSource(src);
    return true;
  };

  return {
    props: {
      src: optimized?.src ?? src ?? undefined,
      srcSet: optimized?.srcSet ?? srcSet,
      sizes,
      ref(node: HTMLImageElement | null) {
        // A server-rendered optimizer request can fail before onError hydrates.
        if (node?.complete && node.naturalWidth === 0 && node.currentSrc) retryOriginal();
      },
    },
    /** Keep the existing failed-image treatment for an original URL that fails too. */
    retryOriginal,
  };
}
