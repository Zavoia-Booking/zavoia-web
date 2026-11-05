import Image from "next/image";
import clsx from "clsx";
import { dictionaries } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import { getMarketingMockup } from "@/lib/marketing/mockups";
import styles from "./calendar-artwork.module.css";

type BusinessMockupProps = { locale: Locale; className?: string };

/** Genuine calendar screens remain separate so neither has to obscure the other. */
export function CalendarDesktopArtwork({ locale, className }: BusinessMockupProps) {
  const t = dictionaries[locale].forBusiness.run.artwork;

  return (
    <figure className={clsx(styles.desktopMount, className)} data-calendar-desktop="">
      <div className={styles.desktop}>
        <span className={styles.desktopEdge} aria-hidden="true" />
        <div className={styles.desktopFace}>
          <div className={styles.desktopBar} aria-hidden="true">
            <span className={styles.desktopDots}><i /><i /><i /></span>
            <span>app.zavoia.com/calendar</span>
          </div>
          <div className={styles.desktopScreen}>
            <Image
              {...getMarketingMockup("businessCalendarDesktop", locale)}
              data-product-scene="businessCalendarDesktop"
              data-product-locale={locale}
              alt={t.desktopAlt}
              sizes="(max-width: 600px) calc(100vw - 32px), (max-width: 920px) calc(100vw - 40px), (max-width: 1096px) calc(100vw - 56px), (max-width: 1176px) 1040px, (max-width: 1428px) calc(100vw - 388px), 1040px"
            />
          </div>
        </div>
      </div>
    </figure>
  );
}

type BusinessAppScene = "businessAppAssignments" | "businessAppMarketplace";

type PhoneArtworkProps = BusinessMockupProps & {
  scene: "businessCalendarMobile" | BusinessAppScene;
  alt: string;
  sizes?: string;
};

function PhoneArtwork({ locale, className, scene, alt, sizes = "(max-width: 360px) 268px, 300px" }: PhoneArtworkProps) {
  const image = getMarketingMockup(scene, locale);

  return (
    <figure
      className={clsx(styles.phoneMount, className)}
      data-calendar-phone={scene === "businessCalendarMobile" ? "" : undefined}
      data-business-app-phone={scene !== "businessCalendarMobile" ? "" : undefined}
    >
      <div className={styles.phone}>
        <span className={styles.phoneEdge} aria-hidden="true" />
        <div className={styles.phoneFace}>
          <div className={styles.phoneScreen} style={{ aspectRatio: `${image.width} / ${image.height}` }}>
            <Image
              {...image}
              data-product-scene={scene}
              data-product-locale={locale}
              alt={alt}
              sizes={sizes}
            />
          </div>
        </div>
      </div>
    </figure>
  );
}

export function CalendarPhoneArtwork({ locale, className }: BusinessMockupProps) {
  return (
    <PhoneArtwork
      locale={locale}
      className={className}
      scene="businessCalendarMobile"
      alt={dictionaries[locale].forBusiness.run.artwork.mobileAlt}
    />
  );
}

export function BusinessAppPhoneArtwork({ locale, className, scene, sizes }: BusinessMockupProps & { scene: BusinessAppScene; sizes?: string }) {
  return (
    <PhoneArtwork
      locale={locale}
      className={className}
      scene={scene}
      alt={dictionaries[locale].forBusiness.app[scene === "businessAppAssignments" ? "assignmentsAlt" : "marketplaceAlt"]}
      sizes={sizes}
    />
  );
}
