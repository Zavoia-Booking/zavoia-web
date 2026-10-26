"use client";

import { useMemo, useRef, useState } from "react";
import { Icon, Img } from "@/components/ui";
import { ImageViewer } from "@/components/ui/image-viewer";
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
  const opener = useRef<HTMLButtonElement | null>(null);
  const photoTriggers = useRef<Array<HTMLButtonElement | null>>([]);
  const currentIndex = Math.min(index, Math.max(photos.length - 1, 0));
  const total = photos.length;

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
      <div className={styles.gallery} data-photo-count={Math.min(total, 3)}>
        <div className={styles.mosaic}>
          {photos.slice(0, 3).map((photo, photoIndex) => (
            <button
              key={photo}
              ref={(node) => { photoTriggers.current[photoIndex] = node; }}
              type="button"
              className={`${styles.tile} zw-zoom-wrap zw-zoom-parent`}
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
                sizes={photoIndex === 0
                  ? total === 1
                    ? "(max-width: 1456px) calc(100vw - 32px), 1400px"
                    : "(max-width: 920px) calc(100vw - 32px), (max-width: 1456px) 66vw, 934px"
                  : "(max-width: 920px) 1px, (max-width: 1456px) 33vw, 467px"}
                loading={photoIndex === 0 ? "eager" : "lazy"}
                fetchPriority={photoIndex === 0 ? "high" : "auto"}
                draggable={false}
                style={{ width: "100%", height: "100%" }}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`${styles.showAll} tap`}
          aria-haspopup="dialog"
          aria-label={dict.business.showAllPhotos}
          onClick={(event) => {
            opener.current = event.currentTarget;
            setIndex(0);
          }}
        >
          <Icon name="grid" size={15} />
          <span className={styles.desktopLabel}>{dict.business.showAllPhotos}</span>
          <span className={styles.photoCount}>{format(total === 1 ? t.photosOne : t.photos, { count: String(total) })}</span>
        </button>
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
          getSource={(photoIndex) => photoTriggers.current[photoIndex] ?? null}
          getReturnFocus={() => opener.current}
          showThumbnails
        />
      )}
    </>
  );
}
