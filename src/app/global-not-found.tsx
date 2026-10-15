import type { Metadata } from "next";
import { headers } from "next/headers";
import { cache } from "react";
import "@/styles/globals.css";
import { fontVariables } from "@/styles/fonts";
import { dictionaries } from "@/i18n/dictionaries";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/locales";
import { PATHNAME_HEADER } from "@/lib/pathname-header";
import { NotFoundPage } from "@/app/_components/not-found/not-found-page";
import { notFoundMetadata } from "@/app/_components/not-found/metadata";

// Only the global boundary reads request data. Matched ISR routes retain their
// cache behavior and use the request-independent segment/root boundaries.
const getNotFoundContext = cache(async () => {
  const pathname = (await headers()).get(PATHNAME_HEADER) ?? undefined;
  const segment = pathname?.split("/")[1] ?? "";
  const locale = isLocale(segment) ? segment : DEFAULT_LOCALE;
  return { locale, pathname };
});

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getNotFoundContext();
  return notFoundMetadata(locale);
}

// This app has separate locale and Studio roots. A global not-found document
// bypasses both layouts, so it owns the document, fonts and complete page shell.
export default async function GlobalNotFound() {
  const { locale, pathname } = await getNotFoundContext();

  return (
    <html lang={locale}>
      <body className={`${fontVariables} antialiased`}>
        <NotFoundPage dictionary={dictionaries[locale]} locale={locale} pathname={pathname} />
      </body>
    </html>
  );
}
