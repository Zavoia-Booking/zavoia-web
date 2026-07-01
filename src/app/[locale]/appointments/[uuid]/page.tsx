import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { DetailContent } from "./_components/detail-content";

// Live, auth-gated personal data: never statically prerender (the backend may
// be down at build time and the appointment is fetched client-side from the
// authenticated session). The `uuid` param is not enumerable.
export const dynamic = "force-dynamic";

// uuids aren't known at build time — accept any value and render dynamically.
export const dynamicParams = true;

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string; uuid: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { locale } = await params;
    if (!isLocale(locale)) return {};
    const dict = dictionaries[locale];
    return {
      title: dict.appointments.title,
      // Personal page — keep it out of search indexes entirely.
      robots: { index: false, follow: false },
    };
  } catch {
    return {};
  }
}

export default async function AppointmentDetailPage({ params }: Props) {
  const { locale, uuid } = await params;
  if (!isLocale(locale)) notFound();
  if (!uuid) notFound();

  return <DetailContent locale={locale} uuid={uuid} />;
}
