import Link from "next/link";
import clsx from "clsx";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { format, formatCount } from "@/i18n/format";
import { localeHref } from "@/i18n/routes";
import { Icon } from "@/components/ui/icon";
import { formatPrice, getPlanPricing } from "@/lib/marketing/pricing";
import { caveat } from "@/styles/fonts";
import { PlanCards } from "@/app/_components/for-business/plan-cards";
import { TeamSeatPrice } from "@/app/_components/for-business/team-seat-price";
import { MarketingFaq } from "@/app/_components/for-business/faq-section";
import { StudioFeatureArt } from "@/app/_components/for-business/studio-feature-art";
import m from "@/app/_components/for-business/marketing.module.css";
import { PricingComparison } from "./pricing-comparison";
import { SmsArtwork } from "./pricing-artwork";
import styles from "./pricing.module.css";

/** Fixed subscriptions, visible plan differences and the full included capabilities. */
export function PricingContent({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale];
  const t = dict.pricing;
  const b = dict.businessMarketing;
  const pricing = getPlanPricing(locale);
  const days = formatCount(pricing.trialDays, locale, b.counts.days);
  const baseTeamMembers = formatCount(pricing.teamMemberLimits.base, locale, b.counts.teamMembers);
  const values = { days, seat: formatPrice(pricing.teamMember, pricing.currency), baseTeamMembers };

  return (
    <main className={clsx(caveat.variable, styles.page)} data-pricing-page="">
      <section className={styles.opening} aria-labelledby="pricing-title">
        <div className="zw-container">
          <header className={styles.head}>
            <h1 className={styles.title} id="pricing-title">
              <span>{t.hero.titleLead}</span>{" "}
              <span>{t.hero.titlePre}<span className={clsx(m.signature, styles.signature)}>{t.hero.titleAccent}</span></span>
            </h1>
            <p className={styles.lead}>{t.hero.lead}</p>
            <nav className={styles.planShortcuts} aria-label={t.plansLabel}>
              {(["base", "plus"] as const).map(id => (
                <a key={id} href={`#pricing-plan-${id}`}>
                  <strong>{b.plans[id].name}</strong>
                  <span>{formatPrice(pricing.plans[id].monthly, pricing.currency)} <span>{b.plans.perMonth}</span></span>
                </a>
              ))}
              <TeamSeatPrice locale={locale} className={styles.shortcutSeatPrice} />
            </nav>
          </header>
          <div className={styles.plans} id="pricing-plans" tabIndex={-1} aria-label={t.plansLabel}>
            <PlanCards locale={locale} headingLevel={2} idPrefix="pricing-plan" source="pricing" />
          </div>
          <div className={styles.billing}>
            <p>{format(t.billing.currencyNote, { currency: pricing.currency })}</p>
            <p>{t.billing.terms}</p>
          </div>
        </div>
      </section>

      <PricingComparison locale={locale} />

      <section className={styles.extras} aria-labelledby="addons-title">
        <div className="zw-container">
          <header className={styles.sectionHead}>
            <h2 className={m.h2} id="addons-title">{t.addons.title}</h2>
            <p className={styles.sectionLead}>{t.addons.lead}</p>
          </header>
          <div className={styles.addons}>
            {t.addons.items.map((addon, index) => (
              <article key={addon.title} className={styles.addon}>
                <div className={styles.addonArtwork} aria-hidden="true">
                  {index === 0 ? <SmsArtwork /> : <StudioFeatureArt kind="design" />}
                </div>
                <h3>{addon.title}</h3>
                <div className={styles.addonCopy}>
                  <p>{addon.body}</p>
                  <p className={styles.availability}>{addon.availability}</p>
                  {index === 1 && <Link href={localeHref(locale, "web-studio")} className={styles.textLink}>{t.addons.studioLink}<Icon name="arrowR" size={16} /></Link>}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <MarketingFaq
        locale={locale}
        headingId="billing-faq-title"
        title={t.faq.title}
        lead={t.faq.lead}
        helpPrompt={t.faq.helpPrompt}
        helpLink={t.faq.helpLink}
        items={t.faq.items.map(item => ({ q: item.q, a: format(item.a, values) }))}
      />
    </main>
  );
}
