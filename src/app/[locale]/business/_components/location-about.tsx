"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Avatar, Icon, Img, Rating, Skeleton, type IconName } from "@/components/ui";
import { tagIcon } from "@/features/marketplace/utils/tagIcons";
import { format, formatCount } from "@/i18n/format";
import { localeHref } from "@/i18n/routes";
import { useTranslation } from "@/i18n/useTranslation";
import type { Locale } from "@/i18n/locales";
import type { BookingPolicy, ListingDetail, VenueTagDictionaries } from "@/lib/api/marketplace/types";
import { taxonomyLabel } from "@/lib/marketplace/card-mappers";
import { currentOpening, nextOpening, openStatus, parseWorkingHoursDay, venueClock, WEEKDAYS } from "@/lib/marketplace/working-hours";
import { useBrowserTimezone } from "@/lib/marketplace/use-venue-clock";
import type { LocationBrandSummary } from "@/lib/marketplace/location-brand.server";
import type { IndustryVisual } from "@/lib/marketplace/industry-visuals";
import styles from "./location-about.module.css";
import { ReportIssue } from "@/app/[locale]/help/_components/report-issue";

// The search filters' groups, in their order and words, so a venue reads the way it was found.
const VENUE_TAG_GROUPS = [
  { key: "amenities", section: "amenities" },
  { key: "paymentMethods", section: "payment" },
  { key: "languages", section: "languages" },
] as const;

function webHref(value: string | null): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export function LocationAbout({
  listing,
  locale,
  phone,
  now,
  canBook,
  venueTags,
  brand,
  discover,
}: {
  listing: ListingDetail;
  locale: Locale;
  phone: string | null;
  now: number | null;
  canBook: boolean;
  venueTags: VenueTagDictionaries | null;
  brand: LocationBrandSummary | null;
  /** The header's category page for this city, offered only when it lists other places. */
  discover: { href: string; industry: string; visual: IndustryVisual } | null;
}) {
  const { dict } = useTranslation();
  const t = dict.locationPage;
  const location = listing.location;
  // The API resolves location -> business -> UTC. An invalid supplied zone
  // remains unknown; the visitor's clock must never decide a venue's status.
  const timezone = location.timezone?.trim() || listing.timezone?.trim();
  const browserTimezone = useBrowserTimezone();
  const today = now === null ? null : venueClock(new Date(now), timezone ?? "")?.day;
  const dayNames = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" });
    // This reference week starts on Monday; only the localized names are used.
    return WEEKDAYS.map((_, index) => formatter.format(new Date(Date.UTC(2024, 0, 8 + index, 12))));
  }, [locale]);
  const locationDescription = location.description?.trim();
  const brandDescription = listing.description?.trim();
  const email = location.email || listing.email;
  const hasContact = Boolean(phone || email);
  const hours = location.workingHours;
  const hasHours = hours != null && WEEKDAYS.some((day) => hours[day] != null);
  const otherLocations = Array.isArray(listing.otherLocations) ? listing.otherLocations : [];
  const socialLinks: { label: string; href: string | null; icon: IconName }[] = [
    { label: t.visitWebsite, href: webHref(listing.websiteUrl), icon: "globe" },
    { label: "Instagram", href: webHref(listing.instagramUrl), icon: "ig" },
    { label: "Facebook", href: webHref(listing.facebookUrl), icon: "fb" },
    { label: "TikTok", href: webHref(listing.tiktokUrl), icon: "tt" },
    { label: "Pinterest", href: webHref(listing.pinterestUrl), icon: "pint" },
  ];
  const socials = socialLinks.filter((social): social is { label: string; href: string; icon: IconName } => social.href != null);
  // The listing decides which places exist; the brand page only adds their details.
  const siblings = otherLocations.map((other) => ({ ...other, detail: brand?.locations[other.id] ?? null }));
  const brandRating = brand?.averageRating ?? null;
  const featureGroups = VENUE_TAG_GROUPS
    .map((group) => ({
      key: group.key,
      label: dict.search.filters.sections[group.section],
      tags: (venueTags?.[group.key] ?? []).map((tag) => ({ id: tag.id, slug: tag.slug, label: dict.venueTags[group.key][tag.slug] ?? tag.name })),
    }))
    .filter((group) => group.tags.length > 0);
  // Amenities run down the first column; payment and languages share the second.
  const amenityGroups = featureGroups.filter((group) => group.key === "amenities");
  const otherGroups = featureGroups.filter((group) => group.key !== "amenities");
  const featureColumns = (amenityGroups.length > 0 ? [amenityGroups, otherGroups] : otherGroups.map((group) => [group]))
    .filter((column) => column.length > 0);

  // The same open/closed reading as the page header, plus when a closed venue opens next.
  const status = useMemo(() => {
    if (location.open247) return { tone: "open", label: dict.common.open247, note: null, continuation: null };
    if (now === null) return null;
    const venue = { open247: location.open247, workingHours: location.workingHours, timezone: timezone ?? "" };
    const instant = new Date(now);
    const current = openStatus(venue, instant);
    if (current.status === "open") {
      const opening = currentOpening(venue, instant);
      return {
        tone: "open", label: dict.common.open,
        note: current.closesAt ? format(dict.common.closesAt, { time: current.closesAt }) : null,
        continuation: opening?.startedPreviousDay
          ? format(t.continuesFrom, { day: dayNames[WEEKDAYS.indexOf(opening.day)] })
          : null,
      };
    }
    if (current.status !== "closed") return null;
    const next = nextOpening(venue, instant);
    const note = !next ? null
      : next.inDays === 0 ? format(t.opensToday, { time: next.opensAt })
      : next.inDays === 1 ? format(t.opensTomorrow, { time: next.opensAt })
      : format(t.opensOn, { day: dayNames[WEEKDAYS.indexOf(next.day)], time: next.opensAt });
    return { tone: "closed", label: dict.common.closed, note, continuation: null };
  }, [location.open247, location.workingHours, timezone, now, dict.common, t, dayNames]);

  const timezoneLabel = useMemo(() => {
    if (!timezone || !browserTimezone || now === null) return null;
    try {
      const formatter = new Intl.DateTimeFormat(locale, { timeZone: timezone, timeZoneName: "longGeneric" });
      const visitorZone = new Intl.DateTimeFormat(locale, { timeZone: browserTimezone }).resolvedOptions().timeZone;
      if (formatter.resolvedOptions().timeZone === visitorZone) return null;
      return formatter.formatToParts(new Date(now)).find(part => part.type === "timeZoneName")?.value ?? null;
    } catch {
      return null;
    }
  }, [timezone, browserTimezone, locale, now]);

  return (
    <div className={styles.root}>
      {/* The report dialog is fixed to the viewport, so it stays outside the size container. */}
      <div className={styles.sheet}>
        <section className={styles.introduction}>
          <h2 className={styles.title}>{t.aboutLocation}</h2>
          {locationDescription && <p className={`txt-pretty ${styles.lead}`}>{locationDescription}</p>}
        </section>
        {/* The longer schedule leads, so the shorter contact column ends on the right. */}
        <div className={styles.visit}>
          <section className={styles.hoursSection}>
            <h2 className={styles.hoursHeading}>{t.openingHours}</h2>
            {(location.open247 || hasHours) && <div className={styles.hoursSummary} role="status" aria-busy={(now === null && !location.open247) || undefined}>
              {now === null && !location.open247 ? <div aria-hidden="true" className={styles.statusSkeleton}>
                <Skeleton w="min(260px, 80%)" h={24} />
              </div> : status ? <>
                <p className={styles.status} data-tone={status.tone}>
                  <span className={styles.statusDot} aria-hidden="true" />
                  <span className={styles.statusLabel}>{status.label}</span>
                  {status.note && <><span className={styles.statusSeparator} aria-hidden="true">·</span><span className={styles.statusNote}>{status.note}</span></>}
                </p>
                {status.continuation && <p className={styles.statusDetail}>{status.continuation}</p>}
              </> : <p className={styles.statusDetail}>{t.hoursStatusUnknown}</p>}
            </div>}
            {location.open247 ? null : !hasHours ? (
              <p className={styles.note}>{t.hoursUnknown}</p>
            ) : (
              <dl className={styles.week}>
                {WEEKDAYS.map((key, index) => {
                  const day = parseWorkingHoursDay(hours?.[key]);
                  const isToday = key === today;
                  return (
                    <div key={key} className={styles.day} aria-current={isToday ? "date" : undefined}>
                      <dt>{dayNames[index]}</dt>
                      <dd className={day.kind === "open" ? styles.times : styles.dayNote}>
                        {day.kind === "open" ? <>
                          <span>{day.open} - {day.close}</span>
                          {day.overnight && <span className={styles.nextDay}>{t.nextDay}</span>}
                        </> : day.kind === "closed" ? dict.business.closed : t.hoursNotProvided}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            )}
            {(hasHours || location.open247) && timezoneLabel && <p className={styles.timezone}>{format(t.timesInTimezone, { timezone: timezoneLabel })}</p>}
          </section>

          {hasContact && (
            <section className={styles.contactSection}>
              <h2 className={styles.contactHeading}>{t.contact}</h2>
              <ul className={styles.contacts}>
                {phone && (
                  <li>
                    <a href={`tel:${phone}`} className={styles.contact} aria-label={`${dict.business.call}: ${phone}`}>
                      <Icon name="phone" size={19} />
                      <span className={styles.contactValue}>{phone}</span>
                      <span className={styles.contactAction}>{dict.business.call}</span>
                    </a>
                  </li>
                )}
                {email && (
                  <li>
                    <a href={`mailto:${email}`} className={styles.contact} aria-label={`${t.email}: ${email}`}>
                      <Icon name="email" size={19} />
                      <span className={styles.contactValue}>{email}</span>
                      <span className={styles.contactAction}>{t.email}</span>
                    </a>
                  </li>
                )}
              </ul>
            </section>
          )}
        </div>

        {featureColumns.length > 0 && (
          <section className={styles.features}>
            <h2 className={styles.label}>{dict.search.filters.features}</h2>
            <div className={styles.featureColumns}>
              {featureColumns.map((column) => (
                <div key={column[0].key} className={styles.featureColumn}>
                  {column.map((group) => (
                    <div key={group.key}>
                      <h3 className={styles.groupTitle}>{group.label}</h3>
                      {group.key === "languages" ? (
                        <p className={styles.featureText}>{group.tags.map((tag) => tag.label).join(", ")}</p>
                      ) : (
                        <ul className={styles.featureList}>
                          {group.tags.map((tag) => {
                            const Glyph = tagIcon(tag.slug) ?? Check;
                            return (
                              <li key={tag.id}>
                                <Glyph size={18} strokeWidth={1.8} aria-hidden="true" />
                                <span>{tag.label}</span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {canBook && listing.bookingPolicy && <BookingPolicySection policy={listing.bookingPolicy} />}

        <section className={styles.brand} data-aside={siblings.length > 0 || undefined}>
          <div className={styles.brandMain}>
            <div className={styles.brandIdentity}>
              <Avatar src={listing.logo ?? undefined} name={listing.name} size={72} ring loading="lazy" />
              <div className={styles.brandText}>
                <h2 className={styles.brandHeading}>
                  <span className={styles.brandEyebrow}>{t.brandPartOf}</span>{" "}
                  <span className={styles.brandName}>{listing.name}</span>
                </h2>
                {(listing.industry || brandRating != null) && (
                  <p className={styles.brandMeta}>
                    {listing.industry && <span>{taxonomyLabel(listing.industry, locale)}</span>}
                    {brandRating != null && <Rating rating={brandRating} reviews={brand?.totalReviews} size={13} />}
                  </p>
                )}
              </div>
            </div>
            {brandDescription && brandDescription !== locationDescription && (
              <p className={`txt-pretty ${styles.brandDescription}`}>{brandDescription}</p>
            )}
            <div className={styles.brandActions}>
              <Link
                href={localeHref(locale, "brand", listing.businessSlug ?? String(listing.businessId))}
                className={`tap zw-btn ${styles.brandAction}`}
              >
                {t.brandPage}
                <Icon name="arrowR" size={15} />
              </Link>
              {socials.length > 0 && (
                <nav className={styles.socials} aria-label={t.socialLinks}>
                  {/* The business enters these addresses itself: Zavoia links to them without vouching for them. */}
                  {socials.map((social) => (
                    <a key={social.label} href={social.href} target="_blank" rel="nofollow ugc noreferrer">
                      <Icon name={social.icon} size={15} />
                      {social.label}
                      <Icon name="arrowUR" size={12} />
                    </a>
                  ))}
                </nav>
              )}
            </div>
          </div>
          {siblings.length > 0 && (
            <div className={styles.brandAside}>
              <h3 className={styles.groupTitle}>
                {formatCount(siblings.length, locale, { one: t.moreLocationsOne, few: t.moreLocations, other: t.moreLocationsMany })}
              </h3>
              <ul className={styles.locations}>
                {siblings.map((sibling) => (
                  <li key={sibling.id}>
                    <Link
                      href={localeHref(locale, "business", sibling.detail?.slug || String(sibling.id))}
                      prefetch={false}
                      className={styles.locationCard}
                    >
                      <span className={styles.locationPhoto}>
                        <Img
                          src={sibling.detail?.featuredImage ?? listing.logo ?? undefined}
                          alt=""
                          sizes="auto, 80px"
                          className={styles.locationPhotoImage}
                          label={<Icon name="pin" size={22} color="var(--c-500)" />}
                        />
                      </span>
                      <span className={styles.locationText}>
                        <span className={styles.locationName}>{sibling.name}</span>
                        {(sibling.detail?.address || sibling.detail?.city) && (
                          <span className={styles.locationAddress}>{sibling.detail.address || sibling.detail.city}</span>
                        )}
                        {sibling.detail?.averageRating != null && (
                          <span className={styles.locationRating}>
                            <Rating rating={sibling.detail.averageRating} reviews={sibling.detail.totalReviews} size={13} />
                          </span>
                        )}
                      </span>
                      <Icon name="arrowR" size={17} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {discover && (
          <Link href={discover.href} prefetch={false} className={styles.discover}>
            <span className={styles.discoverText}>
              {/* The header's category, glyph and name together, as the headline. */}
              <span className={styles.discoverTitle}>
                <Icon name={discover.visual.icon} color={discover.visual.accent} size={26} />
                <span>{discover.industry}</span>
              </span>
              <span className={styles.discoverLead}>{t.discoverLead}</span>
            </span>
            <span className={styles.discoverAction}>
              {t.discoverAction}
              <Icon name="arrowR" size={13} />
            </span>
          </Link>
        )}
      </div>

      <ReportIssue t={dict.help.report} locale={locale} triggerLabel={t.reportLocation} className={styles.report} context={{ type: "listing", label: `${listing.name} · ${location.name}`, businessId: listing.businessId, listingId: listing.listingId, locationId: listing.locationId }} />
    </div>
  );
}

/** The policy the booking dialog shows, worded for someone who hasn't booked yet. */
function BookingPolicySection({ policy }: { policy: BookingPolicy }) {
  const { dict, locale } = useTranslation();
  const p = dict.appointmentPage;
  const duration = (minutes: number) => {
    const unit = minutes % 1440 === 0 ? "day" : minutes % 60 === 0 ? "hour" : "minute";
    return new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "long" }).format(
      unit === "day" ? minutes / 1440 : unit === "hour" ? minutes / 60 : minutes,
    );
  };
  const term = (allowed: boolean, minutes: number, notice: string) => !allowed
    ? dict.locationPage.policyNotOnline
    : minutes > 0 ? format(notice, { duration: duration(minutes) }) : p.noNoticeRequired;
  const combined = policy.allowCustomerCancellation && policy.allowCustomerReschedule &&
    policy.cancellationWindowMinutes === policy.rescheduleWindowMinutes;
  return (
    <section className={styles.policy}>
      <h2 className={styles.label}>{p.combinedPolicyTitle}</h2>
      {combined ? (
        <p className={`txt-pretty ${styles.policyText}`}>
          {policy.cancellationWindowMinutes > 0
            ? format(p.combinedNotice, { duration: duration(policy.cancellationWindowMinutes) })
            : p.combinedNoNoticeRequired}
        </p>
      ) : (
        <dl className={styles.policyTerms}>
          <div><dt>{p.cancellationPolicy}</dt><dd>{term(policy.allowCustomerCancellation, policy.cancellationWindowMinutes, p.cancellationNotice)}</dd></div>
          <div><dt>{p.reschedulePolicy}</dt><dd>{term(policy.allowCustomerReschedule, policy.rescheduleWindowMinutes, p.rescheduleNotice)}</dd></div>
        </dl>
      )}
    </section>
  );
}
