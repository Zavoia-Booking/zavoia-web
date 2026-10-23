"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import { Icon, Img } from "@/components/ui";
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
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const opener = useRef<HTMLButtonElement | null>(null);
  const thumbnailStrip = useRef<HTMLDivElement | null>(null);
  const touch = useRef<{ x: number; y: number; at: number } | null>(null);
  const currentIndex = Math.min(index, Math.max(photos.length - 1, 0));
  const total = photos.length;

  function photoLabel(photoIndex: number) {
    return format(t.photoAlt, { name, index: String(photoIndex + 1) });
  }

  function showPhoto(photoIndex: number) {
    const next = Math.max(0, Math.min(total - 1, photoIndex));
    setIndex(next);
    const strip = thumbnailStrip.current;
    const thumbnail = strip?.children[next] as HTMLElement | undefined;
    if (strip && thumbnail) {
      // Move this horizontal rail only; scrollIntoView can scroll the dialog too.
      strip.scrollLeft = thumbnail.offsetLeft - (strip.clientWidth - thumbnail.offsetWidth) / 2;
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        showPhoto(currentIndex - 1);
        break;
      case "ArrowRight":
        event.preventDefault();
        showPhoto(currentIndex + 1);
        break;
      case "Home":
        event.preventDefault();
        showPhoto(0);
        break;
      case "End":
        event.preventDefault();
        showPhoto(total - 1);
        break;
    }
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    const point = event.touches[0];
    touch.current = event.touches.length === 1
      ? { x: point.clientX, y: point.clientY, at: Date.now() }
      : null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = touch.current;
    touch.current = null;
    const end = event.changedTouches[0];
    if (!start || !end || event.touches.length > 0) return;
    const dx = end.clientX - start.x;
    const dy = end.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 45 && Date.now() - start.at < 800) {
      showPhoto(currentIndex + (dx < 0 ? 1 : -1));
    }
  }

  if (total === 0) {
    return (
      <div className={`${styles.gallery} ${styles.empty}`}>
        <Img alt={name} label={cat} style={{ width: "100%", height: "100%" }} />
      </div>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div className={styles.gallery} data-photo-count={Math.min(total, 3)}>
        <div className={styles.mosaic}>
          {photos.slice(0, 3).map((photo, photoIndex) => (
            <button
              key={photo}
              type="button"
              className={`${styles.tile} zw-zoom-wrap zw-zoom-parent`}
              aria-label={photoLabel(photoIndex)}
              aria-haspopup="dialog"
              onClick={(event) => {
                opener.current = event.currentTarget;
                setIndex(photoIndex);
                setOpen(true);
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
            setOpen(true);
          }}
        >
          <Icon name="grid" size={15} />
          <span className={styles.desktopLabel}>{dict.business.showAllPhotos}</span>
          <span className={styles.photoCount}>{format(total === 1 ? t.photosOne : t.photos, { count: String(total) })}</span>
        </button>
      </div>

      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay}>
          <Dialog.Content
            className={styles.viewer}
            aria-describedby={undefined}
            onKeyDown={handleKeyDown}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (opener.current?.isConnected) opener.current.focus({ preventScroll: true });
            }}
          >
            <div className={styles.viewerHeader}>
              <Dialog.Title className={styles.viewerTitle}>{name}</Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className={`${styles.iconButton} tap`} aria-label={dict.business.close}>
                  <Icon name="x" size={19} />
                </button>
              </Dialog.Close>
            </div>

            <div
              className={styles.stage}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={() => { touch.current = null; }}
            >
              <Img
                src={photos[currentIndex]}
                alt={photoLabel(currentIndex)}
                title=""
                label={cat}
                sizes="(max-width: 920px) 100vw, (max-width: 1280px) calc(100vw - 64px), 1216px"
                loading="eager"
                draggable={false}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>

            <div className={styles.viewerFooter}>
              <div className={styles.navigation}>
                <button
                  type="button"
                  className={`${styles.iconButton} tap`}
                  onClick={() => showPhoto(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  aria-label={t.previousPhoto}
                >
                  <Icon name="chevL" size={18} />
                </button>
                <span className={styles.position} aria-live="polite" aria-atomic="true">
                  {format(t.photoPosition, { index: String(currentIndex + 1), count: String(total) })}
                </span>
                <button
                  type="button"
                  className={`${styles.iconButton} tap`}
                  onClick={() => showPhoto(currentIndex + 1)}
                  disabled={currentIndex === total - 1}
                  aria-label={t.nextPhoto}
                >
                  <Icon name="chevR" size={18} />
                </button>
              </div>
              {total > 1 && (
                <div className={styles.thumbnails} ref={thumbnailStrip}>
                  {photos.map((photo, photoIndex) => (
                    <button
                      key={photo}
                      type="button"
                      className={styles.thumbnail}
                      aria-label={photoLabel(photoIndex)}
                      aria-pressed={currentIndex === photoIndex}
                      onClick={() => showPhoto(photoIndex)}
                    >
                      <Img src={photo} alt="" title="" label={cat} sizes="64px" draggable={false} style={{ width: "100%", height: "100%" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
