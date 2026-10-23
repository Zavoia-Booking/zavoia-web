"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import { format } from "@/i18n/format";
import { localeHref } from "@/i18n/routes";
import { useAuth } from "@/lib/auth/useAuth";
import { useAuthModal } from "@/components/shell/auth-modal-provider";
import { Avatar, Button, Icon, Img, SignedOutGate, Skeleton } from "@/components/ui";
import { InlineError } from "@/components/ui/inline-error";
import { listAppointments } from "@/lib/api/marketplace/appointments";
import type {
  AppointmentList,
  AppointmentListItem,
  ListAppointmentsParams,
  PastAppointmentsGroup,
} from "@/lib/api/marketplace/types";
import { formatDuration } from "@/lib/format/money-time";
import {
  STATUS_DOT_COLOR,
  apptDateParts,
  apptTime,
  deriveTense,
  formatApptPrice,
  timeUntil,
  wallDateKey,
  type TimeUntil,
} from "./vm";
import { useAppointmentClock } from "./use-appointment-clock";
import styles from "./appointments.module.css";

type ApptDict = Dictionary["appointments"];
type PageDict = Dictionary["appointmentPage"];
type Filter = "all" | "upcoming" | "past" | "cancelled" | "no_show";
const PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

function timeUntilLabel(tu: TimeUntil, t: ApptDict): string {
  switch (tu.kind) {
    case "live": return t.timeUntil.live;
    case "pending": return t.timeUntil.awaiting;
    case "soon": return tu.variant === "starting"
      ? t.timeUntil.starting
      : format(t.timeUntil.inMinutes, { n: String(tu.value) });
    case "today": return format(t.timeUntil.inHours, { n: String(tu.value) });
    case "future": {
      if (tu.variant === "tomorrow") return t.timeUntil.tomorrow;
      const labels = tu.variant === "days"
        ? [t.timeUntil.inDaysOne, t.timeUntil.inDaysMany]
        : tu.variant === "weeks"
          ? [t.timeUntil.inWeeksOne, t.timeUntil.inWeeksMany]
          : [t.timeUntil.inMonthsOne, t.timeUntil.inMonthsMany];
      return format(labels[tu.value === 1 ? 0 : 1], { n: String(tu.value) });
    }
  }
}

function TicketCard({ a, locale, t, page, now }: {
  a: AppointmentListItem;
  locale: Locale;
  t: ApptDict;
  page: PageDict;
  now: Date;
}) {
  const tz = a.location.timezone ?? undefined;
  const tense = deriveTense(a.scheduledAt, a.endsAt, a.status, now, tz);
  const { dow, day, mon } = apptDateParts(a.scheduledAt, locale, tz);
  const title = a.bookingType === "bundle"
    ? a.bookedItemName
    : [a.primaryItemName, a.additionalItemsCount > 0
      ? format(page.moreItems, { n: String(a.additionalItemsCount) })
      : null].filter(Boolean).join(" ");
  const startTime = apptTime(a.scheduledAt, locale, tz);
  const endTime = apptTime(a.endsAt, locale, tz);
  const fullDate = new Intl.DateTimeFormat(locale, {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz,
  }).format(new Date(a.scheduledAt));
  const brandName = a.business?.name?.trim();
  const branchName = a.location.name?.trim();
  const venueName = brandName || branchName || page.venueUnavailable;
  const separateBranch = branchName && brandName && branchName.toLocaleLowerCase(locale) !== brandName.toLocaleLowerCase(locale);
  const venueImage = brandName ? a.business?.logo : a.location.profileImage;
  const staffName = a.staff
    ? [a.staff.firstName, a.staff.lastName].filter(Boolean).join(" ").trim()
    : "";
  const statusLabel = tense === "now" ? page.statusLabels.live : page.statusLabels[a.status];
  const countdown = timeUntil(a.scheduledAt, a.status, tense, now);
  const showCountdown = a.status === "confirmed" && countdown && countdown.kind !== "live";
  const price = formatApptPrice(a.price, a.currency, locale, t.free);
  const accessibleLabel = [title, fullDate, `${startTime} – ${endTime}`, venueName,
    separateBranch ? branchName : null, staffName, statusLabel, price].filter(Boolean).join(", ");

  return (
    <Link
      href={localeHref(locale, "appointments", a.uuid)}
      prefetch={false}
      className={`${styles.card} tap zw-hover-lift`}
      aria-label={accessibleLabel}
    >
      <div className={styles.cardBody}>
        <div className={styles.when}>
          <time dateTime={a.scheduledAt} className={styles.date} aria-label={fullDate}>
            <span className={styles.dateMonth}>{mon}</span>
            <span className={styles.dateDay}>{day}</span>
          </time>
          <div className={styles.whenDetails}>
            <span className={styles.weekday}>{dow}</span>
            <span className={styles.time}>{startTime} – {endTime}</span>
            <span className={styles.status}>
              <span aria-hidden="true" className={styles.statusDot} style={{ background: tense === "now" ? "var(--s-success-600)" : STATUS_DOT_COLOR[a.status] }} />
              {statusLabel}
              {showCountdown && <span className={styles.countdown}>{timeUntilLabel(countdown, t)}</span>}
            </span>
          </div>
        </div>
        <h3 className={styles.service} title={title}>{title}</h3>
        <div className={styles.metadata}>
          <span className={styles.duration}><Icon name="clock" size={13} color="var(--c-600)" />{formatDuration(Number(a.duration))}</span>
          <span className={styles.price}><span aria-hidden="true" className={styles.separator}>·</span>{price}</span>
        </div>
        {staffName && (
          <div className={styles.professional}>
            <Avatar src={a.staff?.profileImage ?? undefined} name={staffName} size={20} />
            <span title={staffName}>{staffName}</span>
          </div>
        )}
      </div>
      <div className={styles.venue}>
        <div className={`${styles.venueImage} zw-zoom-wrap`} aria-hidden="true">
          {venueImage ? (
            <Img src={venueImage} alt="" label={venueName.trim()[0]} style={{ width: "100%", height: "100%" }} />
          ) : <span>{venueName.trim()[0]}</span>}
        </div>
        <span className={styles.venueIdentity}>
          <span className={styles.venueName} title={venueName}>{venueName}</span>
          {separateBranch && <span className={styles.branch} title={branchName}>{branchName}</span>}
        </span>
        <Icon name="chevR" size={16} color="var(--c-600)" />
      </div>
    </Link>
  );
}

function SchedSection({ label, count, open, onToggle, id }: {
  label: string;
  count: number | null;
  open: boolean;
  onToggle: () => void;
  id: string;
}) {
  return (
    <h2 className={styles.sectionHeading}>
      <button type="button" className={`${styles.sectionToggle} tap`} onClick={onToggle}
        aria-expanded={open} aria-controls={id}>
        <span className={styles.sectionTitle}>{label}
          <span className={styles.sectionCount}>{count === null
            ? <span aria-hidden="true"><Skeleton w="2ch" h={12} r={3} /></span>
            : count}</span>
        </span>
        <Icon name={open ? "chevU" : "chevD"} size={16} color="var(--c-600)" />
      </button>
    </h2>
  );
}

function SchedFilters({ value, onChange, counts, t, page, loading = false }: {
  value: Filter;
  onChange: (f: Filter) => void;
  counts: Partial<Record<Filter, number>>;
  t: ApptDict;
  page: PageDict;
  loading?: boolean;
}) {
  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: t.filters.all },
    { id: "upcoming", label: t.filters.upcoming },
    { id: "past", label: t.filters.past },
    { id: "cancelled", label: t.filters.cancelled },
    { id: "no_show", label: t.filters.noShow },
  ];
  return (
    <div className={styles.filters} role="group" aria-label={page.filtersLabel}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        const count = counts[tab.id];
        return (
          <button key={tab.id} type="button" className={`${styles.filter} tap`}
            onClick={() => onChange(tab.id)} aria-pressed={active} disabled={loading}>
            {tab.label}
            {count !== undefined && <span className={styles.filterCount}>{count}</span>}
            {loading && <span aria-hidden="true"><Skeleton w="2ch" h={11} r={3} /></span>}
          </button>
        );
      })}
    </div>
  );
}

function YearSep({ year }: { year: number }) {
  return <div className={styles.year}><span>{year}</span><span aria-hidden="true" /></div>;
}

function SchedGrid({ items, locale, t, page, now, withYears = false }: {
  items: AppointmentListItem[];
  locale: Locale;
  t: ApptDict;
  page: PageDict;
  now: Date;
  withYears?: boolean;
}) {
  const nodes: ReactNode[] = [];
  let lastYear = now.getFullYear();
  for (const a of items) {
    if (withYears) {
      const year = Number(wallDateKey(new Date(a.scheduledAt), a.location.timezone ?? undefined).slice(0, 4));
      if (year !== lastYear) nodes.push(<YearSep key={`year-${year}-${a.uuid}`} year={year} />);
      lastYear = year;
    }
    nodes.push(<TicketCard key={a.uuid} a={a} locale={locale} t={t} page={page} now={now} />);
  }
  return <div className={styles.grid}>{nodes}</div>;
}

function SchedEmpty({ t, onExplore }: { t: ApptDict; onExplore: () => void }) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}><Icon name="cal" size={24} color="var(--c-600)" /></span>
      <h2>{t.empty.title}</h2>
      <p className="txt-pretty">{t.empty.body}</p>
      <Button kind="accent" size="md" onClick={onExplore}>{t.empty.cta}</Button>
    </div>
  );
}

function AppointmentsHeading({ t, upcoming, past, loading }: {
  t: ApptDict;
  upcoming: number | null;
  past: number | null;
  loading: boolean;
}) {
  const count = (n: number | null) => n !== null ? n : loading
    ? <span aria-hidden="true"><Skeleton w="2ch" h={12} r={3} /></span>
    : null;
  return <header className={styles.heading}>
    <h1>{t.title}</h1>
    {(loading || upcoming !== null || past !== null) && (
      <div className={styles.summary}>
        {(loading || upcoming !== null) && <span>{count(upcoming)} {t.upcomingWord}</span>}
        {(loading || past !== null) && <span>{count(past)} {t.pastWord}</span>}
      </div>
    )}
  </header>;
}

function ListLoading({ t, label = t.sectionUpcoming }: { t: ApptDict; label?: string }) {
  return <div aria-busy="true">
    <div aria-hidden="true" inert>
      <SchedSection label={label} count={null} open onToggle={() => {}} id="appointments-loading" />
      <div id="appointments-loading" className={styles.grid}>
        {[0, 1, 2].map((i) => <div key={i} className={styles.card}>
          <div className={styles.cardBody}>
            <div className={styles.when}>
              <Skeleton w={48} h={62} r={10} style={{ flexShrink: 0 }} />
              <div className={styles.whenDetails}>
                <Skeleton w={36} h={11} r={3} />
                <Skeleton w={140} h={19} r={4} />
                <Skeleton w={94} h={14} r={4} />
              </div>
            </div>
            <div className={styles.service}><Skeleton w="82%" h={22} r={4} /></div>
            <div className={styles.metadata}><Skeleton w="52%" h={18} r={4} /></div>
            <div className={styles.professional}><Skeleton w={20} h={20} r={999} /><Skeleton w={90} h={15} r={4} /></div>
          </div>
          <div className={styles.venue}><Skeleton w={36} h={36} r={10} /><Skeleton w="56%" h={18} r={4} /></div>
        </div>)}
      </div>
    </div>
    <p role="status" className="sr-only">{t.loading}</p>
  </div>;
}

function LoadingState({ t, page }: { t: ApptDict; page: PageDict }) {
  return <div className={`zw-container ${styles.page}`} aria-busy="true">
    <AppointmentsHeading t={t} upcoming={null} past={null} loading />
    <SchedFilters value="all" onChange={() => {}} counts={{}} t={t} page={page} loading />
    <ListLoading t={t} />
  </div>;
}

function ErrorState({ t, onRetry, retrying }: { t: ApptDict; onRetry: () => void; retrying: boolean }) {
  return <div className={styles.errorState}>
    <InlineError className="txt-pretty">{t.errorLoading}</InlineError>
    <Button kind="primary" size="md" onClick={onRetry} loading={retrying}>{t.retry}</Button>
  </div>;
}

/** Re-fetch every loaded history page so refreshing never drops paginated rows. */
async function fetchAppointments(filter: Filter, loadedCount: number): Promise<AppointmentList> {
  const wanted = Math.max(PAGE_SIZE, loadedCount);
  const limit = Math.min(MAX_PAGE_SIZE, wanted);
  const params: ListAppointmentsParams = { ...(filter === "all" ? {} : { status: filter }), limit };
  const first = await listAppointments(params);
  if (!first.past) return first;
  const remaining: Promise<AppointmentList>[] = [];
  const count = Math.min(wanted, first.past.total);
  for (let offset = limit; offset < count; offset += MAX_PAGE_SIZE) {
    remaining.push(listAppointments({ ...params, offset, limit: Math.min(MAX_PAGE_SIZE, count - offset) }));
  }
  const rest = await Promise.all(remaining);
  const rows = [...first.past.items, ...rest.flatMap((res) => res.past?.items ?? [])];
  const items = [...new Map(rows.map((a) => [a.uuid, a])).values()];
  return { ...first, past: { ...first.past, items, offset: 0, limit: PAGE_SIZE, hasMore: items.length < first.past.total } };
}

export function AppointmentsContent({ locale }: { locale: Locale }) {
  const { user } = useAuth();
  return <AppointmentsSessionContent key={user?.uuid ?? "anonymous"} locale={locale} />;
}

function AppointmentsSessionContent({ locale }: { locale: Locale }) {
  const { dict } = useTranslation();
  const t = dict.appointments;
  const page = dict.appointmentPage;
  const router = useRouter();
  const { status } = useAuth();
  const { openAuthModal } = useAuthModal();
  const now = useAppointmentClock();
  const [filter, setFilter] = useState<Filter>("all");
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [pastOpen, setPastOpen] = useState(true);
  const [upcoming, setUpcoming] = useState<AppointmentListItem[]>([]);
  const [past, setPast] = useState<PastAppointmentsGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [errored, setErrored] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [loadedFilter, setLoadedFilter] = useState<Filter | null>(null);
  const [counts, setCounts] = useState<Partial<Record<Filter, number>>>({});
  const [loadMoreErrored, setLoadMoreErrored] = useState(false);
  const requestRef = useRef(0);
  const moreRequestRef = useRef(0);
  const busyRef = useRef(false);
  const moreBusyRef = useRef(false);
  const lastStartedRef = useRef(0);
  const snapshotRef = useRef<{ filter: Filter; count: number } | null>(null);
  const authed = status === "authenticated";

  useEffect(() => {
    if (!authed) return;
    let alive = true;
    const request = ++requestRef.current;
    const paginationRequest = moreRequestRef;
    ++moreRequestRef.current;
    moreBusyRef.current = false;
    busyRef.current = true;
    lastStartedRef.current = Date.now();
    const previous = snapshotRef.current;
    const main = fetchAppointments(filter, previous?.filter === filter ? previous.count : 0);
    // The all-response is the authoritative source for the summary totals.
    const summary = filter === "all" ? null : listAppointments({ limit: 1 }).catch(() => null);
    Promise.all([main, summary]).then(([res, totals]) => {
      if (!alive || request !== requestRef.current) return;
      setLoadedFilter(filter);
      setUpcoming(res.upcoming ?? []);
      setPast(res.past);
      snapshotRef.current = { filter, count: res.past?.items.length ?? 0 };
      setCounts((known) => {
        const all = filter === "all" ? res : totals;
        return {
          ...known,
          ...(all ? {
            all: (all.upcoming?.length ?? 0) + (all.past?.total ?? 0),
            upcoming: all.upcoming?.length ?? 0,
            past: all.past?.total ?? 0,
          } : {}),
          [filter]: filter === "all"
            ? (res.upcoming?.length ?? 0) + (res.past?.total ?? 0)
            : filter === "upcoming" ? res.upcoming?.length ?? 0 : res.past?.total ?? 0,
        };
      });
      setErrored(false);
    }).catch(() => {
      if (alive && request === requestRef.current) setErrored(true);
    }).finally(() => {
      if (!alive || request !== requestRef.current) return;
      busyRef.current = false;
      setLoading(false);
      setLoadingMore(false);
      setHasLoadedOnce(true);
    });
    return () => {
      alive = false;
      ++paginationRequest.current;
      moreBusyRef.current = false;
    };
  }, [authed, filter, attempt]);

  useEffect(() => {
    if (!authed) return;
    const refresh = () => {
      if (document.visibilityState === "hidden" || navigator.onLine === false || busyRef.current || moreBusyRef.current) return;
      // Focus and visibility events often arrive together.
      if (Date.now() - lastStartedRef.current < 10_000) return;
      lastStartedRef.current = Date.now();
      setAttempt((n) => n + 1);
    };
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [authed]);

  const onFilter = useCallback((next: Filter) => {
    if (next === filter) return;
    ++requestRef.current;
    ++moreRequestRef.current;
    moreBusyRef.current = false;
    setLoadingMore(false);
    setLoading(true);
    setErrored(false);
    setLoadMoreErrored(false);
    setFilter(next);
  }, [filter]);

  const onRetry = useCallback(() => {
    setLoading(true);
    setAttempt((n) => n + 1);
  }, []);

  const onLoadMore = useCallback(async () => {
    if (!past?.hasMore || moreBusyRef.current || busyRef.current) return;
    const request = ++moreRequestRef.current;
    moreBusyRef.current = true;
    setLoadingMore(true);
    setLoadMoreErrored(false);
    try {
      const res = await listAppointments({
        status: filter === "all" ? "past" : filter,
        limit: PAGE_SIZE,
        offset: past.items.length,
      });
      if (request !== moreRequestRef.current) return;
      if (res.past) {
        const seen = new Set(past.items.map((a) => a.uuid));
        const items = [...past.items, ...res.past.items.filter((a) => !seen.has(a.uuid))];
        setPast({ ...res.past, items });
        snapshotRef.current = { filter, count: items.length };
      }
    } catch {
      if (request === moreRequestRef.current) setLoadMoreErrored(true);
    } finally {
      if (request === moreRequestRef.current) {
        moreBusyRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [past, filter]);

  if (status === "idle" || status === "loading") return <LoadingState t={t} page={page} />;
  if (status === "unauthenticated" || status === "error") {
    return <SignedOutGate icon="cal" title={t.gate.title} body={t.gate.body}
      onCta={() => openAuthModal("signin")} secondaryLabel={t.gate.secondary}
      onSecondary={() => router.push(localeHref(locale, "search"))} />;
  }
  if (loading && !hasLoadedOnce) return <LoadingState t={t} page={page} />;

  const hasCurrentData = loadedFilter === filter;
  const showUpcoming = filter === "all" || filter === "upcoming";
  const showFinished = filter !== "upcoming";
  const finishedItems = past?.items ?? [];
  const finishedLabel = filter === "cancelled" ? t.finishedLabels.cancelled
    : filter === "no_show" ? t.finishedLabels.noShow : t.finishedLabels.past;
  const finishedEmptyNote = filter === "cancelled" ? t.notes.cancelledEmpty
    : filter === "no_show" ? t.notes.noShowEmpty : page.historyEmpty;
  const currentEmpty = upcoming.length === 0 && finishedItems.length === 0;
  const trulyEmpty = filter === "all" && currentEmpty;

  return (
    <div className={`zw-container ${styles.page}`}>
      <AppointmentsHeading t={t} upcoming={counts.upcoming ?? null} past={counts.past ?? null} loading={loading && !hasLoadedOnce} />
      <SchedFilters value={filter} onChange={onFilter} counts={counts} t={t} page={page} />
      <span role="status" className="sr-only">{loading ? t.loading : ""}</span>
      {errored && (hasCurrentData ? (
        <div className={styles.refreshError}>
          <InlineError>{page.refreshError}</InlineError>
          <Button kind="secondary" size="sm" loading={loading} onClick={onRetry}>{page.refresh}</Button>
        </div>
      ) : <ErrorState t={t} onRetry={onRetry} retrying={loading} />)}
      {loading && !hasCurrentData && !errored ? <ListLoading t={t} label={showUpcoming ? t.sectionUpcoming : finishedLabel} />
        : !hasCurrentData ? null
        : trulyEmpty ? <SchedEmpty t={t} onExplore={() => router.push(localeHref(locale, "search"))} />
        : <>
          {currentEmpty ? (
            <div className={styles.filteredEmpty}>
              <h2>{page.filterEmptyTitle}</h2>
              <p>{showUpcoming ? t.notes.upcomingEmpty : finishedEmptyNote}</p>
              <Button kind="secondary" size="md" onClick={() => onFilter("all")}>{page.clearFilter}</Button>
            </div>
          ) : <>
            {showUpcoming && <section className={styles.upcoming}>
              <SchedSection label={t.sectionUpcoming} count={upcoming.length} open={upcomingOpen}
                onToggle={() => setUpcomingOpen((o) => !o)} id="appointments-upcoming" />
              <div id="appointments-upcoming" hidden={!upcomingOpen}>
                {upcoming.length === 0 ? <div className={styles.note}>{t.notes.upcomingEmpty}</div>
                  : <SchedGrid items={upcoming} locale={locale} t={t} page={page} now={now} />}
              </div>
            </section>}
            {showFinished && <section className={showUpcoming ? styles.history : undefined}>
              <SchedSection label={finishedLabel} count={past?.total ?? 0} open={pastOpen}
                onToggle={() => setPastOpen((o) => !o)} id="appointments-history" />
              <div id="appointments-history" hidden={!pastOpen}>
                {finishedItems.length === 0 ? <div className={styles.note}>{finishedEmptyNote}</div> : <>
                  <SchedGrid items={finishedItems} locale={locale} t={t} page={page} now={now} withYears />
                  {past?.hasMore && <div className={styles.pagination}>
                    <Button kind="secondary" size="md" loading={loadingMore} spinnerSize={15}
                      onClick={() => void onLoadMore()} disabled={loadingMore}>{t.loadMore}</Button>
                    {loadMoreErrored && <InlineError className="txt-pretty" style={{ marginTop: 10 }}>{t.loadMoreError}</InlineError>}
                  </div>}
                </>}
              </div>
            </section>}
          </>}
        </>}
    </div>
  );
}
