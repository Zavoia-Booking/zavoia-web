"use client";

import { useRouter } from "next/navigation";
import { Button, Icon, InlineError, Skeleton } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import type { CustomerNotification } from "@/lib/api/marketplace/types";
import {
  markAllRead,
  markRead,
  useInboxLoader,
  useNotifications,
  loadNextPage,
} from "@/lib/notifications/use-notifications";
import { Popover } from "./popover";

// Notifications popover, backed by GET /marketplace/customer/notifications/inbox.
// Rows are cursor-paginated (20 at a time) and carry a deep-link payload; the
// ones the web can resolve are opened on click, and every click marks the row
// read regardless of whether it navigates anywhere.

/**
 * Relative age of a notification ("2h", "3d"), in the active locale. Falls back
 * to a plain date past a week, where "8 days ago" stops being useful.
 */
function useTimeAgo(): (iso: string) => string {
  const { locale } = useTranslation();
  return (iso: string) => {
    const then = Date.parse(iso);
    if (Number.isNaN(then)) return "";
    const diffMs = Date.now() - then;
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    const mins = Math.round(diffMs / 60_000);
    if (Math.abs(mins) < 60) return rtf.format(-mins, "minute");
    const hours = Math.round(diffMs / 3_600_000);
    if (Math.abs(hours) < 24) return rtf.format(-hours, "hour");
    const days = Math.round(diffMs / 86_400_000);
    if (Math.abs(days) < 7) return rtf.format(-days, "day");
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
    }).format(new Date(then));
  };
}

/**
 * Where a notification leads, or null when nothing on the web can show it.
 *
 * The payload is written for the mobile app's route names, so `screen`/`params`
 * are ignored here and only the ids the web has pages for are mapped. A legacy
 * numeric `appointmentId` is deliberately NOT mapped: the detail route resolves
 * a UUID, so it would 404.
 */
function notificationHref(
  n: CustomerNotification,
  locale: string,
): string | null {
  const data = n.data;
  if (!data) return null;
  if (data.appointmentUuid) {
    return localeHref(locale as never, "appointments", data.appointmentUuid);
  }
  if (data.ticketId != null) {
    return `${localeHref(locale as never, "account")}?tab=support&ticket=${data.ticketId}`;
  }
  return null;
}

export function NotifPanel({ onClose }: { onClose: () => void }) {
  const { dict, locale } = useTranslation();
  const t = dict.notifications;
  const router = useRouter();
  const timeAgo = useTimeAgo();

  const { items, unreadCount, loading, loadingMore, moreFailed, hasMore, failed, loaded } =
    useNotifications();
  const reload = useInboxLoader(true);
  const initialPending = !loaded && !failed;

  const onRowClick = (n: CustomerNotification) => {
    void markRead(n.id);
    const href = notificationHref(n, locale);
    if (href) {
      onClose();
      router.push(href);
    }
  };

  return (
    <Popover onClose={onClose} label={t.title} width={392}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "16px 18px 12px",
        }}
      >
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--c-900)",
          }}
        >
          {t.title}
        </span>
          <button
            type="button"
            className="tap"
            disabled={!loaded || loading || unreadCount === 0}
            onClick={() => void markAllRead()}
            style={{
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: !loaded || loading ? "default" : "pointer",
              opacity: !loaded || loading ? 0.45 : 1,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--p-700)",
              fontFamily: "inherit",
              visibility: unreadCount > 0 ? "visible" : "hidden",
            }}
          >
            {t.markAllRead}
          </button>
      </div>

      <span role="status" className="sr-only">
        {initialPending || loading || loadingMore ? t.loading : ""}
      </span>
      {/* Session verification and the first inbox request are both unresolved
          content. Keep known rows in place on subsequent requests. */}
      <div className="zw-scroll-y" style={{ height: "min(420px, calc(100dvh - 180px))", padding: "0 6px 8px" }}>
      {initialPending ? (
        <div aria-busy="true">
          <div aria-hidden="true">
            {[0, 1, 2].map((row) => (
              <div key={row} style={{ display: "flex", gap: 11, padding: "11px 12px" }}>
                <span style={{ width: 7, flexShrink: 0 }} />
                <div style={{ display: "grid", gap: 3, flex: 1 }}>
                  <Skeleton w={row === 1 ? "65%" : "78%"} h={21} />
                  <Skeleton h={37.7} />
                  <Skeleton w={72} h={16.5} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : failed && items.length === 0 ? (
        <EmptyBlock
          icon="warn"
          title={t.errorTitle}
          body={t.errorBody}
          action={
            <Button kind="secondary" size="sm" onClick={reload} loading={loading} spinnerSize={14}>
              {dict.errors.retry}
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyBlock icon="bell" title={t.emptyTitle} body={t.emptyBody} />
      ) : (
        <div
          aria-busy={loading || loadingMore}
        >
          {failed && (
            <div style={{ display: "grid", gap: 10, padding: "8px 12px 12px" }}>
              <InlineError>{t.refreshError}</InlineError>
              <Button kind="secondary" size="sm" onClick={reload} loading={loading} spinnerSize={14} style={{ justifySelf: "start" }}>
                {dict.errors.retry}
              </Button>
            </div>
          )}
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {items.map((n) => {
              const href = notificationHref(n, locale);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    className="tap zw-hover-row"
                    onClick={() => onRowClick(n)}
                    style={{
                      display: "flex",
                      gap: 11,
                      width: "100%",
                      textAlign: "left",
                      border: 0,
                      background: n.read ? "transparent" : "var(--c-100)",
                      borderRadius: 12,
                      padding: "11px 12px",
                      cursor: href ? "pointer" : "default",
                      fontFamily: "inherit",
                    }}
                  >
                    {/* Unread marker — a dot, not a colour change, so the cue
                        survives at any contrast setting. */}
                    <span
                      aria-hidden="true"
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        marginTop: 6,
                        flexShrink: 0,
                        background: n.read ? "transparent" : "var(--p-600)",
                      }}
                    />
                    <span style={{ display: "grid", gap: 3, minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: n.read ? 500 : 600,
                          color: "var(--c-900)",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {n.title}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          lineHeight: 1.45,
                          color: "var(--c-600)",
                        }}
                      >
                        {n.body}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          color: "var(--c-500)",
                        }}
                      >
                        {timeAgo(n.createdAt)}
                        {!n.read && (
                          <span className="sr-only"> · {t.unreadLabel}</span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {hasMore && (
            <div style={{ padding: "6px 12px 4px" }}>
              {moreFailed && <InlineError style={{ marginBottom: 10 }}>{t.loadMoreError}</InlineError>}
              <Button
                kind="ghost"
                size="sm"
                onClick={() => void loadNextPage()}
                disabled={loading}
                loading={loadingMore}
                spinnerSize={14}
                style={{ width: "100%" }}
              >
                {moreFailed ? dict.errors.retry : t.loadMore}
              </Button>
            </div>
          )}
        </div>
      )}
      </div>
    </Popover>
  );
}

function EmptyBlock({
  icon,
  title,
  body,
  action,
}: {
  icon: "bell" | "warn";
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 6,
        padding: "26px 28px 36px",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Icon name={icon} size={22} color="var(--c-500)" />
      </span>
      <span
        style={{
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: "var(--c-900)",
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontSize: 13,
          color: "var(--c-600)",
          lineHeight: 1.5,
          maxWidth: 260,
        }}
      >
        {body}
      </span>
      {action && <div style={{ marginTop: 10 }}>{action}</div>}
    </div>
  );
}
