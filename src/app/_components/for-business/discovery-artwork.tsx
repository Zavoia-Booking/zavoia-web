import type { CSSProperties } from "react";
import Image from "next/image";
import { dictionaries } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import { getMarketingMockup } from "@/lib/marketing/mockups";
import styles from "./discovery-artwork.module.css";

/** Hardware depth follows the homepage AppPhone; the product captures stay intact. */
export function DiscoveryArtwork({ locale }: { locale: Locale }) {
  const t = dictionaries[locale].forBusiness.found.artwork;

  return (
    <figure className={styles.artwork} data-discovery-artwork="">
      <div className={styles.composition}>
        <span className={styles.contactShadow} aria-hidden="true" />

        <div className={styles.browserMount} data-discovery-browser="">
          <div className={styles.browser}>
            <span className={styles.browserEdge} aria-hidden="true" />
            <div className={styles.browserFace}>
              <div className={styles.browserBar} aria-hidden="true">
                <span className={styles.browserDots}><i /><i /><i /></span>
                <span>zavoia.com</span>
              </div>
              <div className={styles.browserScreen}>
                <Image
                  {...getMarketingMockup("marketplaceServices", locale)}
                  data-product-scene="marketplaceServices"
                  data-product-locale={locale}
                  alt={t.desktopAlt}
                  sizes="(max-width: 600px) 90vw, (max-width: 920px) 560px, (max-width: 1200px) 46vw, 560px"
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.phoneMount} data-discovery-phone="">
          <div className={styles.phone}>
            {[-9, -6, -3, -1.5].map(depth => (
              <i key={depth} className={styles.phoneEdge} style={{ "--depth": `${depth}px` } as CSSProperties} aria-hidden="true" />
            ))}
            <div className={styles.phoneFace}>
              <div className={styles.phoneScreen}>
                <Image
                  {...getMarketingMockup("consumerMap", locale)}
                  data-product-scene="consumerMap"
                  data-product-locale={locale}
                  alt={t.mobileAlt}
                  sizes="(max-width: 600px) 240px, (max-width: 1200px) 250px, 300px"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

    </figure>
  );
}
