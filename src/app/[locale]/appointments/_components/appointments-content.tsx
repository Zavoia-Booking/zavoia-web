"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import { dictionaries, format } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { useAuth } from "@/lib/auth/useAuth";
import { useAuthModal } from "@/components/shell/auth-modal-provider";
import {
  Avatar,
  Button,
  Icon,
  Kicker,
  SignedOutGate,
  Skeleton,
  Spinner,
} from "@/components/ui";
import { listAppointments } from "@/lib/api/marketplace/appointments";
import type {
  AppointmentList,
  AppointmentListItem,
  AppointmentStatus,
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
  type ApptStamp,
  type Tense,
  type TimeUntil,
} from "./vm";

type ApptDict = (typeof dictionaries)[Locale]["appointments"];

type Filter = "all" | "upcoming" | "past" | "cancelled" | "no_show";

const PAGE_SIZE = 20;

// ─────────────────────────────────────────────
// Status dot — colour by stored status (vm.STATUS_DOT_COLOR).
// Ported from web-appointments.jsx:133-138.
// ─────────────────────────────────────────────
function SchedDot({ status }: { status: AppointmentStatus }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        flexShrink: 0,
        background: STATUS_DOT_COLOR[status],
      }}
    />
  );
}

// ─────────────────────────────────────────────
// Date pill — terracotta today, ink upcoming, white past.
// Ported from web-appointments.jsx:143-162.
// ─────────────────────────────────────────────
function DatePill({
  dow,
  mon,
  day,
  tense = "future",
}: {
  dow: string;
  mon: string;
  day: number;
  tense?: Tense;
}) {
  const isToday = tense === "now" || tense === "today";
  const isPast = tense === "past";
  const pal = isToday
    ? {
        bg: "var(--p-500)",
        fg: "#fff",
        sub: "rgba(255,255,255,0.80)",
        border: "none",
        shadow:
          "0 6px 18px rgba(201,74,42,0.22), 0 1px 2px rgba(28,28,26,0.06)",
      }
    : isPast
      ? {
          bg: "#fff",
          fg: "var(--c-700)",
          sub: "var(--c-500)",
          border: "1px solid rgba(28,28,26,0.10)",
          shadow: "none",
        }
      : {
          bg: "var(--c-ink)",
          fg: "#fff",
          sub: "rgba(255,255,255,0.65)",
          border: "none",
          shadow: "0 1px 2px rgba(28,28,26,0.06)",
        };
  return (
    <div
      style={{
        width: 50,
        height: 64,
        borderRadius: 13,
        flexShrink: 0,
        background: pal.bg,
        color: pal.fg,
        border: pal.border,
        boxShadow: pal.shadow,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 0",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: pal.sub,
          lineHeight: 1,
        }}
      >
        {dow}
      </span>
      <span
        style={{
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          marginTop: 3,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {day}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.10em",
          color: pal.sub,
          lineHeight: 1,
          marginTop: 3,
        }}
      >
        {mon}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Right-hand time-until chip — maps the vm TimeUntil descriptor to dict text.
// Ported from web-appointments.jsx:165-187.
// ─────────────────────────────────────────────
function timeUntilLabel(tu: TimeUntil, t: ApptDict): string {
  switch (tu.kind) {
    case "live":
      return t.timeUntil.live;
    case "pending":
      return t.timeUntil.awaiting;
    case "soon":
      if (tu.variant === "starting") return t.timeUntil.starting;
      return format(t.timeUntil.inMinutes, { n: String(tu.value) });
    case "today":
      return format(t.timeUntil.inHours, { n: String(tu.value) });
    case "future":
      if (tu.variant === "tomorrow") return t.timeUntil.tomorrow;
      if (tu.variant === "days") {
        return format(
          tu.value === 1 ? t.timeUntil.inDaysOne : t.timeUntil.inDaysMany,
          { n: String(tu.value) },
        );
      }
      if (tu.variant === "weeks") {
        return format(
          tu.value === 1 ? t.timeUntil.inWeeksOne : t.timeUntil.inWeeksMany,
          { n: String(tu.value) },
        );
      }
      return format(
        tu.value === 1 ? t.timeUntil.inMonthsOne : t.timeUntil.inMonthsMany,
        { n: String(tu.value) },
      );
  }
}

function SchedChip({ tu, t }: { tu: TimeUntil; t: ApptDict }) {
  const pal =
    tu.kind === "live"
      ? {
          bg: "color-mix(in oklch, var(--s-success-600) 12%, #fff)",
          fg: "var(--s-success-600)",
        }
      : tu.kind === "pending"
        ? {
            bg: "color-mix(in oklch, var(--c-900) 8%, #fff)",
            fg: "var(--c-900)",
          }
        : { bg: "var(--c-100)", fg: "var(--c-700)" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 22,
        padding: "0 10px",
        borderRadius: 999,
        background: pal.bg,
        color: pal.fg,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {tu.kind === "live" && (
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "currentColor",
            position: "relative",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "currentColor",
              animation: "zv-pulse 1.6s ease-out infinite",
            }}
          />
        </span>
      )}
      {timeUntilLabel(tu, t)}
    </span>
  );
}

// ─────────────────────────────────────────────
// Rotated dashed ticket stamp. Ported from web-appointments.jsx:190-207.
// ─────────────────────────────────────────────
function TicketStamp({ stamp, t }: { stamp: ApptStamp; t: ApptDict }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 9px",
        border: `1.5px dashed ${stamp.color}`,
        borderRadius: 4,
        background: "#fff",
        fontFamily: "var(--font-mono)",
        fontSize: 9.5,
        fontWeight: 800,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: stamp.color,
        transform: "rotate(-2deg)",
        lineHeight: 1,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {stamp.pulse && (
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "currentColor",
            position: "relative",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "currentColor",
              animation: "zv-pulse 1.6s ease-out infinite",
            }}
          />
        </span>
      )}
      {t.stamps[stamp.key]}
    </div>
  );
}

// ─────────────────────────────────────────────
// Receipt / ticket card — faithful port of ZwTicketCard (web-appointments.jsx:212-323).
// ─────────────────────────────────────────────
function TicketCard({
  a,
  locale,
  t,
  now,
  onOpen,
}: {
  a: AppointmentListItem;
  locale: Locale;
  t: ApptDict;
  now: Date;
  onOpen: (uuid: string) => void;
}) {
  const tense = deriveTense(a.scheduledAt, a.endsAt, a.status, now);
  const isCancelled = a.status === "cancelled" || a.status === "no_show";

  // Title: bundle → bookedItemName, else primaryItemName + "+ N more".
  const title =
    a.bookingType === "bundle"
      ? a.bookedItemName
      : a.additionalItemsCount > 0
        ? `${a.primaryItemName} + ${a.additionalItemsCount} more`
        : a.primaryItemName;

  const stamp = apptStamp(a.status, tense);
  const tu = timeUntil(a.scheduledAt, a.status, tense, now);

  const startTime = apptTime(a.scheduledAt, locale);
  const endTime = apptTime(a.endsAt, locale);

  const businessName = a.location.name ?? "";
  const businessLogo = a.location.profileImage;

  const staff = a.staff;
  const staffName = staff
    ? `${staff.firstName ?? ""} ${staff.lastName ?? ""}`.trim()
    : "";
  const staffFirst = staff?.firstName ?? staffName;

  const duration = Number(a.duration);

  return (
    <div
      role="button"
      tabIndex={0}
      className="tap zw-hover-lift"
      onClick={() => onOpen(a.uuid)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(a.uuid);
      }}
      style={{
        position: "relative",
        flex: 1,
        minWidth: 0,
        background: isCancelled ? "var(--c-100)" : "#fff",
        border: "1px solid rgba(28,28,26,0.07)",
        borderRadius: 16,
        boxShadow: "var(--sh-sm)",
        cursor: "pointer",
        overflow: "visible",
      }}
    >
      {/* TOP — when + what */}
      <div style={{ padding: "15px 18px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
              flex: 1,
            }}
          >
            <SchedDot status={a.status} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13.5,
                fontWeight: 600,
                color: isCancelled ? "var(--c-500)" : "var(--c-900)",
                letterSpacing: "-0.01em",
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}
            >
              {startTime} – {endTime}
            </span>
          </div>
          {stamp ? (
            <TicketStamp stamp={stamp} t={t} />
          ) : a.status === "confirmed" && tu ? (
            <SchedChip tu={tu} t={t} />
          ) : null}
        </div>

        <div
          style={{
            marginTop: 9,
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "-0.022em",
            lineHeight: 1.22,
            color: isCancelled ? "var(--c-600)" : "var(--c-900)",
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: 7,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--c-600)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <Icon name="clock" size={12} color="var(--c-500)" />
          <span>{formatDuration(duration).toUpperCase()}</span>
          <span style={{ color: "var(--c-400)" }}>·</span>
          <span>
            {formatApptPrice(a.price, a.currency, locale, t.free)}
          </span>
        </div>
      </div>

      {/* PERFORATION — dashed line + both notches share one zero-height
          flow anchor at the top/stub boundary, so they stay centred on the
          same axis at any card (title) height. */}
      <div style={{ position: "relative", height: 0 }} aria-hidden="true">
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 14,
            right: 14,
            height: 1,
            transform: "translateY(-50%)",
            backgroundImage:
              "radial-gradient(circle, rgba(28,28,26,0.22) 0.7px, transparent 0.7px)",
            backgroundSize: "6px 1px",
            backgroundRepeat: "repeat-x",
            backgroundPosition: "left center",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: 0,
            left: -9,
            transform: "translateY(-50%)",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "var(--c-canvas)",
            border: "1px solid rgba(28,28,26,0.10)",
            clipPath: "inset(0 0 0 50%)",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: 0,
            right: -9,
            transform: "translateY(-50%)",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "var(--c-canvas)",
            border: "1px solid rgba(28,28,26,0.10)",
            clipPath: "inset(0 50% 0 0)",
          }}
        />
      </div>

      {/* STUB — who */}
      <div
        style={{
          padding: "13px 18px 15px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          minWidth: 0,
        }}
      >
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: "var(--c-200)",
            border: "1px solid rgba(28,28,26,0.07)",
            overflow: "hidden",
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {businessLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={businessLogo}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span
              style={{ fontSize: 13, fontWeight: 700, color: "var(--c-700)" }}
            >
              {(businessName || "?").trim()[0]}
            </span>
          )}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--c-800)",
              letterSpacing: "-0.012em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "block",
              lineHeight: 1.2,
            }}
          >
            {businessName}
          </span>
        </div>
        {staff && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            <Avatar
              src={staff.profileImage ?? undefined}
              name={staffName}
              size={22}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--c-700)",
                whiteSpace: "nowrap",
                maxWidth: 80,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {staffFirst}
            </span>
          </span>
        )}
        <Icon name="chevR" size={14} color="var(--c-400)" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Timeline row: date pill + ticket. Ported from web-appointments.jsx:326-334.
// ─────────────────────────────────────────────
function TimelineRow({
  a,
  locale,
  t,
  now,
  onOpen,
}: {
  a: AppointmentListItem;
  locale: Locale;
  t: ApptDict;
  now: Date;
  onOpen: (uuid: string) => void;
}) {
  const tense = deriveTense(a.scheduledAt, a.endsAt, a.status, now);
  const { dow, day, mon } = apptDateParts(a.scheduledAt, locale);
  return (
    <div
      style={{ display: "flex", alignItems: "stretch", gap: 14, minWidth: 0 }}
    >
      <div style={{ paddingTop: 4 }}>
        <DatePill dow={dow} mon={mon} day={day} tense={tense} />
      </div>
      <TicketCard a={a} locale={locale} t={t} now={now} onOpen={onOpen} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Section header (accordion). Ported from web-appointments.jsx:338-352.
// ─────────────────────────────────────────────
function SchedSection({
  label,
  count,
  open,
  onToggle,
}: {
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="tap"
      onClick={onToggle}
      aria-expanded={open}
      style={{
        width: "100%",
        boxSizing: "border-box",
        cursor: "pointer",
        background: "transparent",
        border: 0,
        padding: "6px 0 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <span
        style={{ display: "inline-flex", alignItems: "baseline", gap: 10 }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: "-0.026em",
            color: "var(--c-900)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            fontWeight: 500,
            color: "var(--c-500)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {count}
        </span>
      </span>
      <Icon name={open ? "chevU" : "chevD"} size={16} color="var(--c-600)" />
    </button>
  );
}

// ─────────────────────────────────────────────
// Filter chips with mono counts. Ported from web-appointments.jsx:355-386.
// All five chips stay visible (live counts aren't all known up front).
// ─────────────────────────────────────────────
function SchedFilters({
  value,
  onChange,
  counts,
  t,
}: {
  value: Filter;
  onChange: (f: Filter) => void;
  counts: Partial<Record<Filter, number>>;
  t: ApptDict;
}) {
  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: t.filters.all },
    { id: "upcoming", label: t.filters.upcoming },
    { id: "past", label: t.filters.past },
    { id: "cancelled", label: t.filters.cancelled },
    { id: "no_show", label: t.filters.noShow },
  ];
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        marginTop: 24,
        marginBottom: 28,
      }}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        const count = counts[tab.id];
        return (
          <button
            key={tab.id}
            type="button"
            className="tap"
            onClick={() => onChange(tab.id)}
            aria-pressed={active}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              height: 36,
              padding: "0 15px",
              borderRadius: 999,
              cursor: "pointer",
              background: active ? "var(--c-ink)" : "#fff",
              color: active ? "#fff" : "var(--c-700)",
              border:
                "1px solid " +
                (active ? "transparent" : "rgba(28,28,26,0.12)"),
              fontSize: 13.5,
              fontWeight: 600,
              letterSpacing: "-0.005em",
              transition:
                "background-color .2s var(--ease-soft), color .2s var(--ease-soft)",
            }}
          >
            {tab.label}
            {count != null && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: active ? "rgba(255,255,255,0.6)" : "var(--c-500)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Year separator. Ported from web-appointments.jsx:389-396.
// ─────────────────────────────────────────────
function YearSep({ year }: { year: number }) {
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "8px 0 2px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.14em",
          color: "var(--c-500)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {year}
      </span>
      <span
        aria-hidden="true"
        style={{ flex: 1, height: 1, background: "rgba(28,28,26,0.08)" }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Grid of timeline rows (optionally with year separators).
// Ported from web-appointments.jsx:399-415.
// ─────────────────────────────────────────────
function SchedGrid({
  items,
  locale,
  t,
  now,
  onOpen,
  withYears,
}: {
  items: AppointmentListItem[];
  locale: Locale;
  t: ApptDict;
  now: Date;
  onOpen: (uuid: string) => void;
  withYears?: boolean;
}) {
  const nodes: React.ReactNode[] = [];
  let lastYear = now.getFullYear();
  items.forEach((a) => {
    if (withYears) {
      const y = new Date(a.scheduledAt).getFullYear();
      if (y !== lastYear) {
        nodes.push(<YearSep key={`sep-${y}-${a.uuid}`} year={y} />);
        lastYear = y;
      }
    }
    nodes.push(
      <TimelineRow
        key={a.uuid}
        a={a}
        locale={locale}
        t={t}
        now={now}
        onOpen={onOpen}
      />,
    );
  });
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))",
        gap: 18,
        paddingBottom: 8,
      }}
    >
      {nodes}
    </div>
  );
}

// ─────────────────────────────────────────────
// Dashed empty-section note. Ported from web-appointments.jsx:517-524.
// ─────────────────────────────────────────────
function SchedNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "20px 18px",
        background: "#fff",
        border: "1px dashed rgba(28,28,26,0.14)",
        borderRadius: 14,
        fontSize: 13.5,
        color: "var(--c-600)",
        lineHeight: 1.5,
        maxWidth: 520,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// Full empty state. Ported from web-appointments.jsx:526-542.
// ─────────────────────────────────────────────
function SchedEmpty({
  t,
  onExplore,
}: {
  t: ApptDict;
  onExplore: () => void;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px dashed rgba(28,28,26,0.16)",
        borderRadius: 22,
        padding: "64px 28px",
        textAlign: "center",
        maxWidth: 560,
        margin: "0 auto",
      }}
    >
      <span
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--c-shade)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
        }}
      >
        <Icon name="cal" size={24} color="var(--c-600)" />
      </span>
      <div
        style={{
          fontSize: 19,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--c-900)",
          marginBottom: 8,
        }}
      >
        {t.empty.title}
      </div>
      <p
        className="txt-pretty"
        style={{
          margin: "0 auto 24px",
          fontSize: 14.5,
          lineHeight: 1.55,
          color: "var(--c-600)",
          maxWidth: 360,
        }}
      >
        {t.empty.body}
      </p>
      <Button kind="accent" size="lg" onClick={onExplore}>
        {t.empty.cta}
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Loading skeleton — a few ticket-row placeholders.
// ─────────────────────────────────────────────
function LoadingState({ t }: { t: ApptDict }) {
  return (
    <div
      className="zw-container"
      style={{ paddingTop: 44, paddingBottom: 40, width: "100%" }}
      aria-busy="true"
    >
      <Skeleton w={160} h={14} r={6} />
      <div style={{ marginTop: 14 }}>
        <Skeleton w={280} h={40} r={10} />
      </div>
      <div
        style={{
          marginTop: 28,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))",
          gap: 18,
        }}
      >
        <Skeleton w="100%" h={220} r={16} />
        <Skeleton w="100%" h={220} r={16} />
        <Skeleton w="100%" h={220} r={16} />
      </div>
      <p className="sr-only">{t.loading}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// In-region loading — shown inside the list area on a filter REFETCH so the
// page chrome (kicker, title, filter chips) stays mounted and interactive.
// ─────────────────────────────────────────────
function ListLoading({ t }: { t: ApptDict }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))",
        gap: 18,
        paddingBottom: 8,
      }}
      aria-busy="true"
    >
      <Skeleton w="100%" h={220} r={16} />
      <Skeleton w="100%" h={220} r={16} />
      <Skeleton w="100%" h={220} r={16} />
      <p className="sr-only">{t.loading}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Inline fetch-error state.
// ─────────────────────────────────────────────
function ErrorState({ t, onRetry }: { t: ApptDict; onRetry: () => void }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid rgba(28,28,26,0.08)",
        borderRadius: 16,
        boxShadow: "var(--sh-sm)",
        padding: "32px 28px",
        textAlign: "center",
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      <p
        className="txt-pretty"
        style={{
          margin: "0 0 18px",
          fontSize: 14.5,
          lineHeight: 1.55,
          color: "var(--c-600)",
        }}
      >
        {t.errorLoading}
      </p>
      <Button kind="primary" size="md" onClick={onRetry}>
        {t.retry}
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export function AppointmentsContent({ locale }: { locale: Locale }) {
  const t = dictionaries[locale].appointments;
  const router = useRouter();
  const { status } = useAuth();
  const { openAuthModal } = useAuthModal();

  // `now` is captured per data load so all tense/time-until derivations are
  // consistent within a render pass. Initialised at mount; refreshed on fetch.
  const [now, setNow] = useState(() => new Date());

  const [filter, setFilter] = useState<Filter>("all");
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [pastOpen, setPastOpen] = useState(true);

  const [upcoming, setUpcoming] = useState<AppointmentListItem[]>([]);
  const [past, setPast] = useState<PastAppointmentsGroup | null>(null);

  const [loading, setLoading] = useState(true);
  // True once the first fetch has resolved (success OR failure). Distinguishes
  // the initial full-page skeleton from a filter REFETCH: after chrome has been
  // shown once, a filter switch shows an in-region indicator instead of
  // unmounting the whole page.
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [errored, setErrored] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const authed = status === "authenticated";

  // Server fetch driven by the active filter. `all` returns both sections;
  // `upcoming` returns only upcoming; `past`/`cancelled`/`no_show` only finished.
  // Sets state only AFTER the await, so it is safe to call from an effect.
  const load = useCallback(async (active: Filter) => {
    try {
      const params: ListAppointmentsParams =
        active === "all" ? {} : { status: active };
      const res: AppointmentList = await listAppointments(params);
      setNow(new Date());
      setUpcoming(res.upcoming ?? []);
      setPast(res.past);
      setErrored(false);
    } catch {
      setErrored(true);
      setUpcoming([]);
      setPast(null);
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  }, []);

  // Mount + filter changes drive the refetch. `loading`/`errored` are reset in
  // the `onFilter` handler (not here); the fetch resolves and sets state inside
  // the promise continuation (post-await), mirroring account-content's pattern.
  useEffect(() => {
    if (!authed) return;
    let alive = true;
    const params: ListAppointmentsParams =
      filter === "all" ? {} : { status: filter };
    listAppointments(params)
      .then((res) => {
        if (!alive) return;
        setNow(new Date());
        setUpcoming(res.upcoming ?? []);
        setPast(res.past);
        setErrored(false);
      })
      .catch(() => {
        if (!alive) return;
        setErrored(true);
        setUpcoming([]);
        setPast(null);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
        setHasLoadedOnce(true);
      });
    return () => {
      alive = false;
    };
  }, [authed, filter]);

  const onFilter = useCallback(
    (next: Filter) => {
      if (next === filter) return;
      setLoading(true);
      setErrored(false);
      setFilter(next);
    },
    [filter],
  );

  const onRetry = useCallback(() => {
    setLoading(true);
    setErrored(false);
    void load(filter);
  }, [filter, load]);

  const onLoadMore = useCallback(async () => {
    if (!past || !past.hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const params: ListAppointmentsParams = {
        status: filter === "all" ? "past" : (filter as ListAppointmentsParams["status"]),
        limit: past.limit || PAGE_SIZE,
        offset: past.offset + (past.limit || PAGE_SIZE),
      };
      const res = await listAppointments(params);
      const more = res.past;
      if (more) {
        setPast((prev) =>
          prev
            ? {
                ...more,
                items: [...prev.items, ...more.items],
              }
            : more,
        );
      }
    } catch {
      // Soft failure — leave the existing list; user can retry the button.
    } finally {
      setLoadingMore(false);
    }
  }, [past, loadingMore, filter]);

  const onOpen = useCallback(
    (uuid: string) => {
      router.push(localeHref(locale, "appointments", uuid));
    },
    [router, locale],
  );

  // ── Auth gating (mirrors account-content) ──
  if (status === "idle" || status === "loading") {
    return <LoadingState t={t} />;
  }

  if (status === "unauthenticated" || status === "error") {
    return (
      <SignedOutGate
        icon="cal"
        title={t.gate.title}
        body={t.gate.body}
        onCta={() => openAuthModal("signin")}
        secondaryLabel={t.gate.secondary}
        onSecondary={() => router.push(localeHref(locale, "search"))}
      />
    );
  }

  // Authenticated but the FIRST data load hasn't resolved yet — show the
  // full-page skeleton. Once chrome has been shown once, a filter refetch
  // keeps the chrome mounted and shows an in-region indicator instead.
  if (loading && !hasLoadedOnce) {
    return <LoadingState t={t} />;
  }

  // A filter switch (or post-first-load retry) is refetching: keep header,
  // title, sub-line and filter chips mounted; show loading only in the list.
  const refetching = loading;

  // Section visibility per active filter (web-appointments.jsx:472-473).
  const showUpcoming = filter === "all" || filter === "upcoming";
  const showFinished =
    filter === "all" ||
    filter === "past" ||
    filter === "cancelled" ||
    filter === "no_show";

  const finishedItems = past?.items ?? [];
  const finishedTotal = past?.total ?? 0;

  // Finished header label per active filter (web-appointments.jsx:474).
  const finishedLabel =
    filter === "cancelled"
      ? t.finishedLabels.cancelled
      : filter === "no_show"
        ? t.finishedLabels.noShow
        : filter === "past"
          ? t.finishedLabels.completed
          : t.finishedLabels.past;

  // Mono sub-line month/year from the current date.
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  })
    .format(now)
    .toUpperCase();

  const upcomingCount = upcoming.length;
  const pastCount = finishedTotal;

  // Chip counts: known up front for all/upcoming/past; cancelled/no_show
  // counts only after that filter has been loaded.
  const counts: Partial<Record<Filter, number>> = {
    all: upcoming.length + (past?.total ?? 0),
    upcoming: upcoming.length,
    past: past?.total,
  };
  if (filter === "cancelled") counts.cancelled = finishedItems.length;
  if (filter === "no_show") counts.no_show = finishedItems.length;

  // Per-section empty note keyed off the active filter.
  const finishedEmptyNote =
    filter === "cancelled"
      ? t.notes.cancelledEmpty
      : filter === "no_show"
        ? t.notes.noShowEmpty
        : t.notes.pastEmpty;

  const totallyEmpty = upcoming.length === 0 && finishedItems.length === 0;

  return (
    <div
      className="zw-container"
      style={{ paddingTop: 44, paddingBottom: 56, width: "100%" }}
    >
      <Kicker style={{ marginBottom: 10 }}>{t.kicker}</Kicker>
      <h1
        style={{
          margin: 0,
          fontSize: "clamp(28px, 3.4vw, 40px)",
          fontWeight: 600,
          letterSpacing: "-0.035em",
          color: "var(--c-900)",
        }}
      >
        {t.title}
      </h1>
      <div
        style={{
          marginTop: 10,
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.06em",
          color: "var(--c-500)",
        }}
      >
        {monthLabel} · {upcomingCount} {t.upcomingWord} · {pastCount}{" "}
        {t.pastWord}
      </div>

      <SchedFilters value={filter} onChange={onFilter} counts={counts} t={t} />

      {refetching ? (
        <ListLoading t={t} />
      ) : errored ? (
        <ErrorState t={t} onRetry={onRetry} />
      ) : totallyEmpty ? (
        <SchedEmpty
          t={t}
          onExplore={() => router.push(localeHref(locale, "search"))}
        />
      ) : (
        <>
          {showUpcoming && (
            <section style={{ marginBottom: 14 }}>
              <SchedSection
                label={t.sectionUpcoming}
                count={upcoming.length}
                open={upcomingOpen}
                onToggle={() => setUpcomingOpen((o) => !o)}
              />
              {upcomingOpen &&
                (upcoming.length === 0 ? (
                  <SchedNote>{t.notes.upcomingEmpty}</SchedNote>
                ) : (
                  <SchedGrid
                    items={upcoming}
                    locale={locale}
                    t={t}
                    now={now}
                    onOpen={onOpen}
                  />
                ))}
            </section>
          )}

          {showFinished && (
            <section
              style={{
                marginTop: showUpcoming ? 18 : 0,
                paddingTop: showUpcoming ? 18 : 0,
                borderTop: showUpcoming
                  ? "1px solid rgba(28,28,26,0.07)"
                  : "none",
              }}
            >
              <SchedSection
                label={finishedLabel}
                count={finishedTotal}
                open={pastOpen}
                onToggle={() => setPastOpen((o) => !o)}
              />
              {pastOpen &&
                (finishedItems.length === 0 ? (
                  <SchedNote>{finishedEmptyNote}</SchedNote>
                ) : (
                  <>
                    <SchedGrid
                      items={finishedItems}
                      locale={locale}
                      t={t}
                      now={now}
                      onOpen={onOpen}
                      withYears
                    />
                    {past?.hasMore && (
                      <div style={{ marginTop: 18 }}>
                        <button
                          type="button"
                          className="zw-pag-btn"
                          onClick={() => void onLoadMore()}
                          disabled={loadingMore}
                          style={{ padding: "0 18px" }}
                        >
                          {loadingMore ? <Spinner size={15} /> : t.loadMore}
                        </button>
                      </div>
                    )}
                  </>
                ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
