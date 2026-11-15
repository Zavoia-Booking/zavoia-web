import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { Icon } from "@/components/ui/icon";
import { QARow } from "@/components/ui/qa-row";
import faq from "../for-business/faq-section.module.css";
import { FaqArtwork } from "../for-business/faq-artwork";
import m from "../for-business/marketing.module.css";
import { UsefulLinksArtwork } from "./useful-links-artwork";
import postStyles from "./blog-post.module.css";
import styles from "./article-extras.module.css";

type ArticleExtrasProps = {
  locale: Locale;
  faqId: string;
  linksId: string;
  questions: { q: string; a: string }[];
  links: { key: string; label: string; href: string }[];
};

/** The article's own answers and resources, available in the server HTML. */
export function ArticleExtras({ locale, faqId, linksId, questions, links }: ArticleExtrasProps) {
  const t = dictionaries[locale].blog;
  return (
    <>
      {questions.length > 0 && (
        <section className={`zw-container ${postStyles.articleFrame} ${styles.section}`} aria-labelledby={faqId}>
          <div className={styles.content}>
            <div className={styles.intro}>
              <h2 className={styles.title} id={faqId} tabIndex={-1}>
                {t.faqHeading}{" "}<span className={`${m.signature} ${styles.signature}`}>{t.faqHeadingAccent}</span>
              </h2>
              <div className={styles.artwork} aria-hidden="true"><FaqArtwork /></div>
            </div>
            <div className={faq.list}>
              {questions.map((item, index) => <QARow key={index} item={item} />)}
            </div>
          </div>
        </section>
      )}
      {links.length > 0 && (
        <section className={`zw-container ${postStyles.articleFrame} ${styles.linksSection}`} aria-labelledby={linksId}>
          <div className={styles.resources}>
            <div className={styles.resourcesCopy}>
              <h2 className={styles.resourcesTitle} id={linksId} tabIndex={-1}>{t.usefulLinksTitle}</h2>
              <ul className={styles.resourceList}>
                {links.map(link => (
                  <li key={link.key}>
                    <Link href={link.href} className={styles.resourceLink}>
                      <span className={styles.resourceLabel}>{link.label}</span>
                      <span className={styles.resourceArrow} aria-hidden="true"><Icon name="arrowR" size={18} /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.resourcesArtwork} aria-hidden="true"><UsefulLinksArtwork /></div>
          </div>
        </section>
      )}
    </>
  );
}
