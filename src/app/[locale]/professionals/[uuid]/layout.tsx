import type { Metadata } from "next";
import { notFoundMetadata } from "@/app/_components/not-found/metadata";
import { isLocale } from "@/i18n/locales";
import { getProfessionalPageProfile } from "@/lib/professionals/server";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string; uuid: string }>;
};

// Next resolves layout metadata again for not-found responses, but omits the
// interrupted page's metadata, so the missing-profile metadata lives here.
// Available profiles keep the page's own metadata.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, uuid } = await params;
  if (!isLocale(locale)) return {};
  try {
    return (await getProfessionalPageProfile(uuid)) ? {} : notFoundMetadata(locale);
  } catch {
    // Operational failures belong to the page's metadata and error boundary.
    return {};
  }
}

export default function ProfessionalLayout({ children }: Props) {
  return children;
}
