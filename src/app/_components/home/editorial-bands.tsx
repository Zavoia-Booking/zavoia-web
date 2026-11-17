import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { getMarketingMockup } from "@/lib/marketing/mockups";
import { MarketingExampleNote } from "../marketing-example-note";
import styles from "./editorial-bands.module.css";
import studioActions from "./studio-actions.module.css";

const assets = "/images/homepage";
const theme = styles.theme;

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AppPhone({ variant, alt, locale }: { variant: "schedule" | "map"; alt: string; locale: Locale }) {
  const map = variant === "map";
  const image = getMarketingMockup(map ? "consumerMap" : "consumerSchedule", locale);
  const sizes = map
    ? "(max-width: 374px) 220px, (max-width: 900px) 248px, (max-width: 1060px) 212px, (max-width: 1250px) 232px, 246px"
    : "(max-width: 374px) 198px, (max-width: 900px) 212px, (max-width: 1060px) 248px, (max-width: 1250px) 268px, 284px";
  return (
    <div className={clsx(styles["device-mount"], styles[map ? "device-secondary" : "device-primary"])}>
      <div className={styles.phone}>
        <i className={styles.edge} aria-hidden="true" />
        <div className={styles["phone-face"]}>
          <div className={styles.screen}>
            <Image
              {...image}
              data-product-scene={map ? "consumerMap" : "consumerSchedule"}
              data-product-locale={locale}
              alt={alt}
              title={alt}
              sizes={sizes}
              loading="lazy"
              decoding="async"
            />
            <span className={styles["dynamic-island"]} aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppBand({ locale, children }: { locale: Locale; children?: ReactNode }) {
  const s = dictionaries[locale].homeSections.app;
  return (
    <div className={clsx(theme, styles["app-shell"])}>
      <section className={styles["app-band"]} id="zavoia-app" aria-labelledby="app-heading">
        <div className={styles.copy}>
          <h2 className={styles["app-title"]} id="app-heading">
            <span className={styles["headline-line"]}>{s.titleFirst}</span>{" "}
            <span className={styles["headline-line"]}>{s.titleSecond}<em className={styles.signature}>{s.titleAccent}</em></span>
          </h2>
          <p className={styles.intro}>{s.sub}</p>
          {/* No verified store destinations exist yet. Preserve the original
              noninteractive platform labels rather than ship preview actions. */}
          <div className={styles["store-actions"]} role="group" aria-label={s.downloadsLabel}>
            {[
              { icon: "apple", platform: s.ios, name: s.appStore },
              { icon: "google-play", platform: s.android, name: s.googlePlay },
            ].map(store => (
              <span className={styles["store-badge"]} key={store.icon}>
                <span className={styles["store-symbol"]} style={{ "--store-icon": `url('${assets}/${store.icon}.svg')` } as CSSProperties} aria-hidden="true" />
                <span className={styles["store-label"]}><small>{store.platform}</small><strong>{store.name}</strong></span>
              </span>
            ))}
          </div>
        </div>
        <div className={styles["app-device-group"]}>
          <div className={styles["device-stage"]}>
            <AppPhone variant="map" alt={s.mapAlt} locale={locale} />
            <AppPhone variant="schedule" alt={s.scheduleAlt} locale={locale} />
          </div>
          <MarketingExampleNote locale={locale} map />
        </div>
      </section>
      {children}
    </div>
  );
}

const benefitIcons = [
  <><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M16 3v4M8 3v4M3 11h18m-13 5 2 2 4-4" /></>,
  <><rect x="2.5" y="5" width="19" height="14" rx="3" /><path d="M2.5 10h19M7 15h3" /></>,
];

export function TrustBand({ locale }: { locale: Locale }) {
  const s = dictionaries[locale].homeSections.trust;
  return (
    <section className={clsx(theme, styles["closing-trust"])} id="booking-benefits" aria-label={s.title}>
      <ul className={styles["closing-benefits"]}>
        {s.items.map((item, index) => (
          <li key={item.title}>
            <svg className={styles["closing-benefit-icon"]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{benefitIcons[index]}</svg>
            <div><strong>{item.title}</strong><p>{item.sub}</p></div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WebStudioBand({ locale }: { locale: Locale }) {
  const s = dictionaries[locale].homeSections.webStudio;
  const desktopImage = getMarketingMockup("studioBeauty", locale);
  const phoneImage = getMarketingMockup("studioPet", locale);
  return (
    <section className={clsx(theme, styles["studio-option"])} id="web-studio" aria-labelledby="web-studio-heading">
      <div className={styles["studio-option-inner"]}>
        <div className={styles["studio-copy"]}>
          <h2 className={styles["studio-title"]} id="web-studio-heading">{s.titleFirst}{" "}<br />{s.titleSecond}<em className={styles.signature}>{s.titleAccent}</em></h2>
          <p className={styles["studio-intro"]}>{s.sub}</p>
        </div>
        <div className={clsx(styles["studio-visual"], styles["sa-scene"])}>
          <div className={styles["sa-hardware-stage"]}>
            <div className={styles["sa-contact"]} aria-hidden="true" />
            <div className={styles["sa-canvas"]}>
              <div className={styles["sa-browser"]}>
                <div className={styles["sa-browser-bar"]} aria-hidden="true"><span className={styles["sa-browser-dots"]}><i /><i /><i /></span>zavoia.com/lumi-beauty</div>
                <Image {...desktopImage} alt={s.desktopAlt} title={s.desktopAlt} data-product-scene="studioBeauty" data-product-locale={locale} sizes="(max-width: 600px) 80vw, (max-width: 900px) 600px, 700px" loading="lazy" decoding="async" />
              </div>
              <div className={styles["sa-phone"]} role="img" aria-label={s.phoneAlt}>
                <div className={styles["sa-glass"]} aria-hidden="true">
                  <div className={styles["sa-status"]}>
                    <span>9:41</span>
                    <span className={styles["sa-status-symbols"]}>
                      <svg viewBox="0 0 17 12"><path d="M1 10V8m4 2V6m4 4V3m4 7V1" stroke="currentColor" strokeWidth="2.5" /></svg>
                      <svg viewBox="0 0 19 12"><rect x="1" y="2" width="14" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.1" /><rect x="3" y="4" width="10" height="4" rx=".7" fill="currentColor" /><path d="M17 5v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                    </span>
                  </div>
                  <span className={styles["dynamic-island"]} />
                  <div className={styles["sa-screen-viewport"]}>
                    <Image {...phoneImage} className={styles["sa-screen"]} alt="" title={s.phoneAlt} data-product-scene="studioPet" data-product-locale={locale} sizes="(max-width: 600px) 150px, 280px" loading="lazy" decoding="async" />
                  </div>
                  <span className={styles["sa-home"]} />
                </div>
              </div>
            </div>
          </div>
          <MarketingExampleNote locale={locale} websites className={styles["studio-example-note"]} />
        </div>
        <div className={clsx(studioActions.actions, styles["studio-band-actions"])}>
          <Link className={styles["studio-cta"]} href={localeHref(locale, "web-studio")} title={s.cta}>
            <span className={styles["studio-full-label"]}>{s.cta}</span>
            <span className={styles["studio-short-label"]}>{dictionaries[locale].nav.webStudio}</span>
            <Arrow />
          </Link>
          <Link className={studioActions.secondary} href={{ pathname: localeHref(locale, "web-studio", "demo"), query: { returnTo: `${localeHref(locale)}#web-studio` } }}>
            {dictionaries[locale].webStudio.hero.demoCta}<Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function BizStrip({ locale }: { locale: Locale }) {
  const s = dictionaries[locale].homeSections.bizStrip;
  return (
    <section className={clsx(theme, styles["homepage-close"], styles["closing-business"])} id="homepage-close" aria-labelledby="closing-title">
      <h2 className={styles["closing-title"]} id="closing-title">{s.titleFirst}{" "}<br />{s.titleSecond}{" "}<em className={styles.signature}>{s.titleAccent}</em></h2>
      <div className={styles["closing-details"]}>
        <p className={styles["closing-intro"]}>{s.sub}{" "}<strong>{s.commission}</strong></p>
        <div className={styles["closing-actions"]}>
          <Link className={styles["closing-primary"]} href={localeHref(locale, "for-business")} title={s.cta}>{s.cta}<Arrow /></Link>
          <Link className={styles["closing-pricing"]} href={localeHref(locale, "pricing")} title={s.pricing}>{s.pricing}</Link>
        </div>
      </div>
    </section>
  );
}
