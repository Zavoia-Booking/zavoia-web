"use client";

import Link from "next/link";
import * as Collapsible from "@radix-ui/react-collapsible";
import { Close as DialogClose } from "@radix-ui/react-dialog";
import { ActionModal } from "@/app/[locale]/appointments/_components/actions/action-modal";
import { localeHref } from "@/i18n/routes";
import styles from "./support-section.module.css";
import disclosure from "@/components/ui/disclosure-motion.module.css";

import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Support tab — ticket-based support UI inside the account settings page.
 *
 * One responsive ticket list with inline, single-open conversations.
 * Presentation changes preserve the authenticated API and existing state flow.
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

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { format } from "@/i18n/format";
import { errorMessage, mapBackendCode } from "@/lib/api/error-messages";
import { useTranslation } from "@/i18n/useTranslation";
import { Button, Icon, InlineError, Skeleton, useToast } from "@/components/ui";
import { TextareaField } from "@/components/ui/textarea-field";
import {
  getPlainTextApiError,
  plainTextErrorMessage,
  SUPPORT_MESSAGE_MAX_LENGTH,
  validatePlainText,
} from "@/lib/validation/free-text";
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

type AcctDict = Dictionary["account"];
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
// Status stays readable without depending on colour.
// ─────────────────────────────────────────────

function TicketStatusBadge({ status, t }: { status: TicketStatus; t: SupportDict }) {
  return (
    <span className={styles.status} data-closed={status === "CLOSED" || undefined}>
      {status === "CLOSED" ? <Icon name="lock" size={14} aria-hidden="true" /> : <span aria-hidden="true" className={styles.statusDot} style={{ background: statusColor(status) }} />}
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
  selected = false,
}: {
  ticket: TicketListItem;
  t: SupportDict;
  locale: Locale;
  onClick: (button: HTMLButtonElement) => void;
  selected?: boolean;
}) {
  const updated = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(ticket.updatedAt));
  const text = preview(ticket) || categoryLabel(t, ticket.category);

  return (
    <h3 className={styles.ticketHeading}><Collapsible.Trigger asChild>
    <button type="button" className={styles.ticketRow} aria-current={selected ? "true" : undefined} onClick={(event) => onClick(event.currentTarget)}>
      <span className={styles.ticketSubject}>
        <span className={styles.ticketTitle} data-unread={ticket.hasUnread || undefined}>
          {ticket.hasUnread && <span role="img" className={styles.unread} aria-label={t.unreadAria} />}
          <span>{text}</span>
        </span>
        <span className={styles.ticketMeta}>#{ticket.id} · {categoryLabel(t, ticket.category)}</span>
      </span>
      <TicketStatusBadge status={ticket.status} t={t} />
      <time className={styles.ticketDate} dateTime={ticket.updatedAt} aria-label={format(t.updated, { date: updated })}>
        {updated}
      </time>
      <span className={styles.rowArrow} aria-hidden="true"><Icon name="chevD" size={18} /></span>
    </button>
    </Collapsible.Trigger></h3>
  );
}

// ─────────────────────────────────────────────
// Message transcript
// ─────────────────────────────────────────────

function MessageEntry({
  mine,
  label,
  text,
}: {
  mine: boolean;
  label: string;
  text: string;
}) {
  return (
    <article className={styles.message} data-mine={mine || undefined} aria-label={label}>
      <div className={styles.messageAuthor}><Icon name={mine ? "user" : "reply"} size={17} aria-hidden="true" /><span>{label}</span></div>
      <div className={styles.messageText}>{text}</div>
    </article>
  );
}

function SupportEmptyArtwork() {
  return (
    <svg aria-hidden="true" width="112" height="88" viewBox="0 0 112 88" fill="none">
      <ellipse cx="56" cy="79" rx="44" ry="3" fill="var(--c-ink)" opacity=".05" />
      <path d="M25 31L76 23L84 69L33 77L25 31Z" fill="var(--c-shade)" stroke="var(--c-500)" />
      <rect x="30" y="13" width="57" height="60" rx="4" fill="var(--c-canvas)" stroke="var(--c-600)" />
      <path d="M41 28H65M41 37H76M41 46H70" stroke="var(--c-500)" strokeLinecap="round" />
      <path d="M48 57H80C83 57 85 59 85 62V72C85 75 83 77 80 77H67L60 83V77H48C45 77 43 75 43 72V62C43 59 45 57 48 57Z" fill="var(--c-canvas)" stroke="var(--p-500)" strokeLinejoin="round" />
      <path d="M53 67H74" stroke="var(--p-500)" strokeLinecap="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// New ticket form
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
  const { dict, locale } = useTranslation();
  const [category, setCategory] = useState<TicketCategory>("bug");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const messageRef = useRef<HTMLTextAreaElement | null>(null);
  const inFlight = useRef(false);
  const dismissed = useRef(false);
  const guidanceId = useId();

  const submit = async () => {
    if (inFlight.current || dismissed.current) return;
    const invalid = validatePlainText(message, { required: true, maxLength: SUPPORT_MESSAGE_MAX_LENGTH });
    if (invalid) {
      setFieldError(plainTextErrorMessage(invalid, dict.textarea, SUPPORT_MESSAGE_MAX_LENGTH, locale));
      messageRef.current?.focus();
      return;
    }
    const trimmed = message.trim();
    inFlight.current = true;
    setSubmitting(true);
    setFieldError(null);
    setRequestError(null);
    try {
      const created = await createTicket({ category, message: trimmed });
      toast(t.toasts.created, "check");
      onCreated(created);
    } catch (e) {
      const fieldFailure = getPlainTextApiError(e);
      if (fieldFailure) {
        setFieldError(plainTextErrorMessage(fieldFailure, dict.textarea, SUPPORT_MESSAGE_MAX_LENGTH, locale));
      } else {
        setRequestError(errorMessage(e, dict.errors, t.toasts.error));
      }
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const categoryBtn = (value: TicketCategory, label: string) => (
    <button
      type="button"
      className={styles.categoryOption}
      onClick={() => setCategory(value)}
      disabled={submitting}
      aria-pressed={category === value}
    >
      <Icon name={value === "bug" ? "warn" : "info"} size={19} />
      <span>{label}</span>
      <span className={styles.categoryCheck} aria-hidden="true">{category === value && <Icon name="check" size={16} />}</span>
    </button>
  );

  return (
    <ActionModal
      title={t.new.title}
      width={620}
      className={styles.contactModal}
      dismissible={!submitting}
      onClosing={() => { dismissed.current = true; }}
      onClose={onCancel}
      footer={<div className={styles.contactActions}>
        <DialogClose asChild><Button kind="secondary" size="md" disabled={submitting} style={{ paddingInline: "var(--support-action-padding, 20px)" }}>{t.new.cancel}</Button></DialogClose>
        <Button
          loading={submitting}
          kind="primary"
          size="md"
          onClick={submit}
          style={{ paddingInline: "var(--support-action-padding, 20px)" }}
          disabled={submitting || validatePlainText(message, { required: true, maxLength: SUPPORT_MESSAGE_MAX_LENGTH }) !== null}
        >
          {t.new.submit}
        </Button>
      </div>}
    >
    <div className={styles.newForm}>
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--c-700)",
            marginBottom: 8,
          }}
        >
          {t.new.categoryLabel}
        </div>
        <div className={styles.categoryOptions}>
          {categoryBtn("bug", t.new.problemOption)}
          {categoryBtn("question", t.new.questionOption)}
        </div>
      </div>

      <TextareaField
        ref={messageRef}
        label={t.new.messageLabel}
        value={message}
        disabled={submitting}
        error={fieldError}
        onChange={(e) => {
          setMessage(e.target.value);
          setFieldError(null);
          setRequestError(null);
        }}
        placeholder={t.new.messagePlaceholder}
        maxLength={SUPPORT_MESSAGE_MAX_LENGTH}
        required
        rows={5}
        aria-describedby={guidanceId}
      />
      <p id={guidanceId} className={styles.formGuidance}>{t.new.guidance}</p>

      {requestError && <InlineError>{requestError}</InlineError>}

    </div>
    </ActionModal>
  );
}

// ─────────────────────────────────────────────
// Ticket detail — thread + composer + close action
// ─────────────────────────────────────────────

function TicketDetailView({
  ticketId,
  t,
  profile,
  onUpdated,
  draft,
  setDraft,
}: {
  ticketId: number;
  t: SupportDict;
  profile: CustomerProfile;
  onUpdated: (ticket: Ticket) => void;
  draft: string;
  setDraft: (value: string) => void;
}) {
  const toast = useToast();
  const { dict, locale } = useTranslation();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [replyVersion, setReplyVersion] = useState(0);
  const [sending, setSending] = useState(false);
  const [replyFieldError, setReplyFieldError] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [closing, setClosing] = useState(false);
  const replyRef = useRef<HTMLTextAreaElement | null>(null);
  const replyInFlight = useRef(false);
  // Closing a ticket is irreversible from here (it drops out of the active
  // list and stops accepting replies) — the same synchronous lock as
  // register-form.tsx's submitLockRef: `closing` state disables the confirm
  // button only after a re-render, and a fast double click on the modal can
  // still fire closeTicket() twice before that render happens.
  const submitLockRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (!loading) headingRef.current?.focus({ preventScroll: true });
  }, [loading, loadError]);

  // `loading` is initialised to true and this component is remounted (via a
  // `key={ticketId}` at the call site) whenever the selected ticket changes,
  // so no synchronous setState(true)/setState(false) reset is needed here.
  useEffect(() => {
    let alive = true;
    getTicket(ticketId)
      .then((res) => {
        if (!alive) return;
        setLoadError(false);
        setTicket(res);
      })
      .catch(() => {
        if (!alive) return;
        setLoadError(true);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
        setRetrying(false);
      });
    return () => {
      alive = false;
    };
  }, [ticketId, attempt]);

  const send = async () => {
    if (!ticket || replyInFlight.current || !ACTIVE_STATUSES.includes(ticket.status)) return;
    const invalid = validatePlainText(draft, { required: true, maxLength: SUPPORT_MESSAGE_MAX_LENGTH });
    if (invalid) {
      setReplyFieldError(plainTextErrorMessage(invalid, dict.textarea, SUPPORT_MESSAGE_MAX_LENGTH, locale));
      replyRef.current?.focus();
      return;
    }
    const trimmed = draft.trim();
    replyInFlight.current = true;
    setSending(true);
    setReplyFieldError(null);
    setReplyError(null);
    try {
      const updated = await addTicketMessage(ticket.id, { message: trimmed });
      setTicket(updated);
      onUpdated(updated);
      setDraft("");
      // A successful send starts a fresh reply, including its blur-validation
      // state. Failed sends keep the same field and its existing draft.
      setReplyVersion((version) => version + 1);
      toast(t.toasts.replySent, "check");
    } catch (e) {
      // SUPPORT.E04: the ticket was closed (by staff, or in another tab) while
      // this reply was being written. Retrying can never work — the user needs
      // to open a new ticket, so say that instead of "something went wrong".
      const closed = mapBackendCode(e, { "SUPPORT.E04": true as const });
      const fieldFailure = getPlainTextApiError(e);
      if (closed) {
        setReplyError(t.toasts.ticketClosed);
      } else if (fieldFailure) {
        setReplyFieldError(plainTextErrorMessage(fieldFailure, dict.textarea, SUPPORT_MESSAGE_MAX_LENGTH, locale));
      } else {
        setReplyError(errorMessage(e, dict.errors, t.toasts.error));
      }
    } finally {
      replyInFlight.current = false;
      setSending(false);
    }
  };

  const doClose = async () => {
    if (!ticket || submitLockRef.current) return;
    submitLockRef.current = true;
    setClosing(true);
    try {
      const updated = await closeTicket(ticket.id);
      setTicket(updated);
      onUpdated(updated);
      toast(t.toasts.closed, "check");
      setConfirmingClose(false);
    } catch {
      toast(t.toasts.error, "warn", undefined, "error");
    } finally {
      setClosing(false);
      submitLockRef.current = false;
    }
  };

  if (loading) {
    return (
      <section className={styles.detailView} aria-label={t.thread.label}>
        <div aria-busy="true" className={styles.thread}>
          <div aria-hidden="true" className={styles.messages}>
            {[0, 1].map((index) => <div key={index} className={styles.message}><Skeleton w={index === 0 ? 42 : 110} h={14} r={4} /><Skeleton w={index === 0 ? "72%" : "86%"} h={44} r={4} /></div>)}
          </div>
          <div aria-hidden="true" className={styles.composer} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Skeleton w={88} h={16} /><Skeleton h={100} r={14} />
            <div className={styles.replyActions}><Skeleton w={88} h={16} /><Skeleton w={78} h={44} r={999} /></div>
          </div>
          <span role="status" className="sr-only">{dict.account.loading}</span>
        </div>
      </section>
    );
  }

  if (loadError || !ticket) {
    return (
      <section className={styles.detailView} aria-label={t.thread.label}>
        <h4 ref={headingRef} tabIndex={-1} className="sr-only">{t.thread.label}</h4>
        <InlineError>{t.loadError}</InlineError>
        <Button kind="secondary" size="sm" loading={retrying} onClick={() => { setRetrying(true); setAttempt((n) => n + 1); }} style={{ marginTop: 16 }}>{dict.errors.retry}</Button>
        <span role="status" className="sr-only">{retrying ? dict.account.loading : ""}</span>
      </section>
    );
  }

  const canReply = ACTIVE_STATUSES.includes(ticket.status);
  const history = ticket.details?.history ?? [];

  return (
    <section className={styles.detailView} aria-label={t.thread.label}>
      <div className={styles.thread}>
        <h4 ref={headingRef} tabIndex={-1} className="sr-only">{t.thread.label}</h4>
        {!canReply && <div className={styles.closedNotice} role="status" aria-label={t.composer.closedTitle}>
          <Icon name="lock" size={21} aria-hidden="true" />
          <div><p className={styles.closedTitle}>{t.composer.closedTitle}</p><p>{t.composer.closedNote}</p></div>
        </div>}

        <div className={styles.messages}>
          {history.length === 0 ? (
            <div
              style={{
                fontSize: 13.5,
                color: "var(--c-600)",
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
                <MessageEntry
                  key={i}
                  mine={mine}
                  label={mine ? t.thread.you : t.thread.support}
                  text={entry.message}
                />
              );
            })
          )}
        </div>

        {canReply && <div className={styles.composer}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <TextareaField
                key={replyVersion}
                ref={replyRef}
                label={dict.textarea.replyLabel}
                value={draft}
                disabled={sending}
                error={replyFieldError}
                required
                maxLength={SUPPORT_MESSAGE_MAX_LENGTH}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setReplyFieldError(null);
                  setReplyError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder={t.composer.placeholder}
                rows={2}
              />
              {replyError && <InlineError>{replyError}</InlineError>}
              <div className={styles.replyActions}>
              <button type="button" className={styles.closeAction} onClick={() => setConfirmingClose(true)}>{t.close.action}</button>
              <Button
                loading={sending}
                kind="primary"
                size="md"
                onClick={send}
                disabled={sending || validatePlainText(draft, { required: true, maxLength: SUPPORT_MESSAGE_MAX_LENGTH }) !== null}
              >
                {t.composer.send}
              </Button>
              </div>
            </div>
        </div>}
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
            cursor: closing ? "default" : "pointer",
          }}
          onClick={() => {
            if (!closing) setConfirmingClose(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              cursor: "default",
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
              <Button loading={closing} kind="primary" size="md" onClick={doClose} disabled={closing}>
                {t.close.confirm}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
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
  const { dict } = useTranslation();
  const [tickets, setTickets] = useState<TicketListItem[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "closed">("all");
  // Keep unsent text for each conversation while switching within Support.
  // This is temporary UI state, cleared when this account section unmounts.
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const lastTicketButton = useRef<HTMLButtonElement | null>(null);
  const inboxHeading = useRef<HTMLHeadingElement | null>(null);

  const backToInbox = () => {
    setActiveId(null);
    requestAnimationFrame(() => {
      const target = lastTicketButton.current;
      if (target?.isConnected) {
        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      } else inboxHeading.current?.focus({ preventScroll: true });
    });
  };

  // Keep the current state visible during an explicit retry. Cleanup prevents
  // a superseded request from updating this account section.
  useEffect(() => {
    let alive = true;
    listTickets()
      .then((res) => {
        if (!alive) return;
        setLoadError(false);
        setRetrying(false);
        setTickets([...res].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)));
      })
      .catch(() => {
        if (!alive) return;
        setRetrying(false);
        setLoadError(true);
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

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

  const activeCount = (tickets ?? []).filter((ticket) => ACTIVE_STATUSES.includes(ticket.status)).length;
  const visibleTickets = (tickets ?? []).filter((ticket) =>
    filter === "all" || (filter === "active" ? ACTIVE_STATUSES.includes(ticket.status) : ticket.status === "CLOSED"),
  );
  const counts = { all: tickets?.length ?? 0, active: activeCount, closed: (tickets?.length ?? 0) - activeCount };
  const pending = (tickets === null && !loadError) || retrying;

  return (
    <div className={styles.support} aria-busy={pending}>
      <div className={styles.supportHeader}>
        <h1>{t.sectionNav.support}</h1>
        <Button kind="primary" size="md" aria-haspopup="dialog" onClick={() => setCreating(true)} disabled={pending}>
          <Icon name="plus" size={17} />
          {st.newTicket}
        </Button>
      </div>
      <div className={styles.intro}>
        <p>{st.intro}</p>
        <Link className={styles.helpLink} href={localeHref(locale, "help")}>
          {dict.help.pageTitle}<Icon name="arrowR" size={16} />
        </Link>
      </div>
      <div className={styles.supportWorkspace}>
      <div className={styles.inbox}>
        <div className={styles.inboxHeader}>
          <h2 ref={inboxHeading} tabIndex={-1}>{st.report.myTickets}</h2>
          {tickets && tickets.length > 0 && (
            <div className={styles.filters} role="group" aria-label={st.filters.label}>
              {(["all", "active", "closed"] as const).map((value) => (
                <button key={value} type="button" aria-pressed={filter === value} onClick={() => { setActiveId(null); setFilter(value); }}>
                  {st.filters[value]} <span>{counts[value]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {tickets === null && !loadError && (
          <div aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className={styles.ticketRow}>
                <span className={styles.ticketSubject}><Skeleton w="76%" h={18} r={4} /><Skeleton w={110} h={14} r={4} /></span>
                <span className={styles.status}><Skeleton w={88} h={16} r={4} /></span><span className={styles.ticketDate}><Skeleton w={98} h={14} r={4} /></span>
              </div>
            ))}
          </div>
        )}
        {tickets && visibleTickets.length > 0 && (
          <ul className={styles.ticketList}>
            {visibleTickets.map((ticket) => {
              const expanded = activeId === ticket.id;
              return <Collapsible.Root key={ticket.id} asChild open={expanded} onOpenChange={(open) => {
                if (open) openTicket(ticket.id);
                else backToInbox();
              }}>
                <li className={`${styles.ticketItem} ${disclosure.root}`} data-open={expanded}>
                  <TicketRow ticket={ticket} t={st} locale={locale} selected={expanded} onClick={(button) => { lastTicketButton.current = button; }} />
                  <Collapsible.Content className={styles.conversationReveal} inert={!expanded} aria-hidden={!expanded}>
                    <div className={styles.conversationBody}>
                      <TicketDetailView ticketId={ticket.id} t={st} profile={profile}
                        onUpdated={(updated) => { handleUpdated(updated); if (updated.status === "CLOSED") setFilter("all"); }}
                        draft={replyDrafts[ticket.id] ?? ""} setDraft={(value) => setReplyDrafts((prev) => ({ ...prev, [ticket.id]: value }))} />
                    </div>
                  </Collapsible.Content>
                </li>
              </Collapsible.Root>;
            })}
          </ul>
        )}
        {tickets && visibleTickets.length === 0 && !loadError && (
          <div className={styles.empty}>
            <SupportEmptyArtwork />
            <h3>{tickets.length === 0 ? st.empty.title : st.filters.emptyTitle}</h3>
            <p>{tickets.length === 0 ? st.empty.body : st.filters.emptyBody}</p>
          </div>
        )}
        {loadError && <div className={styles.error}>
          <InlineError>{st.loadError}</InlineError>
          <Button kind="secondary" size="sm" loading={retrying} onClick={() => { setRetrying(true); setAttempt((n) => n + 1); }} style={{ marginTop: 16 }}>{dict.errors.retry}</Button>
        </div>}
      </div>
      </div>
      {creating && <NewTicketForm t={st} onCancel={() => setCreating(false)} onCreated={(ticket) => { setFilter("all"); handleCreated(ticket); }} />}
      <span role="status" className="sr-only">{pending ? t.loading : ""}</span>
    </div>
  );
}
