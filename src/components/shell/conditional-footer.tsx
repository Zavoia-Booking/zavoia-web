"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import { localeHref, localizedPathname } from "@/i18n/routes";
import { Footer } from "@/components/shell/footer";
import { routeKey, isFullBleedPath } from "@/components/shell/active-route";

// The search route is a full-bleed, viewport-height map experience: the shared
// footer (and the mobile tab-bar spacer) would push it off-screen / introduce
// page scroll. A nested layout can't remove the parent layout's footer, so this
// client wrapper suppresses both chrome elements on the `search` route only.
// Search keeps language navigation in the shared header.
// Business microsites (zavoia.com/[businessSlug]) are likewise full-bleed: the
// published site brings its own footer.
export function ConditionalFooter({ locale, explore }: { locale: Locale; explore: ReactNode }) {
  const pathname = usePathname();
  if (routeKey(pathname) === "search" || isFullBleedPath(pathname)) return null;
  const isSignInPage = localizedPathname(pathname, locale).replace(/\/$/, "") === localeHref(locale, "auth");

  return (
    <>
      <Footer locale={locale} explore={explore} showWordmark={!isSignInPage} />
      {/* Spacer so content clears the fixed mobile tab bar (and, on the
          business page, the fixed booking bar stacked above it — see the
          `.zw-footer-spacer` rule in globals.css). */}
      <div data-marketplace-chrome className="zw-only-mobile zw-footer-spacer" />
    </>
  );
}
