import clsx from "clsx";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { format, formatCount } from "@/i18n/format";
import { localeHref } from "@/i18n/routes";
import { formatPrice, getPlanPricing, type PlanId } from "@/lib/marketing/pricing";
import { registrationHref, TrialLink } from "./links";
import { PricingSignupLink } from "./pricing-signup-link";
import { PlanArtwork } from "./plan-artwork";
import { TeamSeatPrice } from "./team-seat-price";
import m from "./marketing.module.css";
import styles from "./plans-section.module.css";

const PLAN_IDS: readonly PlanId[] = ["base", "plus"];

/** Shared fixed-price receipts for the business overview and detailed pricing page. */
export function PlanCards({
  locale,
  headingLevel = 3,
  idPrefix = "plan",
  source = "business",
}: {
  locale: Locale;
  headingLevel?: 2 | 3;
  idPrefix?: string;
  source?: "business" | "pricing";
}) {
  const dict = dictionaries[locale];
  const t = dict.forBusiness.plans;
  const b = dict.businessMarketing;
  const pricing = getPlanPricing(locale);
  const pricingPage = source === "pricing";
  const days = formatCount(pricing.trialDays, locale, b.counts.days);
  const members = formatCount(pricing.teamMemberLimits.base, locale, t.additionalTeamMembers);
  const PlanHeading = headingLevel === 2 ? "h2" : "h3";
  const BenefitsHeading = headingLevel === 2 ? "h3" : "h4";

  return (
  <div className={styles.tickets}>
    {PLAN_IDS.map(id => {
      const copy = b.plans[id];
      const plan = pricing.plans[id];
      const locations = formatCount(plan.locations, locale, b.counts.locations);
      const trialCta = format(t.trialCta[id], { days });
      const actionClass = clsx(m.button, styles.trial, id === "plus" ? styles.plusTrial : m.buttonLine);
      const action = (
        <div className={styles.action}>
          {pricingPage ? (
            <PricingSignupLink href={registrationHref(locale)} plan={id} locale={locale} className={actionClass}>
              <span>{trialCta}</span>
              {id === "plus" ? <span className={styles.arrowWell} aria-hidden="true"><Icon name="arrowR" size={18} /></span> : <Icon name="arrowR" size={16} />}
            </PricingSignupLink>
          ) : id === "plus" ? (
            <a href={registrationHref(locale)} className={actionClass}>
              <span>{trialCta}</span>
              <span className={styles.arrowWell} aria-hidden="true"><Icon name="arrowR" size={18} /></span>
            </a>
          ) : <TrialLink label={trialCta} tone="line" arrow className={styles.trial} locale={locale} />}
          <p className={styles.trialNote}>{t.trialNotes[id]}</p>
        </div>
      );
      return (
        <article key={id} className={styles.ticket} data-plan={id} aria-labelledby={`${idPrefix}-${id}`}>
          <div className={clsx(styles.surface, styles.ticketTop)}>
            <div className={styles.ticketHeading}>
              <div className={styles.headingCopy}>
                <div className={styles.ticketName}>
                  <PlanHeading id={`${idPrefix}-${id}`}>{copy.name}</PlanHeading>
                </div>
                <p className={styles.description}>{id === "plus" ? t.plusDescription : t.baseDescription}</p>
              </div>
              {id === "plus" && <div className={styles.planArt} aria-hidden="true"><PlanArtwork plan="plus" /></div>}
            </div>
            <p className={styles.price}>
              <strong data-plan-price={id}>{formatPrice(plan.monthly, pricing.currency)}</strong>{" "}
              <span>{b.plans.perMonth}</span>
            </p>
            <div className={styles.charges}>
              <p className={styles.owner}>{t.ownerIncluded}</p>
              <TeamSeatPrice locale={locale} className={styles.seatPrice} />
            </div>
          </div>
          <div className={clsx(styles.surface, styles.ticketBottom)}>
            <div className={styles.perforation} aria-hidden="true" />
            <div className={styles.benefits}>
              {id === "plus" && (
                <BenefitsHeading className={clsx(styles.benefitsHeading, styles.withIcon)}>
                  <Icon name="check" size={22} color="var(--plan-check)" className={styles.benefitIcon} />
                  <span>{t.plusBenefitsTitle}</span>
                </BenefitsHeading>
              )}
              <ul className={styles.features} role="list">
                {(id === "base" ? t.baseBenefits : t.plusBenefits).map(feature => (
                  <li key={feature.title}>
                    {id === "plus" && <Icon name="plus" size={22} color="var(--plan-accent)" className={styles.benefitIcon} />}
                    <div className={styles.featureCopy}>
                      <strong>{format(feature.title, { locations, members })}</strong>
                      <p>{format(feature.body, { locations, members })}</p>
                      {id === "plus" && feature.studioLink && (
                        <Link className={styles.studioLink} href={localeHref(locale, "web-studio")}>
                          <span>{feature.studioLink}</span><Icon name="arrowR" size={15} />
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {action}
          </div>
        </article>
      );
    })}
  </div>
  );
}
