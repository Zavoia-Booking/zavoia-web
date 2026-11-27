"use client";

import { useId } from "react";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/i18n/useTranslation";
import { businessProfileLinks, type BusinessProfileLinks } from "@/lib/marketplace/business-profile-links";
import styles from "./business-links.module.css";

const platforms = {
  website: { icon: "globe" },
  instagram: { icon: "ig", label: "Instagram" },
  facebook: { icon: "fb", label: "Facebook" },
  tiktok: { icon: "tt", label: "TikTok" },
  pinterest: { icon: "pint", label: "Pinterest" },
} as const;

export function BusinessLinks({ business, headingAs: Heading = "h2", className }: {
  business: BusinessProfileLinks;
  headingAs?: "h2" | "h3";
  className?: string;
}) {
  const { dict } = useTranslation();
  const id = useId();
  const links = businessProfileLinks(business);
  if (!links.length) return null;

  return (
    <nav className={className} aria-labelledby={id}>
      <Heading id={id} className={styles.heading}>{dict.locationPage.socialLinks}</Heading>
      <div className={styles.links}>
        {links.map(({ key, href }) => (
          <a
            key={key}
            className={styles.link}
            href={href}
            target="_blank"
            rel="nofollow ugc noopener noreferrer"
            aria-describedby={`${id}-new-tab`}
          >
            <Icon name={platforms[key].icon} size={18} viewBox="2 2 20 20" />
            {key === "website" ? dict.locationPage.visitWebsite : platforms[key].label}
          </a>
        ))}
      </div>
      <span hidden id={`${id}-new-tab`}>{dict.common.opensInNewTab}</span>
    </nav>
  );
}
