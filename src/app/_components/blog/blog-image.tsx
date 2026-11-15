import type { SanityImage } from "@/sanity/types";
import { getBlogImageProps, type BlogImageOptions } from "@/lib/blog/images";
import { Img, type ImgProps } from "@/components/ui/image";

type BlogImageProps = Omit<ImgProps, "src" | "srcSet" | "sizes" | "alt" | "width" | "height"> & BlogImageOptions & {
  image?: SanityImage;
};

/** Keep the shared image feedback while delivering Next/Sanity responsive URLs. */
export function BlogImage({ image, alt, sizes, maxWidth, aspectRatio, loading, fetchPriority, ...rest }: BlogImageProps) {
  const responsive = getBlogImageProps(image, { alt, sizes, maxWidth, aspectRatio, loading, fetchPriority });
  return <Img {...responsive} {...rest} alt={alt} sizes={sizes} />;
}
