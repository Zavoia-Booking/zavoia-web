"use client";

import { useRouter } from "next/navigation";
import { Button, Icon, Spinner } from "@/components/ui";
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

  const { items, unreadCount, loading, loadingMore, hasMore, failed, loaded } =
    useNotifications();
  const reload = useInboxLoader(true);

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
        {unreadCount > 0 && (
          <button
            type="button"
            className="tap"
            onClick={() => void markAllRead()}
            style={{
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--p-700)",
              fontFamily: "inherit",
            }}
          >
            {t.markAllRead}
          </button>
        )}
      </div>

      {/* Loading — only before anything has ever been shown, so a refresh
          doesn't blank out rows the user is already reading. */}
      {loading && !loaded ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "34px 0 40px",
          }}
        >
          <Spinner size={20} />
        </div>
      ) : failed && items.length === 0 ? (
        <EmptyBlock
          icon="warn"
          title={t.errorTitle}
          body={t.errorBody}
          action={
            <Button kind="secondary" size="sm" onClick={reload}>
              {dict.errors.retry}
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyBlock icon="bell" title={t.emptyTitle} body={t.emptyBody} />
      ) : (
        <div
          className="zw-scroll-y"
          style={{ maxHeight: 420, padding: "0 6px 8px" }}
        >
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
              <Button
                kind="ghost"
                size="sm"
                onClick={() => void loadNextPage()}
                disabled={loadingMore}
                style={{ width: "100%" }}
              >
                {loadingMore ? <Spinner size={14} /> : t.loadMore}
              </Button>
            </div>
          )}
        </div>
      )}
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
          width: 48,
          height: 48,
          borderRadius: 16,
          background: "var(--c-100)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 6,
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
