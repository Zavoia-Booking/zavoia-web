import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ArrowRight, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "../../../../../../../../shared/lib/utils";
import { previewVars } from "../../../../theme";
import type { T } from "../../../shared/types";
import { useReducedMotion } from "../../../shared/hooks";
import { GalleryImage } from "./GalleryImage";
import type { GalleryImage as GalleryImageData } from "../types";

type RectLike = Pick<DOMRect, "left" | "top" | "width" | "height">;
type Gesture = { x0: number; y0: number; dx: number; dy: number; axis: "x" | "y" | null };

const LIGHTBOX_EASE = "cubic-bezier(.19,1,.22,1)";

function containRect(naturalWidth: number, naturalHeight: number): RectLike {
  const width0 = naturalWidth || 3;
  const height0 = naturalHeight || 2;
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const scale = Math.min((viewportWidth * 0.88) / width0, (viewportHeight * 0.8) / height0);
  const width = width0 * scale;
  const height = height0 * scale;
  return {
    left: (viewportWidth - width) / 2,
    top: (viewportHeight - height) / 2,
    width,
    height,
  };
}

/** Fan thumbnails are curved slice unions; every other variant has a single flat thumbnail box. */
function thumbnailRect(root: Element | null): RectLike | null {
  if (!root) return null;
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

/** Shared-element clone used by the design for both the opening crop morph and the softer return. */
function morphImage({
  src,
  from,
  to,
  duration,
  fade,
  reducedMotion,
  onDone,
}: {
  src: string;
  from: RectLike | null;
  to: RectLike | null;
  duration: number;
  fade?: boolean;
  reducedMotion: boolean;
  onDone: () => void;
}): () => void {
  if (!from || !to || !src || reducedMotion) {
    onDone();
    return () => undefined;
  }

  const clone = document.createElement("div");
  clone.className = "mc-gallery-lbox-morph";
  clone.style.left = `${from.left}px`;
  clone.style.top = `${from.top}px`;
  clone.style.width = `${from.width}px`;
  clone.style.height = `${from.height}px`;
  clone.style.backgroundImage = `url("${src.replaceAll('"', '\\"')}")`;
  document.body.appendChild(clone);

  const fromFrame = {
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
  };
  const toFrame = {
    left: `${to.left}px`,
    top: `${to.top}px`,
    width: `${to.width}px`,
    height: `${to.height}px`,
  };
  const frames: Keyframe[] = fade
    ? [
        { ...fromFrame, opacity: 1, boxShadow: "0 30px 80px rgba(0,0,0,.45)" },
        { opacity: 1, offset: 0.62 },
        { ...toFrame, opacity: 0, boxShadow: "0 4px 14px rgba(0,0,0,0)" },
      ]
    : [fromFrame, toFrame];
  const animation = clone.animate(frames, {
    duration,
    easing: LIGHTBOX_EASE,
    fill: "forwards",
  });
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(fallbackTimer);
    clone.remove();
    onDone();
  };
  animation.addEventListener("finish", finish, { once: true });
  const fallbackTimer = window.setTimeout(finish, duration + 90);

  return () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(fallbackTimer);
    animation.cancel();
    clone.remove();
  };
}

/** Keep the dashboard image treatment, with the web's pending and failed-image feedback. */
function LightboxPhoto({ image, fallbackLabel, size, figureRef }: {
  image: GalleryImageData;
  fallbackLabel: string;
  size: RectLike;
  figureRef: React.RefObject<HTMLElement | null>;
}) {
  const [pending, setPending] = useState(true);
  useEffect(() => {
    const img = figureRef.current?.querySelector("img");
    if (img?.complete) setPending(false);
  }, [figureRef]);
  return (
    <>
      {pending && <Skeleton className="mc-gallery-lbox-pending" w="100%" h="100%" r={8} />}
      <GalleryImage
        src={image.src}
        alt={image.alt}
        fallbackLabel={fallbackLabel}
        loading="eager"
        decoding="async"
        draggable={false}
        style={pending ? { width: size.width, height: size.height } : undefined}
        onLoad={() => setPending(false)}
        onError={() => setPending(false)}
      />
    </>
  );
}

/** Dashboard lightbox design; web adapters only handle modal safety, loading and localization. */
export function GalleryLightbox({
  images,
  index,
  setIndex,
  rootRef,
  brandColor,
  fontKey,
  t,
}: {
  images: GalleryImageData[];
  index: number;
  setIndex: (i: number) => void;
  rootRef: React.RefObject<HTMLElement | null>;
  brandColor: string;
  fontKey: string;
  t: T;
}) {
  const reducedMotion = useReducedMotion();
  const [direction, setDirection] = useState(0);
  const [closing, setClosing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLElement>(null);
  const closingRef = useRef(false);
  const closingIndexRef = useRef<number | null>(null);
  const wasOpenRef = useRef(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const morphCancelRef = useRef<(() => void) | null>(null);
  const backdropAnimationRef = useRef<Animation | null>(null);
  const galleryPointerEventsRef = useRef<string | null>(null);
  const portalContainer = typeof document === "undefined" ? null : document.body;

  const cancelActiveMotion = useCallback(() => {
    morphCancelRef.current?.();
    morphCancelRef.current = null;
    backdropAnimationRef.current?.cancel();
    backdropAnimationRef.current = null;
  }, []);

  const releaseGalleryPointer = useCallback(() => {
    const gallery = rootRef.current;
    if (!gallery || galleryPointerEventsRef.current !== null) return;
    galleryPointerEventsRef.current = gallery.style.pointerEvents;
    // Radix correctly disables outside interaction while the dialog is open. During the visual
    // return only, the overlay itself is inert and the Gallery is the one safe surface to release.
    gallery.style.pointerEvents = "auto";
  }, [rootRef]);

  const restoreGalleryPointer = useCallback(() => {
    const previous = galleryPointerEventsRef.current;
    if (previous === null) return;
    if (rootRef.current) rootRef.current.style.pointerEvents = previous;
    galleryPointerEventsRef.current = null;
  }, [rootRef]);

  const thumbnailFor = useCallback(
    (imageIndex: number) => rootRef.current?.querySelector(`[data-gimg="${imageIndex}"]`) ?? null,
    [rootRef],
  );

  const targetFor = useCallback(
    (imageIndex: number) => {
      const image = thumbnailFor(imageIndex)?.querySelector("img");
      return containRect(image?.naturalWidth ?? 3, image?.naturalHeight ?? 2);
    },
    [thumbnailFor],
  );

  const displayedImageRect = useCallback((): RectLike | null => {
    const rect = figureRef.current?.querySelector("img")?.getBoundingClientRect();
    return rect?.width && rect.height ? rect : null;
  }, []);

  const navigate = useCallback(
    (step: number) => {
      if (closingRef.current) return;
      const next = Math.max(0, Math.min(images.length - 1, index + step));
      if (next === index) return;
      cancelActiveMotion();
      if (figureRef.current) figureRef.current.style.opacity = "1";
      setDirection(step);
      setIndex(next);
    },
    [cancelActiveMotion, images.length, index, setIndex],
  );

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    closingIndexRef.current = index;
    const figure = figureRef.current;
    const current = images[index];
    const thumbnail = thumbnailFor(index);
    returnFocusRef.current =
      thumbnail instanceof HTMLElement
        ? thumbnail.matches("button, a[href], [tabindex]")
          ? thumbnail
          : thumbnail.closest<HTMLElement>("button, a[href], [tabindex]")
        : null;
    const destination = thumbnailRect(thumbnail);
    const origin = displayedImageRect() ?? targetFor(index);
    cancelActiveMotion();
    if (!figure || !current || !destination || reducedMotion) {
      setIndex(-1);
      return;
    }

    setClosing(true);
    releaseGalleryPointer();
    figure.style.opacity = "0";
    const duration = 540;
    const backdropAnimation = contentRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: Math.round(duration * 0.78),
      easing: "ease-out",
      fill: "forwards",
    }) ?? null;
    backdropAnimationRef.current = backdropAnimation;
    backdropAnimation?.addEventListener("finish", () => {
      if (backdropAnimationRef.current === backdropAnimation) backdropAnimationRef.current = null;
    }, { once: true });

    const cancelMorph = morphImage({
      reducedMotion,
      src: current.src,
      from: origin,
      to: destination,
      duration,
      fade: true,
      onDone: () => {
        if (morphCancelRef.current === cancelMorph) morphCancelRef.current = null;
        restoreGalleryPointer();
        setIndex(-1);
      },
    });
    morphCancelRef.current = cancelMorph;
  }, [
    cancelActiveMotion,
    displayedImageRect,
    images,
    index,
    reducedMotion,
    releaseGalleryPointer,
    restoreGalleryPointer,
    setIndex,
    targetFor,
    thumbnailFor,
  ]);

  useLayoutEffect(() => {
    const opening = index >= 0 && !wasOpenRef.current;
    const reopeningDuringClose =
      closingRef.current && closingIndexRef.current !== null && closingIndexRef.current !== index;
    wasOpenRef.current = index >= 0;
    if (!opening && !reopeningDuringClose) return;

    if (reopeningDuringClose) {
      cancelActiveMotion();
      restoreGalleryPointer();
      closingRef.current = false;
      closingIndexRef.current = null;
      setClosing(false);
      setDirection(0);
    }

    const figure = figureRef.current;
    const current = images[index];
    const thumbnail = thumbnailFor(index);
    returnFocusRef.current =
      thumbnail instanceof HTMLElement
        ? thumbnail.matches("button, a[href], [tabindex]")
          ? thumbnail
          : thumbnail.closest<HTMLElement>("button, a[href], [tabindex]")
        : null;
    if (!figure || !current || reducedMotion) return;

    const from = thumbnailRect(thumbnail);
    const to = targetFor(index);
    if (!from || !to) return;
    figure.style.opacity = "0";
    const backdropAnimation = contentRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 560,
      easing: LIGHTBOX_EASE,
    }) ?? null;
    backdropAnimationRef.current = backdropAnimation;
    backdropAnimation?.addEventListener("finish", () => {
      if (backdropAnimationRef.current === backdropAnimation) backdropAnimationRef.current = null;
    }, { once: true });

    const cancelMorph = morphImage({
      reducedMotion,
      src: current.src,
      from,
      to,
      duration: 560,
      onDone: () => {
        if (morphCancelRef.current === cancelMorph) morphCancelRef.current = null;
        if (figureRef.current) figureRef.current.style.opacity = "1";
      },
    });
    morphCancelRef.current = cancelMorph;
  }, [
    cancelActiveMotion,
    images,
    index,
    reducedMotion,
    restoreGalleryPointer,
    targetFor,
    thumbnailFor,
  ]);

  useEffect(
    () => () => {
      cancelActiveMotion();
      restoreGalleryPointer();
    },
    [cancelActiveMotion, restoreGalleryPointer],
  );

  const settleMotion = useCallback(() => {
    cancelActiveMotion();
    restoreGalleryPointer();
    gestureRef.current = null;
    if (figureRef.current) {
      figureRef.current.style.opacity = "1";
      figureRef.current.style.transition = "none";
      figureRef.current.style.transform = "";
    }
    if (contentRef.current) {
      contentRef.current.style.transition = "none";
      contentRef.current.style.background = "";
    }
    if (closingRef.current) setIndex(-1);
  }, [cancelActiveMotion, restoreGalleryPointer, setIndex]);
  useEffect(() => {
    window.addEventListener("resize", settleMotion);
    return () => window.removeEventListener("resize", settleMotion);
  }, [settleMotion]);
  useEffect(() => {
    if (reducedMotion) settleMotion();
  }, [reducedMotion, settleMotion]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (closingRef.current || !event.isPrimary || event.button !== 0) return;
    gestureRef.current = {
      x0: event.clientX,
      y0: event.clientY,
      dx: 0,
      dy: 0,
      axis: null,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.style.transition = "none";
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    gesture.dx = event.clientX - gesture.x0;
    gesture.dy = event.clientY - gesture.y0;
    if (!gesture.axis && (Math.abs(gesture.dx) > 10 || Math.abs(gesture.dy) > 10)) {
      gesture.axis = Math.abs(gesture.dx) > Math.abs(gesture.dy) ? "x" : "y";
    }

    const figure = figureRef.current;
    if (!figure || reducedMotion) return;
    if (gesture.axis === "y" && gesture.dy > 0) {
      const scale = 1 - Math.min(gesture.dy / 2600, 0.12);
      figure.style.transform = `translateY(${gesture.dy.toFixed(0)}px) scale(${scale.toFixed(3)})`;
      if (contentRef.current) {
        const opacity = 0.92 - Math.min(gesture.dy / 520, 0.72);
        contentRef.current.style.background = `rgba(18,16,14,${opacity.toFixed(2)})`;
      }
    } else if (gesture.axis === "x") {
      figure.style.transform = `translateX(${(gesture.dx * 0.55).toFixed(0)}px)`;
    }
  };

  const resetGesture = () => {
    gestureRef.current = null;
    if (figureRef.current) {
      figureRef.current.style.transition = reducedMotion ? "none" : `transform 320ms ${LIGHTBOX_EASE}`;
      figureRef.current.style.transform = "";
    }
    if (contentRef.current) {
      contentRef.current.style.transition = reducedMotion ? "none" : "background 320ms";
      contentRef.current.style.background = "";
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const figure = figureRef.current;
    if (!gesture || !figure) return;

    if (gesture.axis === "y" && gesture.dy > 110) {
      close();
      return;
    }
    if (gesture.axis === "x" && Math.abs(gesture.dx) > 60) {
      const nextDirection = gesture.dx < 0 ? 1 : -1;
      if (
        (nextDirection === 1 && index < images.length - 1) ||
        (nextDirection === -1 && index > 0)
      ) {
        figure.style.transform = "";
        if (contentRef.current) contentRef.current.style.background = "";
        navigate(nextDirection);
        return;
      }
    }
    resetGesture();
  };

  const current = images[index];
  if (!current || !portalContainer) return null;
  const number = (value: number) => String(value).padStart(2, "0");

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      {/* Giving Radix the body up front keeps the portal content in this commit. Without an explicit
          container, Radix waits for its own layout effect; our one-shot shared-element opening effect
          then runs before these refs exist and the design's thumbnail-to-fullscreen morph is skipped. */}
      <DialogPrimitive.Portal container={portalContainer}>
        {/* Preserve the web's ref-counted scroll lock when another dialog is already open. */}
        <DialogPrimitive.Overlay asChild>
          <DialogPrimitive.Content
            ref={contentRef}
            className={cn("mc-gallery-lbox", closing && "is-closing")}
            data-image-viewer=""
            data-reduced-motion={reducedMotion}
            style={{
              ...previewVars(brandColor, fontKey),
              // Radix supplies pointer-events inline for modal isolation, so the closing override must
              // also be inline. This lets the next Gallery choice land while the visual return finishes.
              pointerEvents: closing ? "none" : "auto",
            }}
            aria-describedby={undefined}
            onClick={close}
            onInteractOutside={(event) => event.preventDefault()}
            onEscapeKeyDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              close();
            }}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
              if (event.key === "ArrowRight") { event.preventDefault(); navigate(1); }
              else if (event.key === "ArrowLeft") { event.preventDefault(); navigate(-1); }
              else if (event.key === "Home") { event.preventDefault(); navigate(-index); }
              else if (event.key === "End") { event.preventDefault(); navigate(images.length - 1 - index); }
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              const target = returnFocusRef.current;
              requestAnimationFrame(() => {
                if (target?.isConnected) target.focus({ preventScroll: true });
              });
            }}
          >
            <DialogPrimitive.Title className="sr-only">
              {t("businessPage.builder.preview.galleryTitle")}
            </DialogPrimitive.Title>
            <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              {t("businessPage.builder.preview.aria.imagePosition", { index: index + 1, count: images.length })}
            </span>

            <div className="mc-gallery-lbox-bar" onClick={(event) => event.stopPropagation()}>
              <span className="mc-gallery-lbox-count">
                <span className="mc-gallery-lbox-count-current" key={current.id}>
                  {number(index + 1)}
                </span>
                <span>/ {number(images.length)}</span>
              </span>
              <button
                type="button"
                className="mc-gallery-lbox-close"
                onClick={close}
                aria-label={t("businessPage.builder.preview.aria.closeGallery")}
              >
                <X className="size-[18px]" strokeWidth={1.8} aria-hidden />
              </button>
            </div>

            <button
              type="button"
              className="mc-gallery-lbox-nav mc-gallery-lbox-prev"
              disabled={index === 0}
              onClick={(event) => {
                event.stopPropagation();
                navigate(-1);
              }}
              aria-label={t("businessPage.builder.preview.aria.previousImage")}
            >
              <ArrowRight className="size-[22px] rotate-180" strokeWidth={1.8} aria-hidden />
            </button>

            <figure
              ref={figureRef}
              className="mc-gallery-lbox-figure"
              style={{ touchAction: "none" }}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={resetGesture}
            >
              <span className="mc-gallery-lbox-swap" key={current.id} data-dir={direction}>
                <LightboxPhoto
                  image={current}
                  fallbackLabel={t("businessPage.builder.preview.imageUnavailable")}
                  size={targetFor(index)}
                  figureRef={figureRef}
                />
              </span>
            </figure>

            <button
              type="button"
              className="mc-gallery-lbox-nav mc-gallery-lbox-next"
              disabled={index === images.length - 1}
              onClick={(event) => {
                event.stopPropagation();
                navigate(1);
              }}
              aria-label={t("businessPage.builder.preview.aria.nextImage")}
            >
              <ArrowRight className="size-[22px]" strokeWidth={1.8} aria-hidden />
            </button>
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
