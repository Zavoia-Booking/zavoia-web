import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import disclosure from "@/components/ui/disclosure-motion.module.css";
import { dictionaries } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import type { MarketingFaqItem } from "@/lib/marketing/page-content";
import { FaqArtwork } from "./faq-artwork";
import m from "./marketing.module.css";
import styles from "./faq-section.module.css";

/** Secondary questions remain independent native disclosures with no client state. */
export function FaqSection({ locale, items }: { locale: Locale; items: readonly MarketingFaqItem[] }) {
  const dict = dictionaries[locale];
  const t = dict.forBusiness.faq;

  return (
    <MarketingFaq
      locale={locale}
      headingId="faq-title"
      title={t.title}
      lead={t.aside}
      helpPrompt={t.helpPrompt}
      helpLink={t.helpLink}
      items={items}
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
  items: readonly MarketingFaqItem[];
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
                  {item.link && <Link className={`${styles.helpLink} ${styles.answerLink}`} href={item.link.href}>
                    <span>{item.link.label}</span><Icon name="arrowR" size={17} />
                  </Link>}
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
