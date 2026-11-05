import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { notFoundMetadata } from "@/app/_components/not-found/metadata";
import { isLocale } from "@/i18n/locales";
import { locationMetadata } from "@/lib/locations/metadata";
import { getLocationPageListing } from "@/lib/locations/server";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
};

// Keep metadata at the guard's layout: Next resolves layout metadata again
// for not-found responses, but omits the interrupted page's metadata.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !slug) return {};
  try {
    const listing = await getLocationPageListing(slug);
    return listing ? locationMetadata(listing, locale) : notFoundMetadata(locale);
  } catch {
    // Operational failures use the error boundary, never missing-page content.
    return { robots: { index: false, follow: false } };
  }
}

/** Resolve availability outside this segment's loading boundary so a missing
 * location can return HTTP 404 before a successful response starts streaming.
 * The page and metadata reuse this lookup; no extra API request is introduced.
 */
export default async function LocationLayout({ children, params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !slug) notFound();
  if (!await getLocationPageListing(slug)) notFound();
  return children;
}
