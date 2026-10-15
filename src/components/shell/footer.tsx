"use client";

import { useId, type ReactNode } from "react";
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
import { BUSINESS_APP_URL } from "@/lib/env";
import motion from "@/components/ui/disclosure-motion.module.css";
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
              src="/brand/zavoia_logo_full_transparent.png"
              alt="Zavoia"
              width={957}
              height={300}
              sizes="(max-width: 600px) calc(100vw - 32px), (max-width: 920px) calc(100vw - 40px), (max-width: 1456px) calc(100vw - 56px), 1400px"
              className={styles.logo}
            />
          </Link>
        </div>

        <div className={styles.sitemap}>
          <div className={styles.intro}>
            <p className={`txt-pretty ${styles.tagline}`}>{t.tagline}</p>
          </div>

          <nav className={styles.navigation} aria-label={t.navigationLabel}>
            <FooterColumn title={t.explore}>
              <li>{fLink(t.findBusiness, "search")}</li>
              <li>{fLink(t.journal, "blog")}</li>
              {explore}
              <li>
                <Link
                  href={localeHref(locale, "industries")}
                  prefetch={false}
                  className={styles.link}
                >
                  {t.browseIndustries}
                </Link>
              </li>
            </FooterColumn>

            <FooterColumn title={t.forBusiness}>
              <li>{fLink(t.businessOverview, "for-business")}</li>
              <li>{fLink(t.webStudio, "web-studio")}</li>
              <li>{fLink(t.pricing, "pricing")}</li>
              <li>
                <a href={`${BUSINESS_APP_URL}/login`} className={styles.link}>
                  {t.businessSignIn}
                </a>
              </li>
            </FooterColumn>

            <FooterColumn title={t.support}>
              <li>{fLink(t.helpCentre, "help")}</li>
              <li>{fLink(t.myAppointments, "appointments")}</li>
              <li>{fLink(t.cancellation, "terms", "booking-policy")}</li>
            </FooterColumn>
          </nav>
        </div>

        <div className={styles.base}>
          <span className={styles.rights}>{t.rights}</span>
          <div className={styles.legal}>
            {fLink(t.privacy, "terms", "privacy-policy")}
            {fLink(t.terms, "terms")}
            <button type="button" className={styles.link} onClick={openSettings}>
              {t.cookieSettings}
            </button>
            <a href="https://anpc.ro/" className={styles.link}>
              {t.consumerProtection}
            </a>
            {/* Official artwork: https://anpc.ro/download/sal/SAL-PICTOGRAMA.png */}
            <a href="https://reclamatiisal.anpc.ro/" className={styles.salLink}>
              <Image
                src="/legal/anpc-sal.png"
                alt={t.alternativeDisputeResolution}
                width={250}
                height={50}
                className={styles.salBadge}
                unoptimized
              />
            </a>
          </div>
          <div className={styles.language}>
            <LanguageSwitcher currentLocale={locale} placement="above" />
          </div>
        </div>

        {/* All navigation remains rendered when JavaScript is unavailable. */}
        <noscript>
          <style>{`.${styles.columnMotion}{display:grid!important;grid-template-rows:1fr!important;visibility:visible!important;pointer-events:auto!important}.${styles.columnMotion}>div{opacity:1!important}.${styles.trigger}{display:none!important}.${styles.desktopTitle}{display:block!important}`}</style>
        </noscript>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId();

  return (
    <Collapsible className={`${styles.column} ${motion.root}`}>
      <h2 id={headingId} className={styles.heading}>
        <span className={styles.desktopTitle}>{title}</span>
        <CollapsibleTrigger className={styles.trigger}>
          <span>{title}</span>
          <span className={styles.plus} aria-hidden="true" />
        </CollapsibleTrigger>
      </h2>
      {/* CSS handles the responsive disclosure; SEO links stay in the HTML. */}
      <CollapsibleContent forceMount className={styles.columnContent}>
        {/* Radix measures its root without transitions; animate the inner grid. */}
        <div className={styles.columnMotion}>
          <div className={motion.body}>
            <ul className={styles.linkList} aria-labelledby={headingId} role="list">
              {children}
            </ul>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
