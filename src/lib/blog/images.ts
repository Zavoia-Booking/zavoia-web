import { getImageProps } from "next/image";
import type { SanityImage } from "@/sanity/types";
import { urlForImage } from "@/sanity/image";

// Match the shared 1400px content width, page gutters and each editorial grid.
export const BLOG_IMAGE_SIZES = {
  feature: "(max-width: 600px) calc(100vw - 32px), (max-width: 760px) calc(100vw - 40px), (max-width: 920px) calc(55vw - 44px), (max-width: 1100px) calc(55vw - 52.8px), (max-width: 1456px) calc(55vw - 66px), 735px",
  card: "(max-width: 600px) calc(100vw - 32px), (max-width: 640px) calc(100vw - 40px), (max-width: 920px) calc(50vw - 34px), (max-width: 980px) calc(50vw - 42px), (max-width: 1456px) calc(33.333vw - 40px), 446px",
  cover: "(max-width: 600px) calc(100vw - 32px), (max-width: 760px) calc(100vw - 40px), (max-width: 920px) calc(50vw - 40px), (max-width: 1100px) calc(50vw - 48px), (max-width: 1456px) calc(50vw - 60px), 668px",
  body: "(max-width: 600px) calc(100vw - 32px), (max-width: 920px) calc(100vw - 40px), (max-width: 1024px) calc(100vw - 56px), (max-width: 1100px) calc(100vw - 336px), (max-width: 1456px) calc(100vw - 360px), 1096px",
  full: "(max-width: 600px) calc(100vw - 32px), (max-width: 920px) calc(100vw - 40px), (max-width: 1456px) calc(100vw - 56px), 1400px",
} as const;

type ImageOptions = {
  width: number;
  aspectRatio?: number;
  quality?: number;
};

/** The authored crop limits the useful pixels, even when the original is larger. */
function sourceDimensions(image: SanityImage) {
  const dimensions = image.asset?._ref.match(/-(\d+)x(\d+)-[^-]+$/);
  if (!dimensions) return undefined;
  const crop = (image as SanityImage & {
    crop?: { left?: number; right?: number; top?: number; bottom?: number };
  }).crop;
  const width = Math.floor(Number(dimensions[1]) * (1 - (crop?.left ?? 0) - (crop?.right ?? 0)));
  const height = Math.floor(Number(dimensions[2]) * (1 - (crop?.top ?? 0) - (crop?.bottom ?? 0)));
  return width > 0 && height > 0 ? { width, height } : undefined;
}

/** Sanity performs the transform directly; requested dimensions never upscale it. */
export function blogImageUrl(image: SanityImage | undefined, { width: requestedWidth, aspectRatio, quality }: ImageOptions) {
  if (!image?.asset) return undefined;
  const source = sourceDimensions(image);
  if (!source || !Number.isFinite(requestedWidth) || requestedWidth <= 0) return undefined;
  const ratio = aspectRatio ?? source.width / source.height;
  if (!Number.isFinite(ratio) || ratio <= 0) return undefined;
  const width = Math.max(1, Math.floor(Math.min(requestedWidth, source.width, source.height * ratio)));
  const height = Math.max(1, Math.round(width / ratio));
  let builder = urlForImage(image).width(width).height(height);
  if (aspectRatio) builder = builder.fit("crop");
  if (quality) builder = builder.quality(quality);
  return { url: builder.url(), width, height };
}

export type BlogImageOptions = {
  alt: string;
  sizes: string;
  maxWidth?: number;
  aspectRatio?: number;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
};

/** Next generates responsive candidates; Sanity keeps its native crop and format. */
export function getBlogImageProps(image: SanityImage | undefined, {
  alt,
  sizes,
  maxWidth = 1600,
  aspectRatio,
  loading = "lazy",
  fetchPriority,
}: BlogImageOptions) {
  const rendition = blogImageUrl(image, { width: maxWidth, aspectRatio });
  if (!rendition) return undefined;
  const { props } = getImageProps({
    src: rendition.url,
    alt,
    width: rendition.width,
    height: rendition.height,
    sizes,
    loading,
    fetchPriority,
    loader: ({ width, quality }) => blogImageUrl(image, {
      width: Math.min(width, maxWidth), aspectRatio, quality,
    })!.url,
  });

  // Next's candidate widths can exceed a small source. Describe the actual
  // transformed width and remove duplicates, rather than labeling 277px as 3840w.
  const candidates = new Map<number, string>();
  for (const candidate of props.srcSet?.split(", ") ?? []) {
    const url = candidate.slice(0, candidate.lastIndexOf(" "));
    const width = Number(new URL(url).searchParams.get("w"));
    if (width > 0) candidates.set(width, url);
  }
  return {
    ...props,
    srcSet: [...candidates].sort(([a], [b]) => a - b).map(([width, url]) => `${url} ${width}w`).join(", ") || undefined,
  };
}
