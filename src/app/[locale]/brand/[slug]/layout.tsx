import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { notFoundMetadata } from "@/app/_components/not-found/metadata";
import { isLocale } from "@/i18n/locales";
import { getBrandPageData } from "./server";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
};

// Next omits an interrupted page's metadata; keep missing-page metadata at
// the availability guard, matching the location route's existing approach.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !slug) return {};
  try {
    return await getBrandPageData(slug) ? {} : notFoundMetadata(locale);
  } catch {
    return { robots: { index: false, follow: false } };
  }
}

/** Check availability before a successful response starts streaming. */
export default async function BrandLayout({ children, params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !slug) notFound();
  if (!await getBrandPageData(slug)) notFound();
  return children;
}
