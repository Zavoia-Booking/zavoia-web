import type { Metadata } from "next";
import { notFoundMetadata } from "@/app/_components/not-found/metadata";
import { isLocale } from "@/i18n/locales";

// Missing articles and invalid archive queries share the existing 404 page.
// Keep their metadata on the fallback: Next omits the interrupted page's
// metadata when notFound() is handled.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? notFoundMetadata(locale) : {};
}

export { default } from "../not-found";
