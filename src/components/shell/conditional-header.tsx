"use client";

import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import { SiteHeader } from "@/components/shell/site-header";
import { isFullBleedPath } from "@/components/shell/active-route";

// Full-bleed routes (published microsites and /try) render a business site
// with its own nav and footer, so the marketplace header is suppressed there —
// a nested layout cannot remove parent chrome, hence this client wrapper.
export function ConditionalHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  if (isFullBleedPath(pathname)) return null;
  return <SiteHeader locale={locale} />;
}
