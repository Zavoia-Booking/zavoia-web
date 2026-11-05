import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import disclosure from "@/components/ui/disclosure-motion.module.css";
import { dictionaries } from "@/i18n/dictionaries";
import { format, formatCount } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { formatPrice, getPlanPricing } from "@/lib/marketing/pricing";
import { FaqArtwork } from "./faq-artwork";
import m from "./marketing.module.css";
import styles from "./faq-section.module.css";

/** Secondary questions remain native, exclusive disclosures with no client state. */
export function FaqSection({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale];
  const t = dict.forBusiness.faq;
  const pricing = getPlanPricing(locale);
  const counts = dict.businessMarketing.counts;
  const values = {
    days: formatCount(pricing.trialDays, locale, counts.days),
    seat: formatPrice(pricing.teamMember, pricing.currency),
    baseTeamMembers: formatCount(pricing.teamMemberLimits.base, locale, counts.teamMembers),
    baseLocations: formatCount(pricing.plans.base.locations, locale, counts.locations),
    plusLocations: formatCount(pricing.plans.plus.locations, locale, counts.locations),
  };

  return (
    <MarketingFaq
      locale={locale}
      headingId="faq-title"
      title={t.title}
      lead={t.aside}
      helpPrompt={t.helpPrompt}
      helpLink={t.helpLink}
      items={t.items.map(item => ({ q: item.q, a: format(item.a, values) }))}
    />
  );
}

interface MarketingFaqProps {
  locale: Locale;
  headingId: string;
  title: string;
  lead: string;
  helpPrompt: string;
  helpLink: string;
  /** Answers are formatted by the page; blank lines separate paragraphs. */
  items: readonly { q: string; a: string }[];
}

/** The shared disclosure presentation keeps each page's questions and wording. */
export function MarketingFaq({
  locale, headingId, title, lead, helpPrompt, helpLink, items,
}: MarketingFaqProps) {
  return (
    <section className={styles.section} aria-labelledby={headingId} data-business-faq="">
      <div className={`zw-container ${styles.layout}`}>
        <div className={styles.intro}>
          <div className={styles.copy}>
            <h2 className={`${m.h2} ${styles.title}`} id={headingId} tabIndex={-1}>{title}</h2>
            <p className={styles.lead}>{lead}</p>
          </div>
          <div className={styles.artwork} aria-hidden="true"><FaqArtwork /></div>
          <div className={styles.help}>
            <p>{helpPrompt}</p>
            <Link className={styles.helpLink} href={localeHref(locale, "help")}>
              <span>{helpLink}</span><Icon name="arrowR" size={17} />
            </Link>
          </div>
        </div>

        <div className={styles.list}>
          {items.map((item, index) => (
            <details
              key={item.q}
              name={`${headingId}-questions`}
              open={index === 0}
              className={`${styles.item} ${disclosure.root} ${disclosure.native}`}
            >
              <summary className={styles.question}>
                <h3>{item.q}</h3>
                <span className={styles.toggle} aria-hidden="true" />
              </summary>
              <div className={disclosure.body}>
                <div className={styles.answer}>
                  {item.a.split("\n\n").map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
