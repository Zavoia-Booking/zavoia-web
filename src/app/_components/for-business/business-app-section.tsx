import clsx from "clsx";
import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/icon";
import { dictionaries } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import { BusinessAppPhoneArtwork } from "./calendar-artwork";
import { BusinessAppStage } from "./business-app-stage";
import { SIGN_IN_URL } from "./links";
import m from "./marketing.module.css";
import styles from "./business-app-section.module.css";

/** The owner's mobile workspace, distinct from the client app shown earlier. */
export function BusinessAppSection({ locale }: { locale: Locale }) {
  const t = dictionaries[locale].forBusiness.app;
  const stores = dictionaries[locale].homeSections.app;

  return (
    <section className={styles.section} aria-labelledby="business-app-title" data-business-app="">
      <div className={clsx("zw-container", styles.layout)}>
        <header className={styles.intro}>
          <h2 className={styles.title} id="business-app-title">
            <span>{t.titleLead}</span>{" "}
            <span>{t.titlePre}<span className={clsx(m.signature, styles.signature)}>{t.titleAccent}</span></span>
          </h2>
          <p className={styles.lead}>{t.lead}</p>
        </header>

        <div className={styles.actions}>
          <h3 className={styles.downloadTitle} id="business-app-download-title">{t.downloadTitle}</h3>
          <p className={styles.downloadDescription}>{t.downloadDescription}</p>
          {/* Platform badges match the homepage. Add link destinations only
              when the business app's actual store URLs are supplied. */}
          <div className={styles.stores} role="group" aria-label={t.platformsLabel}>
            {[
              { icon: "apple", platform: stores.ios, name: stores.appStore },
              { icon: "google-play", platform: stores.android, name: stores.googlePlay },
            ].map((store) => (
              <span className={styles.storeBadge} key={store.icon}>
                <span
                  className={styles.storeSymbol}
                  style={{ "--store-icon": `url('/images/homepage/${store.icon}.svg')` } as CSSProperties}
                  aria-hidden="true"
                />
                <span className={styles.storeLabel}>
                  <small>{store.platform}</small>
                  <strong>{store.name}</strong>
                </span>
              </span>
            ))}
          </div>
          <a href={SIGN_IN_URL} className={styles.link}>
            <span>{t.webLink}</span>
            <Icon name="arrowR" size={17} />
          </a>
        </div>

        <BusinessAppStage locale={locale} className={styles.showcase}>
          <div className={clsx(styles.feature, styles.assignmentsNote)} data-business-app-feature="assignments">
            <h3>{t.features[0].title}</h3>
            <p>{t.features[0].body}</p>
          </div>
          <div className={clsx(styles.device, styles.assignments)} data-app-device="0">
            <BusinessAppPhoneArtwork locale={locale} scene="businessAppAssignments" className={styles.assignmentsPhone} sizes="(max-width: 360px) 268px, (max-width: 760px) 300px, (max-width: 1200px) 316px, 340px" />
          </div>
          <div className={clsx(styles.feature, styles.marketplaceNote)} data-business-app-feature="marketplace">
            <h3>{t.features[1].title}</h3>
            <p>{t.features[1].body}</p>
          </div>
          <div className={clsx(styles.device, styles.marketplace)} data-app-device="1">
            <BusinessAppPhoneArtwork locale={locale} scene="businessAppMarketplace" className={styles.marketplacePhone} sizes="(max-width: 360px) 268px, (max-width: 760px) 300px, 316px" />
          </div>
        </BusinessAppStage>

        <div className={styles.notifications} data-business-app-feature="notifications">
          <span className={styles.notificationSymbol} aria-hidden="true"><Icon name="bell" size={22} /></span>
          <h3>{t.features[2].title}</h3>
          <p>{t.features[2].body}</p>
        </div>
      </div>
    </section>
  );
}
