import type { Metadata } from "next";
import { notFoundMetadata } from "@/app/_components/not-found/metadata";
import { isLocale } from "@/i18n/locales";
import { resolveCategoryRoute } from "@/lib/seo/category-page.server";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string; city: string; industry: string }>;
};

// Next resolves layout metadata again for not-found responses, but omits the
// interrupted page's metadata, so the missing-page metadata lives here. Found
// and redirected addresses keep the page's own metadata.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city, industry } = await params;
  if (!isLocale(locale)) return {};
  try {
    const route = await resolveCategoryRoute(locale, city, industry);
    return route.kind === "notFound" ? notFoundMetadata(locale) : {};
  } catch {
    // Operational failures belong to the page and its error boundary.
    return {};
  }
}

export default function CategoryLayout({ children }: Props) {
  return children;
}
