import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { dictionaries } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { getMarketingMockup } from "@/lib/marketing/mockups";
import { StudioFeatureArt } from "./studio-feature-art";
import m from "./marketing.module.css";
import styles from "./studio-section.module.css";

const featureArtwork = ["content", "design", "publish"] as const;

/** Two genuine website examples, with the publishing benefits always visible. */
export function StudioSection({ locale }: { locale: Locale }) {
  const t = dictionaries[locale].forBusiness.studio;

  return (
    <section id="web-studio" className={styles.section} aria-labelledby="studio-title">
      <div className={`zw-container ${styles.layout}`}>
        <div className={styles.intro}>
          <h2 className={`${m.h2} ${styles.title}`} id="studio-title">{t.title}</h2>
          <span className={styles.planLabel}>{t.planLabel}</span>
          <p className={`${m.lead} ${styles.lead}`}>{t.lead}</p>
        </div>

        <figure className={styles.artwork} data-studio-artwork="">
          <div className={styles.composition}>
            <span className={styles.contactShadow} aria-hidden="true" />
            <div className={styles.browserMount} data-studio-browser="">
              <div className={styles.browser}>
                <span className={styles.browserEdge} aria-hidden="true" />
                <div className={styles.browserFace}>
                  <div className={styles.browserBar} aria-hidden="true">
                    <span className={styles.browserDots}><i /><i /><i /></span>
                    <span>zavoia.com/lumi-beauty</span>
                  </div>
                  <div className={styles.browserScreen}>
                    <Image
                      {...getMarketingMockup("studioBeauty", locale)}
                      data-product-scene="studioBeauty"
                      data-product-locale={locale}
                      alt={t.desktopAlt}
                      sizes="(max-width: 600px) 92vw, (max-width: 920px) 640px, (max-width: 1200px) 49vw, 640px"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.phoneMount} data-studio-phone="">
              <div className={styles.phone}>
                {[-9, -6, -3, -1.5].map(depth => (
                  <i key={depth} className={styles.phoneEdge} style={{ "--depth": `${depth}px` } as CSSProperties} aria-hidden="true" />
                ))}
                <div className={styles.phoneFace}>
                  <div className={styles.phoneScreen}>
                    <Image
                      {...getMarketingMockup("studioPet", locale)}
                      data-product-scene="studioPet"
                      data-product-locale={locale}
                      alt={t.phoneAlt}
                      sizes="(max-width: 600px) 240px, (max-width: 1200px) 260px, 288px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </figure>

        <ul className={styles.features} role="list">
          {t.features.map((feature, index) => (
            <li className={styles.feature} key={feature.title} data-studio-feature={featureArtwork[index]}>
              <div className={styles.featureArt} aria-hidden="true">
                <StudioFeatureArt kind={featureArtwork[index]} />
              </div>
              <div className={styles.featureCopy}>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <div className={styles.actionLinks}>
            <Link className={styles.primaryAction} href={localeHref(locale, "web-studio")}>
              {t.link}<Icon name="arrowR" size={16} />
            </Link>
            <Link className={styles.link} href={{ pathname: localeHref(locale, "web-studio", "demo"), query: { returnTo: `${localeHref(locale, "for-business")}#web-studio` } }}>
              {dictionaries[locale].webStudio.hero.demoCta}<Icon name="arrowR" size={16} />
            </Link>
          </div>
          <p className={styles.note}>{t.note}</p>
        </div>
      </div>
    </section>
  );
}
