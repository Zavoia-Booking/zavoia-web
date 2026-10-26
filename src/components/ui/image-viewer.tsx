"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { Icon } from "./icon";
import { Img } from "./image";
import { Skeleton } from "./skeleton";
import styles from "./image-viewer.module.css";

export type ImageViewerImage = { id: string; src: string; alt: string };
export type ImageViewerRect = Pick<
  DOMRect,
  "left" | "top" | "width" | "height"
>;
export interface ImageViewerProps {
  images: ImageViewerImage[];
  index: number;
  /** Indices are zero-based; -1 dismisses the viewer after its return animation. */
  onIndexChange: (index: number) => void;
  title: string;
  labels: {
    close: string;
    previous: string;
    next: string;
    position: (index: number, count: number) => string;
    unavailable: string;
  };
  getSource?: (index: number) => HTMLElement | null;
  getSourceRect?: (source: HTMLElement) => ImageViewerRect | null;
  getReturnFocus?: () => HTMLElement | null;
  /** Studio alone releases its source gallery during the visual return. */
  interactionRoot?: RefObject<HTMLElement | null>;
  showThumbnails?: boolean;
  reducedMotion?: boolean;
  style?: CSSProperties;
}

const EASE = "cubic-bezier(.19,1,.22,1)";
const media = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia(media);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
function readMotion() {
  return window.matchMedia(media).matches;
}
function serverMotion() {
  return true;
}

function containedRect(
  image: HTMLImageElement | null,
  bounds: DOMRect,
): ImageViewerRect {
  const width = image?.naturalWidth || 3;
  const height = image?.naturalHeight || 2;
  const scale = Math.min(bounds.width / width, bounds.height / height);
  return {
    left: bounds.left + (bounds.width - width * scale) / 2,
    top: bounds.top + (bounds.height - height * scale) / 2,
    width: width * scale,
    height: height * scale,
  };
}

function visibleRect(rect: ImageViewerRect | null): rect is ImageViewerRect {
  return (
    !!rect &&
    rect.width > 0 &&
    rect.height > 0 &&
    rect.left < innerWidth &&
    rect.top < innerHeight &&
    rect.left + rect.width > 0 &&
    rect.top + rect.height > 0
  );
}

/** A fixed clone bridges the crop using transforms, without animating layout dimensions. */
function morph(
  src: string,
  from: ImageViewerRect,
  to: ImageViewerRect,
  duration: number,
  returning: boolean,
  done: () => void,
) {
  const clone = document.createElement("div");
  clone.className = styles.morph;
  clone.dataset.imageViewerMorph = "";
  Object.assign(clone.style, {
    left: `${to.left}px`,
    top: `${to.top}px`,
    width: `${to.width}px`,
    height: `${to.height}px`,
    backgroundImage: `url(${JSON.stringify(src)})`,
  });
  document.body.appendChild(clone);
  const transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
  const animation = clone.animate(
    [
      { transform, opacity: 1 },
      ...(returning ? [{ opacity: 1, offset: 0.62 }] : []),
      { transform: "none", opacity: returning ? 0 : 1 },
    ],
    { duration, easing: EASE, fill: "forwards" },
  );
  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    window.clearTimeout(timer);
    clone.remove();
    done();
  }
  const timer = window.setTimeout(finish, duration + 90);
  animation.addEventListener("finish", finish, { once: true });
  return () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(timer);
    animation.cancel();
    clone.remove();
  };
}

function ViewerPhoto({
  image,
  unavailable,
}: {
  image: ImageViewerImage;
  unavailable: string;
}) {
  const [pending, setPending] = useState(true);
  return (
    <>
      {pending && (
        <Skeleton className={styles.pending} w="100%" h="100%" r={8} />
      )}
      <Img
        src={image.src}
        alt={image.alt}
        title=""
        loading="eager"
        draggable={false}
        className={styles.image}
        style={{ objectFit: "contain" }}
        label={
          <span
            role="img"
            aria-label={image.alt}
            className={styles.unavailable}
          >
            {unavailable}
          </span>
        }
        onLoad={() => setPending(false)}
        onError={() => setPending(false)}
      />
    </>
  );
}

/** Shared fullscreen gallery. Callers retain their image data and thumbnail layout. */
export function ImageViewer({
  images,
  index,
  onIndexChange,
  title,
  labels,
  getSource,
  getSourceRect,
  getReturnFocus,
  interactionRoot,
  showThumbnails = false,
  reducedMotion,
  style,
}: ImageViewerProps) {
  const systemReduced = useSyncExternalStore(
    subscribeMotion,
    readMotion,
    serverMotion,
  );
  const reduce = reducedMotion ?? systemReduced;
  const [direction, setDirection] = useState(0);
  const [closing, setClosing] = useState(false);
  const content = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLElement>(null);
  const figure = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const lastImage = useRef<string | null>(null);
  const closingImage = useRef<string | null>(null);
  const cancelMorph = useRef<(() => void) | null>(null);
  const backdrop = useRef<Animation | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const sourcePointer = useRef<{
    element: HTMLElement;
    previous: string;
  } | null>(null);
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    dx: number;
    dy: number;
    axis: "x" | "y" | null;
  } | null>(null);
  const dragged = useRef(false);
  const current = images[index];

  const restoreSourcePointer = useCallback(() => {
    if (!sourcePointer.current) return;
    sourcePointer.current.element.style.pointerEvents =
      sourcePointer.current.previous;
    sourcePointer.current = null;
  }, []);
  const cancelMotion = useCallback(() => {
    cancelMorph.current?.();
    cancelMorph.current = null;
    backdrop.current?.cancel();
    backdrop.current = null;
    if (figure.current) figure.current.style.opacity = "1";
  }, []);
  const sourceRect = useCallback(
    (source: HTMLElement | null) => {
      const rect = source
        ? getSourceRect
          ? getSourceRect(source)
          : source.getBoundingClientRect()
        : null;
      return visibleRect(rect) ? rect : null;
    },
    [getSourceRect],
  );
  const photoRect = useCallback(() => {
    if (!stage.current) return null;
    const image =
      figure.current?.querySelector("img") ??
      getSource?.(index)?.querySelector("img") ??
      null;
    const bounds =
      figure.current?.getBoundingClientRect() ??
      stage.current.getBoundingClientRect();
    return containedRect(image, bounds);
  }, [getSource, index]);

  const choose = useCallback(
    (next: number) => {
      if (closingImage.current) return;
      const bounded = Math.max(0, Math.min(images.length - 1, next));
      if (bounded === index) return;
      cancelMotion();
      setDirection(bounded > index ? 1 : -1);
      onIndexChange(bounded);
    },
    [cancelMotion, images.length, index, onIndexChange],
  );

  function close() {
    if (closingImage.current || !current) return;
    closingImage.current = current.id;
    returnFocus.current =
      getReturnFocus?.() ?? getSource?.(index) ?? returnFocus.current;
    const from = photoRect();
    const to = sourceRect(getSource?.(index) ?? null);
    const image = figure.current?.querySelector("img");
    cancelMotion();
    if (reduce) {
      onIndexChange(-1);
      return;
    }
    setClosing(true);
    const source = interactionRoot?.current;
    if (source) {
      sourcePointer.current = {
        element: source,
        previous: source.style.pointerEvents,
      };
      source.style.setProperty("pointer-events", "auto");
    }
    const canMorph = from && to && image?.naturalWidth;
    if (canMorph && figure.current) figure.current.style.opacity = "0";
    const fade =
      content.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: canMorph ? 421 : 180,
        easing: "ease-out",
        fill: "forwards",
      }) ?? null;
    backdrop.current = fade;
    if (!canMorph) {
      if (!fade) onIndexChange(-1);
      else
        fade.addEventListener(
          "finish",
          () => {
            if (backdrop.current === fade) {
              restoreSourcePointer();
              onIndexChange(-1);
            }
          },
          { once: true },
        );
      return;
    }
    cancelMorph.current = morph(current.src, from, to, 540, true, () => {
      cancelMorph.current = null;
      restoreSourcePointer();
      onIndexChange(-1);
    });
  }

  useLayoutEffect(() => {
    if (!current) return;
    const reopening =
      closingImage.current !== null && closingImage.current !== current.id;
    if (lastImage.current === current.id && !reopening) return;
    const opening = lastImage.current === null || reopening;
    cancelMotion();
    restoreSourcePointer();
    closingImage.current = null;
    lastImage.current = current.id;
    setClosing(false);
    if (figure.current) {
      figure.current.style.transform = "";
      figure.current.style.transition = "";
    }
    if (content.current) content.current.style.background = "";
    const source = getSource?.(index) ?? null;
    if (opening)
      returnFocus.current =
        getReturnFocus?.() ??
        source ??
        (document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null);
    if (!opening || reduce) return;
    setDirection(0);
    const from = sourceRect(source);
    const to = stage.current
      ? containedRect(
          source?.querySelector("img") ?? null,
          stage.current.getBoundingClientRect(),
        )
      : null;
    if (!from || !to || !source?.querySelector("img")?.naturalWidth) return;
    if (figure.current) figure.current.style.opacity = "0";
    backdrop.current =
      content.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 560,
        easing: EASE,
      }) ?? null;
    cancelMorph.current = morph(current.src, from, to, 560, false, () => {
      cancelMorph.current = null;
      if (figure.current) figure.current.style.opacity = "1";
    });
  }, [
    cancelMotion,
    current,
    getReturnFocus,
    getSource,
    index,
    photoRect,
    reduce,
    restoreSourcePointer,
    sourceRect,
  ]);

  useLayoutEffect(
    () => () => {
      cancelMotion();
      restoreSourcePointer();
      lastImage.current = null;
    },
    [cancelMotion, restoreSourcePointer],
  );

  const settleMotion = useCallback(() => {
    const dismissing = closingImage.current !== null;
    cancelMotion();
    restoreSourcePointer();
    if (dismissing) onIndexChange(-1);
  }, [cancelMotion, onIndexChange, restoreSourcePointer]);
  useEffect(() => {
    window.addEventListener("resize", settleMotion);
    return () => window.removeEventListener("resize", settleMotion);
  }, [settleMotion]);
  useEffect(() => {
    if (reduce) settleMotion();
  }, [reduce, settleMotion]);

  useEffect(() => {
    if (!current) onIndexChange(-1);
  }, [current, onIndexChange]);

  useLayoutEffect(() => {
    const rail = strip.current;
    const thumbnail = rail?.children[index] as HTMLElement | undefined;
    if (rail && thumbnail)
      rail.scrollLeft =
        thumbnail.offsetLeft - (rail.clientWidth - thumbnail.offsetWidth) / 2;
  }, [index]);

  function resetGesture() {
    gesture.current = null;
    if (figure.current) {
      figure.current.style.transition = reduce
        ? "none"
        : `transform 320ms ${EASE}`;
      figure.current.style.transform = "";
    }
    if (content.current) {
      content.current.style.transition = reduce
        ? "none"
        : "background-color 320ms";
      content.current.style.background = "";
    }
  }
  function pointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (closingImage.current || !event.isPrimary || event.button !== 0) return;
    dragged.current = false;
    gesture.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      dx: 0,
      dy: 0,
      axis: null,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.style.transition = "none";
  }
  function pointerMove(event: ReactPointerEvent<HTMLElement>) {
    const value = gesture.current;
    if (!value || value.id !== event.pointerId) return;
    value.dx = event.clientX - value.x;
    value.dy = event.clientY - value.y;
    if (!value.axis && Math.max(Math.abs(value.dx), Math.abs(value.dy)) > 10)
      value.axis = Math.abs(value.dx) > Math.abs(value.dy) ? "x" : "y";
    if (value.axis) dragged.current = true;
    if (reduce || !figure.current) return;
    if (value.axis === "x")
      figure.current.style.transform = `translateX(${value.dx * 0.55}px)`;
    else if (value.axis === "y" && value.dy > 0) {
      figure.current.style.transform = `translateY(${value.dy}px) scale(${1 - Math.min(value.dy / 2600, 0.12)})`;
      if (content.current)
        content.current.style.background = `rgba(18,16,14,${0.92 - Math.min(value.dy / 520, 0.72)})`;
    }
  }
  function pointerUp(event: ReactPointerEvent<HTMLElement>) {
    const value = gesture.current;
    if (!value || value.id !== event.pointerId) return;
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (value.axis === "y" && value.dy > 110) {
      close();
      return;
    }
    if (value.axis === "x" && Math.abs(value.dx) > 60) {
      choose(index + (value.dx < 0 ? 1 : -1));
    }
    resetGesture();
  }

  if (!current || typeof document === "undefined") return null;
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <Dialog.Portal container={document.body}>
        {/* Radix's ref-counted scroll lock also survives nested-dialog route changes. */}
        <Dialog.Overlay asChild>
          <Dialog.Content
            ref={content}
            data-image-viewer=""
            data-closing={closing}
            data-single={images.length === 1}
            data-reduced-motion={reduce}
            className={styles.viewer}
            style={{ ...style, pointerEvents: closing ? "none" : "auto" }}
            aria-describedby={undefined}
            onClick={close}
            // The fullscreen backdrop is inside Content. Ignore Radix's deferred outside
            // dismissal when a Studio thumbnail opens a new image during the return.
            onInteractOutside={(event) => event.preventDefault()}
            onEscapeKeyDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              close();
            }}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (
                event.altKey ||
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey
              )
                return;
              if (event.key === "ArrowRight") {
                event.preventDefault();
                choose(index + 1);
              } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                choose(index - 1);
              } else if (event.key === "Home") {
                event.preventDefault();
                choose(0);
              } else if (event.key === "End") {
                event.preventDefault();
                choose(images.length - 1);
              }
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              const target = returnFocus.current;
              requestAnimationFrame(() => {
                if (target?.isConnected) target.focus({ preventScroll: true });
              });
            }}
          >
            <div
              className={styles.header}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.counter} aria-hidden="true">
                <span key={current.id} className={styles.current}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>/ {String(images.length).padStart(2, "0")}</span>
              </div>
              <Dialog.Title className={styles.title}>{title}</Dialog.Title>
              <button
                className={styles.close}
                type="button"
                onClick={close}
                aria-label={labels.close}
              >
                <Icon name="x" size={20} />
              </button>
            </div>
            <span
              className="sr-only"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {labels.position(index, images.length)}
            </span>
            <div className={styles.canvas}>
              {images.length > 1 && (
                <button
                  type="button"
                  className={`${styles.nav} ${styles.previous}`}
                  disabled={index === 0}
                  onClick={(event) => {
                    event.stopPropagation();
                    choose(index - 1);
                  }}
                  aria-label={labels.previous}
                >
                  <Icon name="chevL" size={24} />
                </button>
              )}
              <figure
                ref={stage}
                className={styles.stage}
                data-image-viewer-stage=""
                onClick={(event) => {
                  // The img fills this stage with object-fit:contain. Its letterbox
                  // remains backdrop, while the painted photo and completed drags do not dismiss.
                  const bounds = photoRect();
                  const inside =
                    bounds &&
                    event.clientX >= bounds.left &&
                    event.clientX <= bounds.left + bounds.width &&
                    event.clientY >= bounds.top &&
                    event.clientY <= bounds.top + bounds.height;
                  if (
                    dragged.current ||
                    !figure.current?.querySelector("img") ||
                    inside
                  ) {
                    event.stopPropagation();
                  }
                  dragged.current = false;
                }}
              >
                <div
                  ref={figure}
                  className={styles.figure}
                  onPointerDown={pointerDown}
                  onPointerMove={pointerMove}
                  onPointerUp={pointerUp}
                  onPointerCancel={resetGesture}
                >
                  <div
                    key={`${current.id}:${current.src}`}
                    className={styles.swap}
                    data-dir={direction}
                  >
                    <ViewerPhoto
                      image={current}
                      unavailable={labels.unavailable}
                    />
                  </div>
                </div>
              </figure>
              {images.length > 1 && (
                <button
                  type="button"
                  className={`${styles.nav} ${styles.next}`}
                  disabled={index === images.length - 1}
                  onClick={(event) => {
                    event.stopPropagation();
                    choose(index + 1);
                  }}
                  aria-label={labels.next}
                >
                  <Icon name="chevR" size={24} />
                </button>
              )}
            </div>
            <div
              className={styles.footer}
              onClick={(event) => event.stopPropagation()}
            >
              {showThumbnails && images.length > 1 && (
                <div className={styles.thumbnails} ref={strip}>
                  {images.map((image, photoIndex) => (
                    <button
                      key={image.id}
                      type="button"
                      className={styles.thumbnail}
                      aria-label={
                        image.alt || labels.position(photoIndex, images.length)
                      }
                      aria-pressed={photoIndex === index}
                      onClick={() => choose(photoIndex)}
                    >
                      <Img
                        src={image.src}
                        alt=""
                        title=""
                        draggable={false}
                        label=""
                        style={{ width: "100%", height: "100%" }}
                      />
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
