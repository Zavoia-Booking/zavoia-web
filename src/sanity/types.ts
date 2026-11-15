import type { PortableTextBlock } from "@portabletext/types";
import type { Locale } from "@/i18n/locales";

export type Localized<T> = Partial<Record<Locale, T>>;
export type LocalizedSlug = Partial<Record<Locale, { current: string }>>;

export type BlogCategory = "guides" | "business" | "product";

export type SanityImage = {
  asset?: { _ref: string };
  /** Legacy cover descriptions remain readable until editors supply localized text. */
  alt?: string;
  altLocalized?: Localized<string>;
  decorative?: boolean;
  caption?: string;
  crop?: { top: number; bottom: number; left: number; right: number };
  hotspot?: { x: number; y: number; width?: number; height?: number };
};

export type PostAuthor = {
  name: string;
  url?: string;
};

export type PostFaqItem = {
  _key: string;
  question: Localized<string>;
  answer: Localized<string>;
};

export type PostUsefulLink = {
  _key: string;
  label: Localized<string>;
  href: Localized<string>;
};

export type Post = {
  _id: string;
  title: Localized<string>;
  slug: LocalizedSlug;
  category?: BlogCategory;
  excerpt?: Localized<string>;
  body?: Localized<PortableTextBlock[]>;
  coverImage?: SanityImage;
  faq?: PostFaqItem[];
  usefulLinks?: PostUsefulLink[];
  publishedAt: string;
  modifiedAt?: string;
  author?: PostAuthor;
  seo?: {
    title?: Localized<string>;
    description?: Localized<string>;
  };
};

export type PostListItem = Pick<
  Post,
  | "_id"
  | "title"
  | "slug"
  | "excerpt"
  | "body"
  | "coverImage"
  | "publishedAt"
  | "category"
>;
