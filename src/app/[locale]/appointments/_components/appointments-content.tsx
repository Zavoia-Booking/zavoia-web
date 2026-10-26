"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import { format } from "@/i18n/format";
import { localeHref } from "@/i18n/routes";
import { useAuth } from "@/lib/auth/useAuth";
import { useAuthModal } from "@/components/shell/auth-modal-provider";
import { Avatar, Button, Icon, Img, SignedOutGate, Skeleton, useToast } from "@/components/ui";
import type { ToastHandle } from "@/components/ui/toast";
import { PageError } from "@/components/ui/page-error";
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
  apptStamp,
  apptTime,
  deriveTense,
  formatApptPrice,
  timeUntil,
  wallDateKey,
  type TimeUntil,
} from "./vm";
import { useAppointmentClock } from "./use-appointment-clock";
import { AppointmentsSignInArt } from "./appointments-sign-in-art";
import { AppointmentsEmptyArt } from "./appointments-empty-art";
import { readAppointmentListView, saveAppointmentListView, type AppointmentFilter } from "./appointment-list-view";
import styles from "./appointments.module.css";

type ApptDict = Dictionary["appointments"];
type PageDict = Dictionary["appointmentPage"];
type Filter = AppointmentFilter;
const PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

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

function TicketCard({ a, locale, t, page, now, first, last }: {
  a: AppointmentListItem;
  locale: Locale;
  t: ApptDict;
  page: PageDict;
  now: Date;
  first: boolean;
  last: boolean;
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
  const venueName = branchName || brandName || page.venueUnavailable;
  const separateBranch = branchName && brandName && branchName.toLocaleLowerCase(locale) !== brandName.toLocaleLowerCase(locale);
  const venueImage = branchName ? a.location.profileImage : a.business?.logo;
  const staffName = a.staff
    ? [a.staff.firstName, a.staff.lastName].filter(Boolean).join(" ").trim()
    : "";
  const statusLabel = a.status === "confirmed" && tense === "now" ? page.statusLabels.live : page.statusLabels[a.status];
  const stamp = apptStamp(a.status, tense);
  const muted = a.status === "cancelled" || a.status === "no_show";
  const dateTense = muted || a.status === "completed" ? "past" : tense;
  const countdown = timeUntil(a.scheduledAt, a.status, tense, now, tz);
  const showCountdown = a.status === "confirmed" && countdown && !stamp;
  const price = formatApptPrice(a.price, a.currency, locale, t.free);
  const accessibleLabel = [title, fullDate, `${startTime} – ${endTime}`, venueName,
    separateBranch ? brandName : null, staffName, statusLabel, price].filter(Boolean).join(", ");

  return (
    <div className={styles.timelineRow} data-first={first || undefined} data-last={last || undefined}>
      <div className={styles.rail}>
        <time dateTime={a.scheduledAt} className={styles.date} data-tense={dateTense} aria-label={fullDate}>
          <span className={styles.weekday}>{dow.replace(/\.$/, "")}</span>
          <span className={styles.dateDay}>{day}</span>
          <span className={styles.dateMonth}>{mon.replace(/\.$/, "")}</span>
        </time>
      </div>
      <Link
        href={localeHref(locale, "appointments", a.uuid)}
        prefetch={false}
        className={`${styles.card} tap`}
        data-muted={muted || undefined}
        aria-label={accessibleLabel}
      >
        <span className={styles.ticketSurface} aria-hidden="true" />
        <div className={styles.cardTop}>
          <div className={styles.timeRow}>
            <span className={styles.timeGroup}>
              <span className={styles.statusDot} style={{ background: STATUS_DOT_COLOR[a.status] }} title={statusLabel} aria-hidden="true" />
              <span className={styles.time}>{startTime} – {endTime}</span>
            </span>
            {stamp ? (
              <span className={styles.stamp} style={{ color: stamp.color }}>
                {stamp.pulse && <span className={styles.liveDot} aria-hidden="true" />}
                {t.stamps[stamp.key]}
              </span>
            ) : showCountdown ? <span className={styles.countdown}>{timeUntilLabel(countdown, t)}</span> : null}
          </div>
          <h3 className={styles.service} title={title}>{title}</h3>
          <div className={styles.metadata}>
            <span className={styles.duration}><Icon name="clock" size={14} color="var(--c-500)" />{formatDuration(Number(a.duration))}</span>
            <span className={styles.price}><span aria-hidden="true" className={styles.separator}>·</span>{price}</span>
          </div>
        </div>
        <span className={styles.perforation} aria-hidden="true" />
        <div className={styles.venue}>
          <div className={styles.venueImage} aria-hidden="true">
            {venueImage ? (
              <Img src={venueImage} alt="" label={venueName.trim()[0]} style={{ width: "100%", height: "100%" }} />
            ) : <span>{venueName.trim()[0]}</span>}
          </div>
          <span className={styles.venueName}>{venueName}</span>
          {separateBranch && <span className="sr-only">{brandName}</span>}
          {staffName && staffName.toLowerCase() !== "any" && (
            <span className={styles.professional} title={staffName}>
              <Avatar src={a.staff?.profileImage ?? undefined} name={staffName} size={24} />
              <span>{a.staff?.firstName?.trim() || staffName.split(" ")[0]}</span>
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}

function SchedSection({ label, id }: {
  label: string;
  id?: string;
}) {
  return <h2 id={id} className={styles.sectionHeading}>{label}</h2>;
}

function SchedFilters({ value, onChange, counts, t, page, loading = false, disabled = false }: {
  value: Filter;
  onChange: (f: Filter) => void;
  counts: Partial<Record<Filter, number>>;
  t: ApptDict;
  page: PageDict;
  loading?: boolean;
  disabled?: boolean;
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
        const secondary = tab.id === "cancelled" || tab.id === "no_show";
        const count = secondary ? undefined : counts[tab.id];
        return (
          <button key={tab.id} type="button" className={`${styles.filter} tap`}
            onClick={() => onChange(tab.id)} aria-pressed={active} disabled={loading || disabled}>
            {tab.label}
            {count !== undefined && <span className={styles.filterCount}>{count}</span>}
            {loading && !secondary && <span aria-hidden="true"><Skeleton w="2ch" h={12} r={3} /></span>}
          </button>
        );
      })}
    </div>
  );
}

function YearSep({ year }: { year: number }) {
  return <div className={styles.year}><span>{year}</span><span aria-hidden="true" /></div>;
}

function SchedGrid({ items, locale, t, page, now, withYears = false, upcoming = false }: {
  items: AppointmentListItem[];
  locale: Locale;
  t: ApptDict;
  page: PageDict;
  now: Date;
  withYears?: boolean;
  upcoming?: boolean;
}) {
  const nodes: ReactNode[] = [];
  let lastYear = now.getFullYear();
  for (const a of items) {
    if (withYears) {
      const year = Number(wallDateKey(new Date(a.scheduledAt), a.location.timezone ?? undefined).slice(0, 4));
      if (year !== lastYear) nodes.push(<YearSep key={`year-${year}-${a.uuid}`} year={year} />);
      lastYear = year;
    }
    nodes.push(<TicketCard key={a.uuid} a={a} locale={locale} t={t} page={page} now={now} first={a.uuid === items[0]?.uuid} last={a.uuid === items.at(-1)?.uuid} />);
  }
  return <div className={styles.grid} data-upcoming={upcoming || undefined}>{nodes}</div>;
}

function SchedEmpty({ t, onExplore }: { t: ApptDict; onExplore: () => void }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyArtwork}><AppointmentsEmptyArt /></div>
      <div className={styles.emptyCopy}>
      <h1>{t.empty.title}</h1>
      <p className="txt-pretty">{t.empty.body}</p>
      </div>
      <Button kind="primary" size="lg" onClick={onExplore}>{t.empty.cta}</Button>
    </div>
  );
}

function AppointmentsHeading({ t }: { t: ApptDict }) {
  return <header className={styles.heading}>
    <h1>{t.title}</h1>
  </header>;
}

function ListLoading({ t, label = t.sectionUpcoming }: { t: ApptDict; label?: string }) {
  return <div aria-busy="true">
    <div aria-hidden="true" inert>
      <SchedSection label={label} />
      <div id="appointments-loading" className={styles.grid} data-upcoming={label === t.sectionUpcoming || undefined}>
        {[0, 1, 2].map((i) => <div key={i} className={styles.timelineRow} data-first={i === 0 || undefined} data-last={i === 2 || undefined}>
          <div className={styles.rail}><Skeleton w={46} h={68} r={12} /></div>
          <div className={styles.card}>
            <span className={styles.ticketSurface} />
            <div className={styles.cardTop}>
              <div className={styles.timeRow}><Skeleton w={130} h={21} r={4} /><Skeleton w={58} h={24} r={999} /></div>
              <div className={styles.service}><Skeleton w="82%" h={25} r={4} /></div>
              <div className={styles.metadata}><Skeleton w="52%" h={19} r={4} /></div>
            </div>
            <span className={styles.perforation} />
            <div className={styles.venue}><Skeleton w={40} h={40} r={9} style={{ flexShrink: 0 }} /><Skeleton w="56%" h={20} r={4} /><Skeleton w={24} h={24} r={999} style={{ flexShrink: 0 }} /></div>
          </div>
        </div>)}
      </div>
    </div>
    <p role="status" className="sr-only">{t.loading}</p>
  </div>;
}

function LoadingState({ t, page }: { t: ApptDict; page: PageDict }) {
  return <main className={`zw-container ${styles.page}`} aria-busy="true">
    <AppointmentsHeading t={t} />
    <SchedFilters value="all" onChange={() => {}} counts={{}} t={t} page={page} loading />
    <ListLoading t={t} />
  </main>;
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
  const toast = useToast();
  const router = useRouter();
  const { status, refresh: refreshSession } = useAuth();
  const { openAuthModal } = useAuthModal();
  const now = useAppointmentClock();
  const [initialView] = useState(readAppointmentListView);
  const [filter, setFilter] = useState<Filter>(initialView.filter);
  const [authRetrying, setAuthRetrying] = useState(false);
  const offline = useSyncExternalStore(subscribeConnectivity, isOffline, serverOffline);
  const [upcoming, setUpcoming] = useState<AppointmentListItem[]>([]);
  const [past, setPast] = useState<PastAppointmentsGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [errored, setErrored] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [loadedFilter, setLoadedFilter] = useState<Filter | null>(null);
  const [counts, setCounts] = useState<Partial<Record<Filter, number>>>({});
  const requestRef = useRef(0);
  const moreRequestRef = useRef(0);
  const busyRef = useRef(false);
  const moreBusyRef = useRef(false);
  const lastStartedRef = useRef(0);
  const snapshotRef = useRef<{ filter: Filter; count: number } | null>({ filter: initialView.filter, count: initialView.historyCount });
  const restoredScrollRef = useRef(false);
  const loadedFilterRef = useRef<Filter | null>(null);
  const refreshFailedRef = useRef(false);
  const refreshToastRef = useRef<ToastHandle | null>(null);
  const loadMoreToastRef = useRef<ToastHandle | null>(null);
  const offlineToastRef = useRef<ToastHandle | null>(null);
  const offlineEpisodeRef = useRef(false);
  const retryRefreshRef = useRef<() => void>(() => {});
  const retryLoadMoreRef = useRef<() => void>(() => {});
  const authed = status === "authenticated";

  const clearRefreshError = useCallback(() => {
    refreshFailedRef.current = false;
    refreshToastRef.current?.dismiss();
    refreshToastRef.current = null;
  }, []);

  useEffect(() => {
    if (!authed) return;
    const remember = () => saveAppointmentListView({
      filter,
      historyCount: loadedFilter === filter ? past?.items.length ?? 0 : snapshotRef.current?.count ?? 0,
      scrollY: window.scrollY,
    });
    remember();
    window.addEventListener("scroll", remember, { passive: true });
    return () => window.removeEventListener("scroll", remember);
  }, [authed, filter, past, loadedFilter]);

  useEffect(() => {
    if (restoredScrollRef.current || loading || loadedFilter !== initialView.filter) return;
    restoredScrollRef.current = true;
    if (initialView.scrollY > 0) {
      const frame = requestAnimationFrame(() => window.scrollTo({ top: initialView.scrollY, behavior: "instant" }));
      return () => cancelAnimationFrame(frame);
    }
  }, [loading, loadedFilter, initialView]);

  useEffect(() => {
    if (!authed || offline) return;
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
      loadedFilterRef.current = filter;
      setLoadedFilter(filter);
      setUpcoming(res.upcoming ?? []);
      setPast(res.past);
      snapshotRef.current = { filter, count: res.past?.items.length ?? 0 };
      setCounts(() => {
        const all = filter === "all" ? res : totals;
        return {
          ...(all ? {
            all: (all.upcoming?.length ?? 0) + (all.past?.total ?? 0),
            upcoming: all.upcoming?.length ?? 0,
            past: all.past?.total ?? 0,
          } : {}),
        };
      });
      clearRefreshError();
      loadMoreToastRef.current?.dismiss();
      loadMoreToastRef.current = null;
      setErrored(false);
    }).catch(() => {
      if (!alive || request !== requestRef.current) return;
      setErrored(true);
      if (loadedFilterRef.current === filter && navigator.onLine !== false && !refreshFailedRef.current) {
        refreshFailedRef.current = true;
        refreshToastRef.current = toast(page.refreshError, "warn", {
          label: page.refresh,
          onClick: () => retryRefreshRef.current(),
        }, "error");
      }
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
  }, [authed, offline, filter, attempt, clearRefreshError, toast, page.refreshError, page.refresh]);

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
    if (next === filter || offline) return;
    ++requestRef.current;
    ++moreRequestRef.current;
    moreBusyRef.current = false;
    setLoadingMore(false);
    setLoading(true);
    setErrored(false);
    clearRefreshError();
    loadMoreToastRef.current?.dismiss();
    loadMoreToastRef.current = null;
    setFilter(next);
  }, [filter, offline, clearRefreshError]);

  const onRetry = useCallback(() => {
    if (offline || busyRef.current || moreBusyRef.current) return;
    setLoading(true);
    setAttempt((n) => n + 1);
  }, [offline]);

  const onLoadMore = useCallback(async () => {
    if (offline || loadedFilterRef.current !== filter || !past?.hasMore || moreBusyRef.current || busyRef.current) return;
    const request = ++moreRequestRef.current;
    moreBusyRef.current = true;
    setLoadingMore(true);
    loadMoreToastRef.current?.dismiss();
    loadMoreToastRef.current = null;
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
      if (request === moreRequestRef.current && navigator.onLine !== false) {
        loadMoreToastRef.current = toast(t.loadMoreError, "warn", {
          label: dict.errors.retry,
          onClick: () => retryLoadMoreRef.current(),
        }, "error");
      }
    } finally {
      if (request === moreRequestRef.current) {
        moreBusyRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [past, filter, offline, toast, t.loadMoreError, dict.errors.retry]);

  useEffect(() => {
    retryRefreshRef.current = () => {
      clearRefreshError();
      onRetry();
    };
    retryLoadMoreRef.current = () => { void onLoadMore(); };
  }, [onRetry, onLoadMore, clearRefreshError]);

  useEffect(() => {
    if (authed && offline && loadedFilter === filter) {
      if (offlineEpisodeRef.current) return;
      offlineEpisodeRef.current = true;
      clearRefreshError();
      loadMoreToastRef.current?.dismiss();
      loadMoreToastRef.current = null;
      offlineToastRef.current = toast(page.offline, "warn", undefined, "error");
    } else {
      offlineEpisodeRef.current = false;
      offlineToastRef.current?.dismiss();
      offlineToastRef.current = null;
    }
  }, [authed, offline, loadedFilter, filter, clearRefreshError, toast, page.offline]);

  useEffect(() => () => {
    refreshToastRef.current?.dismiss();
    loadMoreToastRef.current?.dismiss();
    offlineToastRef.current?.dismiss();
    retryRefreshRef.current = () => {};
    retryLoadMoreRef.current = () => {};
  }, []);

  if (status === "idle" || status === "loading") return <LoadingState t={t} page={page} />;
  if (status === "unauthenticated") {
    return (
      <main>
        <SignedOutGate artwork={<AppointmentsSignInArt />} title={t.gate.title} body={t.gate.body}
          cta={t.gate.cta} onCta={() => openAuthModal("signin")} secondaryLabel={t.gate.secondary}
          onSecondary={() => router.push(localeHref(locale, "search"))} />
      </main>
    );
  }
  if (status === "error") return <PageError
    title={page.detailSessionErrorTitle}
    description={dict.accountMenu.sessionError}
    primary={{ label: dict.errors.retry, loading: authRetrying, onClick: async () => {
      if (authRetrying) return;
      setAuthRetrying(true);
      try { await refreshSession(); } finally { setAuthRetrying(false); }
    } }}
    secondary={{ label: dict.nav.explore, href: localeHref(locale, "search") }}
  />;

  const hasCurrentData = loadedFilter === filter;
  if (offline && !hasCurrentData) return <PageError
    title={page.detailOfflineTitle}
    description={page.listOfflineBody}
    primary={{ label: dict.errors.retry, onClick: onRetry, disabled: true }}
    secondary={{ label: dict.errors.backHome, href: localeHref(locale) }}
  />;
  if (errored && !hasCurrentData) return <PageError
    title={page.listErrorTitle}
    description={page.listErrorBody}
    primary={{ label: dict.errors.retry, onClick: onRetry, loading, disabled: loading }}
    secondary={filter === "all"
      ? { label: dict.nav.explore, href: localeHref(locale, "search") }
      : { label: page.clearFilter, onClick: () => onFilter("all") }}
  />;
  if (loading && !hasLoadedOnce) return <LoadingState t={t} page={page} />;
  const showUpcoming = filter === "all" || filter === "upcoming";
  const showFinished = filter !== "upcoming";
  const finishedItems = past?.items ?? [];
  const finishedLabel = filter === "cancelled" ? t.finishedLabels.cancelled
    : filter === "no_show" ? t.finishedLabels.noShow : t.finishedLabels.past;
  const finishedEmptyNote = filter === "cancelled" ? t.notes.cancelledEmpty
    : filter === "no_show" ? t.notes.noShowEmpty : page.historyEmpty;
  const currentEmpty = upcoming.length === 0 && finishedItems.length === 0;
  const trulyEmpty = hasCurrentData && filter === "all" && currentEmpty;

  return (
    <main className={`zw-container ${styles.page}`} data-empty={trulyEmpty || undefined}>
      {!trulyEmpty && <>
        <AppointmentsHeading t={t} />
        <SchedFilters value={filter} onChange={onFilter} counts={counts} t={t} page={page} disabled={offline} />
      </>}
      <span role="status" className="sr-only">{loading && !offline ? t.loading : ""}</span>
      {loading && !offline && !hasCurrentData && !errored ? <ListLoading t={t} label={showUpcoming ? t.sectionUpcoming : finishedLabel} />
        : !hasCurrentData ? null
        : trulyEmpty ? <SchedEmpty t={t} onExplore={() => router.push(localeHref(locale, "search"))} />
        : <>
          {currentEmpty ? (
            <div className={styles.filteredEmpty}>
              <h2>{page.filterEmptyTitle}</h2>
              <p>{showUpcoming ? t.notes.upcomingEmpty : finishedEmptyNote}</p>
              <Button kind="secondary" size="md" disabled={offline} onClick={() => onFilter("all")}>{page.clearFilter}</Button>
            </div>
          ) : <>
            {showUpcoming && <section aria-labelledby="appointments-upcoming-title">
              <SchedSection label={t.sectionUpcoming} id="appointments-upcoming-title" />
              <div id="appointments-upcoming">
                {upcoming.length === 0 ? <div className={styles.note}>{t.notes.upcomingEmpty}</div>
                  : <SchedGrid items={upcoming} locale={locale} t={t} page={page} now={now} upcoming />}
              </div>
            </section>}
            {showFinished && <section className={showUpcoming ? styles.history : undefined} aria-labelledby="appointments-history-title">
              <SchedSection label={finishedLabel} id="appointments-history-title" />
              <div id="appointments-history">
                {finishedItems.length === 0 ? <div className={styles.note}>{finishedEmptyNote}</div> : <>
                  <SchedGrid items={finishedItems} locale={locale} t={t} page={page} now={now} withYears />
                  {past?.hasMore && <div className={styles.pagination}>
                    <Button kind="secondary" size="md" loading={loadingMore && !offline} spinnerSize={15}
                      onClick={() => void onLoadMore()} disabled={loadingMore || offline}>{t.loadMore}</Button>
                  </div>}
                </>}
              </div>
            </section>}
          </>}
        </>}
    </main>
  );
}
