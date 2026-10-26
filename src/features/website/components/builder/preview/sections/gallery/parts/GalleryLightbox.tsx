import { useCallback } from "react";
import { ImageViewer } from "@/components/ui/image-viewer";
import { previewVars } from "../../../../theme";
import { useReducedMotion } from "../../../shared/hooks";
import type { T } from "../../../shared/types";
import type { GalleryImage } from "../types";

type RectLike = Pick<DOMRect, "left" | "top" | "width" | "height">;

/** Fan thumbnails are curved slice unions; the other layouts have one flat thumbnail box. */
function thumbnailRect(root: HTMLElement): RectLike {
  const slices = root.querySelectorAll<HTMLElement>(".mc-galfan-slice, .mc-gallery-fan-slice");
  if (slices.length === 0) return root.getBoundingClientRect();

  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;
  slices.forEach((slice) => {
    const rect = slice.getBoundingClientRect();
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  });
  return Number.isFinite(left)
    ? { left, top, width: right - left, height: bottom - top }
    : root.getBoundingClientRect();
}

/** Studio keeps its source-layout geometry and theme while sharing the fullscreen viewer. */
export function GalleryLightbox({
  images,
  index,
  setIndex,
  rootRef,
  brandColor,
  fontKey,
  t,
}: {
  images: GalleryImage[];
  index: number;
  setIndex: (i: number) => void;
  rootRef: React.RefObject<HTMLElement | null>;
  brandColor: string;
  fontKey: string;
  t: T;
}) {
  const reducedMotion = useReducedMotion();
  const getSource = useCallback(
    (imageIndex: number) =>
      rootRef.current?.querySelector<HTMLElement>(`[data-gimg="${imageIndex}"]`) ?? null,
    [rootRef],
  );
  const getReturnFocus = useCallback(() => {
    const thumbnail = getSource(index);
    return thumbnail?.matches("button, a[href], [tabindex]")
      ? thumbnail
      : thumbnail?.closest<HTMLElement>("button, a[href], [tabindex]") ?? null;
  }, [getSource, index]);

  return (
    <ImageViewer
      images={images}
      index={index}
      onIndexChange={setIndex}
      title={t("businessPage.builder.preview.galleryTitle")}
      labels={{
        close: t("businessPage.builder.preview.aria.closeGallery"),
        previous: t("businessPage.builder.preview.aria.previousImage"),
        next: t("businessPage.builder.preview.aria.nextImage"),
        position: (imageIndex, count) =>
          t("businessPage.builder.preview.aria.imagePosition", { index: imageIndex + 1, count }),
        unavailable: t("businessPage.builder.preview.imageUnavailable"),
      }}
      getSource={getSource}
      getSourceRect={thumbnailRect}
      getReturnFocus={getReturnFocus}
      interactionRoot={rootRef}
      reducedMotion={reducedMotion}
      style={previewVars(brandColor, fontKey)}
    />
  );
}
