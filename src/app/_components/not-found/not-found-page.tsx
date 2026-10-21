import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { TRIAL_DAYS } from "@/lib/marketing/pricing";
import { localeHref } from "@/i18n/routes";
import type { Locale } from "@/i18n/locales";
import { BUSINESS_APP_URL } from "@/lib/env";
import { SITE_URL } from "@/lib/site";
import { caveat } from "./font";
import { LanguageSwitcher } from "@/app/_components/language-switcher";
import { NotFoundEnhancements } from "./not-found-enhancements";
import styles from "./not-found-page.module.css";

/** Shared, server-compatible presentation for missing public content.
 * A website lookup's 404 does not establish that its business slug is available.
 * All availability decisions remain in the caller; this page offers signup.
 */
export function NotFoundPage({ locale, pathname, dictionary }: {
  locale: Locale;
  pathname?: string;
  dictionary: Pick<Dictionary, "notFound" | "nav" | "language" | "localeNames">;
}) {
  const t = dictionary.notFound.page;
  const requestedAddress = pathname ? `${new URL(SITE_URL).host}${pathname}` : undefined;

  return (
    <div className={`${styles.surface} ${caveat.variable}`} data-locale={locale} data-arrival="true" id="zavoia-not-found">
      <a className={styles.skip} href="#not-found-content">{t.skip}</a>
      <div className={styles.page}>
        <header className={styles.header}>
          <Link className={styles.logo} href={localeHref(locale)} aria-label={dictionary.nav.homeAria}>
            <Image src="/brand/wordmark-cropped.png" alt="Zavoia" width={141} height={45} />
          </Link>
          <nav className={styles.headerNav} aria-label={t.navigation}>
            <LanguageSwitcher
              messages={{ language: dictionary.language, localeNames: dictionary.localeNames }}
              currentLocale={locale}
              pathname={pathname}
              label={t.language}
              placement="below"
              compact="responsive"
              alternates="same-path"
            />
            <a className={styles.signIn} href={`${BUSINESS_APP_URL}/login`} aria-label={t.signIn}>
              <span className={styles.signInFull}>{t.signIn}</span>
              <span className={styles.signInCompact}>{t.signInShort}</span>
              <span className={styles.signInArrow}><Icon name="arrowUR" size={13} /></span>
            </a>
          </nav>
        </header>
        <main className={styles.main} id="not-found-content" tabIndex={-1}>
          <section className={styles.business} aria-labelledby="not-found-business-title">
            <div className={styles.businessContent}>
              <div className={styles.businessInvitation}>
                <h1 className={styles.businessTitle} id="not-found-business-title" aria-label={t.businessTitle} data-headline>
                  <span className={styles.headlineLine} aria-hidden="true"><span className={styles.headlineInk}>{t.businessTitleLead}</span></span>
                  <span className={styles.headlineLine} aria-hidden="true"><span className={styles.headlineInk}>{t.businessTitlePre}<span className={styles.signature}>{t.businessTitleWord}</span>{t.businessTitlePost}</span></span>
                </h1>
                <div className={styles.businessOffer}>
                  <a className={`${styles.button} ${styles.accent}`} href={`${BUSINESS_APP_URL}/register`} aria-describedby="not-found-trial-detail" data-press>
                    <span>{t.createAccount}</span><Icon name="arrowR" size={17} />
                  </a>
                </div>
              </div>
              <div className={styles.businessLower}>
                <div className={styles.businessDescription}>
                  <p className={styles.businessLead}><span>{t.offerFirst}</span><span>{t.offerSecond}</span></p>
                  <p className={styles.businessDetail}>{t.businessDescription}</p>
                  <p className={styles.trialDetail} id="not-found-trial-detail"><span>{format(t.trialDetail, { days: String(TRIAL_DAYS) })}</span><span>{t.websiteDetail}</span></p>
                </div>
                <Link className={`${styles.inlineLink} ${styles.howLink}`} href={localeHref(locale, "for-business")}>
                  <span className={styles.label}>{t.how}</span><Icon name="arrowR" size={14} />
                </Link>
              </div>
            </div>
          </section>
          <section className={styles.recovery} aria-labelledby="not-found-recovery-title">
            <div className={styles.recoveryMessage}>
              <div className={styles.errorArt} aria-hidden="true"><span className={styles.errorCode}>404</span><span className={styles.errorScript}>{t.lost}</span></div>
              <div className={styles.recoveryCopy}>
                <h2 className={styles.recoveryTitle} id="not-found-recovery-title"><span className={styles.srOnly}>404. </span>{t.title}</h2>
                <p className={styles.description}>{t.description}</p>
                {requestedAddress && <div className={styles.recoveryMeta}><code className={styles.requestedAddress}>{requestedAddress}</code></div>}
              </div>
            </div>
            <Link className={`${styles.button} ${styles.secondary} ${styles.recoveryLink}`} href={localeHref(locale, "search")} data-press>
              <span>{t.explore}</span><Icon name="arrowR" size={17} />
            </Link>
          </section>
        </main>
        <footer className={styles.footer}>
          <span>© {new Date().getUTCFullYear()} Zavoia</span>
        </footer>
      </div>
      <NotFoundEnhancements />
    </div>
  );
}
