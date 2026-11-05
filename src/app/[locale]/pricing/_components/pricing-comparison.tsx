import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { localeHref } from "@/i18n/routes";
import { formatPrice, getPlanPricing } from "@/lib/marketing/pricing";
import { DiscoveryFeatureArt } from "@/app/_components/for-business/discovery-feature-art";
import { CalendarFeatureArt } from "@/app/_components/for-business/calendar-feature-art";
import m from "@/app/_components/for-business/marketing.module.css";
import styles from "./pricing-comparison.module.css";

const BENEFIT_ART = [
  <DiscoveryFeatureArt key="discovery" kind="bookingLink" />,
  <CalendarFeatureArt key="calendar" kind="calendars" />,
  <CalendarFeatureArt key="team" kind="teamAccess" />,
  <CalendarFeatureArt key="clients" kind="clientHistory" />,
];

/** One readable comparison, followed by the capabilities shared by both plans. */
export function PricingComparison({ locale }: { locale: Locale }) {
  const t = dictionaries[locale].pricing;
  const pricing = getPlanPricing(locale);
  const number = (value: number) => new Intl.NumberFormat(locale).format(value);
  const limit = (value: number) => (
    <span className={styles.limit}><span>{t.compare.upTo}</span><strong>{number(value)}</strong></span>
  );
  const rows = [
    { label: t.compare.website, base: t.compare.websiteBase, plus: t.compare.websitePlus },
    { label: t.compare.locations, base: limit(pricing.plans.base.locations), plus: limit(pricing.plans.plus.locations) },
    { label: t.compare.teamMembers, base: limit(pricing.teamMemberLimits.base), plus: <strong className={styles.unlimited}>{t.compare.unlimited}</strong> },
  ];

  return (
    <section className={styles.section} aria-labelledby="compare-title">
      <div className="zw-container">
        <header className={styles.heading}>
          <h2 className={m.h2} id="compare-title" tabIndex={-1}>{t.compare.title}</h2>
          <p className={styles.lead}>{t.compare.lead}</p>
        </header>
        <table className={styles.table} role="table">
          <caption className="sr-only">{t.compare.caption}</caption>
          <thead role="rowgroup">
            <tr role="row">
              <th scope="col" role="columnheader"><span className="sr-only">{t.compare.feature}</span></th>
              <th scope="col" role="columnheader">
                <span className={styles.planName}>Base</span>
                <span className={styles.planSummary}>{t.compare.baseSummary}</span>
              </th>
              <th scope="col" role="columnheader" className={styles.plusColumn}>
                <span className={styles.planName}><Icon name="plus" size={23} color="var(--p-500)" />Plus</span>
                <span className={styles.planSummary}>{t.compare.plusSummary}</span>
              </th>
            </tr>
          </thead>
          <tbody role="rowgroup">
            {rows.map(row => (
              <tr key={row.label} role="row">
                <th scope="row" role="rowheader">{row.label}</th>
                <td role="cell"><span className={styles.mobilePlan} aria-hidden="true">Base</span>{row.base}</td>
                <td role="cell" className={styles.plusColumn}><span className={styles.mobilePlan} aria-hidden="true">Plus</span>{row.plus}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.notes}>
          <p>{format(t.compare.paidMemberNote, { price: formatPrice(pricing.teamMember, pricing.currency) })}</p>
          <p>{format(t.billing.larger, { locations: number(pricing.plans.plus.locations) })}{" "}<Link href={localeHref(locale, "help")} className={styles.helpLink}><span>{t.billing.helpLink}</span><Icon name="arrowR" size={15} /></Link></p>
        </div>

        <div className={styles.included}>
          <header className={styles.includedHeading}>
            <h3>{t.included.title}</h3>
            <p className={styles.lead}>{t.included.lead}</p>
          </header>
          <div className={styles.groups}>
            {t.included.groups.map((group, index) => (
              <div key={group.title} className={styles.group}>
                <div className={styles.artwork} aria-hidden="true">{BENEFIT_ART[index]}</div>
                <div className={styles.groupCopy}>
                  <h4>{group.title}</h4>
                  <ul>
                    {group.items.map(item => (
                      <li key={item}><Icon name="check" size={16} color="var(--s-success-600)" /><span>{item}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
