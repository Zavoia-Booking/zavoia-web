import Image from "next/image";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { urlForImage } from "@/sanity/image";

const components: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      const url = urlForImage(value).width(1600).url();
      return (
        <Image
          src={url}
          alt={value.alt || ""}
          width={1600}
          height={900}
          className="my-6 rounded-md object-cover"
          sizes="(max-width: 768px) 100vw, 768px"
        />
      );
    },
  },
};

export function PortableTextRenderer({
  blocks,
}: {
  blocks: PortableTextBlock[];
}) {
  return <PortableText value={blocks} components={components} />;
}
