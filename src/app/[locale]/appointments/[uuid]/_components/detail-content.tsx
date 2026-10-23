"use client";

import { useTranslation } from "@/i18n/useTranslation";
import type { Dictionary } from "@/i18n/dictionaries";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import { format } from "@/i18n/format";
import { localeHref } from "@/i18n/routes";
import { useAuth } from "@/lib/auth/useAuth";
import { useAuthModal } from "@/components/shell/auth-modal-provider";
import { Button, Icon, InlineError, SignedOutGate, Skeleton } from "@/components/ui";
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
  formatApptPrice,
  type StatusTone,
  type Tense,
} from "../../_components/vm";
import {
  AppointmentActionsProvider,
  useAppointmentActions,
} from "../../_components/actions/actions-provider";
import { canCancel, canLeaveReview, canReschedule, staffDisplayName, type AppointmentChange } from "../../_components/actions/shared";
import { useAppointmentClock } from "../../_components/use-appointment-clock";
import { downloadAppointmentCalendar } from "./calendar";
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
  if (tense === "now") return t.relative.inProgress;
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
  return <div className={`zw-container ${styles.page}`} aria-busy="true">
    <div className={styles.navigation}><a href={localeHref(locale, "appointments")} className={`tap ${styles.back}`}><Icon name="back" size={14} />{t.back}</a></div>
    <div className={styles.hero}>
      <div className={`${styles.kicker} ${styles.heroKicker}`}>{p.detailKicker}</div>
      <div className={styles.heroTop} aria-hidden="true"><Skeleton w={100} h={19} r={4} /></div>
      <div className={styles.title} aria-hidden="true"><Skeleton w="min(520px, 90%)" h="1.12em" /></div>
      <div className={styles.heroMeta} aria-hidden="true"><Skeleton w="min(380px, 90%)" h={22} /><Skeleton w={130} h={18} /></div>
    </div>
    <div className={styles.columns}>
      <div className={styles.content}>
        <Section label={t.sections.where}><div className={styles.venue} aria-hidden="true"><div className={styles.venuePhoto}><Skeleton h="100%" r={0} style={{ minHeight: "inherit" }} /></div><div className={styles.venueContent} style={{ flex: 1 }}><Skeleton w="70%" h={16} /><Skeleton w="90%" h={22} /><Skeleton w="80%" h={18} /></div></div></Section>
        <Section label={t.sections.service}><div className={styles.surface} aria-hidden="true"><div className={styles.serviceList}><div className={styles.serviceItem}><Skeleton w="75%" h={22} /><Skeleton w="30%" h={17} style={{ marginTop: 10 }} /></div></div><div className={styles.total}><Skeleton w="45%" h={30} /><Skeleton w="25%" h={28} /></div></div></Section>
      </div>
      <div className={styles.rail} aria-hidden="true"><div className={styles.railCard}>
        <div className={styles.railHeading}>{p.managementTitle}</div>
        <div className={styles.railPrimary}><Skeleton h={49} r={999} /></div>
        <div className={styles.railRows}>{[0, 1, 2].map((index) => <div className={styles.manageRow} key={index}><Skeleton w={16} h={16} r={4} /><Skeleton w="65%" h={20} /></div>)}</div>
        <div className={styles.railSecondary}><div className={styles.manageRow}><Skeleton w={16} h={16} r={4} /><Skeleton w="55%" h={20} /></div></div>
      </div></div>
    </div>
    <p role="status" className="sr-only">{loadingLabel}</p>
  </div>;
}

// ── Error state (with retry) ─────────────────────────────────────────────────

function ErrorState({
  t,
  errorsT,
  onRetry,
  retrying,
}: {
  t: ApptDict;
  errorsT: Dictionary["errors"];
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div
      className="zw-container"
      style={{ paddingTop: 60, paddingBottom: 60, textAlign: "center", width: "100%" }}
    >
      <span
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--c-mist)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="warn" size={24} color="var(--c-700)" />
      </span>
      <p
        className="txt-pretty"
        style={{
          margin: "18px auto 22px",
          fontSize: 15.5,
          lineHeight: 1.6,
          color: "var(--c-700)",
          maxWidth: 400,
        }}
      >
        {t.errorLoading}
      </p>
      <Button loading={retrying}
          kind="primary" size="lg" onClick={onRetry} disabled={retrying}>
        {errorsT.retry}
      </Button>
    </div>
  );
}

// ── Not-found state ───────────────────────────────────────────────────────────

function NotFoundState({ t, onBack }: { t: ApptDict; onBack: () => void }) {
  return (
    <div className="zw-container" style={{ paddingTop: 60, textAlign: "center", width: "100%" }}>
      <div
        style={{
          fontSize: 19,
          fontWeight: 600,
          color: "var(--c-900)",
          marginBottom: 14,
        }}
      >
        {t.notFound}
      </div>
      <Button kind="primary" onClick={onBack}>
        {t.backToAppointments}
      </Button>
    </div>
  );
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

function ActionRail({ t, appt, tense, tone, onBookAgain, bookingAgain }: {
  t: ApptDict; appt: AppointmentDetail; tense: Tense; tone: StatusTone;
  onBookAgain: () => void; bookingAgain: boolean;
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
  const showPrimary = upcoming ? !!directionsHref : canBookAgain;
  const reviewAllowed = canLeaveReview(appt);
  const showRows = reviewAllowed || !!venue.phone || upcoming;
  const exportCalendar = () => downloadAppointmentCalendar({
    uuid: appt.uuid, title: appt.bookedItemName, startsAt: appt.scheduled_at, endsAt: appt.ends_at,
    updatedAt: appt.updatedAt, pending: appt.status === "pending", venue: venue.name, address: venue.address,
  });
  return <div className={styles.railCard}>
    <h2 className={styles.railHeading}>{p.managementTitle}</h2>
    {showPrimary && <div className={styles.railPrimary}>
      {upcoming ? <a href={directionsHref!} target="_blank" rel="noopener noreferrer" className={`tap zw-btn ${styles.primaryLink}`}><Icon name="nav" size={16} />{t.getDirections}</a> : <Button kind="accent" size="lg" onClick={onBookAgain} loading={bookingAgain} disabled={bookingAgain}><Icon name="rebook" size={16} />{t.bookAgain}</Button>}
    </div>}
    {showRows && <div className={styles.railRows}>
      {reviewAllowed && <ManageRow icon="star" label={t.leaveReview} onClick={() => openReview(appt)} />}
      {venue.phone && <ManageRow icon="phone" label={t.callVenue} href={`tel:${venue.phone}`} />}
      {upcoming && <>
        <ManageRow icon="clock" label={!appt.location?.allowCustomerReschedule ? t.rescheduleUnavailable : rescheduleAllowed ? t.reschedule : t.rescheduleWindowPassed} hint={rescheduleAllowed ? undefined : t.contactBusinessDirectly} disabled={!rescheduleAllowed} onClick={() => openReschedule(appt)} />
        <ManageRow icon="x" label={!appt.location?.allowCustomerCancellation ? t.cancelUnavailable : cancelAllowed ? t.cancelAppointment : t.cancelWindowPassed} hint={cancelAllowed ? undefined : t.contactBusinessDirectly} danger disabled={!cancelAllowed} onClick={() => openCancel(appt)} />
      </>}
    </div>}
    <div className={styles.railSecondary}>
      {upcoming && <ManageRow icon="cal" label={p.addToCalendar} onClick={exportCalendar} />}
      <ManageRow icon="reply" label={p.reportIssue} onClick={() => openReport(appt)} />
    </div>
  </div>;
}

function DetailBody({ t, appt, locale, onOpenApp, refreshError, refreshing, onRefresh }: {
  t: ApptDict; appt: AppointmentDetail; locale: Locale; onOpenApp?: () => void;
  refreshError: boolean; refreshing: boolean; onRefresh: () => void;
}) {
  const p = useTranslation().dict.appointmentPage;
  const now = useAppointmentClock();
  const { rebook, pending: rebooking } = useRebook();
  const tz = apptTimeZone(appt.location?.timezone, appt.business?.timezone);
  const tense = deriveTense(appt.scheduled_at, appt.ends_at, appt.status, now, tz);
  const tone = apptStatusTone(appt.status, tense);
  const services = [appt.primaryItemName || appt.bookedItemName, ...appt.additionalServices].filter(Boolean);
  const date = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz }).format(new Date(appt.scheduled_at));
  const relative = relativeLabel(t, tense, appt.scheduled_at, tz, now);
  const venue = appointmentVenue(appt);
  const venueHref = locationHref(locale, appt.location);
  const directionsHref = venue.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}` : null;
  const professionals = appointmentProfessionals(appt);
  const businessReview = appt.reviews.business;
  const professionalReviews = appt.reviews.professionals.filter((professional) => professional.review);
  const hasReviews = !!businessReview || professionalReviews.length > 0;
  return <div className={`zw-container ${styles.page}`}>
    <div className={styles.navigation}>
      <a href={localeHref(locale, "appointments")} className={`tap ${styles.back}`}><Icon name="back" size={14} />{t.back}</a>
      {onOpenApp && <Button kind="ghost" size="sm" onClick={onOpenApp}>{t.openApp}</Button>}
    </div>
    <header className={styles.hero}>
      <div className={`${styles.kicker} ${styles.heroKicker}`}>{p.detailKicker}</div>
      <div className={styles.heroTop}>
        <StampPill t={t} tone={tone} status={appt.status} />
        {relative && <span className={styles.relative}>{relative}</span>}
        {appt.business?.name && (venueHref ? <a href={venueHref} className={styles.businessLink}>{format(t.atBusiness, { business: appt.business.name })}</a> : <span className={styles.businessLink}>{format(t.atBusiness, { business: appt.business.name })}</span>)}
      </div>
      <h1 className={styles.title}>{services[0]}</h1>
      {services.slice(1).map((service, index) => <div className={styles.additionalService} key={`${index}:${service}`}>+ {service}</div>)}
      <div className={styles.heroMeta}>
        <div className={styles.date}><Icon name="cal" size={16} color="var(--p-600)" /><time dateTime={appt.scheduled_at}>{date}</time><span>· {apptTime(appt.scheduled_at, locale, tz)} – {apptTime(appt.ends_at, locale, tz)}</span></div>
        <span className={styles.meta}>{formatDuration(Number(appt.duration))} · {formatApptPrice(appt.price, appt.currency, locale, t.free)}</span>
      </div>
      {appt.status === "pending" && <PendingBanner t={t} appt={appt} tense={tense} />}
      {tense === "now" && <LiveStrip t={t} appt={appt} />}
      <RecurringNote t={t} appt={appt} />
    </header>
    {refreshError && <div className={styles.refreshError}><InlineError>{p.refreshError}</InlineError><Button kind="secondary" size="sm" loading={refreshing} onClick={onRefresh}>{p.refresh}</Button></div>}
    <div className={styles.columns}>
      <div className={styles.content}>
        <Section label={t.sections.where}><WhereCard t={t} appt={appt} locale={locale} tense={tense} tone={tone} /></Section>
        <Section label={services.length > 1 ? t.sections.services : t.sections.service}><ServiceCard t={t} appt={appt} locale={locale} /></Section>
        {appt.notes && <Section label={t.sections.note}><NotesCard notes={appt.notes} /></Section>}
        {professionals.length > 0 && <Section label={t.sections.with}><WithCard t={t} appt={appt} locale={locale} /></Section>}
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
      <aside className={styles.rail} aria-label={p.managementTitle}>
        <ActionRail t={t} appt={appt} tense={tense} tone={tone} onBookAgain={() => void rebook(appt)} bookingAgain={rebooking} />
      </aside>
    </div>
    <MobileBar t={t} appt={appt} locale={locale} tense={tense} tone={tone} directionsHref={directionsHref} onBookAgain={() => void rebook(appt)} bookingAgain={rebooking} />
  </div>;
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
  const { status, user } = useAuth();
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

  if (status === "unauthenticated" || status === "error") {
    return (
      <SignedOutGate
        icon="cal"
        title={t.signedOutTitle}
        body={t.signedOutBody}
        onCta={() => openAuthModal(
          "signin",
          `${window.location.pathname}${window.location.search}${window.location.hash}`,
        )}
        secondaryLabel={reviewRequested ? t.openApp : t.explorePlaces}
        onSecondary={reviewRequested ? openApp : () => router.push(localeHref(locale, "search"))}
      />
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
  const router = useRouter();
  const [appt, setAppt] = useState<AppointmentDetail | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [retrying, setRetrying] = useState(false);
  const [enteredWithReview] = useState(reviewRequested);
  const [refreshError, setRefreshError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadedRef = useRef(false);
  const refreshingRef = useRef(false);
  const aliveRef = useRef(false);
  const requestRef = useRef(0);

  const applyResult = useCallback((data: AppointmentDetail | null, request: number) => {
    if (!aliveRef.current || request !== requestRef.current) return;
    setRetrying(false);
    if (!data) {
      setPhase("notFound");
      return;
    }
    loadedRef.current = true;
    setAppt(data);
    setRefreshError(false);
    setPhase("ready");
  }, []);

  const applyError = useCallback((e: unknown, request: number) => {
    if (!aliveRef.current || request !== requestRef.current) return;
    setRetrying(false);
    setPhase(e instanceof ApiError && e.status === 404 ? "notFound" : "error");
  }, []);

  const load = useCallback(() => {
    if (!aliveRef.current) return;
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
    refreshingRef.current = true;
    setRefreshing(true);
    const request = ++requestRef.current;
    try {
      const data = await getAppointment(uuid);
      if (!aliveRef.current || request !== requestRef.current) return;
      if (!data) { setPhase("notFound"); return; }
      setAppt(data);
      setRefreshError(false);
    } catch (error) {
      if (!aliveRef.current || request !== requestRef.current) return;
      if (error instanceof ApiError && error.status === 404) setPhase("notFound");
      else setRefreshError(true);
    } finally {
      if (aliveRef.current && request === requestRef.current) {
        refreshingRef.current = false;
        setRefreshing(false);
      }
    }
  }, [uuid]);

  useEffect(() => {
    const refreshVisible = () => {
      if (document.visibilityState !== "hidden" && !refreshingRef.current) void refetch();
    };
    window.addEventListener("focus", refreshVisible);
    window.addEventListener("online", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      window.removeEventListener("focus", refreshVisible);
      window.removeEventListener("online", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, [refetch]);

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
    };
  }, [uuid, applyResult, applyError]);

  if (phase === "loading") {
    return <DetailLoadingState loadingLabel={t.loading} />;
  }
  if (phase === "notFound") {
    return (
      <NotFoundState t={t} onBack={() => router.push(localeHref(locale, "appointments"))} />
    );
  }
  if (phase === "error" || !appt) {
    return (
      <ErrorState
        t={t}
        errorsT={dictionary.errors}
        onRetry={load}
        retrying={retrying}
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
        refreshError={refreshError}
        refreshing={refreshing}
        onRefresh={() => void refetch()}
      />
    </AppointmentActionsProvider>
  );
}
