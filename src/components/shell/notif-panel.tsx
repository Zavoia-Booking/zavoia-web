"use client";

import { Icon } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { Popover } from "./popover";

// Notifications popover. Ported chrome from ZwNotifPanel (docs/web-account.jsx)
// but rendered as an EMPTY STATE: no notifications client functions exist yet,
// so we intentionally avoid mock data this slice.
// TODO(phase2): wire to GET /marketplace/customer/notifications/inbox.

export function NotifPanel({ onClose }: { onClose: () => void }) {
  const { dict } = useTranslation();
  const t = dict.notifications;

  return (
    <Popover onClose={onClose} label={t.title} width={392}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
      </div>
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
          <Icon name="bell" size={22} color="var(--c-500)" />
        </span>
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "var(--c-900)",
          }}
        >
          {t.emptyTitle}
        </span>
        <span
          style={{
            fontSize: 13,
            color: "var(--c-600)",
            lineHeight: 1.5,
            maxWidth: 260,
          }}
        >
          {t.emptyBody}
        </span>
      </div>
    </Popover>
  );
}
