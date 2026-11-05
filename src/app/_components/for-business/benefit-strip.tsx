import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { format, formatCount } from "@/i18n/format";
import { getPlanPricing } from "@/lib/marketing/pricing";
import { NoCardArt, NoCommissionArt, TrialArt } from "./benefit-art";
import styles from "./benefit-strip.module.css";

/** The three trial promises, given their own illustrated band after the hero. */
export function BenefitStrip({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale];
  const t = dict.forBusiness.benefits;
  const b = dict.businessMarketing;
  const { trialDays } = getPlanPricing(locale);
  const days = formatCount(trialDays, locale, b.counts.days);
  const benefits = [
    {
      key: "trial",
      title: format(b.trialDays, { days }),
      body: t.trial,
      art: <TrialArt days={trialDays} />,
    },
    {
      key: "card",
      title: b.noCard,
      body: t.noCard,
      art: <NoCardArt />,
    },
    {
      key: "commission",
      title: dict.forBusiness.hero.noCommission,
      body: t.noCommission,
      art: <NoCommissionArt />,
    },
  ];

  return (
    <section className={styles.band} aria-label={t.label} data-business-benefits="">
      <div className="zw-container">
        <ul className={styles.list}>
          {benefits.map(({ key, title, body, art }) => (
            <li key={key} className={styles.item}>
              <div className={styles.art} aria-hidden="true">{art}</div>
              <div className={styles.copy}>
                <h2>{title}</h2>
                <p>{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
