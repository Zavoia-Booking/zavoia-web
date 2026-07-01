"use client";

import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import { Footer } from "@/components/shell/footer";
import { routeKey } from "@/components/shell/active-route";

// The search route is a full-bleed, viewport-height map experience: the shared
// footer (and the mobile tab-bar spacer) would push it off-screen / introduce
// page scroll. A nested layout can't remove the parent layout's footer, so this
// client wrapper suppresses both chrome elements on the `search` route only.
export function ConditionalFooter({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  if (routeKey(pathname) === "search") return null;

  return (
    <>
      <Footer locale={locale} />
      {/* Spacer so content clears the fixed mobile tab bar */}
      <div className="zw-only-mobile" style={{ height: 70 }} />
    </>
  );
}
