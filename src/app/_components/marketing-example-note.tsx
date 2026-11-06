import Image from "next/image";
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
  const copy = dictionaries[locale].marketingExamples;
  return (
    <div className={`${styles.note} ${className}`} data-marketing-example-note="">
      <p>{websites ? copy.websites : copy.product}</p>
      {map && <div className={styles.credits}>
        <a href="https://www.mapbox.com/about/maps" aria-label="Mapbox">
          <Image src="/images/marketing/mapbox-logo.svg" alt="Mapbox" width={88} height={23} />
        </a>
        <span>© <a href="https://www.mapbox.com/about/maps">Mapbox</a></span>
        <span>© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a></span>
        <a href="https://apps.mapbox.com/feedback/">{copy.improveMap}</a>
      </div>}
    </div>
  );
}
