import clsx from "clsx";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { PlanCards } from "./plan-cards";
import m from "./marketing.module.css";
import styles from "./plans-section.module.css";

/** Fixed monthly subscriptions with the paid-seat rate on each shared card. */
export function PlansSection({ locale }: { locale: Locale }) {
  const t = dictionaries[locale].forBusiness.plans;

  return (
    <section className={styles.section} id="plans" tabIndex={-1} aria-labelledby="plans-title">
      <div className="zw-container">
        <div className={styles.content}>
          <div className={styles.heading}>
            <h2 className={m.h2} id="plans-title">{t.title}</h2>
            <p className={clsx(m.lead, styles.lead)}>{t.lead}</p>
          </div>

          <PlanCards locale={locale} />
        </div>
      </div>
    </section>
  );
}
