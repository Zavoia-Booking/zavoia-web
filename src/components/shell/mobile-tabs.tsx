"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui";
import { useAuth } from "@/lib/auth/useAuth";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import type { Locale } from "@/i18n/locales";
import { routeKey } from "./active-route";

// Port of ZwMobileTabs (docs/web-shell.jsx). Fixed bottom frosted bar, mobile
// only. Tabs depend on auth state; active state derived from the pathname.

type Tab = {
  // The leading route segment ("" = home). Drives the link target + active.
  segment: string;
  icon: IconName;
  activeIcon?: IconName;
  label: string;
};

export function MobileTabs({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const { status, user, optimisticUser } = useAuth();
  const { dict } = useTranslation();
  // optimisticUser: session hint present while the initial check is in
  // flight — show the authenticated tab set immediately instead of flashing
  // Offers → Bookings/Saved ~1s after every refresh.
  const isAuthed = (status === "authenticated" && !!user) || optimisticUser !== null;
  const t = dict.mobileTabs;

  const key = routeKey(pathname);

  const tabs: Tab[] = isAuthed
    ? [
        { segment: "", icon: "home", activeIcon: "homeF", label: t.explore },
        { segment: "search", icon: "search", label: t.search },
        { segment: "appointments", icon: "cal", label: t.bookings },
        { segment: "saved", icon: "heartO", label: t.saved },
        { segment: "help", icon: "info", label: t.help },
      ]
    : [
        { segment: "", icon: "home", activeIcon: "homeF", label: t.explore },
        { segment: "search", icon: "search", label: t.search },
        { segment: "offers", icon: "sparkle", label: t.offers },
        { segment: "help", icon: "info", label: t.help },
      ];

  const isActive = (segment: string) => {
    if (segment === "") {
      return key === "" || key === "business" || key === "l";
    }
    if (segment === "help") return key === "help" || key === "support";
    return key === segment;
  };

  return (
    <nav
      className="zw-only-mobile zv-frost"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 95,
        borderTop: "1px solid rgba(28,28,26,0.07)",
        display: "flex",
        justifyContent: "space-around",
        padding: "6px 8px calc(8px + env(safe-area-inset-bottom))",
      }}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.segment);
        const icon =
          active && tab.activeIcon ? tab.activeIcon : tab.icon;
        const href = tab.segment
          ? localeHref(locale, tab.segment)
          : localeHref(locale);
        return (
          <Link
            key={tab.segment || "home"}
            href={href}
            className="tap"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              textDecoration: "none",
              padding: "6px 10px",
              minWidth: 52,
              borderRadius: 12,
            }}
          >
            <Icon
              name={icon}
              size={21}
              color={active ? "var(--p-600)" : "var(--c-500)"}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.01em",
                color: active ? "var(--p-600)" : "var(--c-500)",
              }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
