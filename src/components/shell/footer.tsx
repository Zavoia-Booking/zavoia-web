"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { LanguageSwitcher } from "@/app/_components/language-switcher";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import type { Locale } from "@/i18n/locales";
import { useConsent } from "@/lib/consent/ConsentProvider";
import styles from "./footer.module.css";

/** Signature's ruled wordmark band and sitemap, adapted to marketplace navigation. */
export function Footer({ locale, explore }: { locale: Locale; explore: ReactNode }) {
  const { dict } = useTranslation();
  const t = dict.footer;
  const { openSettings } = useConsent();

  const fLink = (label: string, ...segments: string[]) => (
    <Link href={localeHref(locale, ...segments)} className={styles.link}>
      {label}
    </Link>
  );

  return (
    <footer data-marketplace-chrome className={styles.footer}>
      <div className={`zw-container ${styles.frame}`}>
        <div className={styles.markBand}>
          <Link href={localeHref(locale)} className={styles.mark}>
            <Image
              src="/brand/wordmark.svg"
              alt="Zavoia"
              width={766}
              height={232}
              className={styles.logo}
              unoptimized
            />
          </Link>
        </div>

        <div className={styles.sitemap}>
          <div className={styles.intro}>
            <p className={`txt-pretty ${styles.tagline}`}>{t.tagline}</p>
          </div>

          <div className={styles.navigation}>
            <FooterColumn title={t.explore}>
              {fLink(t.offers, "offers")}
              {explore}
            </FooterColumn>

            <FooterColumn title={t.zavoia}>
              {fLink(t.about, "about")}
              {fLink(t.journal, "blog")}
              {fLink(t.forBusiness, "for-business")}
              {fLink(t.pricing, "pricing")}
              {fLink(t.businessDashboard, "for-business")}
            </FooterColumn>

            <FooterColumn title={t.support}>
              {fLink(t.helpCentre, "help")}
              {fLink(t.myTickets, "support")}
              {fLink(t.cancellation, "terms", "booking-policy")}
            </FooterColumn>
          </div>
        </div>

        <div className={styles.base}>
          <span className={styles.rights}>{t.rights}</span>
          <div className={styles.legal}>
            {fLink(t.privacy, "terms", "privacy-policy")}
            {fLink(t.terms, "terms")}
            <button type="button" className={styles.link} onClick={openSettings}>
              {t.cookieSettings}
            </button>
          </div>
          <div className={styles.language}>
            <LanguageSwitcher currentLocale={locale} placement="above" />
          </div>
        </div>

        {/* All navigation remains rendered when JavaScript is unavailable. */}
        <noscript>
          <style>{`.${styles.columnContent}[data-state="closed"]{display:flex!important}.${styles.trigger}{display:none!important}.${styles.desktopTitle}{display:block!important}`}</style>
        </noscript>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Collapsible className={styles.column}>
      <h2 className={styles.heading}>
        <span className={styles.desktopTitle}>{title}</span>
        <CollapsibleTrigger className={styles.trigger}>
          <span>{title}</span>
          <span className={styles.plus} aria-hidden="true" />
        </CollapsibleTrigger>
      </h2>
      {/* CSS handles the responsive disclosure; SEO links stay in the HTML. */}
      <CollapsibleContent forceMount className={styles.columnContent}>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
