import type { Metadata } from "next";
import { notFoundMetadata } from "@/app/_components/not-found/metadata";
import { isLocale } from "@/i18n/locales";

// A missing website interrupts its page metadata. Keep its localized title
// on the fallback, without a website guard that would also gate city categories.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? notFoundMetadata(locale) : {};
}

export { default } from "../not-found";
