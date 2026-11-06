import { notFound, permanentRedirect } from "next/navigation";
import { LOCALES, isLocale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";

export const dynamicParams = false;

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/** Keep printed QR codes and shared looks working at the former demo address. */
export default async function LegacyDemoPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      query.append(key, item);
    }
  }
  const suffix = query.size ? `?${query.toString()}` : "";
  permanentRedirect(`${localeHref(locale, "web-studio", "demo")}${suffix}`);
}
