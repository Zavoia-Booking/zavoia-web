import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LOCALES, isLocale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { AuthSkeleton } from "../_components/auth-skeleton";
import { GoogleCallback } from "./_components/google-callback";

export const dynamicParams = false;

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  return {
    title: dictionaries[locale].auth.googleCallback.pageTitle,
    robots: { index: false, follow: false },
  };
}

/**
 * Landing route for Google's OAuth redirect (?code=&state=). Registered in
 * Google Cloud Console as the locale-less `<origin>/auth/callback` — the
 * proxy rewrites that to this default-locale route. All the work happens
 * client-side in GoogleCallback (the flow context lives in sessionStorage).
 */
export default async function GoogleCallbackPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <Suspense fallback={<AuthSkeleton />}>
      <GoogleCallback locale={locale} />
    </Suspense>
  );
}
