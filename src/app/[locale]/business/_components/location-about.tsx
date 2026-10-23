"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { Avatar, Icon } from "@/components/ui";
import { format } from "@/i18n/format";
import { localeHref } from "@/i18n/routes";
import { useTranslation } from "@/i18n/useTranslation";
import type { Locale } from "@/i18n/locales";
import type { ListingDetail } from "@/lib/api/marketplace/types";
import { taxonomyLabel } from "@/lib/marketplace/card-mappers";
import styles from "./location-about.module.css";
import { ReportIssue } from "@/app/[locale]/help/_components/report-issue";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

function subscribeMinute(onChange: () => void) {
  const interval = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(interval);
}

function venueDay(timezone: string): string | null {
  try {
    return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: timezone })
      .format(new Date())
      .toLowerCase();
  } catch {
    return null;
  }
}

function webHref(value: string | null): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function hasTime(value: string | undefined): value is string {
  return typeof value === "string" && /^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(value);
}

export function LocationAbout({
  listing,
  locale,
  phone,
  directionsHref,
}: {
  listing: ListingDetail;
  locale: Locale;
  phone: string | null;
  directionsHref: string | null;
}) {
  const { dict } = useTranslation();
  const t = dict.locationPage;
  const location = listing.location;
  const timezone = location.timezone || listing.timezone;
  const today = useSyncExternalStore(subscribeMinute, () => venueDay(timezone), () => null);
  const dayNames = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" });
    // This reference week starts on Monday; only the localized names are used.
    return DAYS.map((_, index) => formatter.format(new Date(Date.UTC(2024, 0, 8 + index, 12))));
  }, [locale]);
  const locationDescription = location.description?.trim();
  const brandDescription = listing.description?.trim();
  const email = location.email || listing.email;
  const address = location.address?.trim() || location.city?.trim();
  const hours = location.workingHours;
  const hasHours = hours != null && DAYS.some((day) => hours[day] != null);
  const socials = [
    { label: t.visitWebsite, href: webHref(listing.websiteUrl) },
    { label: "Instagram", href: webHref(listing.instagramUrl) },
    { label: "Facebook", href: webHref(listing.facebookUrl) },
    { label: "TikTok", href: webHref(listing.tiktokUrl) },
    { label: "Pinterest", href: webHref(listing.pinterestUrl) },
  ].filter((social): social is { label: string; href: string } => social.href != null);

  return (
    <div className={styles.root}>
      {locationDescription && (
        <section>
          <h2 className={styles.title}>{t.aboutLocation}</h2>
          <p className={styles.description}>{locationDescription}</p>
        </section>
      )}

      <div className={styles.details}>
        <section>
          <h2 className={styles.title}>{dict.business.address}</h2>
          {address && <address className={styles.address}>{address}</address>}
          {location.address && location.city && !location.address.toLocaleLowerCase(locale).includes(location.city.toLocaleLowerCase(locale)) && (
            <p className={styles.city}>{location.city}</p>
          )}
          {(phone || email) && (
            <div className={styles.contacts}>
              {phone && (
                <a href={`tel:${phone}`} className={styles.contactLink} aria-label={`${dict.business.call}: ${phone}`}>
                  <Icon name="phone" size={16} />
                  <span>{phone}</span>
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className={styles.contactLink} aria-label={`${t.email}: ${email}`}>
                  <Icon name="email" size={16} />
                  <span>{email}</span>
                </a>
              )}
            </div>
          )}
          {directionsHref && (
            <a href={directionsHref} target="_blank" rel="noreferrer" className={`tap zw-btn ${styles.directions}`}>
              <Icon name="pin" size={15} />
              {dict.business.directions}
              <Icon name="arrowUR" size={13} />
            </a>
          )}
        </section>

        <section>
          <h2 className={styles.title}>{dict.business.hours}</h2>
          {location.open247 ? (
            <p className={styles.alwaysOpen}>
              <span className={styles.openDot} aria-hidden="true" />
              {dict.common.open247}
            </p>
          ) : !hasHours ? (
            <p className={styles.note}>{t.hoursUnknown}</p>
          ) : (
            <dl className={styles.hours}>
              {DAYS.map((key, index) => {
                const day = hours?.[key];
                const timeLabel = day?.isOpen === false
                  ? dict.business.closed
                  : day?.isOpen && hasTime(day.open) && hasTime(day.close)
                    ? `${day.open} – ${day.close}`
                    : t.hoursNotProvided;
                const isToday = key === today;
                return (
                  <div key={key} className={styles.hoursRow} data-today={isToday || undefined}>
                    <dt>
                      {dayNames[index]}
                      {isToday && <span className={styles.today}>{t.today}</span>}
                    </dt>
                    <dd>{timeLabel}</dd>
                  </div>
                );
              })}
            </dl>
          )}
        </section>
      </div>

      <section className={styles.brand}>
        <h2 className={styles.title}>{format(t.aboutBrand, { name: listing.name })}</h2>
        {brandDescription && brandDescription !== locationDescription && (
          <p className={styles.description}>{brandDescription}</p>
        )}
        <Link
          href={localeHref(locale, "brand", listing.businessSlug ?? String(listing.businessId))}
          className={`tap ${styles.brandLink}`}
        >
          <Avatar src={listing.logo ?? undefined} name={listing.name} size={46} ring />
          <span className={styles.brandIdentity}>
            <span className={styles.brandName}>{listing.name}</span>
            {listing.industry && <span className={styles.industry}>{taxonomyLabel(listing.industry, locale)}</span>}
          </span>
          <Icon name="arrowR" size={17} />
        </Link>
        {socials.length > 0 && (
          <nav className={styles.socials} aria-label={t.socialLinks}>
            {socials.map((social) => (
              <a key={social.label} href={social.href} target="_blank" rel="noreferrer">
                {social.label}<Icon name="arrowUR" size={12} />
              </a>
            ))}
          </nav>
        )}
      </section>

      <ReportIssue t={dict.help.report} locale={locale} triggerLabel={t.reportLocation} className={styles.report} context={{ type: "listing", label: `${listing.name} · ${location.name}`, businessId: listing.businessId, listingId: listing.listingId, locationId: listing.locationId }} />
    </div>
  );
}
