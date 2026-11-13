import clsx from "clsx";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { dictionaries } from "@/i18n/dictionaries";
import { format, formatCount } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { getPlanPricing } from "@/lib/marketing/pricing";
import { ClosingArtwork } from "./closing-artwork";
import { registrationHref, SIGN_IN_URL } from "./links";
import m from "./marketing.module.css";
import styles from "./closing-section.module.css";

/** A final invitation, with the action beside its setup details and reassurance. */
export function ClosingSection({ locale }: { locale: Locale }) {
  const t = dictionaries[locale].forBusiness;
  const b = dictionaries[locale].businessMarketing;
  const days = formatCount(getPlanPricing(locale).trialDays, locale, b.counts.days);

  return (
    <MarketingClosing
      locale={locale}
      headingId="close-title"
      title={
        <>
          <span>{t.close.titleLead}</span>
          <span>{t.close.titlePre}<span className={clsx(m.signature, styles.signature)}>{t.close.titleAccent}</span></span>
        </>
      }
      lead={t.close.lead}
      trialLabel={format(t.hero.trialCta, { days })}
      terms={[b.noCard, t.hero.noCommission]}
    />
  );
}

interface MarketingClosingProps {
  locale: Locale;
  headingId: string;
  /** Direct span children create the two headline lines. */
  title: ReactNode;
  lead: string;
  trialLabel: string;
  terms: readonly string[];
}

/** The shared closing presentation accepts the page's own final invitation. */
export function MarketingClosing({
  locale, headingId, title, lead, trialLabel, terms,
}: MarketingClosingProps) {
  const b = dictionaries[locale].businessMarketing;

  return (
    <section className={styles.section} aria-labelledby={headingId} data-business-closing="" data-locale={locale}>
      <div className={clsx("zw-container", styles.layout)}>
        <div className={styles.copy}>
          <h2 className={styles.title} id={headingId}>{title}</h2>
          <p className={styles.lead}>{lead}</p>

          <div className={styles.actions}>
            <a className={clsx(m.button, styles.trial)} href={registrationHref(locale)}>
              <span>{trialLabel}</span>
              <span className={styles.arrowWell} aria-hidden="true"><Icon name="arrowR" size={18} /></span>
            </a>
            <ul className={styles.terms}>
              {terms.map(term => (
                <li key={term}><Icon name="check" size={15} color="var(--s-success-600)" />{term}</li>
              ))}
            </ul>
            <p className={styles.signIn}>
              <span>{b.signInPrompt}</span>
              <a href={SIGN_IN_URL}>{b.signIn}</a>
            </p>
          </div>
        </div>

        <div className={styles.artwork} aria-hidden="true"><ClosingArtwork /></div>
      </div>
    </section>
  );
}
