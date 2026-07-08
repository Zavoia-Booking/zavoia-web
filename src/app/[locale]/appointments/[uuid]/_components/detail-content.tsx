"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import { dictionaries, format } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { useAuth } from "@/lib/auth/useAuth";
import { useAuthModal } from "@/components/shell/auth-modal-provider";
import { Button, Icon, SignedOutGate, Skeleton, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api/http";
import { getAppointment } from "@/lib/api/marketplace/appointments";
import { useRebook } from "@/lib/booking";
import type { AppointmentDetail } from "@/lib/api/marketplace/types";
import { formatDuration } from "@/lib/format/money-time";
import {
  apptStatusTone,
  apptTime,
  deriveTense,
  formatApptPrice,
  type StatusTone,
  type Tense,
} from "../../_components/vm";
import {
  AppointmentActionsProvider,
  useAppointmentActions,
} from "../../_components/actions/actions-provider";
import {
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

type ApptDict = (typeof dictionaries)[Locale]["appointmentDetail"];

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
  now: Date = new Date(),
): string | null {
  if (tense === "now") return t.relative.inProgress;
  if (tense === "today") return t.relative.today;
  if (tense !== "future") return null;

  // Whole calendar days from `now`'s start-of-day to the appointment's.
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const sched = new Date(scheduledAt);
  const days = Math.round(
    (startOfDay(sched) - startOfDay(now)) / 86_400_000,
  );
  if (days <= 1) return t.relative.tomorrow;
  if (days <= 6) return format(t.relative.inDays, { n: String(days) });
  return null;
}

// ── Loading skeleton ────────────────────────────────────────────────────────

function LoadingState({ loadingLabel }: { loadingLabel: string }) {
  return (
    <div
      className="zw-container"
      style={{ paddingTop: 40, paddingBottom: 40, width: "100%" }}
      aria-busy="true"
    >
      <Skeleton w={180} h={24} r={8} />
      <div style={{ marginTop: 24 }}>
        <Skeleton w="70%" h={48} r={12} />
      </div>
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 24 }}>
        <Skeleton w="100%" h={150} r={18} />
        <Skeleton w="100%" h={200} r={18} />
      </div>
      <p className="sr-only">{loadingLabel}</p>
    </div>
  );
}

// ── Error state (with retry) ─────────────────────────────────────────────────

function ErrorState({
  t,
  onRetry,
  retrying,
}: {
  t: ApptDict;
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
      <Button kind="primary" size="lg" onClick={onRetry} disabled={retrying}>
        {retrying ? <Spinner size={16} color="#fff" /> : t.back}
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

// ── Action rail + manage rows — MUST be rendered below the actions provider ──

function RailButton({
  kind,
  icon,
  children,
  href,
  onClick,
  disabled,
}: {
  kind: "primary" | "secondary" | "accent";
  icon: Parameters<typeof Icon>[0]["name"];
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const color = kind === "secondary" ? "var(--c-800)" : "#fff";
  const content = (
    <>
      <Icon name={icon} size={16} color={color} />
      {children}
    </>
  );
  if (href) {
    const look =
      kind === "primary"
        ? { background: "var(--c-ink)", color: "#fff", border: "1px solid var(--c-ink)" }
        : kind === "accent"
          ? { background: "var(--p-500)", color: "#fff", border: "1px solid var(--p-500)" }
          : { background: "#fff", color: "var(--c-900)", border: "1px solid rgba(28,28,26,0.14)" };
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="tap zw-btn"
        style={{
          ...look,
          width: "100%",
          padding: "15px 28px",
          fontSize: 16,
          fontWeight: 600,
          borderRadius: "var(--r-full)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          textDecoration: "none",
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
        }}
      >
        {content}
      </a>
    );
  }
  return (
    <Button
      kind={kind}
      size="lg"
      onClick={onClick}
      disabled={disabled}
      style={{ width: "100%" }}
    >
      {content}
    </Button>
  );
}

function ManageRow({
  icon,
  label,
  danger,
  disabled,
  onClick,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={"tap" + (disabled ? "" : " zw-hover-row")}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        background: "transparent",
        border: 0,
        cursor: disabled ? "default" : "pointer",
        textAlign: "left",
        padding: "12px 14px",
        borderRadius: 11,
        fontSize: 14,
        fontWeight: 500,
        opacity: disabled ? 0.4 : 1,
        color: danger ? "var(--s-warning-600)" : "var(--c-800)",
        fontFamily: "inherit",
      }}
    >
      <Icon name={icon} size={16} color={danger ? "var(--s-warning-600)" : "var(--c-600)"} />
      {label}
    </button>
  );
}

/**
 * Builds a Google Calendar "add event" template URL from the appointment.
 * Format: YYYYMMDDTHHMMSSZ/YYYYMMDDTHHMMSSZ in UTC.
 */
function calendarUrl(appt: AppointmentDetail): string {
  const fmt = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const title = appt.primaryItemName || appt.bookedItemName || "Appointment";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmt(appt.scheduled_at)}/${fmt(appt.ends_at)}`,
  });
  const where = appt.location?.address ?? appt.location?.name ?? "";
  if (where) params.set("location", where);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function ActionRail({
  t,
  appt,
  locale,
  tense,
  tone,
}: {
  t: ApptDict;
  appt: AppointmentDetail;
  locale: Locale;
  tense: Tense;
  tone: StatusTone;
}) {
  const { openReview, openReschedule, openCancel } = useAppointmentActions();
  const { rebook, pending: rebooking } = useRebook();
  const loc = appt.location;
  const biz = appt.business;
  const upcomingOrLive = tense === "future" || tense === "today" || tense === "now";
  const isPast = tense === "past";
  const cancelled = tone === "warning" || tone === "error";

  const address = loc?.address ?? null;
  const directionsHref = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;
  const phone = loc?.phone ?? biz?.phone ?? null;
  const calHref = calendarUrl(appt);
  // "Book again" re-opens the booking drawer pre-filled from this appointment
  // via useRebook (which re-fetches the live listing for authoritative pricing +
  // the booking listingId/timezone). It falls back to the business detail page
  // when the listing can't be loaded or no service still maps. Only offer it when
  // there is a resolvable location id to rebook against.
  const canBookAgain = loc?.id != null;

  const canReview =
    appt.reviews.canLeaveBusinessReview ||
    appt.reviews.professionals.some((p) => p.canLeaveReview);

  const showManage = upcomingOrLive && !cancelled;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid rgba(28,28,26,0.09)",
        borderRadius: 20,
        boxShadow: "var(--sh-md)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "18px 18px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 11,
              background: "var(--c-shade)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="cal" size={18} color="var(--p-600)" />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--c-900)", letterSpacing: "-0.015em" }}>
              {new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" }).format(
                new Date(appt.scheduled_at),
              )}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--c-600)",
                marginTop: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {apptTime(appt.scheduled_at, locale)} – {apptTime(appt.ends_at, locale)}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {upcomingOrLive && !cancelled && (
            <>
              {directionsHref && (
                <RailButton kind="primary" icon="nav" href={directionsHref}>
                  {t.getDirections}
                </RailButton>
              )}
              {phone && (
                <RailButton kind="secondary" icon="phone" href={`tel:${phone}`}>
                  {t.callVenue}
                </RailButton>
              )}
            </>
          )}
          {isPast && !cancelled && (
            <>
              {canReview && (
                <RailButton kind="accent" icon="star" onClick={() => openReview(appt)}>
                  {t.leaveReview}
                </RailButton>
              )}
              {canBookAgain && (
                <RailButton
                  kind={canReview ? "secondary" : "accent"}
                  icon="rebook"
                  onClick={() => void rebook(appt)}
                  disabled={rebooking}
                >
                  {t.bookAgain}
                </RailButton>
              )}
            </>
          )}
          {cancelled && canBookAgain && (
            <RailButton
              kind="accent"
              icon="rebook"
              onClick={() => void rebook(appt)}
              disabled={rebooking}
            >
              {t.bookAgain}
            </RailButton>
          )}
        </div>
      </div>

      {showManage && (
        <>
          <div style={{ height: 1, background: "rgba(28,28,26,0.08)" }} />
          <div style={{ padding: 6 }}>
            <ManageRow
              icon="clock"
              label={loc?.allowCustomerReschedule ? t.reschedule : t.rescheduleUnavailable}
              disabled={!loc?.allowCustomerReschedule}
              onClick={() => openReschedule(appt)}
            />
            <a
              href={calHref}
              target="_blank"
              rel="noopener noreferrer"
              className="tap zw-hover-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                background: "transparent",
                border: 0,
                textDecoration: "none",
                padding: "12px 14px",
                borderRadius: 11,
                fontSize: 14,
                fontWeight: 500,
                color: "var(--c-800)",
              }}
            >
              <Icon name="cal" size={16} color="var(--c-600)" />
              {t.addToCalendar}
            </a>
            <ManageRow
              icon="x"
              label={t.cancelAppointment}
              danger
              disabled={!loc?.allowCustomerCancellation}
              onClick={() => openCancel(appt)}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ── Detail body (rendered under the provider) ───────────────────────────────

function DetailBody({
  t,
  appt,
  locale,
}: {
  t: ApptDict;
  appt: AppointmentDetail;
  locale: Locale;
}) {
  const router = useRouter();
  const { openReview } = useAppointmentActions();

  const tense = deriveTense(appt.scheduled_at, appt.ends_at, appt.status);
  const tone = apptStatusTone(appt.status, tense);
  const cancelled = tone === "warning" || tone === "error";

  const services = [appt.primaryItemName, ...appt.additionalServices].filter(Boolean);
  const time = apptTime(appt.scheduled_at, locale);
  const endTime = apptTime(appt.ends_at, locale);
  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(appt.scheduled_at));

  const relLabel = relativeLabel(t, tense, appt.scheduled_at);
  const heroChip =
    formatDuration(Number(appt.duration)) +
    " · " +
    formatApptPrice(appt.price, appt.currency, locale, t.free);

  const bizName = appt.business?.name ?? "";
  // Resolve via the location's numeric id (see ActionRail note); null when absent.
  const bizHref =
    appt.location?.id != null
      ? localeHref(locale, "business", String(appt.location.id))
      : undefined;

  const directionsHref = appt.location?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appt.location.address)}`
    : null;

  const bizReview = appt.reviews.business;
  const proReviews = appt.reviews.professionals.filter((p) => p.review);
  const hasReviews = !!bizReview || proReviews.length > 0;

  return (
    <div className="zw-container" style={{ paddingTop: 22, width: "100%" }}>
      <button
        type="button"
        className="tap"
        onClick={() => router.push(localeHref(locale, "appointments"))}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 22,
          background: "transparent",
          border: 0,
          cursor: "pointer",
          fontSize: 13.5,
          fontWeight: 600,
          color: "var(--c-600)",
          padding: "4px 0",
          fontFamily: "inherit",
        }}
      >
        <Icon name="back" size={14} color="var(--c-600)" />
        {t.back}
      </button>

      {/* HERO */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <StampPill t={t} tone={tone} status={appt.status} />
        {relLabel && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--c-600)",
              letterSpacing: "0.02em",
            }}
          >
            {relLabel}
          </span>
        )}
        <span style={{ flex: 1 }} />
        {appt.business &&
          (bizHref ? (
            <a
              href={bizHref}
              className="tap"
              style={{
                background: "transparent",
                border: 0,
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--c-600)",
                textDecoration: "none",
              }}
            >
              {format(t.atBusiness, { business: bizName })}
            </a>
          ) : (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--c-600)",
              }}
            >
              {format(t.atBusiness, { business: bizName })}
            </span>
          ))}
      </div>
      <h1
        className="txt-balance"
        style={{
          margin: 0,
          fontSize: "clamp(28px, 3.4vw, 44px)",
          fontWeight: 600,
          letterSpacing: "-0.038em",
          lineHeight: 1.04,
          color: cancelled ? "var(--c-700)" : "var(--c-900)",
        }}
      >
        {services[0] ?? appt.bookedItemName}
      </h1>
      {services.slice(1).map((s, i) => (
        <div
          key={i}
          style={{
            fontSize: "clamp(19px, 2.2vw, 26px)",
            fontWeight: 500,
            letterSpacing: "-0.025em",
            color: "var(--c-600)",
            marginTop: 4,
            lineHeight: 1.15,
          }}
        >
          <span style={{ color: "var(--c-400)", fontWeight: 400 }}>+ </span>
          {s}
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontSize: 15,
            fontWeight: 600,
            color: "var(--c-900)",
          }}
        >
          <Icon name="cal" size={16} color="var(--p-600)" />
          {dateLabel} · {time} – {endTime}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--c-600)",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
          }}
        >
          {heroChip}
        </span>
      </div>

      {tone === "pending" && <PendingBanner t={t} appt={appt} />}
      {tense === "now" && <LiveStrip t={t} appt={appt} />}
      <RecurringNote t={t} appt={appt} />

      <div style={{ height: 28 }} />
      <div style={{ height: 1, background: "rgba(28,28,26,0.08)" }} />

      {/* BODY */}
      <div
        data-biz-cols="1"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 340px",
          gap: "clamp(28px, 4vw, 56px)",
          alignItems: "start",
          marginTop: 4,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <Section label={t.sections.where}>
            <WhereCard t={t} appt={appt} locale={locale} tense={tense} tone={tone} />
          </Section>

          <Section label={services.length > 1 ? t.sections.services : t.sections.service}>
            <ServiceCard t={t} appt={appt} locale={locale} />
          </Section>

          {appt.notes && (
            <Section label={t.sections.note}>
              <NotesCard notes={appt.notes} />
            </Section>
          )}

          {appt.staff_users?.[0] && (
            <Section label={t.sections.with}>
              <WithCard staff={appt.staff_users} />
            </Section>
          )}

          {hasReviews && (
            <Section label={t.sections.yourReview}>
              {bizReview && (
                <ReviewCard
                  t={t}
                  rating={Number(bizReview.rating)}
                  comment={bizReview.comment}
                  onEdit={() => openReview(appt)}
                />
              )}
              {proReviews.map((p) => (
                <ReviewCard
                  key={p.staffId}
                  t={t}
                  rating={Number(p.review!.rating)}
                  comment={p.review!.comment}
                  onEdit={() => openReview(appt)}
                />
              ))}
            </Section>
          )}

          {appt.business?.description &&
            (appt.business.logo || appt.location?.profileImage) && (
              <Section label={t.sections.about}>
                <AboutCard t={t} appt={appt} locale={locale} />
              </Section>
            )}

          <CloserBand t={t} appt={appt} locale={locale} tense={tense} tone={tone} />
        </div>

        {/* Right rail — desktop sticky */}
        <div className="zw-only-desktop" style={{ position: "sticky", top: "calc(var(--nav-h) + 18px)" }}>
          <ActionRail t={t} appt={appt} locale={locale} tense={tense} tone={tone} />
        </div>
      </div>

      {/* Mobile sticky bar */}
      <MobileBar
        t={t}
        appt={appt}
        locale={locale}
        tense={tense}
        tone={tone}
        directionsHref={directionsHref}
      />
      <div className="zw-only-mobile" style={{ height: 64 }} />
    </div>
  );
}

// ── Top-level data + gating + provider mount ────────────────────────────────

type Phase = "loading" | "ready" | "notFound" | "error";

export function DetailContent({ locale, uuid }: { locale: Locale; uuid: string }) {
  const t = dictionaries[locale].appointmentDetail;
  const router = useRouter();
  const { status } = useAuth();
  const { openAuthModal } = useAuthModal();

  const [appt, setAppt] = useState<AppointmentDetail | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");

  const authed = status === "authenticated";
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // Resolve a fetch outcome to the next phase. setState lives only in the
  // promise callbacks below (never synchronously in an effect body).
  const applyResult = useCallback((data: AppointmentDetail | null) => {
    if (!aliveRef.current) return;
    if (!data) {
      setPhase("notFound");
      return;
    }
    setAppt(data);
    setPhase("ready");
  }, []);

  const applyError = useCallback((e: unknown) => {
    if (!aliveRef.current) return;
    // A clearly-absent appointment (404) → the not-found block; anything else
    // (network, 5xx, auth) → the retryable error state.
    if (e instanceof ApiError && e.status === 404) {
      setPhase("notFound");
    } else {
      setPhase("error");
    }
  }, []);

  // `load` is used by the retry handler (an event handler — allowed to setState).
  const load = useCallback(() => {
    getAppointment(uuid).then(applyResult, applyError);
  }, [uuid, applyResult, applyError]);

  // `refetch` re-runs the fetch silently in the background (keeps the current
  // body mounted) and is what the actions provider calls after cancel /
  // reschedule / review succeed.
  const refetch = useCallback(() => {
    return getAppointment(uuid).then(
      (data) => {
        if (aliveRef.current && data) setAppt(data);
      },
      () => {
        // Swallow refetch failures — the modal already toasts; keep current view.
      },
    );
  }, [uuid]);

  useEffect(() => {
    if (!authed) return;
    // setState is performed inside the promise callbacks, not synchronously.
    getAppointment(uuid).then(applyResult, applyError);
  }, [authed, uuid, applyResult, applyError]);

  // ── Auth gating ──
  if (status === "idle" || status === "loading") {
    return <LoadingState loadingLabel={t.loading} />;
  }

  if (status === "unauthenticated" || status === "error") {
    return (
      <SignedOutGate
        icon="cal"
        title={t.signedOutTitle}
        body={t.signedOutBody}
        onCta={() => openAuthModal("signin")}
        secondaryLabel={t.explorePlaces}
        onSecondary={() => router.push(localeHref(locale, "search"))}
      />
    );
  }

  // ── Authenticated data states ──
  if (phase === "loading") {
    return <LoadingState loadingLabel={t.loading} />;
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
        onRetry={() => {
          setPhase("loading");
          load();
        }}
        retrying={false}
      />
    );
  }

  return (
    <AppointmentActionsProvider onChanged={refetch}>
      <DetailBody t={t} appt={appt} locale={locale} />
    </AppointmentActionsProvider>
  );
}
