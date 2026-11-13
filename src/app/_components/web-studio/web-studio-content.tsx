import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { localeHref } from "@/i18n/routes";
import { Icon } from "@/components/ui/icon";
import { formatPrice, getPlanPricing, premiumStyleStartingPrice } from "@/lib/marketing/pricing";
import { BRAND_ACCENT_CATALOG, FONT_CATALOG } from "@/features/website/components/builder/theme";
import { MarketingFaq } from "@/app/_components/for-business/faq-section";
import { TeamSeatPrice } from "@/app/_components/for-business/team-seat-price";
import { registrationHref, SIGN_IN_URL } from "@/app/_components/for-business/links";
import { preloadSignatureFont } from "@/app/_components/for-business/signature-font";
import m from "@/app/_components/for-business/marketing.module.css";
import { WebStudioHero } from "./web-studio-hero";
import { ConnectedArt, StoryConnectors } from "./connected-art";
import { ConnectedStory } from "./connected-story";
import { SetupSection } from "./setup-section";
import connected from "./connected-story.module.css";
import styles from "./web-studio.module.css";

/** The product story and industry examples are authored on the server. */
export function WebStudioContent({ locale, pending = false }: { locale: Locale; pending?: boolean }) {
  const t = dictionaries[locale].webStudio;
  const pricing = getPlanPricing(locale);
  const values = { days: String(pricing.trialDays) };
  const demoHref = localeHref(locale, "web-studio", "demo");
  const signupHref = registrationHref(locale);
  preloadSignatureFont();
  return (
    <div className={styles.page} data-web-studio="" data-locale={locale}>
      <WebStudioHero locale={locale} hero={t.hero} showcase={t.showcase} industries={dictionaries[locale].industries} exampleNote={dictionaries[locale].marketingExamples.websites} pending={pending} />

      <section className={styles.connected} aria-labelledby="connected-title" data-studio-connected="">
        <div className="zw-container">
          <ConnectedStory locale={locale}>
            <header className={connected.intro}>
              <h2 id="connected-title" className={m.h2}>{t.connected.title}</h2>
            </header>
            <div className={connected.flow}>
              <ul className={connected.story} role="list">
                {t.connected.features.map((feature, index) => (
                  <li key={index} className={connected.chapter}>
                    <div className={connected.scene}>
                      <ConnectedArt kind={index === 0 ? "details" : index === 1 ? "website" : "calendar"} copy={t.connected.artwork} />
                    </div>
                    <div className={connected.copy}><h3>{feature.title}</h3><p>{feature.body}</p></div>
                  </li>
                ))}
              </ul>
              <StoryConnectors />
            </div>
          </ConnectedStory>
        </div>
      </section>

      <SetupSection locale={locale} copy={t.setup} pending={pending} />

      <section className={styles.publishing} aria-labelledby="publishing-title">
        <div className="zw-container">
          <div className={styles.publishingLayout}>
            <div className={styles.publishingCopy}>
              <h2 id="publishing-title" className={m.h2}>{t.publishing.title}</h2>
              <p className={styles.publishingLead}>{t.publishing.lead}</p>
              <ul className={styles.publishBenefits}>
                {t.publishing.features.map(feature => <li key={feature}><Icon name="check" size={19} color="oklch(74% .13 158)" /><span>{feature}</span></li>)}
              </ul>
              <Link className={styles.textLink} href={localeHref(locale, "pricing")}>{t.publishing.pricingLink}<Icon name="arrowR" size={17} /></Link>
            </div>
            <div className={styles.publishingAction}>
              <div className={styles.plusHeading}>
                <h3>{t.publishing.planName}</h3>
                <p className={styles.price}><strong>{formatPrice(pricing.plans.plus.monthly, pricing.currency)}</strong><span>{t.publishing.perMonth}</span></p>
              </div>
              <div className={styles.charges}>
                <p className={styles.owner}>{dictionaries[locale].forBusiness.plans.ownerIncluded}</p>
                <TeamSeatPrice locale={locale} className={styles.seatPrice} />
              </div>
              <a className={styles.trial} href={signupHref}>{format(t.publishing.cta, values)}<span className={styles.arrowWell}><Icon name="arrowR" size={18} /></span></a>
              <p className={styles.trialNote}>{format(t.publishing.trialNote, values)}</p>
              <a className={`${styles.textLink} ${styles.signIn}`} href={SIGN_IN_URL}>{t.publishing.signInLink}<Icon name="arrowR" size={15} /></a>
            </div>
          </div>
          <div className={styles.stylesInfo}>
            <h3>{t.publishing.stylesTitle}</h3>
            <div>
              <p>{format(t.publishing.stylesBody, { fonts: String(FONT_CATALOG.length), colours: String(BRAND_ACCENT_CATALOG.length) })}</p>
              <p className={styles.stylePrice}>{format(t.publishing.stylePrice, { price: premiumStyleStartingPrice(locale) })}</p>
              <Link className={styles.textLink} href={demoHref}>{t.publishing.demoLink}<Icon name="arrowR" size={17} /></Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFaq locale={locale} headingId="studio-faq-title" title={t.faq.title} lead={t.faq.lead} helpPrompt={t.faq.helpPrompt} helpLink={t.faq.helpLink} items={t.faq.items.map(item => ({
        q: item.q,
        a: format(item.a, values),
        link: item.helpLink ? { label: item.helpLink, href: localeHref(locale, "help") } : undefined,
      }))} />
    </div>
  );
}
