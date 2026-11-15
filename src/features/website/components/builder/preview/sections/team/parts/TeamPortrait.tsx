import { useResponsivePublicImage } from "../../../shared/useResponsivePublicImage";

/** Keep each team variant's native image geometry and shared source recovery. */
export function TeamPortrait({ src, alt, sizes }: { src: string; alt: string; sizes: string }) {
  const image = useResponsivePublicImage(src, sizes);
  return <img {...image.props} alt={alt} loading="lazy" decoding="async" draggable={false} onError={image.retryOriginal} />;
}
