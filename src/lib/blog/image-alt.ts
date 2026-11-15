import type { Locale } from "@/i18n/locales";
import type { SanityImage } from "@/sanity/types";

/** Prefer the page language; keep older published covers readable until edited. */
export function getBlogCoverAlt(image: SanityImage | undefined, locale: Locale): string {
  if (image?.decorative) return "";
  return image?.altLocalized?.[locale]?.trim() || image?.alt?.trim() || "";
}
