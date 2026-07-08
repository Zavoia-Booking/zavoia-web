"use client";

/**
 * Presentational sub-components for the appointment detail page (Slice 4).
 *
 * These are a faithful port of `docs/web-appointment-detail.jsx` onto the LIVE
 * `AppointmentDetail` API shape. Several prototype features are intentionally
 * degraded/omitted because the API does not expose the underlying data — each
 * such omission is documented inline (recurring total/cadence,
 * cancelledBy/refNo/distance, join-online URL).
 *
 * All numeric fields that can arrive as runtime STRINGS (averageRating, price,
 * duration) are coerced with `Number()` before arithmetic / `.toFixed`.
 */

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { Avatar, Icon, Img, Rating, Stars } from "@/components/ui";
import { formatDuration, formatMoney } from "@/lib/format/money-time";
import {
  apptTime,
  formatApptPrice,
  type StatusTone,
  type Tense,
} from "../../_components/vm";
import type {
  AppointmentDetail,
  AppointmentStatus,
} from "@/lib/api/marketplace/types";

const ZW_CARD = "1px solid rgba(28,28,26,0.07)";
const ZW_CARD_R = 18;

type ApptDict = Dictionary["appointmentDetail"];

/** Coerce a runtime number-or-numeric-string into a real number (or null). */
function num(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ── Status stamp pill (prototype 102–127) ──────────────────────────────────

/**
 * Tone → CSS colour for the dashed status stamp. Mirrors the prototype mapping:
 * live→success, warning→warning, error→error, neutral/completed→c-600,
 * pending→c-900, confirmed→p-600.
 */
function stampColor(tone: StatusTone): string {
  switch (tone) {
    case "live":
      return "var(--s-success-600)";
    case "warning":
      return "var(--s-warning-600)";
    case "error":
      return "var(--s-error-600)";
    case "neutral":
      return "var(--c-600)";
    case "pending":
      return "var(--c-900)";
    default:
      return "var(--p-600)";
  }
}

/** Tone → dictionary status label. */
function stampLabel(t: ApptDict, tone: StatusTone, status: AppointmentStatus): string {
  if (tone === "live") return t.status.inProgress;
  if (tone === "warning") return t.status.cancelled;
  if (tone === "error") return t.status.noShow;
  if (tone === "neutral" || status === "completed") return t.status.completed;
  if (tone === "pending") return t.status.pending;
  return t.status.confirmed;
}

export function StampPill({
  t,
  tone,
  status,
}: {
  t: ApptDict;
  tone: StatusTone;
  status: AppointmentStatus;
}) {
  const color = stampColor(tone);
  const pulse = tone === "live";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "5px 11px 5px 9px",
        border: "1.5px dashed " + color,
        borderRadius: 6,
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: "0.12em",
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
          position: "relative",
          display: "inline-block",
        }}
      >
        {pulse && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: color,
              animation: "zv-pulse 1.6s ease-out infinite",
            }}
          />
        )}
      </span>
      {stampLabel(t, tone, status)}
    </span>
  );
}

// ── Eyebrow-labelled section wrapper ───────────────────────────────────────

export function Section({
  label,
  children,
  style = {},
}: {
  label: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <section style={{ marginTop: 36, ...style }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 13,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--c-500)",
          }}
        >
          {label}
        </span>
      </div>
      {children}
    </section>
  );
}

// ── WHERE — venue ticket (distance OMITTED: no field) ──────────────────────

export function WhereCard({
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
  const loc = appt.location;
  const biz = appt.business;
  if (!loc) return null;
  const photo = loc.profileImage ?? biz?.logo ?? undefined;
  const rating = num(loc.averageRating);
  // /business/[slug] resolves a LOCATION slug-or-numeric-id via getListing; a
  // business UUID resolves to neither (and location has no slug). Use the
  // location's numeric id, stringified — mirrors saved-content.tsx.
  const bizHref =
    loc.id != null ? localeHref(locale, "business", String(loc.id)) : undefined;
  return (
    <a
      href={bizHref}
      className="zw-hover-lift"
      style={{
        display: "flex",
        background: "#fff",
        cursor: bizHref ? "pointer" : "default",
        border: ZW_CARD,
        borderRadius: ZW_CARD_R,
        overflow: "hidden",
        boxShadow: "var(--sh-sm)",
        minHeight: 150,
        textDecoration: "none",
      }}
    >
      <div
        className="zw-zoom-wrap"
        style={{
          width: 150,
          flexShrink: 0,
          background: "var(--c-300)",
          position: "relative",
        }}
      >
        <Img
          src={photo}
          alt={biz?.name ?? loc.name}
          style={{
            width: "100%",
            height: "100%",
            filter:
              tone === "warning"
                ? "saturate(0.3)"
                : tense === "past"
                  ? "saturate(0.85)"
                  : "none",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 42%, rgba(0,0,0,0.06) 56%, rgba(0,0,0,0.78) 100%)",
          }}
        />
        {biz && (
          <div
            className="txt-pretty"
            style={{
              position: "absolute",
              left: 12,
              right: 12,
              bottom: 11,
              fontSize: 13.5,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.014em",
              lineHeight: 1.18,
              textShadow: "0 1px 3px rgba(0,0,0,0.45)",
            }}
          >
            {biz.name}
          </div>
        )}
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: "18px 20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 7,
          borderLeft: "1px dashed rgba(28,28,26,0.10)",
        }}
      >
        <div
          className="txt-pretty"
          style={{
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "-0.028em",
            color: "var(--c-900)",
            lineHeight: 1.16,
          }}
        >
          {loc.name}
        </div>
        {loc.address && (
          <div
            className="txt-pretty"
            style={{ fontSize: 13, color: "var(--c-600)", lineHeight: 1.4 }}
          >
            {loc.address}
          </div>
        )}
        {rating != null && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 2,
              flexWrap: "wrap",
            }}
          >
            <Rating rating={rating} reviews={loc.totalReviews} size={12.5} />
          </div>
        )}
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--p-700)",
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            marginTop: 4,
          }}
        >
          {t.viewVenue}
          <Icon name="chevR" size={13} color="var(--p-700)" />
        </span>
      </div>
    </a>
  );
}


// ── SERVICE(S) — line items + pay-at-venue total ───────────────────────────
// Renders per-item price/duration (read from AppointmentBreakdownItem) plus
// subtotal + bundle-discount rows, then a receipt-style pay-at-venue total.
// Per-item prices are integer MINOR units; subtotal = Σ item prices and the
// discount = subtotal − charged total (shown only when positive).

export function ServiceCard({
  t,
  appt,
  locale,
}: {
  t: ApptDict;
  appt: AppointmentDetail;
  locale: Locale;
}) {
  const rows: Array<{ name: string; price: number | null; duration: number | null }> =
    appt.items.length > 0
      ? appt.items.map((it) => ({
          name: it.name,
          price: num(it.price as number | string | null | undefined),
          duration: num(it.duration as number | string | null | undefined),
        }))
      : [appt.primaryItemName, ...appt.additionalServices]
          .filter(Boolean)
          .map((name) => ({ name, price: null, duration: null }));
  const multi = rows.length > 1;
  const isBundle = appt.bookingType === "bundle";
  const bizName = appt.business?.name ?? "";
  const price = formatApptPrice(appt.price, appt.currency, locale, t.free);

  // Receipt math — minor units. Subtotal = Σ finite item prices.
  const hasAnyPrice = rows.some((r) => r.price != null);
  const subtotal = rows.reduce((n, r) => n + (r.price ?? 0), 0);
  const total = num(appt.price) ?? 0;
  const free = total === 0;
  const discount = subtotal - total;
  const showDiscount = !free && hasAnyPrice && discount > 0;
  // Subtotal row appears when multi-line (or a discount exists) and not free.
  const showSubtotal = !free && hasAnyPrice && (multi || showDiscount);
  const showReceipt = showSubtotal || showDiscount;

  return (
    <div
      style={{
        background: "#fff",
        border: ZW_CARD,
        borderRadius: ZW_CARD_R,
        boxShadow: "var(--sh-sm)",
        padding: "6px 20px 18px",
      }}
    >
      {isBundle && appt.bundle?.name && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "15px 0 13px",
            borderBottom: "1px solid rgba(28,28,26,0.06)",
          }}
        >
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: 7,
              background: "var(--p-100)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="sparkle" size={13} color="var(--p-600)" />
          </span>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--c-900)" }}>
            {appt.bundle.name}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--p-600)",
            }}
          >
            {t.bundleTag}
          </span>
        </div>
      )}
      {isBundle && appt.bundle?.description && (
        <p
          className="txt-pretty"
          style={{
            margin: 0,
            padding: "14px 0 12px",
            borderBottom: "1px solid rgba(28,28,26,0.06)",
            fontSize: 13.5,
            color: "var(--c-700)",
            lineHeight: 1.45,
          }}
        >
          {appt.bundle.description}
        </p>
      )}
      {rows.map((s, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "15px 0",
            borderBottom: "1px solid rgba(28,28,26,0.06)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
            {multi && (
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "var(--c-100)",
                  border: "1px solid rgba(28,28,26,0.10)",
                  color: "var(--c-600)",
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </span>
            )}
            <span style={{ minWidth: 0 }}>
              <span
                style={{
                  display: "block",
                  fontSize: 15,
                  color: "var(--c-900)",
                  letterSpacing: "-0.01em",
                }}
              >
                {s.name}
              </span>
              {s.duration != null && (
                <span
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    color: "var(--c-600)",
                    marginTop: 2,
                  }}
                >
                  {formatDuration(s.duration)}
                </span>
              )}
            </span>
          </span>
          {s.price != null && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--c-800)",
                fontVariantNumeric: "tabular-nums",
                flexShrink: 0,
              }}
            >
              {s.price === 0
                ? t.free
                : formatMoney(s.price, appt.currency, locale)}
            </span>
          )}
        </div>
      ))}
      {showSubtotal && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "13px 0 3px",
          }}
        >
          <span style={{ fontSize: 13, color: "var(--c-600)" }}>{t.subtotal}</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13.5,
              color: "var(--c-700)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatMoney(subtotal, appt.currency, locale)}
          </span>
        </div>
      )}
      {showDiscount && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "4px 0",
          }}
        >
          <span style={{ fontSize: 13, color: "var(--c-600)" }}>
            {t.bundleDiscount}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13.5,
              color: "var(--s-success-600)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {"− " + formatMoney(discount, appt.currency, locale)}
          </span>
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          paddingTop: 14,
          marginTop: showReceipt ? 6 : 0,
          borderTop: showReceipt
            ? "1px dashed rgba(28,28,26,0.18)"
            : "none",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--c-900)",
              letterSpacing: "-0.01em",
            }}
          >
            {t.totalAtVenue}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--c-500)",
            }}
          >
            {format(t.payDirectly, { business: bizName })}
          </span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 24,
            fontWeight: 600,
            color: "var(--c-900)",
            letterSpacing: "-0.025em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {price}
        </span>
      </div>
    </div>
  );
}

// ── NOTES ──────────────────────────────────────────────────────────────────

export function NotesCard({ notes }: { notes: string }) {
  return (
    <div
      style={{
        background: "#fff",
        border: ZW_CARD,
        borderRadius: ZW_CARD_R,
        boxShadow: "var(--sh-sm)",
        padding: "16px 20px",
        display: "flex",
        gap: 13,
        alignItems: "flex-start",
      }}
    >
      <Icon name="reply" size={17} color="var(--c-500)" style={{ marginTop: 2, flexShrink: 0 }} />
      <p
        className="txt-pretty"
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.55,
          color: "var(--c-700)",
          fontStyle: "italic",
        }}
      >
        &ldquo;{notes}&rdquo;
      </p>
    </div>
  );
}

// ── WITH — provider card (years + specialties OMITTED: no fields) ──────────

export function WithCard({ staff }: { staff: AppointmentDetail["staff_users"] }) {
  const member = staff?.[0];
  if (!member) return null;
  const name =
    member.displayName ||
    [member.firstName, member.lastName].filter(Boolean).join(" ") ||
    "";
  const rating = num(member.averageRating);
  return (
    <div
      className="zw-hover-lift"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 15,
        background: "#fff",
        border: ZW_CARD,
        borderRadius: ZW_CARD_R,
        boxShadow: "var(--sh-sm)",
        padding: "18px 20px",
      }}
    >
      <Avatar src={member.profileImage ?? undefined} name={name} size={54} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 16.5,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--c-900)",
            }}
          >
            {name}
          </span>
          {rating != null && (
            <Rating rating={rating} reviews={member.totalReviews} size={12.5} />
          )}
        </div>
        {member.professionalTitle && (
          <div style={{ fontSize: 13, color: "var(--c-600)", marginTop: 3 }}>
            {member.professionalTitle}
          </div>
        )}
      </div>
    </div>
  );
}

// ── YOUR REVIEW — business + per-professional review cards ─────────────────

export function ReviewCard({
  t,
  rating,
  comment,
  onEdit,
  label,
}: {
  t: ApptDict;
  rating: number;
  comment: string | null;
  onEdit: () => void;
  label?: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: ZW_CARD,
        borderRadius: ZW_CARD_R,
        boxShadow: "var(--sh-sm)",
        padding: "18px 20px",
        marginTop: 12,
      }}
    >
      {label && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--c-500)",
            marginBottom: 10,
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Stars value={rating} size={17} />
        <button
          type="button"
          className="tap"
          onClick={onEdit}
          style={{
            background: "transparent",
            border: 0,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--p-700)",
            fontFamily: "inherit",
          }}
        >
          {t.edit}
        </button>
      </div>
      {comment && (
        <p
          className="txt-pretty"
          style={{
            margin: "12px 0 0",
            fontSize: 14,
            lineHeight: 1.55,
            color: "var(--c-700)",
          }}
        >
          &ldquo;{comment}&rdquo;
        </p>
      )}
    </div>
  );
}

// ── ABOUT THE VENUE — editorial business card ──────────────────────────────

export function AboutCard({
  t,
  appt,
  locale,
}: {
  t: ApptDict;
  appt: AppointmentDetail;
  locale: Locale;
}) {
  const biz = appt.business;
  const loc = appt.location;
  const photo = biz?.logo ?? loc?.profileImage ?? undefined;
  // Resolve via the location's numeric id (see WhereCard note). Omit the card
  // when there is no resolvable location id rather than link to /business/undefined.
  if (!biz || !photo || !biz.description || loc?.id == null) return null;
  const href = localeHref(locale, "business", String(loc.id));
  return (
    <a
      href={href}
      className="tap"
      style={{
        width: "100%",
        background: "transparent",
        border: 0,
        padding: 0,
        cursor: "pointer",
        textAlign: "left",
        display: "block",
        textDecoration: "none",
      }}
    >
      <div
        className="zw-zoom-parent"
        style={{
          position: "relative",
          height: 220,
          borderRadius: ZW_CARD_R,
          overflow: "hidden",
          background: "var(--c-300)",
          boxShadow: "var(--sh-md)",
        }}
      >
        <div className="zw-zoom-wrap" style={{ position: "absolute", inset: 0 }}>
          <Img src={photo} alt={biz.name} style={{ width: "100%", height: "100%" }} />
        </div>
      </div>
      <div
        style={{
          margin: "-30px 18px 0",
          position: "relative",
          background: "#fff",
          border: "1px solid rgba(28,28,26,0.06)",
          borderRadius: 16,
          boxShadow: "var(--sh-sm)",
          padding: "16px 18px 18px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "-0.025em",
              color: "var(--c-900)",
            }}
          >
            {biz.name}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--p-700)",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              flexShrink: 0,
            }}
          >
            {t.viewProfile}
            <Icon name="chevR" size={12} color="var(--p-700)" />
          </span>
        </div>
        <p
          className="txt-pretty"
          style={{ margin: "7px 0 0", fontSize: 14, lineHeight: 1.5, color: "var(--c-700)" }}
        >
          {biz.description}
        </p>
      </div>
    </a>
  );
}

// ── Pending banner ─────────────────────────────────────────────────────────

export function PendingBanner({ t, appt }: { t: ApptDict; appt: AppointmentDetail }) {
  const bizName = appt.business?.name ?? "";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        marginTop: 20,
        background: "var(--s-warning-100)",
        border: "1px solid color-mix(in oklch, var(--s-warning-600) 22%, transparent)",
        borderRadius: 14,
        padding: "14px 16px",
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name="clock" size={15} color="var(--s-warning-600)" />
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--c-900)" }}>
          {t.awaitingConfirmation}
        </div>
        <div
          className="txt-pretty"
          style={{ fontSize: 13, lineHeight: 1.45, color: "var(--c-700)", marginTop: 2 }}
        >
          {format(t.awaitingConfirmationBody, { business: bizName })}
        </div>
      </div>
    </div>
  );
}

// ── Live progress strip (tick driven by parent via `tick` prop) ────────────

export function LiveStrip({ t, appt }: { t: ApptDict; appt: AppointmentDetail }) {
  // Tick ~every 30s so the bar + minutes-left label stay current. The clock is
  // seeded once via a lazy initializer (runs on mount only) and advanced from
  // the interval callback — never set synchronously in the effect body. This
  // component only mounts client-side (after the authed fetch), so the lazy
  // `Date.now()` read is hydration-safe.
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const start = new Date(appt.scheduled_at).getTime();
  const end = new Date(appt.ends_at).getTime();
  const p = Math.max(0, Math.min(1, (clock - start) / Math.max(1, end - start)));
  const mins = Math.max(0, Math.floor((end - clock) / 60000));
  const label =
    mins <= 0 ? t.endingNow : mins === 1 ? t.oneMinLeft : format(t.minsLeft, { n: String(mins) });
  const color = "var(--s-success-600)";
  return (
    <div style={{ marginTop: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: color,
              position: "relative",
              display: "inline-block",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: color,
                animation: "zv-pulse 1.6s ease-out infinite",
              }}
            />
          </span>
          {t.inProgress}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--c-600)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          position: "relative",
          height: 4,
          borderRadius: 999,
          background: "rgba(28,28,26,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${Math.round(p * 100)}%`,
            background: color,
            borderRadius: 999,
            transition: "width .8s var(--ease-out)",
          }}
        />
      </div>
    </div>
  );
}

// ── Recurring note (minimal — total/cadence/timeline OMITTED: no fields) ───

export function RecurringNote({
  t,
  appt,
}: {
  t: ApptDict;
  appt: AppointmentDetail;
}) {
  // The API exposes only `recurringGroupId` and `recurringIndex` — NO total,
  // cadence, or per-visit dates. The prototype's dot-timeline + cadence + the
  // `nextOn`/`finalVisit`/`visitOfTotal` strings all require data we don't
  // have (a "Visit {index} of ?" with a literal "?" is a design wart). We
  // therefore render a clean, honest "part of a recurring plan" line. If even
  // the group/index is absent we omit the note entirely.
  if (!appt.recurringGroupId) return null;
  if (appt.recurringIndex == null) return null;
  return (
    <div
      style={{
        marginTop: 16,
        padding: "15px 18px",
        background: "#fff",
        border: ZW_CARD,
        borderRadius: 14,
        boxShadow: "var(--sh-sm)",
        display: "flex",
        alignItems: "center",
        gap: 11,
      }}
    >
      <Icon name="layers" size={16} color="var(--p-600)" />
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--c-900)",
          letterSpacing: "-0.014em",
        }}
      >
        {t.recurringPlan}
      </span>
    </div>
  );
}

// ── Closer band ────────────────────────────────────────────────────────────

export function CloserBand({
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
  const cancelled = tone === "warning" || tone === "error";

  if (cancelled) {
    const heading = tone === "error" ? t.youMissedAppointment : t.cancelledTitle;
    // Strip a leading "Cancelled by <…>" boilerplate segment (up to the first
    // "·" or end) so the detail line doesn't echo the heading. If nothing
    // meaningful remains after the trim, render no detail line.
    const reasonDetail = (() => {
      const raw = appt.cancellation_reason?.trim();
      if (!raw) return null;
      const dot = raw.indexOf("·");
      const head = (dot === -1 ? raw : raw.slice(0, dot)).trim();
      if (/^cancelled by\b/i.test(head)) {
        const rest = dot === -1 ? "" : raw.slice(dot + 1).trim();
        return rest || null;
      }
      return raw;
    })();
    return (
      <div
        style={{
          marginTop: 36,
          paddingTop: 22,
          borderTop: "1px solid rgba(28,28,26,0.08)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          textAlign: "center",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            fontSize: 14,
            fontWeight: 500,
            color: "var(--c-800)",
          }}
        >
          <Icon
            name={tone === "error" ? "warn" : "x"}
            size={15}
            color={tone === "error" ? "var(--s-error-600)" : "var(--s-warning-600)"}
          />
          <span>{heading}</span>
        </span>
        {reasonDetail && (
          <span
            className="txt-pretty"
            style={{ maxWidth: 320, fontSize: 13, color: "var(--c-600)", lineHeight: 1.45 }}
          >
            {reasonDetail}
          </span>
        )}
      </div>
    );
  }

  const loc = appt.location;
  const upcoming = tense === "now" || tense === "today" || tense === "future";
  const createdDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(new Date(appt.createdAt));
  const windowHours =
    loc && loc.cancellationWindowMinutes
      ? Math.round(loc.cancellationWindowMinutes / 60)
      : null;
  // Map the booking source to a localized suffix; unknown values get no suffix.
  const sourceWord =
    appt.bookingSource === "marketplace"
      ? t.bookedVia.zavoia
      : appt.bookingSource === "direct"
        ? t.bookedVia.direct
        : appt.bookingSource === "admin"
          ? t.bookedVia.admin
          : null;
  const bookedLine = sourceWord
    ? format(t.bookedOn, { date: createdDate }) + " · " + sourceWord
    : format(t.bookedOn, { date: createdDate });

  return (
    <div
      style={{
        marginTop: 36,
        paddingTop: 22,
        borderTop: "1px solid rgba(28,28,26,0.08)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 9,
        textAlign: "center",
      }}
    >
      {upcoming && loc?.allowCustomerCancellation && windowHours != null && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13.5,
            fontWeight: 500,
            color: "var(--c-800)",
          }}
        >
          <Icon name="shield" size={15} color="var(--s-success-600)" />
          {format(t.freeCancellationUpTo, { n: String(windowHours) })}
        </span>
      )}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--c-500)",
        }}
      >
        {bookedLine}
      </span>
    </div>
  );
}

// ── Mobile sticky bar ──────────────────────────────────────────────────────

export function MobileBar({
  appt,
  locale,
  tense,
  tone,
  t,
  directionsHref,
}: {
  appt: AppointmentDetail;
  locale: Locale;
  tense: Tense;
  tone: StatusTone;
  t: ApptDict;
  directionsHref: string | null;
}) {
  const cancelled = tone === "warning" || tone === "error";
  const bookAgain = tense === "past" || cancelled;
  const bizName = appt.business?.name ?? "";
  // Resolve via the location's numeric id (see WhereCard note); null when absent.
  const bizHref =
    appt.location?.id != null
      ? localeHref(locale, "business", String(appt.location.id))
      : null;
  const time = apptTime(appt.scheduled_at, locale);
  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(appt.scheduled_at));

  return (
    <div
      className="zw-only-mobile zv-frost"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: "calc(58px + env(safe-area-inset-bottom))",
        zIndex: 80,
        borderTop: "1px solid rgba(28,28,26,0.08)",
        padding: "10px var(--gutter)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--c-900)" }}>
          {dateLabel} · {time}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            color: "var(--c-600)",
            marginTop: 1,
          }}
        >
          {bizName}
        </div>
      </div>
      {bookAgain ? (
        bizHref ? (
          <a
            href={bizHref}
            className="tap zw-btn"
            style={{
              background: "var(--p-500)",
              color: "#fff",
              border: "1px solid var(--p-500)",
              padding: "11px 20px",
              fontSize: 14.5,
              fontWeight: 600,
              borderRadius: "var(--r-full)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {t.bookAgain}
          </a>
        ) : null
      ) : (
        <a
          href={directionsHref ?? "#"}
          target={directionsHref ? "_blank" : undefined}
          rel={directionsHref ? "noopener noreferrer" : undefined}
          className="tap zw-btn"
          style={{
            background: "var(--c-ink)",
            color: "#fff",
            border: "1px solid var(--c-ink)",
            padding: "11px 20px",
            fontSize: 14.5,
            fontWeight: 600,
            borderRadius: "var(--r-full)",
            textDecoration: "none",
            whiteSpace: "nowrap",
            opacity: directionsHref ? 1 : 0.45,
            pointerEvents: directionsHref ? "auto" : "none",
          }}
        >
          {t.directions}
        </a>
      )}
    </div>
  );
}
