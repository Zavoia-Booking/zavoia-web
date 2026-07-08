"use client";

/**
 * Support tab — ticket-based support UI inside the account settings page.
 *
 * Ported from the design prototype `docs/web-support.jsx` (ticket rows, status
 * dot, message bubbles, composer), adapted onto the REAL API shape and the
 * narrower single-column account layout (list ⇄ detail, no fixed two-pane
 * desktop inbox chrome).
 *
 * Data-shape notes (see src/lib/api/marketplace/types.ts):
 * - `Ticket.details.history` entries have NO per-message timestamp — only
 *   ticket-level `createdAt`/`updatedAt` exist. Do not fabricate one.
 * - `entry.createdBy === String(profile.id)` (numeric CustomerProfile.id, not
 *   the uuid) identifies "my" messages; anything else is a support reply.
 * - `category` is lowercase ("bug" | "question"); `status` is uppercase.
 * - Messages can only be added while status is OPEN / IN_PROGRESS / REOPENED.
 * - No pagination, no attachments — out of scope.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { dictionaries, format } from "@/i18n/dictionaries";
import { Button, Icon, Skeleton, Spinner, useToast } from "@/components/ui";
import {
  addTicketMessage,
  closeTicket,
  createTicket,
  getTicket,
  listTickets,
} from "@/lib/api/marketplace/support";
import type {
  CustomerProfile,
  Ticket,
  TicketCategory,
  TicketListItem,
  TicketStatus,
} from "@/lib/api/marketplace/types";

type AcctDict = (typeof dictionaries)[Locale]["account"];
type SupportDict = AcctDict["support"];

const ACTIVE_STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "REOPENED"];

function statusColor(status: TicketStatus): string {
  switch (status) {
    case "OPEN":
      return "var(--s-info-600)";
    case "IN_PROGRESS":
      return "var(--s-success-600)";
    case "REOPENED":
      return "var(--s-warning-600)";
    case "CLOSED":
    default:
      return "var(--c-500)";
  }
}

function statusLabel(t: SupportDict, status: TicketStatus): string {
  switch (status) {
    case "OPEN":
      return t.status.open;
    case "IN_PROGRESS":
      return t.status.inProgress;
    case "REOPENED":
      return t.status.reopened;
    case "CLOSED":
    default:
      return t.status.closed;
  }
}

function categoryLabel(t: SupportDict, category?: TicketCategory | null): string {
  if (category === "bug") return t.category.bug;
  if (category === "question") return t.category.question;
  return t.category.question;
}

function preview(ticket: Ticket): string {
  const history = ticket.details?.history ?? [];
  const first = history[0]?.message;
  return (first ?? "").trim();
}

// ─────────────────────────────────────────────
// Status badge — dashed pill, matching the appointment detail's StampPill
// visual language (src/app/[locale]/appointments/[uuid]/_components/sections.tsx).
// ─────────────────────────────────────────────

function TicketStatusBadge({
  status,
  t,
}: {
  status: TicketStatus;
  t: SupportDict;
}) {
  const color = statusColor(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 9px 3px 7px",
        border: "1.5px dashed " + color,
        borderRadius: 6,
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color,
        background: "#fff",
        whiteSpace: "nowrap",
        lineHeight: 1,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      {statusLabel(t, status)}
    </span>
  );
}

// ─────────────────────────────────────────────
// Ticket list row
// ─────────────────────────────────────────────

function TicketRow({
  ticket,
  t,
  locale,
  onClick,
}: {
  ticket: TicketListItem;
  t: SupportDict;
  locale: Locale;
  onClick: () => void;
}) {
  const updated = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(ticket.updatedAt));
  const text = preview(ticket) || categoryLabel(t, ticket.category);

  return (
    <button
      type="button"
      className="tap zw-hover-row"
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
        textAlign: "left",
        padding: "15px 18px",
        background: "transparent",
        border: 0,
        borderBottom: "1px solid rgba(28,28,26,0.06)",
        cursor: "pointer",
        font: "inherit",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
        <TicketStatusBadge status={ticket.status} t={t} />
        <span style={{ flex: 1 }} />
        {ticket.hasUnread && (
          <span
            aria-label={t.unreadAria}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--p-500)",
              flexShrink: 0,
            }}
          />
        )}
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            color: "var(--c-500)",
          }}
        >
          {format(t.updated, { date: updated })}
        </span>
      </div>
      <span
        style={{
          fontSize: 14.5,
          fontWeight: ticket.hasUnread ? 600 : 500,
          color: "var(--c-900)",
          letterSpacing: "-0.01em",
          lineHeight: 1.35,
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {text}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--c-500)",
          letterSpacing: "0.04em",
        }}
      >
        #{ticket.id} · {categoryLabel(t, ticket.category)}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────
// Thread bubble
// ─────────────────────────────────────────────

function Bubble({
  mine,
  label,
  text,
}: {
  mine: boolean;
  label: string;
  text: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: mine ? "flex-end" : "flex-start",
      }}
    >
      <div style={{ maxWidth: "84%" }}>
        <div
          className="txt-pretty"
          style={{
            padding: "11px 15px",
            fontSize: 14,
            lineHeight: 1.5,
            letterSpacing: "-0.005em",
            background: mine ? "var(--c-ink)" : "#fff",
            color: mine ? "#fff" : "var(--c-900)",
            border: mine ? 0 : "1px solid rgba(28,28,26,0.08)",
            borderRadius: mine ? "18px 18px 5px 18px" : "18px 18px 18px 5px",
            boxShadow: "var(--sh-sm)",
            whiteSpace: "pre-wrap",
          }}
        >
          {text}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9.5,
            color: "var(--c-500)",
            marginTop: 4,
            textAlign: mine ? "right" : "left",
            padding: "0 4px",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// New ticket form (inline card)
// ─────────────────────────────────────────────

function NewTicketForm({
  t,
  onCancel,
  onCreated,
}: {
  t: SupportDict;
  onCancel: () => void;
  onCreated: (ticket: Ticket) => void;
}) {
  const toast = useToast();
  const [category, setCategory] = useState<TicketCategory>("bug");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const trimmed = message.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const created = await createTicket({ category, message: trimmed });
      toast(t.toasts.created, "check");
      onCreated(created);
    } catch {
      toast(t.toasts.error, "warn");
    } finally {
      setSubmitting(false);
    }
  };

  const categoryBtn = (value: TicketCategory, label: string) => (
    <button
      type="button"
      className="tap"
      onClick={() => setCategory(value)}
      disabled={submitting}
      style={{
        flex: 1,
        padding: "10px 14px",
        borderRadius: 12,
        border:
          category === value
            ? "1.5px solid var(--c-ink)"
            : "1px solid rgba(28,28,26,0.14)",
        background: category === value ? "var(--c-shade)" : "#fff",
        color: "var(--c-900)",
        fontSize: 14,
        fontWeight: 600,
        cursor: submitting ? "default" : "pointer",
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid rgba(28,28,26,0.08)",
        borderRadius: 16,
        boxShadow: "var(--sh-sm)",
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          fontSize: 15.5,
          fontWeight: 600,
          letterSpacing: "-0.012em",
          color: "var(--c-900)",
        }}
      >
        {t.new.title}
      </div>

      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--c-700)",
            marginBottom: 8,
          }}
        >
          {t.new.categoryLabel}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {categoryBtn("bug", t.category.bug)}
          {categoryBtn("question", t.category.question)}
        </div>
      </div>

      <label style={{ display: "block" }}>
        <span
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--c-700)",
            marginBottom: 8,
          }}
        >
          {t.new.messageLabel}
        </span>
        <textarea
          value={message}
          disabled={submitting}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t.new.messagePlaceholder}
          rows={5}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(28,28,26,0.18)",
            fontSize: 14,
            color: "var(--c-900)",
            background: "#fff",
            outline: "none",
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />
      </label>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Button kind="secondary" size="md" onClick={onCancel} disabled={submitting}>
          {t.new.cancel}
        </Button>
        <Button
          kind="primary"
          size="md"
          onClick={submit}
          disabled={submitting || !message.trim()}
        >
          {submitting ? <Spinner size={16} color="#fff" /> : t.new.submit}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Ticket detail — thread + composer + close action
// ─────────────────────────────────────────────

function TicketDetailView({
  ticketId,
  t,
  profile,
  onBack,
  onUpdated,
}: {
  ticketId: number;
  t: SupportDict;
  profile: CustomerProfile;
  onBack: () => void;
  onUpdated: (ticket: Ticket) => void;
}) {
  const toast = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [closing, setClosing] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // `loading` is initialised to true and this component is remounted (via a
  // `key={ticketId}` at the call site) whenever the selected ticket changes,
  // so no synchronous setState(true)/setState(false) reset is needed here.
  useEffect(() => {
    let alive = true;
    getTicket(ticketId)
      .then((res) => {
        if (!alive) return;
        setTicket(res);
      })
      .catch(() => {
        if (!alive) return;
        setLoadError(true);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [ticketId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [ticket?.details.history.length]);

  const send = async () => {
    const trimmed = draft.trim();
    if (!trimmed || !ticket || sending) return;
    setSending(true);
    try {
      const updated = await addTicketMessage(ticket.id, { message: trimmed });
      setTicket(updated);
      onUpdated(updated);
      setDraft("");
      toast(t.toasts.replySent, "check");
    } catch {
      toast(t.toasts.error, "warn");
    } finally {
      setSending(false);
    }
  };

  const doClose = async () => {
    if (!ticket) return;
    setClosing(true);
    try {
      const updated = await closeTicket(ticket.id);
      setTicket(updated);
      onUpdated(updated);
      toast(t.toasts.closed, "check");
      setConfirmingClose(false);
    } catch {
      toast(t.toasts.error, "warn");
    } finally {
      setClosing(false);
    }
  };

  const backButton = (
    <button
      type="button"
      className="tap zw-hover-row"
      onClick={onBack}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 16,
        background: "transparent",
        border: 0,
        cursor: "pointer",
        fontSize: 13.5,
        fontWeight: 600,
        color: "var(--c-600)",
        padding: "4px 0",
        font: "inherit",
      }}
    >
      <Icon name="back" size={14} color="var(--c-600)" />
      {t.backToTickets}
    </button>
  );

  if (loading) {
    return (
      <div>
        {backButton}
        <Skeleton w="100%" h={220} r={16} />
      </div>
    );
  }

  if (loadError || !ticket) {
    return (
      <div>
        {backButton}
        <div style={{ fontSize: 13.5, color: "var(--s-error-600)" }}>
          {t.loadError}
        </div>
      </div>
    );
  }

  const canReply = ACTIVE_STATUSES.includes(ticket.status);
  const history = ticket.details?.history ?? [];

  return (
    <div>
      {backButton}
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(28,28,26,0.08)",
          borderRadius: 20,
          boxShadow: "var(--sh-md)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid rgba(28,28,26,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TicketStatusBadge status={ticket.status} t={t} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--c-500)",
              }}
            >
              #{ticket.id} · {categoryLabel(t, ticket.category)}
            </span>
          </div>
          {canReply && (
            <button
              type="button"
              className="tap"
              onClick={() => setConfirmingClose(true)}
              style={{
                background: "transparent",
                border: 0,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--s-error-600)",
                padding: "4px 0",
                fontFamily: "inherit",
              }}
            >
              {t.close.action}
            </button>
          )}
        </div>

        <div
          ref={scrollRef}
          style={{
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            background: "var(--c-50, var(--c-canvas))",
            maxHeight: 460,
            overflowY: "auto",
          }}
        >
          {history.length === 0 ? (
            <div
              style={{
                fontSize: 13.5,
                color: "var(--c-500)",
                textAlign: "center",
                padding: "12px 0",
              }}
            >
              {t.thread.empty}
            </div>
          ) : (
            history.map((entry, i) => {
              const mine = entry.createdBy === String(profile.id);
              return (
                <Bubble
                  key={i}
                  mine={mine}
                  label={mine ? t.thread.you : t.thread.support}
                  text={entry.message}
                />
              );
            })
          )}
        </div>

        <div
          style={{
            padding: "14px 16px",
            borderTop: "1px solid rgba(28,28,26,0.07)",
            background: "#fff",
          }}
        >
          {canReply ? (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea
                value={draft}
                disabled={sending}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={t.composer.placeholder}
                rows={2}
                style={{
                  flex: 1,
                  boxSizing: "border-box",
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(28,28,26,0.14)",
                  fontSize: 14,
                  color: "var(--c-900)",
                  background: "var(--c-canvas)",
                  outline: "none",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
              <Button
                kind="accent"
                size="md"
                onClick={send}
                disabled={sending || !draft.trim()}
              >
                {sending ? (
                  <Spinner size={16} color="#fff" />
                ) : (
                  t.composer.send
                )}
              </Button>
            </div>
          ) : (
            <div
              style={{
                fontSize: 13,
                color: "var(--c-500)",
                textAlign: "center",
                padding: "6px 0",
              }}
            >
              {t.composer.closedNote}
            </div>
          )}
        </div>
      </div>

      {confirmingClose && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="zw-close-ticket-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            background: "rgba(28,28,26,0.42)",
          }}
          onClick={() => {
            if (!closing) setConfirmingClose(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 18,
              boxShadow: "var(--sh-lg)",
              padding: "24px 24px 20px",
              maxWidth: 420,
              width: "100%",
            }}
          >
            <h2
              id="zw-close-ticket-title"
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--c-900)",
              }}
            >
              {t.close.confirmTitle}
            </h2>
            <p
              className="txt-pretty"
              style={{
                margin: "10px 0 22px",
                fontSize: 14.5,
                lineHeight: 1.5,
                color: "var(--c-600)",
              }}
            >
              {t.close.confirmBody}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Button
                kind="secondary"
                size="md"
                onClick={() => setConfirmingClose(false)}
                disabled={closing}
              >
                {t.close.cancel}
              </Button>
              <Button kind="primary" size="md" onClick={doClose} disabled={closing}>
                {closing ? <Spinner size={16} color="#fff" /> : t.close.confirm}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// "Report an issue" card — ported from the Help Centre aside in the design
// prototype `docs/web-help.jsx` (ZwHelpAside): title + response-time promise,
// a "My tickets" snapshot of up to 3 open tickets, and the primary CTA.
// The design's "Open inbox" action is dropped — here the full inbox renders
// directly below the card, so the CTA always starts a new ticket.
// ─────────────────────────────────────────────

function ReportIssueCard({
  t,
  locale,
  tickets,
  onOpenTicket,
  onNew,
}: {
  t: SupportDict;
  locale: Locale;
  tickets: TicketListItem[];
  onOpenTicket: (id: number) => void;
  onNew: () => void;
}) {
  const open = tickets.filter((tk) => ACTIVE_STATUSES.includes(tk.status));
  const hasHistory = tickets.length > 0;
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <div className="zw-help-card">
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--c-900)",
        }}
      >
        {t.report.title}
      </div>
      <div style={{ marginTop: 6 }}>
        <span style={{ fontSize: 12.5, color: "var(--c-600)" }}>
          {t.report.sub}
        </span>
      </div>

      <div style={{ marginTop: 18 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: open.length ? 2 : 8,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--c-500)",
            }}
          >
            {t.report.myTickets}
          </span>
          {open.length > 0 && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                fontWeight: 600,
                color: "var(--p-700)",
              }}
            >
              {open.length === 1
                ? t.report.openCountOne
                : format(t.report.openCount, { count: String(open.length) })}
            </span>
          )}
        </div>
        {open.length > 0 ? (
          open.slice(0, 3).map((tk) => (
            <button
              key={tk.id}
              type="button"
              className="zw-help-treq tap"
              onClick={() => onOpenTicket(tk.id)}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: statusColor(tk.status),
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "var(--c-900)",
                    letterSpacing: "-0.01em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {preview(tk) || categoryLabel(t, tk.category)}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: 11.5,
                    color: "var(--c-500)",
                    marginTop: 1,
                  }}
                >
                  {statusLabel(t, tk.status)} ·{" "}
                  {dateFmt.format(new Date(tk.updatedAt))}
                </span>
              </span>
              <Icon name="chevR" size={14} color="var(--c-400)" />
            </button>
          ))
        ) : (
          <p
            className="txt-pretty"
            style={{
              margin: 0,
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--c-600)",
            }}
          >
            {hasHistory ? t.report.noneOpen : t.report.nothingYet}
          </p>
        )}
      </div>

      <div style={{ display: "flex", marginTop: 16 }}>
        <Button
          kind="primary"
          size="md"
          onClick={onNew}
          style={{ flex: 1, justifyContent: "center" }}
        >
          {t.newTicket}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Root component
// ─────────────────────────────────────────────

export function SupportSection({
  t,
  locale,
  profile,
}: {
  t: AcctDict;
  locale: Locale;
  profile: CustomerProfile;
}) {
  const st = t.support;
  const [tickets, setTickets] = useState<TicketListItem[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  // `tickets`/`loadError` start at their "not yet loaded" values, so no
  // synchronous setState reset is needed at the top of this effect — it
  // only runs once on mount (empty dep array).
  useEffect(() => {
    let alive = true;
    listTickets()
      .then((res) => {
        if (!alive) return;
        setTickets([...res].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)));
      })
      .catch(() => {
        if (!alive) return;
        setLoadError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleUpdated = useCallback((ticket: Ticket) => {
    setTickets((prev) =>
      (prev ?? []).map((tk) =>
        tk.id === ticket.id ? { ...tk, ...ticket } : tk,
      ),
    );
  }, []);

  const handleCreated = useCallback(
    (ticket: Ticket) => {
      setTickets((prev) => [{ ...ticket, hasUnread: false }, ...(prev ?? [])]);
      setCreating(false);
      setActiveId(ticket.id);
    },
    [],
  );

  const openTicket = (id: number) => {
    setActiveId(id);
    setTickets((prev) =>
      (prev ?? []).map((tk) => (tk.id === id ? { ...tk, hasUnread: false } : tk)),
    );
  };

  if (activeId !== null) {
    return (
      <TicketDetailView
        key={activeId}
        ticketId={activeId}
        t={st}
        profile={profile}
        onBack={() => setActiveId(null)}
        onUpdated={handleUpdated}
      />
    );
  }

  if (creating) {
    return (
      <NewTicketForm
        t={st}
        onCancel={() => setCreating(false)}
        onCreated={handleCreated}
      />
    );
  }

  if (tickets === null) {
    if (loadError) {
      return (
        <div style={{ fontSize: 13.5, color: "var(--s-error-600)" }}>
          {st.loadError}
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Skeleton w="100%" h={90} r={16} />
        <Skeleton w="100%" h={90} r={16} />
        <Skeleton w="100%" h={90} r={16} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <ReportIssueCard
        t={st}
        locale={locale}
        tickets={tickets}
        onOpenTicket={openTicket}
        onNew={() => setCreating(true)}
      />
      {tickets.length > 0 && (
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(28,28,26,0.08)",
            borderRadius: 16,
            boxShadow: "var(--sh-sm)",
            overflow: "hidden",
          }}
        >
          {tickets.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              t={st}
              locale={locale}
              onClick={() => openTicket(ticket.id)}
            />
          ))}
        </div>
      )}
      {loadError && (
        <div style={{ fontSize: 12.5, color: "var(--s-error-600)" }}>
          {st.loadError}
        </div>
      )}
    </div>
  );
}
