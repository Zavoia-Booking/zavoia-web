import clsx from "clsx";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { format, formatCount } from "@/i18n/format";
import { getPlanPricing } from "@/lib/marketing/pricing";
import { caveat } from "@/styles/fonts";
import { TrialLink } from "./links";
import { ClosingSection } from "./closing-section";
import { PricingLink } from "./pricing-link";
import { StreetScene } from "./street-scene";
import { BenefitStrip } from "./benefit-strip";
import { DiscoverySection } from "./discovery-section";
import { CalendarSection } from "./calendar-section";
import { BusinessAppSection } from "./business-app-section";
import { JourneySection } from "./journey-section";
import { StudioSection } from "./studio-section";
import { PlansSection } from "./plans-section";
import { FaqSection } from "./faq-section";
import m from "./marketing.module.css";
import styles from "./for-business.module.css";

/**
 * /for-business: get found (hero, the marketplace page), keep clients (the
 * booking path), run the day (calendar and business app), the website (Plus), then plans,
 * questions and the trial. Server-rendered, with small client leaves for the
 * street and pricing link.
 */
export function ForBusinessContent({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale];
  const t = dict.forBusiness;
  const b = dict.businessMarketing;
  const pricing = getPlanPricing(locale);
  const days = formatCount(pricing.trialDays, locale, b.counts.days);

  return (
    <div className={caveat.variable}>
      <div className={styles.heroRegion}>
        <section className={styles.hero} data-locale={locale} aria-labelledby="for-business-title">
          <div className="zw-container">
            <div className={styles.heroTop}>
              <h1 className={clsx(m.h1, styles.heroTitle, "zw-rise")} data-d="1" id="for-business-title">
                <span>{t.hero.titleLead}</span>{" "}
                <span>{t.hero.titlePre}<span className={clsx(m.signature, styles.heroSignature)}>{t.hero.titleAccent}</span></span>
              </h1>
              <div className={styles.heroCopy}>
                <div className={clsx(styles.heroIntro, "zw-rise")} data-d="2">
                  <p className={styles.heroLead}>{t.hero.lead}</p>
                  <p className={styles.heroSupport}>{t.hero.support}</p>
                </div>
                <div className={clsx(m.ctaRow, styles.heroActions)}>
                  <TrialLink label={format(t.hero.trialCta, { days })} arrow className={styles.heroTrial} />
                  <PricingLink className={clsx(m.textLink, styles.heroPricing)}>
                    {t.hero.pricingLink}
                  </PricingLink>
                </div>
              </div>
            </div>

            <div className={styles.streetWrap}>
              <StreetScene locale={locale} />
            </div>
          </div>
        </section>

        <BenefitStrip locale={locale} />
      </div>

      <DiscoverySection locale={locale} />

      <JourneySection locale={locale} />

      <CalendarSection locale={locale} />

      <div className={styles.toolsRegion}>
        <BusinessAppSection locale={locale} />
        <StudioSection locale={locale} />
      </div>

      <PlansSection locale={locale} />

      <FaqSection locale={locale} />

      <ClosingSection locale={locale} />
    </div>
  );
}
