/* eslint-disable @next/next/no-img-element -- Pre-sized WebP captures use native srcSet, including inside the scaled SVG device scene. */
import type { CSSProperties } from "react";
import Link from "next/link";
import localFont from "next/font/local";
import clsx from "clsx";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import styles from "./editorial-bands.module.css";

const caveat = localFont({
  src: [
    { path: "../../fonts/caveat-latin-700.woff2", weight: "700", style: "normal" },
    { path: "../../fonts/caveat-latin-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-home-caveat",
  display: "swap",
  preload: false,
});

const assets = "/images/homepage";
const theme = clsx(styles.theme, caveat.variable);

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AppPhone({ variant, alt }: { variant: "schedule" | "map"; alt: string }) {
  const map = variant === "map";
  return (
    <div className={clsx(styles["device-mount"], styles[map ? "device-secondary" : "device-primary"])}>
      <div className={styles.phone}>
        {[-8, -6, -4, -2].map(depth => (
          <i key={depth} className={styles.edge} style={{ "--depth": `${depth}px` } as CSSProperties} aria-hidden="true" />
        ))}
        <div className={styles["phone-face"]}>
          <div className={styles.screen}>
            <img
              src={`${assets}/${map ? "native-map-en" : "aligned-schedule-en"}.webp`}
              srcSet={map ? `${assets}/native-map-en-540.webp 540w, ${assets}/native-map-en-810.webp 810w, ${assets}/native-map-en.webp 1080w` : undefined}
              sizes={map ? "(max-width: 374px) 220px, (max-width: 900px) 248px, (max-width: 1060px) 212px, (max-width: 1250px) 232px, 246px" : undefined}
              width={1080}
              height={2424}
              alt={alt}
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

export function AppBand({ locale }: { locale: Locale }) {
  const s = dictionaries[locale].homeSections.app;
  return (
    <div className={clsx(theme, styles["app-shell"])}>
      <section className={styles["app-band"]} id="zavoia-app" aria-labelledby="app-heading">
        <div className={styles.copy}>
          <h2 className={styles["app-title"]} id="app-heading">
            <span className={styles["headline-line"]}>{s.titleFirst}</span>
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
        <div className={styles["device-stage"]}>
          <AppPhone variant="map" alt={s.mapAlt} />
          <AppPhone variant="schedule" alt={s.scheduleAlt} />
        </div>
      </section>
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
  return (
    <section className={clsx(theme, styles["studio-option"])} id="web-studio" aria-labelledby="web-studio-heading">
      <div className={styles["studio-option-inner"]}>
        <div className={clsx(styles["studio-visual"], styles["sa-scene"])}>
          <div className={styles["sa-hardware-stage"]}>
            <div className={styles["sa-contact"]} aria-hidden="true" />
            <svg viewBox="0 0 1536 1240" xmlns="http://www.w3.org/2000/svg" focusable="false">
              <foreignObject width="1536" height="1240">
                <div className={styles["sa-browser"]} style={{ transform: "matrix(0.81887622,0.04291548,-0.04291548,0.81887622,310,30)" }}>
                  <div className={styles["sa-browser-bar"]} aria-hidden="true"><span className={styles["sa-browser-dots"]}><i /><i /><i /></span>zavoia.com/lumi-beauty</div>
                  <img src={`${assets}/beauty-desktop.webp`} srcSet={`${assets}/beauty-desktop-560.webp 560w, ${assets}/beauty-desktop-1120.webp 1120w, ${assets}/beauty-desktop.webp 1440w`} sizes="(max-width: 600px) 80vw, (max-width: 900px) 600px, 700px" width={1440} height={960} alt={s.desktopAlt} loading="lazy" decoding="async" />
                </div>
              </foreignObject>
              <foreignObject width="1536" height="1240">
                <div className={styles["sa-phone"]} role="img" aria-label={s.phoneAlt} style={{ transform: "matrix(0.98768834,-0.15643447,0.15643447,0.98768834,55,300)" }}>
                  <div className={styles["sa-glass"]} aria-hidden="true">
                    <div className={styles["sa-status"]}>
                      <span>9:41</span>
                      <span className={styles["sa-status-symbols"]}>
                        <svg viewBox="0 0 17 12"><path d="M1 10V8m4 2V6m4 4V3m4 7V1" stroke="currentColor" strokeWidth="2.5" /></svg>
                        <svg viewBox="0 0 19 12"><rect x="1" y="2" width="14" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.1" /><rect x="3" y="4" width="10" height="4" rx=".7" fill="currentColor" /><path d="M17 5v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                      </span>
                    </div>
                    <span className={styles["dynamic-island"]} />
                    <img className={styles["sa-screen"]} src={`${assets}/pet-phone.webp`} srcSet={`${assets}/pet-phone-390.webp 390w, ${assets}/pet-phone.webp 780w`} sizes="(max-width: 600px) 150px, 280px" width={780} height={1520} alt="" loading="lazy" decoding="async" />
                    <span className={styles["sa-home"]} />
                  </div>
                </div>
              </foreignObject>
            </svg>
          </div>
        </div>
        <div className={styles["studio-copy"]}>
          <h2 className={styles["studio-title"]} id="web-studio-heading">{s.titleFirst}<br />{s.titleSecond}<em className={styles.signature}>{s.titleAccent}</em></h2>
          <p className={styles["studio-intro"]}>{s.sub}</p>
          <Link className={styles["studio-cta"]} href={localeHref(locale, "web-studio")}>{s.cta}<Arrow /></Link>
        </div>
      </div>
    </section>
  );
}

export function BizStrip({ locale }: { locale: Locale }) {
  const s = dictionaries[locale].homeSections.bizStrip;
  return (
    <section className={clsx(theme, styles["homepage-close"], styles["closing-business"])} id="homepage-close" aria-labelledby="closing-title">
      <h2 className={styles["closing-title"]} id="closing-title">{s.titleFirst}<br />{s.titleSecond}{" "}<em className={styles.signature}>{s.titleAccent}</em></h2>
      <div className={styles["closing-details"]}>
        <p className={styles["closing-intro"]}>{s.sub}{" "}<strong>{s.commission}</strong></p>
        <div className={styles["closing-actions"]}>
          <Link className={styles["closing-primary"]} href={localeHref(locale, "for-business")}>{s.cta}<Arrow /></Link>
          <Link className={styles["closing-pricing"]} href={localeHref(locale, "pricing")}>{s.pricing}</Link>
        </div>
      </div>
    </section>
  );
}
