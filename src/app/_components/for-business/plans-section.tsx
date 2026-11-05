import clsx from "clsx";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { formatPrice, getPlanPricing } from "@/lib/marketing/pricing";
import { PlanCards } from "./plan-cards";
import m from "./marketing.module.css";
import styles from "./plans-section.module.css";

/** Fixed monthly subscriptions, with the additional-member charge stated separately. */
export function PlansSection({ locale }: { locale: Locale }) {
  const t = dictionaries[locale].forBusiness.plans;
  const pricing = getPlanPricing(locale);
  const memberPrice = format(t.memberPrice, { price: formatPrice(pricing.teamMember, pricing.currency) });

  return (
    <section className={styles.section} id="plans" tabIndex={-1} aria-labelledby="plans-title">
      <div className="zw-container">
        <div className={styles.content}>
          <div className={styles.heading}>
            <h2 className={m.h2} id="plans-title">{t.title}</h2>
            <p className={clsx(m.lead, styles.lead)}>{t.lead}</p>
            <p className={styles.teamPrice} data-plan-team-price="">{memberPrice}</p>
          </div>

          <PlanCards locale={locale} />
        </div>
      </div>
    </section>
  );
}
