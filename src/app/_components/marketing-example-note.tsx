import Image from "next/image";
import { useId } from "react";
import { Icon } from "@/components/ui/icon";
import { dictionaries } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import styles from "./marketing-example-note.module.css";

/** Only for Zavoia-authored marketing previews, never customer listings. */
export function MarketingExampleNote({ locale, websites = false, map = false, className = "" }: {
  locale: Locale;
  websites?: boolean;
  map?: boolean;
  className?: string;
}) {
  const dict = dictionaries[locale];
  const copy = dict.marketingExamples;
  const newTabHintId = useId();
  const creditLinkProps = {
    target: "_blank",
    rel: "noopener noreferrer",
    "aria-describedby": newTabHintId,
  };
  return (
    <div className={`${styles.note} ${className}`} data-marketing-example-note="">
      <p>{websites ? copy.websites : copy.product}</p>
      {map && <div className={styles.credits}>
        <a href="https://www.mapbox.com/about/maps" aria-label="Mapbox" {...creditLinkProps}>
          <Image src="/images/marketing/mapbox-logo.svg" alt="Mapbox" width={88} height={23} />
          <Icon name="arrowUR" size={12} />
        </a>
        <span>© <a href="https://www.mapbox.com/about/maps" {...creditLinkProps}>Mapbox<Icon name="arrowUR" size={12} /></a></span>
        <span>© <a href="https://www.openstreetmap.org/copyright" {...creditLinkProps}>OpenStreetMap<Icon name="arrowUR" size={12} /></a></span>
        <a href="https://apps.mapbox.com/feedback/" {...creditLinkProps}>{copy.improveMap}<Icon name="arrowUR" size={12} /></a>
        <span id={newTabHintId} hidden>{dict.common.opensInNewTab}</span>
      </div>}
    </div>
  );
}
