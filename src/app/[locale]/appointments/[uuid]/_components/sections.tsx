"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import type { Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n/dictionaries";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/format";
import { localeHref } from "@/i18n/routes";
import { Avatar, Button, Icon, Img, Rating, Stars } from "@/components/ui";
import { formatDuration, formatMoney } from "@/lib/format/money-time";
import { apptTime, apptTimeZone, formatApptPrice, STATUS_DOT_COLOR, type StatusTone, type Tense } from "../../_components/vm";
import { useAppointmentClock } from "../../_components/use-appointment-clock";
import { useAppointmentActions } from "../../_components/actions/actions-provider";
import { canLeaveReview } from "../../_components/actions/shared";
import type { AppointmentBreakdownItem, AppointmentDetail, AppointmentStatus } from "@/lib/api/marketplace/types";
import { TeamMemberProfileModal } from "@/app/[locale]/business/_components/team-member-profile-modal";
import styles from "./detail.module.css";
import ticketStyles from "../../_components/appointments.module.css";

type ApptDict = Dictionary["appointmentDetail"];

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}
function num(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Snapshots preserve booked identity after a venue or professional is removed. */
export function appointmentVenue(appt: AppointmentDetail) {
  const snapshot = record(appt.locationSnapshot);
  return {
    name: appt.location?.name || text(snapshot?.locationName),
    address: appt.location?.address || text(snapshot?.address),
    profileImage: appt.location?.profileImage || null,
    phone: appt.location?.phone || appt.business?.phone || null,
  };
}

export function appointmentProfessionals(appt: AppointmentDetail) {
  const live = (appt.staff_users ?? []).map((member) => ({ ...member, historical: false }));
  const snapshots = Array.isArray(appt.staffSnapshot) ? appt.staffSnapshot : [];
  for (const value of snapshots) {
    const snapshot = record(value);
    if (!snapshot) continue;
    const id = num(snapshot.userId);
    const uuid = text(snapshot.userUuid);
    if (live.some((member) => (id != null && member.teamMemberId === id) || (uuid && member.uuid === uuid))) continue;
    const firstName = text(snapshot.firstName);
    const lastName = text(snapshot.lastName);
    if (!firstName && !lastName) continue;
    live.push({
      teamMemberId: id ?? 0, uuid: uuid ?? "", firstName, lastName,
      profileImage: text(snapshot.profileImage), professionalTitle: text(snapshot.professionalTitle),
      displayName: null, averageRating: null, totalReviews: 0, historical: true,
    });
  }
  return live;
}

export function locationHref(locale: Locale, loc: AppointmentDetail["location"]): string | undefined {
  if (!loc) return undefined;
  const target = loc.slug || (loc.id != null ? String(loc.id) : null);
  return target ? localeHref(locale, "business", target) : undefined;
}

export function StampPill({ t, tone, status }: { t: ApptDict; tone: StatusTone; status: AppointmentStatus }) {
  const label = tone === "live" ? t.status.inProgress : {
    pending: t.status.pending, confirmed: t.status.confirmed, completed: t.status.completed,
    cancelled: t.status.cancelled, no_show: t.status.noShow,
  }[status];
  return <span className={ticketStyles.stamp} style={{ color: tone === "live" ? "var(--s-success-600)" : STATUS_DOT_COLOR[status] }}>
    {tone === "live" && <span aria-hidden="true" className={ticketStyles.liveDot} />}
    {label}
  </span>;
}

export function Section({ label, children, style }: { label: string; children: ReactNode; style?: CSSProperties }) {
  return <section className={styles.section} style={style}>
    <h2 className={styles.sectionTitle}>{label}</h2>
    {children}
  </section>;
}

export function WhereCard({ t, appt, locale }: { t: ApptDict; appt: AppointmentDetail; locale: Locale; tense: Tense; tone: StatusTone }) {
  const { dict } = useTranslation();
  const venue = appointmentVenue(appt);
  if (!venue.name && !venue.address) return <p className={styles.body}>{dict.appointmentPage.venueUnavailable}</p>;
  const href = locationHref(locale, appt.location);
  const photo = venue.profileImage;
  const content = <>
    <div className={`${styles.venuePhoto} zw-zoom-wrap`}>
      {photo ? <Img src={photo} alt="" style={{ width: "100%", height: "100%" }} /> : <Icon name="pin" size={28} color="var(--c-600)" />}
    </div>
    <div className={styles.venueContent}>
      {appt.business?.name && <span className={styles.kicker}>{appt.business.name}</span>}
      {venue.name && <span className={styles.cardTitle}>{venue.name}</span>}
      {venue.address && <span className={styles.body}>{venue.address}</span>}
      {appt.location?.averageRating != null && <Rating rating={Number(appt.location.averageRating)} reviews={appt.location.totalReviews} size={12.5} />}
      {href ? <span className={styles.textLink}>{t.viewVenue}<Icon name="chevR" size={13} /></span> : <span className={styles.secondary}>{dict.appointmentPage.historicalVenue}</span>}
    </div>
  </>;
  return href ? <a href={href} className={styles.venue}>{content}</a> : <div className={styles.venue}>{content}</div>;
}

function servicesFor(item: AppointmentBreakdownItem) {
  return Array.isArray(item.services) ? item.services : [];
}

export function ServiceCard({ t, appt, locale }: { t: ApptDict; appt: AppointmentDetail; locale: Locale }) {
  const p = useTranslation().dict.appointmentPage;
  const rows: AppointmentBreakdownItem[] = appt.items.length ? appt.items : [{
    name: appt.primaryItemName || appt.bookedItemName, description: appt.bookedItemDescription,
    duration: Number(appt.duration), price: Number(appt.price),
  }, ...appt.additionalServices.map((name) => ({ name }))];
  const tz = apptTimeZone(appt.location?.timezone, appt.business?.timezone);
  const total = num(appt.price);
  // A bundle's constituent prices are its authoritative undiscounted comparison.
  // Never double-count the bundle price itself alongside its included services.
  const originalPrices = rows.map((item) => {
    const included = servicesFor(item);
    if (included.length && included.every((service) => num(service.price) != null)) return included.reduce((sum, service) => sum + Number(service.price), 0);
    return num(item.price);
  });
  const originalTotal = originalPrices.every((price) => price != null) ? originalPrices.reduce<number>((sum, price) => sum + (price ?? 0), 0) : null;
  const saving = total != null && originalTotal != null ? Math.max(0, originalTotal - total) : 0;
  return <div className={styles.receipt}>
    <div className={styles.receiptBody}>
      <div className={styles.serviceList}>
        {rows.map((item, index) => {
          const included = servicesFor(item);
          const duration = num(item.duration);
          const price = num(item.price);
          const offset = num(item.startOffsetMinutes);
          return <div className={styles.serviceItem} key={`${index}:${item.name}`}>
            <div className={styles.serviceHeading}>
              <div className={styles.serviceIdentity}>
                {rows.length > 1 && <span className={styles.serviceIndex}>{String(index + 1).padStart(2, "0")}</span>}
                <div>
                  <div className={styles.cardTitle}>{item.name}</div>
                  <div className={styles.serviceMeta}>
                    {item.type === "bundle" && <span>{t.bundleTag}</span>}
                    {duration != null && <span>{formatDuration(duration)}</span>}
                    {rows.length > 1 && offset != null && <span>{format(p.startsAt, { time: apptTime(new Date(new Date(appt.scheduled_at).getTime() + offset * 60_000).toISOString(), locale, tz) })}</span>}
                  </div>
                </div>
              </div>
              {price != null && <span className={styles.itemPrice}>{formatApptPrice(price, appt.currency, locale, t.free)}</span>}
            </div>
            {item.description && <p className={styles.serviceDescription}>{item.description}</p>}
            {included.length > 0 && <div className={styles.included}>
              <span className={styles.kicker}>{p.includedServices}</span>
              <ul className={styles.includedList}>
                {included.map((service, serviceIndex) => <li key={`${serviceIndex}:${service.name}`}>
                  <span>{service.name}</span>
                  {num(service.duration) != null && <span className={styles.secondary}>{formatDuration(Number(service.duration))}</span>}
                </li>)}
              </ul>
            </div>}
          </div>;
        })}
      </div>
      {saving > 0 && originalTotal != null && <div className={styles.savings}>
        <span>{format(p.savedAmount, { amount: formatMoney(saving, appt.currency, locale) })}</span>
        <s>{formatMoney(originalTotal, appt.currency, locale)}</s>
      </div>}
    </div>
    <div className={styles.total}>
      <span className={styles.receiptPerforation} aria-hidden="true" />
      <div><span className={styles.cardTitle}>{p.bookedTotal}</span><p className={styles.totalHint}>{p.bookedTotalHint}</p></div>
      <span className={styles.totalPrice}>{formatApptPrice(appt.price, appt.currency, locale, t.free)}</span>
    </div>
  </div>;
}

export function NotesCard({ notes }: { notes: string }) {
  return <div className={styles.notes}><Icon name="reply" size={17} color="var(--c-600)" /><p>{notes}</p></div>;
}

export function WithCard({ t, appt, locale }: { t: ApptDict; appt: AppointmentDetail; locale: Locale }) {
  const p = useTranslation().dict.appointmentPage;
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const members = appointmentProfessionals(appt);
  const businessId = appt.business?.id;
  const locationId = appt.location?.id;
  const hasVenue = businessId != null && businessId > 0 && locationId != null && locationId > 0;
  const selectedMember = hasVenue
    ? members.find((member) => member.teamMemberId === selectedMemberId && !member.historical)
    : undefined;
  return <><div className={styles.staffList}>{members.map((member, index) => {
    const name = member.displayName || [member.firstName, member.lastName].filter(Boolean).join(" ");
    const canOpen = hasVenue && !member.historical && member.teamMemberId > 0;
    const content = <><Avatar src={member.profileImage ?? undefined} name={name} size={56} />
      <div className={styles.staffContent}><span className={styles.cardTitle}>{name}</span>
        {member.professionalTitle && <span className={styles.body}>{member.professionalTitle}</span>}
        {member.averageRating != null && <Rating rating={Number(member.averageRating)} reviews={member.totalReviews} size={12.5} />}
        {canOpen ? <span className={styles.textLink}>{t.viewProfile}<Icon name="chevR" size={12} /></span> : member.historical && <span className={styles.secondary}>{p.historicalProfessional}</span>}
      </div></>;
    return canOpen ? <button key={`${member.uuid}:${index}`} type="button"
      className={`${styles.staffMember} ${styles.staffAction}`}
      aria-label={`${t.viewProfile}: ${name}`} aria-haspopup="dialog"
      onClick={() => setSelectedMemberId(member.teamMemberId)}>{content}</button>
      : <div key={`${member.uuid}:${index}`} className={styles.staffMember}>{content}</div>;
  })}</div>
    {selectedMember && <TeamMemberProfileModal
      key={`${appt.uuid}:${selectedMember.teamMemberId}:${businessId}:${locationId}`}
      member={{ ...selectedMember, id: selectedMember.teamMemberId }}
      businessId={businessId} locationId={locationId} locale={locale}
      onClose={() => setSelectedMemberId(null)} />}
  </>;
}

export function ReviewCard({ rating, comment, label }: { rating: number; comment: string | null; label?: string }) {
  return <div className={`${styles.surface} ${styles.review}`}>
    {label && <h3 className={styles.reviewLabel}>{label}</h3>}
    <Stars value={rating} size={17} />
    {comment && <p className={styles.body}>{comment}</p>}
  </div>;
}

export function AboutCard({ t, appt, locale }: { t: ApptDict; appt: AppointmentDetail; locale: Locale }) {
  const biz = appt.business;
  if (!biz?.description) return null;
  const target = biz.businessSlug || String(biz.id);
  return <a href={localeHref(locale, "brand", target)} className={styles.about}>
    <Avatar src={biz.logo ?? undefined} name={biz.name} size={54} />
    <div><span className={styles.cardTitle}>{biz.name}</span><p className={styles.body}>{biz.description}</p><span className={styles.textLink}>{t.viewBrand}<Icon name="chevR" size={12} /></span></div>
  </a>;
}

export function PendingBanner({ t, appt, tense }: { t: ApptDict; appt: AppointmentDetail; tense: Tense }) {
  const p = useTranslation().dict.appointmentPage;
  const businessName = appt.business?.name?.trim();
  const pastBody = businessName ? format(p.pendingPastBody, { businessName }) : p.pendingPastBodyFallback;
  return <div className={styles.pending}>
    <Icon name="clock" size={18} color="var(--s-warning-600)" />
    <div><strong>{tense === "past" ? p.pendingPastTitle : t.awaitingConfirmation}</strong><p>{tense === "past" ? pastBody : tense === "now" ? p.pendingStartedBody : p.awaitingBody}</p></div>
  </div>;
}

export function LiveStrip({ t, appt }: { t: ApptDict; appt: AppointmentDetail }) {
  const now = useAppointmentClock();
  const end = new Date(appt.ends_at).getTime();
  const start = new Date(appt.scheduled_at).getTime();
  const progress = Math.max(0, Math.min(1, (now.getTime() - start) / Math.max(1, end - start)));
  const minutes = Math.max(0, Math.ceil((end - now.getTime()) / 60_000));
  const label = minutes <= 0 ? t.endingNow : minutes === 1 ? t.oneMinLeft : format(t.minsLeft, { n: String(minutes) });
  return <div className={styles.live}>
    <div className={styles.liveLabels}><span>{label}</span></div>
    <div className={styles.progress} role="progressbar" aria-label={t.inProgress} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><span style={{ transform: `scaleX(${progress})` }} /></div>
  </div>;
}

export function RecurringNote({ t, appt }: { t: ApptDict; appt: AppointmentDetail }) {
  if (!appt.recurringGroupId) return null;
  return <p className={styles.recurring}><Icon name="layers" size={15} color="var(--c-600)" />{t.recurringPlan}</p>;
}

export function CloserBand({ t, appt, locale, tone }: { t: ApptDict; appt: AppointmentDetail; locale: Locale; tone: StatusTone }) {
  const p = useTranslation().dict.appointmentPage;
  const tz = apptTimeZone(appt.location?.timezone, appt.business?.timezone);
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: tz }).format(new Date(appt.createdAt));
  const source = { marketplace: t.bookedVia.zavoia, admin: p.bookedViaAdmin, phone: p.bookedViaPhone, walk_in: p.bookedViaWalkIn }[appt.bookingSource];
  return <div className={styles.closer}>
    {(tone === "warning" || tone === "error") && <div className={styles.cancellation}>
      <strong>{tone === "error" ? t.youMissedAppointment : t.cancelledTitle}</strong>
      {appt.cancellation_reason && <p>{appt.cancellation_reason}</p>}
    </div>}
    <span>{format(t.bookedOn, { date })}{source && <span> · {source}</span>}</span>
  </div>;
}

export function MobileBar({ appt, locale, tense, tone, t, directionsHref, onBookAgain, bookingAgain, offline }: {
  appt: AppointmentDetail; locale: Locale; tense: Tense; tone: StatusTone; t: ApptDict;
  directionsHref: string | null; onBookAgain: () => void; bookingAgain: boolean; offline: boolean;
}) {
  const { openReview } = useAppointmentActions();
  const reviewAllowed = canLeaveReview(appt);
  const bookAgain = tense === "past" || appt.status === "completed" || tone === "warning" || tone === "error";
  const canBookAgain = appt.location?.id != null;
  if (!reviewAllowed && (bookAgain ? !canBookAgain : !directionsHref)) return null;
  const tz = apptTimeZone(appt.location?.timezone, appt.business?.timezone);
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: tz }).format(new Date(appt.scheduled_at));
  return <div className={`${styles.mobileBar} zw-mobile-actionbar`}>
    {reviewAllowed ? <div className={styles.mobileReviewActions}>
      {canBookAgain && <Button kind="secondary" style={{ padding: "12px", whiteSpace: "normal", lineHeight: 1.3 }} loading={bookingAgain} onClick={onBookAgain} disabled={bookingAgain || offline}>{t.bookAgain}</Button>}
      <Button kind="accent" style={{ border: "none", color: "var(--c-50)", padding: "12px", whiteSpace: "normal", lineHeight: 1.3 }} disabled={offline} onClick={() => openReview(appt)}><Icon name="star" size={16} />{t.leaveReview}</Button>
    </div> : <>
      <div className={styles.mobileSummary}><strong>{date} · {apptTime(appt.scheduled_at, locale, tz)}</strong><span>{[appt.business?.name, appointmentVenue(appt).name].filter(Boolean).join(" · ")}</span></div>
      {bookAgain ? <Button kind="primary" loading={bookingAgain} onClick={onBookAgain} disabled={bookingAgain || offline}>{t.bookAgain}</Button> : <a className={`tap zw-btn ${styles.mobileDirection}`} href={directionsHref!} target="_blank" rel="noopener noreferrer">{t.viewMap}</a>}
    </>}
  </div>;
}
