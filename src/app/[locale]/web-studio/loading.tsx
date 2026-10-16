"use client";

import { WebStudioContent } from "@/app/_components/web-studio/web-studio-content";
import { useTranslation } from "@/i18n/useTranslation";

// Suspense boundary for this route: the locale layout's chrome (header,
// footer, tabs) paints immediately and this stands in for the page body while
// the showcase site loads.
export default function Loading() {
  const { locale } = useTranslation();
  return <main aria-busy="true"><WebStudioContent locale={locale} showcase={null} showcaseName={null} pending /></main>;
}
