import { createContext, useContext, useState } from "react";
import { getImageProps } from "next/image";
import { canOptimizePublicImage } from "@/lib/image-sources";

/** Generate responsive sources without replacing the renderer's CSS geometry. */
export const PreviewImageSizesContext = createContext<string | undefined>(undefined);

/** A finished image with no pixels. */
const hasNoPixels = (node: HTMLImageElement) => node.complete && node.naturalWidth === 0 && !!node.currentSrc;

/**
 * Runs `retry` for an image whose request failed before React could hear its error event.
 * A lazy `sizes="auto"` image that is 0px wide also reports no natural size, so for those
 * `decode()` decides: it rejects for a failed image and resolves for a healthy one.
 */
function retryIfFailed(node: HTMLImageElement | null, retry: () => unknown) {
  if (!node || !hasNoPixels(node)) return;
  if (node.loading !== "lazy" || !/^auto(,|$)/i.test(node.sizes)) {
    retry();
    return;
  }
  // A source change also rejects a decode in flight, so only two rejections in a row count.
  const stillFailed = () => node.isConnected && hasNoPixels(node);
  node.decode().catch(() => {
    if (stillFailed()) node.decode().catch(() => {
      if (stillFailed()) retry();
    });
  });
}

export function useResponsivePublicImage(src: string | null | undefined, sizes: string, srcSet?: string) {
  const previewSizes = useContext(PreviewImageSizesContext);
  const imageSizes = previewSizes ?? sizes;
  const [originalSource, setOriginalSource] = useState<string | null>(null);
  const optimized = src && src !== originalSource && !srcSet && canOptimizePublicImage(src)
    ? getImageProps({ src, alt: "", fill: true, sizes: imageSizes }).props
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
      sizes: imageSizes,
      ref(node: HTMLImageElement | null) {
        // A server-rendered optimizer request can fail before onError hydrates.
        retryIfFailed(node, retryOriginal);
      },
    },
    /** Keep the existing failed-image treatment for an original URL that fails too. */
    retryOriginal,
  };
}
