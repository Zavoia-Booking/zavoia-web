"use client";

import {
  createContext, useCallback, useContext, useEffect, useLayoutEffect,
  useMemo, useRef, useState, startTransition, type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { PageError } from "@/components/ui/page-error";
import { useToast, type ToastHandle } from "@/components/ui/toast";
import { useTranslation } from "@/i18n/useTranslation";

type FeedId = "categories" | "websites" | "brands" | "city" | "nearby" | "recent";
export interface DiscoveryReport {
  pending: boolean;
  failed: boolean;
  count: number;
  retry?: () => Promise<void>;
  failureId?: number;
  failureKind?: "refresh" | "more" | "retry" | "initial";
  retryAt?: number;
}
type Reports = Record<FeedId, DiscoveryReport>;
const PENDING: DiscoveryReport = { pending: true, failed: false, count: 0 };
const INITIAL: Reports = {
  categories: PENDING, websites: PENDING, brands: PENDING,
  city: PENDING, nearby: PENDING, recent: PENDING,
};
const PLACE_FEEDS: FeedId[] = ["brands", "city", "nearby", "recent"];
const PRIMARY_FEEDS: FeedId[] = ["brands", "city", "nearby"];
const RETRY_DEADLINE_MS = 20_000;
type Publish = (id: FeedId, report: DiscoveryReport) => void;
const PublishContext = createContext<Publish | null>(null);
const FeedbackContext = createContext<{
  reports: Reports; retry: () => void; busy: boolean; retryAt: number;
} | null>(null);

/** One owner for homepage recovery and notifications, across streamed and browser feeds. */
export function DiscoveryProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const { dict } = useTranslation();
  const copy = dict.homeSections.discovery;
  const [reports, setReports] = useState(INITIAL);
  const reportsRef = useRef(reports);
  const [retrying, setRetrying] = useState(false);
  const [retryAt, setRetryAt] = useState(0);
  const retryAtRef = useRef(0);
  const failedAttempts = useRef(0);
  const attempt = useRef<Map<FeedId, number | undefined> | null>(null);
  const seenFailures = useRef(new Map<FeedId, number | undefined>());
  const notification = useRef<ToastHandle | null>(null);
  // Only announced failures belong to this incident. An unrelated hidden
  // optional failure must not suppress notifications for a later outage.
  const incidentSources = useRef(new Set<FeedId>());

  const publish = useCallback<Publish>((id, report) => {
    const previous = reportsRef.current[id];
    if (Object.keys({ ...previous, ...report }).every((key) =>
      previous[key as keyof DiscoveryReport] === report[key as keyof DiscoveryReport])) return;
    reportsRef.current = { ...reportsRef.current, [id]: report };
    setReports(reportsRef.current);
  }, []);

  const clearNotification = useCallback(() => {
    notification.current?.dismiss();
    notification.current = null;
  }, []);
  useEffect(() => clearNotification, [clearNotification]);

  const retry = useCallback(() => {
    if (attempt.current || Date.now() < retryAtRef.current) return;
    const failures = (Object.entries(reportsRef.current) as [FeedId, DiscoveryReport][])
      .filter(([, report]) => report.failed);
    if (!failures.length) return;
    // A feed's pagination control shares this budget; never create an attempt
    // for a retry that the store will correctly reject during its cooldown.
    if (failures.some(([, report]) => Date.now() < (report.retryAt ?? 0))) return;
    attempt.current = new Map(failures.map(([id, report]) => [id, report.failureId]));
    setRetrying(true);
    clearNotification();
    // Server refresh preserves each successful section. Browser stores have their own retries.
    if (failures.some(([, report]) => !report.retry)) startTransition(() => router.refresh());
    void Promise.allSettled(failures.flatMap(([, report]) => report.retry
      ? [Promise.resolve().then(report.retry)] : []));
  }, [router, clearNotification]);

  const finishRetry = useCallback((failures: FeedId[]) => {
    attempt.current = null;
    setRetrying(false);
    clearNotification();
    if (failures.length) {
      failedAttempts.current += 1;
      const delay = Math.min(60_000, 15_000 * 2 ** Math.min(failedAttempts.current - 1, 2));
      retryAtRef.current = Date.now() + delay;
      setRetryAt(retryAtRef.current);
      failures.forEach((id) => incidentSources.current.add(id));
      // Do not immediately invite another failing request from the toast.
      notification.current = toast(copy.retryFailed, "warn", undefined, "error");
    } else {
      failedAttempts.current = 0;
      retryAtRef.current = 0;
      setRetryAt(0);
    }
  }, [clearNotification, toast, copy.retryFailed]);

  useEffect(() => {
    if (!retrying) return;
    // router.refresh() has no completion promise or cancellable signal. A
    // missing RSC response must still release our action's loading state.
    const timer = setTimeout(() => {
      if (!attempt.current) return;
      console.error("Home discovery retry failed", { reason: "timeout" });
      finishRetry([...attempt.current.keys()].filter((id) =>
        reportsRef.current[id].failed || reportsRef.current[id].pending));
    }, RETRY_DEADLINE_MS);
    return () => clearTimeout(timer);
  }, [retrying, finishRetry]);

  useEffect(() => {
    const entries = Object.entries(reports) as [FeedId, DiscoveryReport][];
    const newFailures = entries.filter(([id, report]) => {
      if (!report.failed) {
        seenFailures.current.delete(id);
        return false;
      }
      const fresh = !seenFailures.current.has(id) || seenFailures.current.get(id) !== report.failureId;
      seenFailures.current.set(id, report.failureId);
      return fresh;
    });
    incidentSources.current.forEach((id) => {
      if (!reports[id].failed && !reports[id].pending) incidentSources.current.delete(id);
    });
    if (!incidentSources.current.size) clearNotification();
    if (!attempt.current && !entries.some(([, report]) => report.failed)) {
      failedAttempts.current = 0;
      retryAtRef.current = 0;
      setRetryAt(0);
    }

    const announce = (message: string, sources: FeedId[]) => {
      clearNotification();
      sources.forEach((id) => incidentSources.current.add(id));
      const coolingDown = Date.now() < retryAtRef.current
        || entries.some(([, report]) => report.failed && Date.now() < (report.retryAt ?? 0));
      notification.current = toast(message, "warn",
        coolingDown ? undefined : { label: copy.retry, onClick: retry }, "error");
    };

    if (attempt.current) {
      // Each requested feed must publish its new outcome, including successful empty responses.
      const settled = [...attempt.current].every(([id, failureId]) => {
        const report = reports[id];
        return !report.pending && (!report.failed || report.failureId !== failureId);
      });
      if (settled) {
        finishRetry(entries.filter(([, report]) => report.failed).map(([id]) => id));
      }
      return;
    }

    const actionFailures = newFailures.filter(([, report]) =>
      report.failureKind === "more"
      || (report.failureKind === "retry" && Date.now() >= retryAtRef.current));
    const retainedFailures = newFailures.filter(([, report]) => report.count > 0);
    if (actionFailures.length) {
      const sources = [...new Set([...actionFailures, ...retainedFailures].map(([id]) => id))];
      announce(actionFailures.some(([, report]) => report.failureKind === "more")
        ? copy.loadMoreFailed : copy.retryFailed, sources);
    } else {
      const alreadyAnnounced = incidentSources.current.size > 0;
      // A later failing feed joins the same incident even when its notification
      // is suppressed; recovery of the first feed must not clear the others.
      retainedFailures.forEach(([id]) => incidentSources.current.add(id));
      if (!alreadyAnnounced && retainedFailures.length) {
        announce(copy.refreshFailed, retainedFailures.map(([id]) => id));
      }
    }
  }, [reports, toast, copy, retry, clearNotification, finishRetry]);

  const feedback = useMemo(() => ({
    reports, retry, busy: retrying,
    retryAt: Math.max(retryAt, ...Object.values(reports).map((report) => report.failed ? report.retryAt ?? 0 : 0)),
  }), [reports, retry, retrying, retryAt]);
  return <PublishContext.Provider value={publish}>
    <FeedbackContext.Provider value={feedback}>{children}</FeedbackContext.Provider>
  </PublishContext.Provider>;
}

/** Report outcomes without exposing a separate error row for each optional section. */
export function useDiscoveryFeed(id: FeedId, report: DiscoveryReport): void {
  const publish = useContext(PublishContext);
  if (!publish) throw new Error("useDiscoveryFeed requires DiscoveryProvider");
  const { pending, failed, count, retry, failureId, failureKind, retryAt } = report;
  useLayoutEffect(() => {
    publish(id, { pending, failed, count, retry, failureId, failureKind, retryAt });
  }, [publish, id, pending, failed, count, retry, failureId, failureKind, retryAt]);
}

/** Preserve successfully rendered server cards if a later route refresh fails. */
export function ServerDiscoveryFeed({ id, failed, failureId, count, children }: {
  id: "categories" | "websites" | "brands";
  failed: boolean; failureId?: number; count: number; children?: ReactNode;
}) {
  const [retained, setRetained] = useState({ children, count });
  if (!failed && (retained.children !== children || retained.count !== count)) {
    setRetained({ children, count });
  }
  useDiscoveryFeed(id, {
    pending: false, failed, count: failed ? retained.count : count, failureId,
  });
  return failed ? retained.children : children;
}

export function DiscoveryRecovery() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("DiscoveryRecovery requires DiscoveryProvider");
  const { reports, retry, busy, retryAt } = context;
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const update = () => setSeconds(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)));
    update();
    if (retryAt <= Date.now()) return;
    const timer = setInterval(update, 1000);
    const end = setTimeout(() => { clearInterval(timer); update(); }, retryAt - Date.now());
    return () => { clearInterval(timer); clearTimeout(end); };
  }, [retryAt]);
  const { dict } = useTranslation();
  const copy = dict.homeSections.discovery;
  // Taxonomy and promotional websites do not establish that actual places loaded.
  // Missing coordinates/history report a settled, nonfailed result and never imply an outage.
  const show = PLACE_FEEDS.every((id) => !reports[id].pending || reports[id].failed)
    && PLACE_FEEDS.every((id) => reports[id].count === 0)
    && PRIMARY_FEEDS.some((id) => reports[id].failed);
  return <>
    {show && <div className="zw-container">
      <PageError variant="compact" title={copy.title} description={copy.body}
        primary={{ label: seconds > 0 ? copy.retryIn.replace("{seconds}", String(seconds)) : copy.retry,
          onClick: retry, loading: busy, disabled: seconds > 0 }} />
    </div>}
    <span role="status" className="sr-only">{show ? busy ? dict.search.updating : copy.title : ""}</span>
  </>;
}
