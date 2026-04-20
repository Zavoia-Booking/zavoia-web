import type { PortableTextBlock } from "@portabletext/types";
import type { Locale } from "@/i18n/locales";

export type Localized<T> = Partial<Record<Locale, T>>;
export type LocalizedSlug = Partial<Record<Locale, { current: string }>>;

export type SanityImage = {
  asset?: { _ref: string };
  alt?: string;
  hotspot?: { x: number; y: number };
};

export type Post = {
  _id: string;
  title: Localized<string>;
  slug: LocalizedSlug;
  excerpt?: Localized<string>;
  body?: Localized<PortableTextBlock[]>;
  coverImage?: SanityImage;
  publishedAt: string;
  seo?: {
    title?: Localized<string>;
    description?: Localized<string>;
  };
};

export type PostListItem = Pick<
  Post,
  "_id" | "title" | "slug" | "excerpt" | "coverImage" | "publishedAt"
>;
