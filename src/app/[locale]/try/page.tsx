import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { ShuffleExperience } from "@/app/_components/try/shuffle-experience";

export const dynamicParams = false;

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const one = (value: string | string[] | undefined): string | null =>
  (Array.isArray(value) ? value[0] : value) ?? null;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = dictionaries[locale];

  return {
    title: dict.tryStudio.pageTitle,
    description: dict.tryStudio.pageDescription,
    // Deliberately not indexed: the page renders a demonstration business at
    // full fidelity, and a fabricated salon has no business competing in
    // search against the real listings on this domain. /web-studio is the
    // indexable page that sells this.
    robots: { index: false, follow: true },
  };
}

/**
 * The shuffle — zavoia.com/try.
 *
 * Built as a QR destination: a business owner scans a flyer, lands on a real
 * Zavoia website filling their phone, and re-rolls it with one thumb. Short
 * enough to type by hand when a scan fails.
 *
 * `?s=` opens on a specific look (so a printed campaign can carry its own),
 * `?src=` carries the scan source through to signup.
 */
export default async function TryPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const sp = await searchParams;

  return (
    <ShuffleExperience
      locale={locale}
      initialCode={one(sp.s)}
      source={one(sp.src)}
    />
  );
}
