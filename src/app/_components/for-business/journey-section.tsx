import type { CSSProperties } from "react";
import Image from "next/image";
import { dictionaries } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import { getMarketingMockup } from "@/lib/marketing/mockups";
import m from "./marketing.module.css";
import styles from "./journey-section.module.css";

const REMINDER_STEP = 2;

/** The client's real schedule beside the complete, visible booking journey. */
export function JourneySection({ locale }: { locale: Locale }) {
  const t = dictionaries[locale].forBusiness.life;

  return (
    <section className={styles.section} aria-labelledby="life-title">
      <div className={`zw-container ${styles.layout}`}>
        <div className={styles.intro}>
          <h2 className={m.h2} id="life-title">{t.title}</h2>
          <p className={m.lead}>{t.lead}</p>
        </div>

        <figure className={styles.artwork} data-journey-artwork="">
          <div className={styles.composition}>
            <span className={styles.contactShadow} aria-hidden="true" />
            <div className={styles.phoneMount} data-journey-phone="">
              <div className={styles.phone}>
                {[-9, -6, -3, -1.5].map(depth => (
                  <i key={depth} className={styles.phoneEdge} style={{ "--depth": `${depth}px` } as CSSProperties} aria-hidden="true" />
                ))}
                <div className={styles.phoneFace}>
                  <div className={styles.phoneScreen}>
                    <Image
                      {...getMarketingMockup("consumerSchedule", locale)}
                      data-product-scene="consumerSchedule"
                      data-product-locale={locale}
                      alt={t.scheduleAlt}
                      sizes="(max-width: 600px) 240px, 300px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </figure>

        <ol className={styles.steps}>
          {t.steps.map((step, index) => (
            <li key={step.title} className={styles.step} data-reminder={index === REMINDER_STEP}>
              <span className={styles.number} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
