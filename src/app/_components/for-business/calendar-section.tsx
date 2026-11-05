import clsx from "clsx";
import { dictionaries } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import { CalendarDesktopArtwork, CalendarPhoneArtwork } from "./calendar-artwork";
import { CalendarFeatureArt } from "./calendar-feature-art";
import m from "./marketing.module.css";
import styles from "./calendar-section.module.css";

const featureArtwork = ["calendars", "bookingRules", "bookingChanges", "teamAccess", "servicesBundles", "clientHistory"] as const;

/** The same working day on desktop and mobile, with every benefit visible. */
export function CalendarSection({ locale }: { locale: Locale }) {
  const t = dictionaries[locale].forBusiness.run;

  return (
    <section className={styles.section} aria-labelledby="run-title">
      <div className={clsx("zw-container", styles.layout)} data-calendar-artwork="">
        <div className={styles.heading}>
          <h2 className={m.h2} id="run-title">{t.title}</h2>
          <p className={clsx(m.lead, styles.lead)}>{t.lead}</p>
        </div>

        <CalendarDesktopArtwork locale={locale} className={styles.desktop} />
        <CalendarPhoneArtwork locale={locale} className={styles.phone} />

        <ul className={styles.features} role="list">
          {t.features.map((feature, index) => (
            <li className={styles.feature} key={feature.title} data-calendar-feature={featureArtwork[index]}>
              <div className={styles.featureArt} aria-hidden="true">
                <CalendarFeatureArt kind={featureArtwork[index]} />
              </div>
              <div className={styles.featureCopy}>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
