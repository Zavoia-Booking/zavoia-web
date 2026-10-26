"use client";

import { useTranslation } from "@/i18n/useTranslation";
import type { Dictionary } from "@/i18n/dictionaries";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import { format } from "@/i18n/format";
import { localeHref } from "@/i18n/routes";
import { useAuth } from "@/lib/auth/useAuth";
import { useAuthModal } from "@/components/shell/auth-modal-provider";
import { Button, Icon, SignedOutGate, Skeleton, useToast, type ToastHandle } from "@/components/ui";
import { PageError } from "@/components/ui/page-error";
import { ApiError } from "@/lib/api/http";
import { getAppointment } from "@/lib/api/marketplace/appointments";
import { useRebook } from "@/lib/booking";
import type { AppointmentDetail } from "@/lib/api/marketplace/types";
import { formatDuration } from "@/lib/format/money-time";
import {
  apptStatusTone,
  apptTime,
  apptTimeZone,
  deriveTense,
  wallDateKey,
  type StatusTone,
  type Tense,
} from "../../_components/vm";
import {
  AppointmentActionsProvider,
  useAppointmentActions,
} from "../../_components/actions/actions-provider";
import { canCancel, canLeaveReview, canReschedule, staffDisplayName, type AppointmentChange } from "../../_components/actions/shared";
import { useAppointmentClock } from "../../_components/use-appointment-clock";
import { AppointmentsSignInArt } from "../../_components/appointments-sign-in-art";
import styles from "./detail.module.css";
import {
  appointmentProfessionals,
  appointmentVenue,
  locationHref,
  AboutCard,
  CloserBand,
  LiveStrip,
  MobileBar,
  NotesCard,
  PendingBanner,
  RecurringNote,
  ReviewCard,
  Section,
  ServiceCard,
  StampPill,
  WhereCard,
  WithCard,
} from "./sections";

type ApptDict = Dictionary["appointmentDetail"];

function subscribeConnectivity(listener: () => void) {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}
const isOffline = () => navigator.onLine === false;
const serverOffline = () => false;

/**
 * Short relative-time label for the hero, next to the status stamp (prototype
 * `web-appointment-detail.jsx:550`). Returns `null` when nothing short should
 * render — past appointments (the stamp already conveys completed/cancelled/
 * no-show) and future appointments more than ~6 days out.
 */
function relativeLabel(
  t: ApptDict,
  tense: Tense,
  scheduledAt: string,
  timeZone?: string,
  now: Date = new Date(),
): string | null {
  if (tense === "now") return null;
  if (tense === "today") return t.relative.today;
  if (tense !== "future") return null;

  // Whole calendar days between today and the appointment, both counted in
  // the venue's calendar (the zone its times are shown in).
  const dayNumber = (d: Date) => Date.parse(wallDateKey(d, timeZone)) / 86_400_000;
  const days = Math.round(dayNumber(new Date(scheduledAt)) - dayNumber(now));
  if (days <= 1) return t.relative.tomorrow;
  if (days <= 6) return format(t.relative.inDays, { n: String(days) });
  return null;
}

// ── Loading skeleton ────────────────────────────────────────────────────────

export function DetailLoadingState({ loadingLabel }: { loadingLabel: string }) {
  const { dict, locale } = useTranslation();
  const t = dict.appointmentDetail;
  const p = dict.appointmentPage;
  return <main className={`zw-container ${styles.page}`} aria-busy="true">
    <div className={styles.navigation}><Link href={localeHref(locale, "appointments")} prefetch={false} className={`tap ${styles.back}`}><Icon name="back" size={14} />{t.back}</Link></div>
    <div className={styles.columns}>
      <div className={styles.hero} aria-hidden="true">
        <div className={styles.heroIdentity}>
          <div className={styles.datePlaceholder}><Skeleton h="100%" r="inherit" /></div>
          <div className={styles.heroCopy}>
            <div className={styles.title}><Skeleton w="90%" h="1.12em" /></div>
            <Skeleton w="50%" h={23} style={{ marginTop: 12 }} />
          </div>
          <div className={styles.heroStatus}><Skeleton w={100} h={25} r={4} /></div>
        </div>
        <div className={styles.heroMeta}>
          <div className={styles.schedule} style={{ flex: 1 }}><Skeleton w="75%" h={22} /><Skeleton w={190} h={34} /></div>
          <Skeleton w={60} h={21} />
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.providerGrid}>
          <Section label={t.sections.where}><div className={styles.venue} aria-hidden="true"><div className={styles.venuePhoto}><Skeleton h="100%" r={0} /></div><div className={styles.venueContent} style={{ flex: 1 }}><Skeleton w="70%" h={16} /><Skeleton w="90%" h={22} /><Skeleton w="80%" h={18} /></div></div></Section>
          <Section label={t.sections.with}><div className={styles.staffMember} aria-hidden="true"><Skeleton w={56} h={56} r="50%" style={{ flexShrink: 0 }} /><div className={styles.staffContent} style={{ flex: 1 }}><Skeleton w="90%" h={22} /><Skeleton w="65%" h={18} /></div></div></Section>
        </div>
        <Section label={t.sections.service}><div className={styles.receipt} aria-hidden="true"><div className={styles.receiptBody}><div className={styles.serviceList}><div className={styles.serviceItem}><Skeleton w="75%" h={28} /><Skeleton w="30%" h={20} style={{ marginTop: 10 }} /><Skeleton w="60%" h={22} style={{ marginTop: 14 }} /></div></div></div><div className={styles.total}><span className={styles.receiptPerforation} /><Skeleton w="45%" h={40} /><Skeleton w="25%" h={34} /></div></div></Section>
      </div>
      <div className={styles.rail} aria-hidden="true"><div className={styles.railCard}>
        <div className={styles.railHeading}>{p.managementTitle}</div>
        <div className={styles.railPrimary}><Skeleton h={49} r={999} /></div>
        <div className={styles.railRows}>{[0, 1, 2].map((index) => <div className={styles.manageRow} key={index}><Skeleton w={16} h={16} r={4} /><Skeleton w="65%" h={20} /></div>)}</div>
        <div className={styles.railSecondary}><div className={styles.manageRow}><Skeleton w={16} h={16} r={4} /><Skeleton w="55%" h={20} /></div></div>
      </div></div>
    </div>
    <p role="status" className="sr-only">{loadingLabel}</p>
  </main>;
}

// ── Error state (with retry) ─────────────────────────────────────────────────

function ErrorState({
  t,
  errorsT,
  onRetry,
  retrying,
  offline,
}: {
  t: ApptDict;
  errorsT: Dictionary["errors"];
  onRetry: () => void;
  retrying: boolean;
  offline: boolean;
}) {
  const { dict, locale } = useTranslation();
  const copy = dict.appointmentPage;
  return <PageError
    title={offline ? copy.detailOfflineTitle : copy.detailErrorTitle}
    description={offline ? copy.detailOfflineBody : copy.detailErrorBody}
    primary={{ label: errorsT.retry, onClick: onRetry, loading: retrying, disabled: retrying || offline }}
    secondary={{ label: t.backToAppointments, href: localeHref(locale, "appointments") }}
  />;
}

// ── Not-found state ───────────────────────────────────────────────────────────

function NotFoundState({ t }: { t: ApptDict }) {
  const { dict, locale } = useTranslation();
  return <PageError
    title={t.notFound}
    description={dict.appointmentPage.detailNotFoundBody}
    primary={{ label: t.backToAppointments, href: localeHref(locale, "appointments") }}
  />;
}

// A single management surface stays available at every viewport width.
function ManageRow({ icon, label, hint, danger, disabled, onClick, href }: {
  icon: Parameters<typeof Icon>[0]["name"]; label: string; hint?: string;
  danger?: boolean; disabled?: boolean; onClick?: () => void; href?: string;
}) {
  const content = <><Icon name={icon} size={16} /><span className={styles.rowCopy}><span>{label}</span>{hint && <span className={styles.rowHint}>{hint}</span>}</span></>;
  const className = `${styles.manageRow} ${danger ? styles.danger : ""} ${disabled ? "" : "tap zw-hover-row"}`;
  return href ? <a href={href} className={className}>{content}</a> : <button type="button" className={className} disabled={disabled} onClick={onClick}>{content}</button>;
}

/** Booking settings are sent as minutes, including zero for no advance notice. */
function noticeDuration(minutes: number, locale: Locale): string {
  const unit = minutes % 1_440 === 0 ? "day" : minutes % 60 === 0 ? "hour" : "minute";
  const value = unit === "day" ? minutes / 1_440 : unit === "hour" ? minutes / 60 : minutes;
  return new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "long" }).format(value);
}

function BookingPolicies({ appt }: { appt: AppointmentDetail }) {
  const { dict, locale } = useTranslation();
  const p = dict.appointmentPage;
  const location = appt.location;
  if (!location || (!location.allowCustomerCancellation && !location.allowCustomerReschedule)) return null;
  const sharedDeadline = location.allowCustomerCancellation && location.allowCustomerReschedule
    && location.cancellationWindowMinutes === location.rescheduleWindowMinutes;
  return <section className={styles.policies} aria-labelledby="appointment-policy-title">
    <h3 id="appointment-policy-title">{sharedDeadline ? p.combinedPolicyTitle : p.policyTitle}</h3>
    {sharedDeadline ? <p className={styles.policySummary}>
      {location.cancellationWindowMinutes > 0
        ? format(p.combinedNotice, { duration: noticeDuration(location.cancellationWindowMinutes, locale) })
        : p.combinedNoNoticeRequired}
    </p> : <dl>
      {location.allowCustomerCancellation && <div>
        <dt>{p.cancellationPolicy}</dt>
        <dd>{location.cancellationWindowMinutes > 0
          ? format(p.cancellationNotice, { duration: noticeDuration(location.cancellationWindowMinutes, locale) })
          : p.noNoticeRequired}</dd>
      </div>}
      {location.allowCustomerReschedule && <div>
        <dt>{p.reschedulePolicy}</dt>
        <dd>{location.rescheduleWindowMinutes > 0
          ? format(p.rescheduleNotice, { duration: noticeDuration(location.rescheduleWindowMinutes, locale) })
          : p.noNoticeRequired}</dd>
      </div>}
    </dl>}
  </section>;
}

function ActionRail({ t, appt, tense, tone, onBookAgain, bookingAgain, offline }: {
  t: ApptDict; appt: AppointmentDetail; tense: Tense; tone: StatusTone;
  onBookAgain: () => void; bookingAgain: boolean; offline: boolean;
}) {
  const p = useTranslation().dict.appointmentPage;
  const { openReview, openReschedule, openCancel, openReport } = useAppointmentActions();
  const venue = appointmentVenue(appt);
  const cancelled = tone === "warning" || tone === "error";
  const upcoming = tense !== "past" && appt.status !== "completed" && !cancelled;
  const directionsHref = venue.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}` : null;
  const canBookAgain = appt.location?.id != null;
  const rescheduleAllowed = canReschedule(appt);
  const cancelAllowed = canCancel(appt);
  const reviewAllowed = canLeaveReview(appt);
  const showPrimary = reviewAllowed || (upcoming ? !!directionsHref : canBookAgain);
  const showRows = !!venue.phone || upcoming;
  const blockedChanges = upcoming && (!rescheduleAllowed || !cancelAllowed);
  return <div className={styles.railCard}>
    <h2 className={styles.railHeading}>{p.managementTitle}</h2>
    {showPrimary && <div className={styles.railPrimary}>
      {reviewAllowed ? <>
        <Button kind="accent" size="lg" style={{ border: "none", color: "var(--c-50)" }} disabled={offline} onClick={() => openReview(appt)}><Icon name="star" size={16} />{t.leaveReview}</Button>
        {canBookAgain && <Button kind="secondary" size="lg" onClick={onBookAgain} loading={bookingAgain} disabled={bookingAgain || offline}><Icon name="rebook" size={16} />{t.bookAgain}</Button>}
      </> : upcoming ? <a href={directionsHref!} target="_blank" rel="noopener noreferrer" className={`tap zw-btn ${styles.primaryLink}`}><Icon name="nav" size={16} />{t.viewMap}</a> : <Button kind="primary" size="lg" onClick={onBookAgain} loading={bookingAgain} disabled={bookingAgain || offline}><Icon name="rebook" size={16} />{t.bookAgain}</Button>}
    </div>}
    {showRows && <div className={styles.railRows}>
      {venue.phone && <ManageRow icon="phone" label={t.callVenue} href={`tel:${venue.phone}`} />}
      {upcoming && <>
        <ManageRow icon="clock" label={t.reschedule} hint={!rescheduleAllowed ? (!appt.location?.allowCustomerReschedule ? t.rescheduleUnavailable : t.rescheduleWindowPassed) : undefined} disabled={!rescheduleAllowed || offline} onClick={() => openReschedule(appt)} />
        <ManageRow icon="x" label={appt.status === "pending" ? p.cancelRequest : t.cancelAppointment} hint={!cancelAllowed ? (!appt.location?.allowCustomerCancellation ? t.cancelUnavailable : t.cancelWindowPassed) : undefined} danger disabled={!cancelAllowed || offline} onClick={() => openCancel(appt)} />
        {blockedChanges && <p className={styles.contactHint}>{t.contactBusinessDirectly}</p>}
      </>}
    </div>}
    <div className={styles.railSecondary}>
      <ManageRow icon="reply" label={p.reportIssue} disabled={offline} onClick={() => openReport(appt)} />
    </div>
    {upcoming && <BookingPolicies appt={appt} />}
  </div>;
}

function DetailBody({ t, appt, locale, onOpenApp }: {
  t: ApptDict; appt: AppointmentDetail; locale: Locale; onOpenApp?: () => void;
}) {
  const p = useTranslation().dict.appointmentPage;
  const now = useAppointmentClock();
  const offline = useSyncExternalStore(subscribeConnectivity, isOffline, serverOffline);
  const { rebook, pending: rebooking } = useRebook();
  const tz = apptTimeZone(appt.location?.timezone, appt.business?.timezone);
  const tense = deriveTense(appt.scheduled_at, appt.ends_at, appt.status, now, tz);
  const tone = apptStatusTone(appt.status, tense);
  const services = [appt.primaryItemName || appt.bookedItemName, ...appt.additionalServices].filter(Boolean);
  const date = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz }).format(new Date(appt.scheduled_at));
  const datePart = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...options, timeZone: tz }).format(new Date(appt.scheduled_at));
  const relative = relativeLabel(t, tense, appt.scheduled_at, tz, now);
  const venue = appointmentVenue(appt);
  const venueHref = locationHref(locale, appt.location);
  const directionsHref = venue.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}` : null;
  const professionals = appointmentProfessionals(appt);
  const businessReview = appt.reviews.business;
  const professionalReviews = appt.reviews.professionals.filter((professional) => professional.review);
  const hasReviews = !!businessReview || professionalReviews.length > 0;
  return <main className={`zw-container ${styles.page}`}>
    <div className={styles.navigation}>
      <Link href={localeHref(locale, "appointments")} prefetch={false} className={`tap ${styles.back}`}><Icon name="back" size={14} />{t.back}</Link>
      {onOpenApp && <Button kind="ghost" size="sm" onClick={onOpenApp}>{t.openApp}</Button>}
    </div>
    <div className={styles.columns}>
      <header className={styles.hero}>
        <div className={styles.heroIdentity}>
          <div className={styles.dateBadge} data-tense={tense} aria-hidden="true">
            <span>{datePart({ weekday: "short" })}</span>
            <strong>{datePart({ day: "numeric" })}</strong>
            <span>{datePart({ month: "short" })}</span>
          </div>
          <div className={styles.heroCopy}>
            <h1 className={styles.title}>{services[0]}</h1>
            {services.slice(1).map((service, index) => <div className={styles.additionalService} key={`${index}:${service}`}>+ {service}</div>)}
            {appt.business?.name && (venueHref ? <a href={venueHref} className={styles.businessLink}>{format(t.atBusiness, { business: appt.business.name })}</a> : <span className={styles.businessLink}>{format(t.atBusiness, { business: appt.business.name })}</span>)}
          </div>
          <div className={styles.heroStatus}>
            <StampPill t={t} tone={tone} status={appt.status} />
            {relative && <span className={styles.relative}>{relative}</span>}
          </div>
        </div>
        <div className={styles.heroMeta}>
          <div className={styles.schedule}>
            <time dateTime={appt.scheduled_at} className={styles.date}>{date}</time>
            <span className={styles.timeRange}>{apptTime(appt.scheduled_at, locale, tz)} <span>–</span> {apptTime(appt.ends_at, locale, tz)}</span>
          </div>
          <span className={styles.duration}><Icon name="clock" size={16} />{formatDuration(Number(appt.duration))}</span>
        </div>
        {tone === "live" && <LiveStrip t={t} appt={appt} />}
        <RecurringNote t={t} appt={appt} />
        {appt.status === "pending" && <PendingBanner t={t} appt={appt} tense={tense} />}
        <a href="#appointment-management" className={`tap ${styles.managementShortcut}`}><Icon name="cal" size={15} />{p.managementTitle}<Icon name="chevR" size={13} /></a>
      </header>
      <div className={styles.content}>
        <div className={styles.providerGrid}>
          <Section label={t.sections.where}><WhereCard t={t} appt={appt} locale={locale} tense={tense} tone={tone} /></Section>
          {professionals.length > 0 && <Section label={t.sections.with}><WithCard key={appt.uuid} t={t} appt={appt} locale={locale} /></Section>}
        </div>
        <Section label={services.length > 1 ? t.sections.services : t.sections.service}><ServiceCard t={t} appt={appt} locale={locale} /></Section>
      </div>
      <aside id="appointment-management" className={styles.rail} aria-label={p.managementTitle} tabIndex={-1}>
        <ActionRail t={t} appt={appt} tense={tense} tone={tone} onBookAgain={() => void rebook(appt)} bookingAgain={rebooking} offline={offline} />
      </aside>
      <div className={styles.content}>
        {appt.notes && <Section label={t.sections.note}><NotesCard notes={appt.notes} /></Section>}
        {hasReviews && <Section label={t.sections.yourReview}>
          {businessReview && <ReviewCard rating={Number(businessReview.rating)} comment={businessReview.comment} label={format(p.reviewForBusiness, { name: venue.name || appt.business?.name || p.venueUnavailable })} />}
          {professionalReviews.map((professional) => {
            const member = professionals.find((candidate) => candidate.teamMemberId === professional.staffId || candidate.uuid === professional.staffUuid);
            return <ReviewCard key={professional.staffId} rating={Number(professional.review!.rating)} comment={professional.review!.comment} label={format(p.reviewForProfessional, { name: staffDisplayName(member) || p.professionalUnavailable })} />;
          })}
        </Section>}
        {appt.business?.description && <Section label={t.sections.about}><AboutCard t={t} appt={appt} locale={locale} /></Section>}
        <CloserBand t={t} appt={appt} locale={locale} tone={tone} />
      </div>
    </div>
    <MobileBar t={t} appt={appt} locale={locale} tense={tense} tone={tone} directionsHref={directionsHref} onBookAgain={() => void rebook(appt)} bookingAgain={rebooking} offline={offline} />
  </main>;
}

// ── Top-level data + gating + provider mount ────────────────────────────────

type Phase = "loading" | "ready" | "notFound" | "error";

/** Consume an email's review intent only after the owned appointment has loaded. */
function ReviewIntent({
  appt,
  requested,
  onConsumed,
}: {
  appt: AppointmentDetail;
  requested: boolean;
  onConsumed: () => void;
}) {
  const { openReview } = useAppointmentActions();
  const consumedRef = useRef(false);

  useEffect(() => {
    if (!requested || consumedRef.current) return;
    consumedRef.current = true;
    if (canLeaveReview(appt)) openReview(appt);
    onConsumed();
  }, [appt, requested, openReview, onConsumed]);

  return null;
}

export function DetailContent({ locale, uuid }: { locale: Locale; uuid: string }) {
  const dictionary = useTranslation().dict;
  const t = dictionary.appointmentDetail;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status, user, refresh: refreshSession } = useAuth();
  const [authRetrying, setAuthRetrying] = useState(false);
  const { openAuthModal } = useAuthModal();
  const reviewRequested = searchParams.get("review") === "1";
  const openApp = useCallback(() => {
    window.location.assign(`marketplaceapp://appointment/${encodeURIComponent(uuid)}?review=1`);
  }, [uuid]);
  const consumeReview = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("review");
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}${window.location.hash}`, { scroll: false });
  }, [pathname, router, searchParams]);

  if (status === "idle" || status === "loading") {
    return <DetailLoadingState loadingLabel={t.loading} />;
  }

  if (status === "error") {
    return <PageError
      title={dictionary.appointmentPage.detailSessionErrorTitle}
      description={dictionary.accountMenu.sessionError}
      primary={{ label: dictionary.errors.retry, loading: authRetrying, onClick: async () => {
        if (authRetrying) return;
        setAuthRetrying(true);
        try { await refreshSession(); }
        finally { setAuthRetrying(false); }
      } }}
      secondary={{ label: t.backToAppointments, href: localeHref(locale, "appointments") }}
    />;
  }

  if (status === "unauthenticated") {
    const gate = dictionary.appointments.gate;
    return (
      <main>
      <SignedOutGate
        artwork={<AppointmentsSignInArt />}
        title={gate.title}
        body={gate.body}
        cta={gate.cta}
        onCta={() => openAuthModal(
          "signin",
          `${window.location.pathname}${window.location.search}${window.location.hash}`,
        )}
        secondaryLabel={reviewRequested ? t.openApp : gate.secondary}
        onSecondary={reviewRequested ? openApp : () => router.push(localeHref(locale, "search"))}
      />
      </main>
    );
  }

  // A different appointment or signed-in account owns a fresh data/action session.
  return (
    <AppointmentDetailSession
      key={`${uuid}:${user?.uuid ?? ""}`}
      locale={locale}
      uuid={uuid}
      reviewRequested={reviewRequested}
      onConsumeReview={consumeReview}
      onOpenApp={openApp}
    />
  );
}

function AppointmentDetailSession({
  locale,
  uuid,
  reviewRequested,
  onConsumeReview,
  onOpenApp,
}: {
  locale: Locale;
  uuid: string;
  reviewRequested: boolean;
  onConsumeReview: () => void;
  onOpenApp: () => void;
}) {
  const dictionary = useTranslation().dict;
  const t = dictionary.appointmentDetail;
  const p = dictionary.appointmentPage;
  const toast = useToast();
  const [appt, setAppt] = useState<AppointmentDetail | null>(null);
  const offline = useSyncExternalStore(subscribeConnectivity, isOffline, serverOffline);
  const [phase, setPhase] = useState<Phase>("loading");
  const [retrying, setRetrying] = useState(false);
  const [enteredWithReview] = useState(reviewRequested);
  const loadedRef = useRef(false);
  const refreshingRef = useRef(false);
  const aliveRef = useRef(false);
  const requestRef = useRef(0);
  const refreshFailedRef = useRef(false);
  const refreshToastRef = useRef<ToastHandle | null>(null);
  const offlineToastRef = useRef<ToastHandle | null>(null);
  const offlineEpisodeRef = useRef(false);
  const retryRefreshRef = useRef<() => void>(() => {});

  const clearRefreshError = useCallback(() => {
    refreshFailedRef.current = false;
    refreshToastRef.current?.dismiss();
    refreshToastRef.current = null;
  }, []);

  const applyResult = useCallback((data: AppointmentDetail | null, request: number) => {
    if (!aliveRef.current || request !== requestRef.current) return;
    setRetrying(false);
    if (!data) {
      loadedRef.current = false;
      clearRefreshError();
      setPhase("notFound");
      return;
    }
    loadedRef.current = true;
    setAppt(data);
    clearRefreshError();
    setPhase("ready");
  }, [clearRefreshError]);

  const applyError = useCallback((e: unknown, request: number) => {
    if (!aliveRef.current || request !== requestRef.current) return;
    setRetrying(false);
    loadedRef.current = false;
    setPhase(e instanceof ApiError && e.status === 404 ? "notFound" : "error");
  }, []);

  const load = useCallback(() => {
    if (!aliveRef.current || navigator.onLine === false) return;
    setRetrying(true);
    const request = ++requestRef.current;
    getAppointment(uuid).then(
      (data) => applyResult(data, request),
      (error) => applyError(error, request),
    );
  }, [uuid, applyResult, applyError]);

  // The successful write confirms this appointment's one-shot eligibility,
  // even when the ordinary detail refresh subsequently cannot complete.
  const markReviewSubmitted = useCallback((submittedUuid: string) => {
    if (!aliveRef.current) return;
    setAppt((current) => current?.uuid !== submittedUuid ? current : {
      ...current,
      reviews: {
        ...current.reviews,
        canLeaveBusinessReview: false,
        professionals: current.reviews.professionals.map((professional) => ({
          ...professional,
          canLeaveReview: false,
        })),
      },
    });
  }, []);

  // Apply the mutation's authoritative result before the network refresh. A
  // failed GET must never resurrect the old time/status after a successful write.
  const refetch = useCallback(async (change?: AppointmentChange) => {
    if (!aliveRef.current || !loadedRef.current) return;
    if (change) setAppt((current) => current ? { ...current, ...change } : current);
    // Every confirmed mutation, including a review with no detail patch, must
    // supersede reads started before the write. Poll/retry callers dedupe below.
    refreshingRef.current = true;
    const request = ++requestRef.current;
    try {
      const data = await getAppointment(uuid);
      if (!aliveRef.current || request !== requestRef.current) return;
      if (!data) { loadedRef.current = false; clearRefreshError(); setPhase("notFound"); return; }
      setAppt(data);
      clearRefreshError();
    } catch (error) {
      if (!aliveRef.current || request !== requestRef.current) return;
      if (error instanceof ApiError && error.status === 404) {
        loadedRef.current = false;
        clearRefreshError();
        setPhase("notFound");
      } else if (navigator.onLine !== false && !refreshFailedRef.current) {
        // Keep loaded details usable, and announce each outage once rather
        // than queueing the same toast on every focus or automatic poll.
        refreshFailedRef.current = true;
        refreshToastRef.current = toast(p.detailRefreshError, "warn", {
          label: p.refresh,
          onClick: () => retryRefreshRef.current(),
        }, "error");
      }
    } finally {
      if (aliveRef.current && request === requestRef.current) {
        refreshingRef.current = false;
      }
    }
  }, [uuid, clearRefreshError, toast, p.detailRefreshError, p.refresh]);

  useEffect(() => {
    retryRefreshRef.current = () => {
      if (refreshingRef.current || navigator.onLine === false) return;
      clearRefreshError();
      void refetch();
    };
  }, [refetch, clearRefreshError]);

  useEffect(() => {
    if (offline && appt && phase === "ready") {
      if (offlineEpisodeRef.current) return;
      offlineEpisodeRef.current = true;
      clearRefreshError();
      offlineToastRef.current = toast(p.detailOffline, "warn", undefined, "error");
    } else {
      offlineEpisodeRef.current = false;
      offlineToastRef.current?.dismiss();
      offlineToastRef.current = null;
    }
  }, [offline, appt, phase, toast, p.detailOffline, clearRefreshError]);

  useEffect(() => {
    const refreshVisible = () => {
      if (document.visibilityState !== "hidden" && navigator.onLine !== false && !refreshingRef.current) {
        if (loadedRef.current) void refetch();
        else load();
      }
    };
    const interval = window.setInterval(refreshVisible, 60_000);
    window.addEventListener("focus", refreshVisible);
    window.addEventListener("online", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshVisible);
      window.removeEventListener("online", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, [refetch, load]);

  useEffect(() => {
    aliveRef.current = true;
    const request = ++requestRef.current;
    getAppointment(uuid).then(
      (data) => applyResult(data, request),
      (error) => applyError(error, request),
    );
    return () => {
      aliveRef.current = false;
      requestRef.current += 1;
      refreshToastRef.current?.dismiss();
      offlineToastRef.current?.dismiss();
    };
  }, [uuid, applyResult, applyError]);

  if (phase === "loading" && !offline) {
    return <DetailLoadingState loadingLabel={t.loading} />;
  }
  if (phase === "notFound") {
    return (
      <NotFoundState t={t} />
    );
  }
  if (phase === "error" || !appt) {
    return (
      <ErrorState
        t={t}
        errorsT={dictionary.errors}
        onRetry={load}
        retrying={retrying}
        offline={offline}
      />
    );
  }

  return (
    <AppointmentActionsProvider onChanged={refetch} onReviewSubmitted={markReviewSubmitted}>
      <ReviewIntent appt={appt} requested={reviewRequested} onConsumed={onConsumeReview} />
      <DetailBody
        t={t}
        appt={appt}
        locale={locale}
        onOpenApp={enteredWithReview ? onOpenApp : undefined}
      />
    </AppointmentActionsProvider>
  );
}
