import { LayoutTemplate, Newspaper, type LucideIcon } from "lucide-react";
import { Icon, type IconName } from "@/components/ui/icon";
import type { Dictionary } from "@/i18n/dictionaries";

export type AccountNavigationItem = {
  key: string;
  icon: IconName | LucideIcon;
  label: string;
  segments: string[];
  accent?: boolean;
};

/** Keep desktop and mobile account destinations in the same translated order. */
export function accountNavigation(dict: Dictionary): {
  personal: AccountNavigationItem[];
  community: AccountNavigationItem[];
  business: AccountNavigationItem[];
  legal: AccountNavigationItem[];
} {
  const t = dict.accountMenu;
  return {
    personal: [
      { key: "appointments", icon: "cal", label: t.appointments, segments: ["appointments"] },
      { key: "saved", icon: "heartO", label: t.saved, segments: ["saved"] },
      { key: "profile", icon: "user", label: t.profileSettings, segments: ["account"] },
    ],
    community: [
      { key: "journal", icon: Newspaper, label: t.journal, segments: ["blog"] },
      { key: "help", icon: "info", label: t.helpSupport, segments: ["help"] },
    ],
    business: [
      { key: "for-business", icon: "building", label: t.forBusiness, segments: ["for-business"] },
      { key: "web-studio", icon: LayoutTemplate, label: t.webStudio, segments: ["web-studio"], accent: true },
      { key: "pricing", icon: "wallet", label: t.pricing, segments: ["pricing"] },
    ],
    legal: [
      { key: "privacy", icon: "shield", label: dict.footer.privacy, segments: ["terms", "privacy-policy"] },
      { key: "terms", icon: "doc", label: dict.footer.terms, segments: ["terms"] },
    ],
  };
}

export function AccountNavigationIcon({ icon, color, size = 16 }: {
  icon: IconName | LucideIcon;
  color: string;
  size?: number;
}) {
  if (typeof icon === "string") return <Icon name={icon} size={size} color={color} />;
  const Glyph = icon;
  return <Glyph size={size} strokeWidth={1.7} color={color} aria-hidden="true" style={{ display: "block", flexShrink: 0 }} />;
}
