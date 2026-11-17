import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { useResponsivePublicImage } from "../../../shared/useResponsivePublicImage";

type LocationImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  fallbackLabel?: string;
};

/** Design-source image behavior: lazy decode, load fade, and a striped failed-URL fallback. */
export function LocationImage({
  src,
  alt = "",
  fallbackLabel,
  className = "",
  onLoad,
  onError,
  ...props
}: LocationImageProps) {
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
      <span
        className={`mc-location-image-fallback ${className}`}
        role={alt || fallbackLabel ? "img" : undefined}
        aria-label={alt || fallbackLabel || undefined}
        aria-hidden={alt || fallbackLabel ? undefined : true}
      >
        <span>{fallbackLabel || alt}</span>
      </span>
    );
  }

  return (
    <img
      {...props}
      {...responsive.props}
      alt={alt}
      className={`mc-location-image${loaded ? " is-loaded" : ""} ${className}`}
      loading={loading}
      decoding={props.decoding ?? "async"}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
      onError={(event) => {
        if (responsive.retryOriginal()) return;
        setFailed(true);
        onError?.(event);
      }}
      ref={(node) => {
        if (node?.complete && node.naturalWidth > 0 && !loaded) setLoaded(true);
        responsive.props.ref(node);
      }}
    />
  );
}
