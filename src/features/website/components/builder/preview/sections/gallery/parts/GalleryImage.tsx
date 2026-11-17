import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { cn } from "../../../../../../../../shared/lib/utils";
import { useResponsivePublicImage } from "../../../shared/useResponsivePublicImage";

type GalleryImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  fallbackLabel?: string;
};

/** Design-file image primitive: lazy decode, load fade, and a quiet striped failure state. */
export function GalleryImage({
  src,
  alt = "",
  fallbackLabel = "Gallery",
  className,
  onLoad,
  onError,
  ...props
}: GalleryImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const previousSrc = useRef(src);
  const loading = props.loading ?? "lazy";
  const responsive = useResponsivePublicImage(
    src,
    props.sizes ?? (loading === "lazy" ? "auto, (max-width: 1400px) 100vw, 1400px" : "100vw"),
    props.srcSet,
  );

  useEffect(() => {
    if (previousSrc.current === src) return;
    previousSrc.current = src;
    setFailed(false);
    setLoaded(false);
  }, [src]);

  if (!src || failed) {
    return (
      <span className={cn("mc-gallery-image-fallback", className)} role="img" aria-label={alt || fallbackLabel}>
        <span>{fallbackLabel}</span>
      </span>
    );
  }

  return (
    <img
      {...props}
      {...responsive.props}
      alt={alt}
      className={cn("mc-gallery-image", loaded && "is-loaded", className)}
      loading={loading}
      decoding={props.decoding ?? "async"}
      onLoad={(event) => {
        event.currentTarget.removeAttribute("data-fade-pending");
        setLoaded(true);
        onLoad?.(event);
      }}
      onError={(event) => {
        if (responsive.retryOriginal()) return;
        setFailed(true);
        onError?.(event);
      }}
      ref={(node) => {
        if (node && !node.complete) node.setAttribute("data-fade-pending", "true");
        if (node?.complete && node.naturalWidth > 0 && !loaded) setLoaded(true);
        responsive.props.ref(node);
      }}
    />
  );
}
