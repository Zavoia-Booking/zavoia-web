"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Icon, Img } from "@/components/ui";
import { ImageViewer, type ImageViewerRect } from "@/components/ui/image-viewer";
import { format } from "@/i18n/format";
import { useTranslation } from "@/i18n/useTranslation";
import type { ListingDetail } from "@/lib/api/marketplace/types";
import styles from "./location-gallery.module.css";

interface Props {
  listing: ListingDetail;
  cat: string;
}

export function LocationGallery({ listing, cat }: Props) {
  const { dict } = useTranslation();
  const t = dict.locationPage;
  const name = listing.location.name || listing.name;
  const photos = useMemo(() => {
    const sources = [
      listing.featuredImage,
      ...listing.portfolioImages.map((image) => typeof image === "string" ? image : image.url),
    ];
    return [...new Set(sources.filter((url): url is string => typeof url === "string" && url.trim().length > 0).map((url) => url.trim()))];
  }, [listing.featuredImage, listing.portfolioImages]);
  const images = useMemo(() => photos.map((src, photoIndex) => ({
    id: src,
    src,
    alt: format(t.photoAlt, { name, index: String(photoIndex + 1) }),
  })), [photos, name, t.photoAlt]);
  const [index, setIndex] = useState(-1);
  const collage = useRef<HTMLDivElement | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const photoTriggers = useRef<Array<HTMLButtonElement | null>>([]);
  const currentIndex = Math.min(index, Math.max(photos.length - 1, 0));
  const total = photos.length;
  const previewCount = Math.min(total, 4);
  const countLabel = format(total === 1 ? t.photosOne : t.photos, { count: String(total) });

  // Only visible previews participate in the viewer's image transition. Photos
  // beyond the collage (or hidden on phones) use the viewer's fade instead.
  const sourceRect = useCallback((source: HTMLElement): ImageViewerRect | null => {
    if (!collage.current) return null;
    const bounds = collage.current.getBoundingClientRect();
    const rect = source.getBoundingClientRect();
    const left = Math.max(rect.left, bounds.left, 0);
    const top = Math.max(rect.top, bounds.top, 0);
    const right = Math.min(rect.right, bounds.right, window.innerWidth);
    const bottom = Math.min(rect.bottom, bounds.bottom, window.innerHeight);
    return right > left && bottom > top ? { left, top, width: right - left, height: bottom - top } : null;
  }, []);
  const getSource = useCallback((photoIndex: number) => {
    const source = photoTriggers.current[photoIndex];
    return source && sourceRect(source) ? source : null;
  }, [sourceRect]);
  const getReturnFocus = useCallback(() => opener.current, []);

  function photoLabel(photoIndex: number) {
    return format(t.photoAlt, { name, index: String(photoIndex + 1) });
  }

  if (total === 0) {
    return (
      <div className={`${styles.gallery} ${styles.empty}`}>
        <Img alt={name} label={cat} style={{ width: "100%", height: "100%" }} />
      </div>
    );
  }

  return (
    <>
      <div className={styles.gallery} data-photo-count={total} data-preview-count={previewCount} role="region" aria-label={`${name}, ${countLabel}`}>
        <div ref={collage} className={styles.collage}>
          {photos.slice(0, previewCount).map((photo, photoIndex) => (
            <button
              key={photo}
              ref={(node) => { photoTriggers.current[photoIndex] = node; }}
              type="button"
              className={styles.tile}
              data-photo-index={photoIndex}
              aria-label={photoLabel(photoIndex)}
              aria-haspopup="dialog"
              onClick={(event) => {
                opener.current = event.currentTarget;
                setIndex(photoIndex);
              }}
            >
              <Img
                src={photo}
                alt={photoLabel(photoIndex)}
                title=""
                label={cat}
                // Tall phone crops need source pixels for their height as well
                // as their width, especially with landscape venue photography.
                sizes={total === 1
                  ? "(max-width: 600px) 480px, (max-width: 920px) calc(100vw - 80px), (max-width: 1100px) calc(100vw - 408px), (max-width: 1440px) calc(100vw - 472px), (max-width: 1456px) calc(100vw - 528px), 928px"
                  : photoIndex === 0
                    ? total === 2
                      ? "(max-width: 600px) 400px, (max-width: 920px) 58vw, (max-width: 1440px) 46vw, 545px"
                      : "(max-width: 600px) 400px, (max-width: 920px) 42vw, (max-width: 1440px) 32vw, 390px"
                    : "(max-width: 600px) 34vw, (max-width: 920px) 32vw, (max-width: 1440px) 24vw, 310px"}
                loading={photoIndex === 0 ? "eager" : "lazy"}
                fetchPriority={photoIndex === 0 ? "high" : "auto"}
                draggable={false}
                style={{ width: "100%", height: "100%" }}
              />
            </button>
          ))}
          {total > 1 && <button
            type="button"
            className={styles.seeAll}
            aria-label={format(t.seeAllPhotosLabel, { count: String(total) })}
            aria-haspopup="dialog"
            onClick={(event) => {
              opener.current = event.currentTarget;
              setIndex(0);
            }}
          >
            <Icon name="expand" size={20} className={styles.seeAllIcon} />
            <span className={styles.seeAllText}><span>{t.seeAllPhotos}</span><span className={styles.photoCount}>{countLabel}</span></span>
          </button>}
        </div>
      </div>

      {index >= 0 && (
        <ImageViewer
          images={images}
          index={currentIndex}
          onIndexChange={setIndex}
          title={name}
          labels={{
            close: dict.business.close,
            previous: t.previousPhoto,
            next: t.nextPhoto,
            position: (photoIndex, count) => format(t.photoPosition, { index: String(photoIndex + 1), count: String(count) }),
            unavailable: dict.imageViewer.unavailable,
          }}
          getSource={getSource}
          getSourceRect={sourceRect}
          getReturnFocus={getReturnFocus}
          showThumbnails
        />
      )}
    </>
  );
}
