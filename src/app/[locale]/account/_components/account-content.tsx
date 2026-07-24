"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import { dictionaries, format } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { useAuth } from "@/lib/auth/useAuth";
import { authErrorMessage } from "@/lib/api/auth-error-messages";
import { GOOGLE_CLIENT_ID } from "@/lib/env";
import { GoogleSignInButton } from "@/app/[locale]/auth/_components/google-signin-button";
import { useAuthModal } from "@/components/shell/auth-modal-provider";
import {
  Avatar,
  Button,
  DatePicker,
  Icon,
  SignedOutGate,
  Skeleton,
  Spinner,
  useToast,
} from "@/components/ui";
import {
  changePassword,
  deleteAccount,
  getNotificationPreferences,
  getProfile,
  getProfileSummary,
  updateNotificationPreferences,
  updateProfile,
  uploadProfileImage,
} from "@/lib/api/marketplace/customer";
import type {
  CustomerProfile,
  CustomerProfileSummary,
  NotificationPreferences,
  UpdateNotificationPreferencesBody,
  UpdateProfileBody,
} from "@/lib/api/marketplace/types";
import { SupportSection } from "./support-section";

type SectionId = "personal" | "preferences" | "security" | "support";

type AcctDict = (typeof dictionaries)[Locale]["account"];

// ─────────────────────────────────────────────
// Card / section primitives (Tailwind-free inline styles, matching the
// prototype's surface treatment so the page reads as one design system).
// ─────────────────────────────────────────────

function Card({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid rgba(28,28,26,0.08)",
        borderRadius: 16,
        boxShadow: "var(--sh-sm)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--c-500)",
        }}
      >
        {children}
      </div>
      {sub && (
        <div
          className="txt-pretty"
          style={{
            fontSize: 13,
            color: "var(--c-500)",
            marginTop: 6,
            lineHeight: 1.45,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function SectionError({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        fontSize: 13.5,
        color: "var(--s-error-600)",
      }}
    >
      {message}
    </div>
  );
}

// ─────────────────────────────────────────────
// Toggle switch (.zw-switch) — role=switch, aria-checked, data-on.
// ─────────────────────────────────────────────

function SwitchRow({
  label,
  caption,
  on,
  busy,
  onToggle,
  last,
}: {
  label: string;
  caption: string;
  on: boolean;
  busy: boolean;
  onToggle: () => void;
  last?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={busy}
      onClick={onToggle}
      className="tap"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        textAlign: "left",
        padding: "15px 18px",
        background: "transparent",
        border: 0,
        cursor: busy ? "default" : "pointer",
        font: "inherit",
        borderBottom: last ? 0 : "1px solid rgba(28,28,26,0.06)",
        opacity: busy ? 0.6 : 1,
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "-0.012em",
            color: "var(--c-900)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            display: "block",
            fontSize: 12.5,
            color: "var(--c-500)",
            marginTop: 2,
          }}
        >
          {caption}
        </span>
      </span>
      <span
        className="zw-switch"
        data-on={on ? "1" : "0"}
        aria-hidden="true"
      />
    </button>
  );
}

// ─────────────────────────────────────────────
// Inline-editable field row
// ─────────────────────────────────────────────

function EditableRow({
  label,
  value,
  type = "text",
  locale = "en",
  emptyLabel,
  saving,
  buttons,
  onSave,
  last,
}: {
  label: string;
  value: string;
  type?: "text" | "tel" | "date";
  /** Used by the date type for calendar + display formatting. */
  locale?: string;
  emptyLabel: string;
  saving: boolean;
  buttons: AcctDict["buttons"];
  onSave: (next: string) => void;
  last?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
  }, [editing]);

  const start = () => {
    setDraft(value);
    setEditing(true);
  };
  const commit = () => {
    setEditing(false);
    onSave(draft.trim());
  };
  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  const muted = !value;
  // Dates display as "15 March 1994" instead of raw ISO.
  const displayText =
    type === "date" && value
      ? new Intl.DateTimeFormat(locale, {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(`${value}T12:00:00`))
      : value;

  return (
    <div
      style={{
        padding: "16px 0",
        borderBottom: last ? 0 : "1px solid rgba(28,28,26,0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: editing ? "center" : "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--c-900)",
            }}
          >
            {label}
          </div>
          {editing ? (
            type === "date" ? (
              <DatePicker
                value={draft}
                onChange={setDraft}
                locale={locale}
                disabled={saving}
                placeholder={emptyLabel}
              />
            ) : (
              <input
                ref={ref}
                type={type}
                value={draft}
                disabled={saving}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  if (e.key === "Escape") cancel();
                }}
                style={{
                  marginTop: 8,
                  width: "100%",
                  maxWidth: 340,
                  boxSizing: "border-box",
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(28,28,26,0.18)",
                  fontSize: 14,
                  color: "var(--c-900)",
                  background: "#fff",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            )
          ) : (
            <div
              style={{
                fontSize: 14,
                color: muted ? "var(--c-400)" : "var(--c-600)",
                marginTop: 4,
              }}
            >
              {displayText || emptyLabel}
            </div>
          )}
        </div>
        {editing ? (
          <span style={{ display: "inline-flex", gap: 6, flexShrink: 0 }}>
            <button
              type="button"
              className="tap"
              onClick={commit}
              disabled={saving}
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                border: 0,
                background: "var(--c-ink)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: saving ? "default" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {saving ? <Spinner size={14} color="#fff" /> : buttons.save}
            </button>
            <button
              type="button"
              className="tap"
              onClick={cancel}
              disabled={saving}
              style={{
                padding: "7px 12px",
                borderRadius: 999,
                border: "1px solid rgba(28,28,26,0.14)",
                background: "#fff",
                color: "var(--c-700)",
                fontSize: 13,
                fontWeight: 600,
                cursor: saving ? "default" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {buttons.cancel}
            </button>
          </span>
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            {saving && <Spinner size={14} />}
            <button
              type="button"
              className="tap"
              onClick={start}
              disabled={saving}
              style={{
                background: "transparent",
                border: 0,
                cursor: saving ? "default" : "pointer",
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--c-900)",
                textDecoration: "underline",
                padding: "2px 0",
                fontFamily: "inherit",
              }}
            >
              {buttons.edit}
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Address row — one "Address" entry whose edit mode opens all address inputs
// at once (country / city / street / number / mentions), saved as ONE profile
// update. Display mode composes "Street Number, City, Country" + mentions.
// ─────────────────────────────────────────────

function AddressRow({
  fields,
  buttons,
  profile,
  saving,
  onSave,
  last,
}: {
  fields: AcctDict["fields"];
  buttons: AcctDict["buttons"];
  profile: CustomerProfile;
  saving: boolean;
  onSave: (patch: Partial<UpdateProfileBody>) => void;
  last?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    country: "",
    city: "",
    street: "",
    number: "",
    mentions: "",
  });
  const firstRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing && firstRef.current) firstRef.current.focus();
  }, [editing]);

  const start = () => {
    setDraft({
      country: profile.addressCountry ?? "",
      city: profile.addressCity ?? "",
      street: profile.addressStreet ?? "",
      number: profile.addressNumber ?? "",
      mentions: profile.addressMentions ?? "",
    });
    setEditing(true);
  };
  const commit = () => {
    setEditing(false);
    onSave({
      addressCountry: draft.country.trim(),
      addressCity: draft.city.trim(),
      addressStreet: draft.street.trim(),
      addressNumber: draft.number.trim(),
      addressMentions: draft.mentions.trim(),
    });
  };
  const cancel = () => setEditing(false);

  const summary = [
    [profile.addressStreet, profile.addressNumber].filter(Boolean).join(" "),
    profile.addressCity,
    profile.addressCountry,
  ]
    .filter(Boolean)
    .join(", ");

  const inputStyle: CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "9px 12px",
    borderRadius: 10,
    border: "1px solid rgba(28,28,26,0.18)",
    fontSize: 14,
    color: "var(--c-900)",
    background: "#fff",
    outline: "none",
    fontFamily: "inherit",
  };
  const subLabelStyle: CSSProperties = {
    display: "block",
    fontSize: 12.5,
    fontWeight: 600,
    color: "var(--c-500)",
    marginBottom: 4,
  };
  const onKeys = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") cancel();
  };

  return (
    <div
      style={{
        padding: "16px 0",
        borderBottom: last ? 0 : "1px solid rgba(28,28,26,0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--c-900)",
            }}
          >
            {fields.address}
          </div>
          {editing ? (
            <div
              style={{
                marginTop: 10,
                maxWidth: 480,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <label>
                <span style={subLabelStyle}>{fields.addressCountry}</span>
                <input
                  ref={firstRef}
                  type="text"
                  value={draft.country}
                  disabled={saving}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, country: e.target.value }))
                  }
                  onKeyDown={onKeys}
                  style={inputStyle}
                />
              </label>
              <label>
                <span style={subLabelStyle}>{fields.addressCity}</span>
                <input
                  type="text"
                  value={draft.city}
                  disabled={saving}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, city: e.target.value }))
                  }
                  onKeyDown={onKeys}
                  style={inputStyle}
                />
              </label>
              <label>
                <span style={subLabelStyle}>{fields.addressStreet}</span>
                <input
                  type="text"
                  value={draft.street}
                  disabled={saving}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, street: e.target.value }))
                  }
                  onKeyDown={onKeys}
                  style={inputStyle}
                />
              </label>
              <label>
                <span style={subLabelStyle}>{fields.addressNumber}</span>
                <input
                  type="text"
                  value={draft.number}
                  disabled={saving}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, number: e.target.value }))
                  }
                  onKeyDown={onKeys}
                  style={inputStyle}
                />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                <span style={subLabelStyle}>{fields.addressMentions}</span>
                <input
                  type="text"
                  value={draft.mentions}
                  disabled={saving}
                  placeholder={fields.addressMentionsPlaceholder}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, mentions: e.target.value }))
                  }
                  onKeyDown={onKeys}
                  style={inputStyle}
                />
              </label>
            </div>
          ) : (
            <div
              style={{
                fontSize: 14,
                color: summary ? "var(--c-600)" : "var(--c-400)",
                marginTop: 4,
              }}
            >
              {summary || fields.addressEmpty}
              {summary && profile.addressMentions ? (
                <div
                  style={{ fontSize: 12.5, color: "var(--c-400)", marginTop: 3 }}
                >
                  {profile.addressMentions}
                </div>
              ) : null}
            </div>
          )}
        </div>
        {editing ? (
          <span style={{ display: "inline-flex", gap: 6, flexShrink: 0 }}>
            <button
              type="button"
              className="tap"
              onClick={commit}
              disabled={saving}
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                border: 0,
                background: "var(--c-ink)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: saving ? "default" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {saving ? <Spinner size={14} color="#fff" /> : buttons.save}
            </button>
            <button
              type="button"
              className="tap"
              onClick={cancel}
              disabled={saving}
              style={{
                padding: "7px 12px",
                borderRadius: 999,
                border: "1px solid rgba(28,28,26,0.14)",
                background: "#fff",
                color: "var(--c-700)",
                fontSize: 13,
                fontWeight: 600,
                cursor: saving ? "default" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {buttons.cancel}
            </button>
          </span>
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            {saving && <Spinner size={14} />}
            <button
              type="button"
              className="tap"
              onClick={start}
              disabled={saving}
              style={{
                background: "transparent",
                border: 0,
                cursor: saving ? "default" : "pointer",
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--c-900)",
                textDecoration: "underline",
                padding: "2px 0",
                fontFamily: "inherit",
              }}
            >
              {buttons.edit}
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Read-only row (email)
// ─────────────────────────────────────────────

function ReadOnlyRow({
  label,
  value,
  note,
  last,
}: {
  label: string;
  value: string;
  note: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        padding: "16px 0",
        borderBottom: last ? 0 : "1px solid rgba(28,28,26,0.06)",
      }}
    >
      <div
        style={{
          fontSize: 14.5,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: "var(--c-900)",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, color: "var(--c-600)", marginTop: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--c-400)", marginTop: 6 }}>
        {note}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Profile banner
// ─────────────────────────────────────────────

function StatChip({
  value,
  label,
  nf,
  onClick,
}: {
  value: number;
  label: string;
  nf: Intl.NumberFormat;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="tap zw-hover-lift"
      onClick={onClick}
      style={{
        flex: "0 0 auto",
        minWidth: 104,
        textAlign: "left",
        background: "var(--c-canvas)",
        border: "1px solid rgba(28,28,26,0.07)",
        borderRadius: 14,
        padding: "12px 16px",
        cursor: "pointer",
        font: "inherit",
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: "var(--c-900)",
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {nf.format(value)}
      </div>
      <div style={{ fontSize: 12, color: "var(--c-500)", marginTop: 2 }}>
        {label}
      </div>
    </button>
  );
}

function ProfileBanner({
  t,
  locale,
  profile,
  summary,
  uploadingPhoto,
  onPickPhoto,
  onSavedClick,
}: {
  t: AcctDict;
  locale: Locale;
  profile: CustomerProfile;
  summary: CustomerProfileSummary | null;
  uploadingPhoto: boolean;
  onPickPhoto: (file: File) => void;
  onSavedClick?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const name =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.email;
  const image = profile.profileImage ?? summary?.profileImage ?? undefined;

  const memberSince = summary?.memberSince
    ? new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
      }).format(new Date(summary.memberSince))
    : null;

  const nf = new Intl.NumberFormat(locale);
  const reviews =
    (summary?.totalBusinessReviews ?? 0) +
    (summary?.totalProfessionalReviews ?? 0);

  const verified = profile.email_verified;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "clamp(18px, 3vw, 28px)",
        background: "#fff",
        border: "1px solid rgba(28,28,26,0.08)",
        borderRadius: 22,
        boxShadow: "var(--sh-sm)",
        padding: "clamp(20px, 2.5vw, 28px)",
        flexWrap: "wrap",
      }}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPickPhoto(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className="zw-avatar-edit"
        aria-label={t.buttons.changePhoto}
        disabled={uploadingPhoto}
        onClick={() => fileRef.current?.click()}
        style={{
          width: 84,
          height: 84,
          borderRadius: "50%",
          border: 0,
          padding: 0,
          background: "transparent",
          flexShrink: 0,
          boxShadow: "0 0 0 3px var(--c-canvas), 0 0 0 4px rgba(28,28,26,0.10)",
        }}
      >
        <Avatar src={image} name={name} size={84} />
        <span className="zw-avatar-ov">
          {uploadingPhoto ? (
            <Spinner size={20} color="#fff" />
          ) : (
            <Icon name="pencil" size={17} color="#fff" />
          )}
        </span>
      </button>

      <div style={{ flex: 1, minWidth: 180 }}>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(24px, 2.8vw, 32px)",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            color: "var(--c-900)",
          }}
        >
          {name}
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 8,
            flexWrap: "wrap",
          }}
        >
          {memberSince && (
            <span style={{ fontSize: 13.5, color: "var(--c-600)" }}>
              {format(t.stats.memberSince, { date: memberSince })}
            </span>
          )}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11.5,
              fontWeight: 600,
              color: verified ? "var(--s-success-600)" : "var(--c-600)",
              background: verified ? "var(--s-success-100)" : "var(--c-100)",
              padding: "3px 9px",
              borderRadius: 999,
            }}
          >
            <Icon
              name={verified ? "check" : "email"}
              size={12}
              color={verified ? "var(--s-success-600)" : "var(--c-600)"}
            />
            {verified ? t.verifiedPill : t.unverifiedPill}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <StatChip
          value={summary?.totalAppointments ?? 0}
          label={t.stats.appointments}
          nf={nf}
        />
        <StatChip value={reviews} label={t.stats.reviews} nf={nf} />
        <StatChip
          value={summary?.totalFavorites ?? 0}
          label={t.stats.saved}
          nf={nf}
          onClick={onSavedClick}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Notifications section
// ─────────────────────────────────────────────

type NotifGroup = "marketing" | "reminders";
type NotifChannel = "push" | "sms" | "email";

const FLAT_KEY: Record<
  NotifGroup,
  Record<NotifChannel, keyof UpdateNotificationPreferencesBody>
> = {
  marketing: {
    push: "marketingPush",
    sms: "marketingSms",
    email: "marketingEmail",
  },
  // NOTE: GET returns the plural "reminders" group; the POST body uses the
  // SINGULAR "reminder*" keys.
  reminders: {
    push: "reminderPush",
    sms: "reminderSms",
    email: "reminderEmail",
  },
};

function NotificationsSection({
  t,
  prefs,
  setPrefs,
}: {
  t: AcctDict;
  prefs: NotificationPreferences;
  setPrefs: (p: NotificationPreferences) => void;
}) {
  const toast = useToast();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const toggle = async (group: NotifGroup, channel: NotifChannel) => {
    const key = `${group}.${channel}`;
    const current = prefs[group][channel];
    const next = !current;
    // optimistic flip
    const optimistic: NotificationPreferences = {
      ...prefs,
      [group]: { ...prefs[group], [channel]: next },
    };
    setPrefs(optimistic);
    setBusyKey(key);
    try {
      const body: UpdateNotificationPreferencesBody = {
        [FLAT_KEY[group][channel]]: next,
      };
      const updated = await updateNotificationPreferences(body);
      setPrefs(updated); // reconcile from response
      toast(t.toasts.prefsUpdated, "check");
    } catch {
      setPrefs(prefs); // revert
      toast(t.toasts.genericError, "bell");
    } finally {
      setBusyKey(null);
    }
  };

  const group = (
    g: NotifGroup,
    title: string,
    caption: string,
    emailCaption: string,
  ) => (
    <div>
      <SectionLabel sub={caption}>{title}</SectionLabel>
      <Card>
        <SwitchRow
          label={t.notif.push}
          caption={t.notif.pushCaption}
          on={prefs[g].push}
          busy={busyKey === `${g}.push`}
          onToggle={() => toggle(g, "push")}
        />
        <SwitchRow
          label={t.notif.sms}
          caption={t.notif.smsCaption}
          on={prefs[g].sms}
          busy={busyKey === `${g}.sms`}
          onToggle={() => toggle(g, "sms")}
        />
        <SwitchRow
          label={t.notif.email}
          caption={emailCaption}
          on={prefs[g].email}
          busy={busyKey === `${g}.email`}
          onToggle={() => toggle(g, "email")}
          last
        />
      </Card>
    </div>
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "clamp(20px, 3vw, 32px)",
      }}
    >
      {group(
        "marketing",
        t.notif.marketing,
        t.notif.marketingCaption,
        t.notif.emailCaption,
      )}
      {group(
        "reminders",
        t.notif.reminders,
        t.notif.remindersCaption,
        t.notif.reminderEmailCaption,
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Password form
// ─────────────────────────────────────────────

function PasswordForm({ t, onDone }: { t: AcctDict; onDone: () => void }) {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const field = (
    label: string,
    val: string,
    set: (v: string) => void,
    autoComplete: string,
  ) => (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--c-700)",
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      <input
        type="password"
        value={val}
        autoComplete={autoComplete}
        disabled={saving}
        onChange={(e) => set(e.target.value)}
        style={{
          width: "100%",
          maxWidth: 360,
          boxSizing: "border-box",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(28,28,26,0.18)",
          fontSize: 14,
          color: "var(--c-900)",
          background: "#fff",
          outline: "none",
          fontFamily: "inherit",
        }}
      />
    </label>
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next.length < 8) {
      setError(t.password.tooShort);
      return;
    }
    if (next !== confirm) {
      setError(t.password.mismatch);
      return;
    }
    setSaving(true);
    try {
      const res = await changePassword({
        currentPassword: current,
        newPassword: next,
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      toast(res.message || t.toasts.passwordChanged, "check");
      onDone();
    } catch {
      toast(t.toasts.genericError, "lock");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 360 }}
    >
      {field(t.password.current, current, setCurrent, "current-password")}
      {field(t.password.new, next, setNext, "new-password")}
      {field(t.password.confirm, confirm, setConfirm, "new-password")}
      <div style={{ fontSize: 12.5, color: "var(--c-500)" }}>
        {t.password.rules}
      </div>
      {error && (
        <div style={{ fontSize: 13, color: "var(--s-error-600)" }}>{error}</div>
      )}
      <div>
        <Button
          kind="primary"
          size="md"
          type="submit"
          disabled={saving || !current || !next || !confirm}
        >
          {saving ? <Spinner size={16} color="#fff" /> : t.buttons.changePassword}
        </Button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Google connection row — Connected / Not connected state derived from
// `!!user.googleSub`. Connect uses the reused GIS button (only when
// GOOGLE_CLIENT_ID is configured). Disconnect requires the account password and
// is gated off when the account has no password (hasPassword === false).
// ─────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AuthErrorsDict = (typeof dictionaries)[Locale]["auth"]["errors"];

function GoogleConnectionRow({
  t,
  authErrors,
  locale,
  last,
}: {
  t: AcctDict;
  authErrors: AuthErrorsDict;
  locale: Locale;
  last?: boolean;
}) {
  const toast = useToast();
  const { user, unlinkGoogle } = useAuth();
  const g = t.googleConnection;

  const isLinked = !!user?.googleSub;
  // hasPassword is only authoritative once /me has loaded it; treat undefined as
  // "assume a password exists" so we don't wrongly disable the control before
  // refreshUser resolves. The gate only bites on an explicit `false`.
  const hasPassword = user?.hasPassword !== false;

  const [promptOpen, setPromptOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submitDisconnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password) return;
    setBusy(true);
    try {
      await unlinkGoogle(password);
      setPromptOpen(false);
      setPassword("");
      toast(g.disconnectedToast, "check");
    } catch (err) {
      setError(authErrorMessage(err, authErrors));
    } finally {
      setBusy(false);
    }
  };

  const canConnect = !isLinked && Boolean(GOOGLE_CLIENT_ID);

  return (
    <div
      style={{
        padding: "16px 0",
        borderBottom: last ? 0 : "1px solid rgba(28,28,26,0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 14.5,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--c-900)",
            }}
          >
            <Icon name="googleG" size={17} />
            {g.title}
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: isLinked ? "var(--s-success-600)" : "var(--c-600)",
              background: isLinked ? "var(--s-success-100)" : "var(--c-100)",
              padding: "3px 9px",
              borderRadius: 999,
              marginTop: 8,
            }}
          >
            {isLinked ? g.connected : g.notConnected}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--c-500)", marginTop: 8 }}>
            {isLinked ? g.connectedCaption : g.connectCaption}
          </div>
        </div>

        <div style={{ flexShrink: 0 }}>
          {isLinked ? (
            <button
              type="button"
              className="tap"
              onClick={() => setPromptOpen((o) => !o)}
              disabled={!hasPassword || busy}
              style={{
                background: "transparent",
                border: 0,
                cursor: !hasPassword || busy ? "default" : "pointer",
                fontSize: 13.5,
                fontWeight: 600,
                color: !hasPassword ? "var(--c-400)" : "var(--s-error-600)",
                textDecoration: "underline",
                padding: "2px 0",
                fontFamily: "inherit",
              }}
            >
              {g.disconnect}
            </button>
          ) : canConnect ? (
            /* Full-page redirect to Google; the /auth/callback page completes
               the link and returns here (the row then shows Connected). */
            <div style={{ minWidth: 200 }}>
              <GoogleSignInButton
                intent="link"
                locale={locale}
                redirect={localeHref(locale, "account")}
              />
            </div>
          ) : null}
        </div>
      </div>

      {isLinked && promptOpen && hasPassword && (
        <form
          onSubmit={submitDisconnect}
          style={{
            marginTop: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            maxWidth: 360,
          }}
        >
          <label style={{ display: "block" }}>
            <span
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--c-700)",
                marginBottom: 6,
              }}
            >
              {g.passwordLabel}
            </span>
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              disabled={busy}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={g.passwordPrompt}
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
              }}
            />
          </label>
          {error && (
            <div style={{ fontSize: 13, color: "var(--s-error-600)" }}>
              {error}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              kind="primary"
              size="md"
              type="submit"
              disabled={busy || !password}
            >
              {busy ? (
                <Spinner size={16} color="#fff" />
              ) : (
                g.confirmDisconnect
              )}
            </Button>
            <Button
              kind="secondary"
              size="md"
              type="button"
              disabled={busy}
              onClick={() => {
                setPromptOpen(false);
                setPassword("");
                setError(null);
              }}
            >
              {g.cancel}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Change email form — current email is read-only; user enters a new email
// (validated with the shared EMAIL_RE). Success surfaces the new email + an
// "other devices signed out" note when revokedSessionCount > 0.
// ─────────────────────────────────────────────

function ChangeEmailForm({
  t,
  authErrors,
  last,
}: {
  t: AcctDict;
  authErrors: AuthErrorsDict;
  last?: boolean;
}) {
  const toast = useToast();
  const { user, changeEmail } = useAuth();
  const c = t.changeEmail;

  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currentEmail = user?.email ?? "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = newEmail.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError(c.invalidEmail);
      return;
    }
    setSaving(true);
    try {
      const res = await changeEmail(currentEmail, trimmed);
      setOpen(false);
      setNewEmail("");
      toast(c.changedToast, "check");
      if (res.revokedSessionCount > 0) {
        toast(
          res.revokedSessionCount === 1
            ? c.otherSessionsRevokedOne
            : format(c.otherSessionsRevoked, {
                count: String(res.revokedSessionCount),
              }),
          "shield",
        );
      }
    } catch (err) {
      setError(authErrorMessage(err, authErrors));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        padding: "16px 0",
        borderBottom: last ? 0 : "1px solid rgba(28,28,26,0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--c-900)",
            }}
          >
            {c.title}
          </div>
          <div style={{ fontSize: 14, color: "var(--c-600)", marginTop: 4 }}>
            {currentEmail}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--c-500)", marginTop: 6 }}>
            {c.caption}
          </div>
        </div>
        <button
          type="button"
          className="tap"
          onClick={() => setOpen((o) => !o)}
          style={{
            flexShrink: 0,
            background: "transparent",
            border: 0,
            cursor: "pointer",
            fontSize: 13.5,
            fontWeight: 600,
            color: "var(--c-900)",
            textDecoration: "underline",
            padding: "2px 0",
            fontFamily: "inherit",
          }}
        >
          {t.buttons.edit}
        </button>
      </div>

      {open && (
        <form
          onSubmit={submit}
          style={{
            marginTop: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            maxWidth: 360,
          }}
        >
          <label style={{ display: "block" }}>
            <span
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--c-700)",
                marginBottom: 6,
              }}
            >
              {c.newLabel}
            </span>
            <input
              type="email"
              value={newEmail}
              autoComplete="email"
              disabled={saving}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={c.newPlaceholder}
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
              }}
            />
          </label>
          {error && (
            <div style={{ fontSize: 13, color: "var(--s-error-600)" }}>
              {error}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              kind="primary"
              size="md"
              type="submit"
              disabled={saving || !newEmail.trim()}
            >
              {saving ? <Spinner size={16} color="#fff" /> : c.submit}
            </Button>
            <Button
              kind="secondary"
              size="md"
              type="button"
              disabled={saving}
              onClick={() => {
                setOpen(false);
                setNewEmail("");
                setError(null);
              }}
            >
              {c.cancel}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Danger zone
// ─────────────────────────────────────────────

function DangerZone({
  t,
  onDeleted,
}: {
  t: AcctDict;
  onDeleted: () => Promise<void>;
}) {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const doDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      toast(t.toasts.accountDeleted, "check");
      await onDeleted();
    } catch {
      setDeleting(false);
      setConfirming(false);
      toast(t.toasts.genericError, "trash");
    }
  };

  return (
    <>
      <Card>
        <button
          type="button"
          className="tap zw-hover-row"
          onClick={() => setConfirming(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            width: "100%",
            textAlign: "left",
            padding: "15px 18px",
            background: "transparent",
            border: 0,
            cursor: "pointer",
            font: "inherit",
          }}
        >
          <Icon name="trash" size={20} color="var(--s-error-600)" />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontSize: 15,
                fontWeight: 600,
                color: "var(--s-error-600)",
              }}
            >
              {t.buttons.deleteAccount}
            </span>
            <span
              style={{
                display: "block",
                fontSize: 12.5,
                color: "var(--c-500)",
                marginTop: 2,
              }}
            >
              {t.danger.caption}
            </span>
          </span>
          <Icon name="chevR" size={16} color="var(--c-400)" />
        </button>
      </Card>

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="zw-del-title"
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
            if (!deleting) setConfirming(false);
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
              id="zw-del-title"
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--c-900)",
              }}
            >
              {t.danger.confirmTitle}
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
              {t.danger.confirmBody}
            </p>
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <Button
                kind="secondary"
                size="md"
                onClick={() => setConfirming(false)}
                disabled={deleting}
              >
                {t.danger.cancel}
              </Button>
              <Button
                kind="primary"
                size="md"
                onClick={doDelete}
                disabled={deleting}
              >
                {deleting ? <Spinner size={16} color="#fff" /> : t.danger.confirm}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// Section bodies — composed from the existing primitives. `id` selects which
// body renders; props are threaded so each body has exactly what it needs.
// ─────────────────────────────────────────────

function SectionBody({
  id,
  t,
  locale,
  profile,
  prefs,
  prefsError,
  setPrefs,
  savingField,
  saveField,
  saveAddress,
  onDeleted,
}: {
  id: SectionId;
  t: AcctDict;
  locale: Locale;
  profile: CustomerProfile | null;
  prefs: NotificationPreferences | null;
  prefsError: boolean;
  setPrefs: (p: NotificationPreferences) => void;
  savingField: string | null;
  saveField: (field: keyof UpdateProfileBody, value: string) => void;
  saveAddress: (patch: Partial<UpdateProfileBody>) => void;
  onDeleted: () => Promise<void>;
}) {
  const [pwOpen, setPwOpen] = useState(false);
  if (id === "personal") {
    if (!profile) {
      return (
        <Card>
          <SectionError message={t.sectionError} />
        </Card>
      );
    }
    const dobValue = profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : "";
    return (
      <div>
        <EditableRow
          label={t.fields.firstName}
          value={profile.firstName ?? ""}
          emptyLabel={t.fields.phoneEmpty}
          saving={savingField === "firstName"}
          buttons={t.buttons}
          onSave={(v) => saveField("firstName", v)}
        />
        <EditableRow
          label={t.fields.lastName}
          value={profile.lastName ?? ""}
          emptyLabel={t.fields.phoneEmpty}
          saving={savingField === "lastName"}
          buttons={t.buttons}
          onSave={(v) => saveField("lastName", v)}
        />
        <EditableRow
          label={t.fields.phone}
          value={profile.phone ?? ""}
          type="tel"
          emptyLabel={t.fields.phoneEmpty}
          saving={savingField === "phone"}
          buttons={t.buttons}
          onSave={(v) => saveField("phone", v)}
        />
        <EditableRow
          label={t.fields.dateOfBirth}
          value={dobValue}
          type="date"
          locale={locale}
          emptyLabel={t.fields.phoneEmpty}
          saving={savingField === "dateOfBirth"}
          buttons={t.buttons}
          onSave={(v) => saveField("dateOfBirth", v)}
        />
        <ReadOnlyRow
          label={t.fields.email}
          value={profile.email}
          note={t.emailReadOnlyNote}
        />
        <AddressRow
          fields={t.fields}
          buttons={t.buttons}
          profile={profile}
          saving={savingField === "address"}
          onSave={saveAddress}
          last
        />
      </div>
    );
  }

  if (id === "preferences") {
    if (!prefs) {
      return (
        <Card>
          <SectionError message={prefsError ? t.sectionError : t.loading} />
        </Card>
      );
    }
    return <NotificationsSection t={t} prefs={prefs} setPrefs={setPrefs} />;
  }

  if (id === "support") {
    if (!profile) {
      return (
        <Card>
          <SectionError message={t.sectionError} />
        </Card>
      );
    }
    return <SupportSection t={t} locale={locale} profile={profile} />;
  }

  // security
  return (
    <SecuritySection
      t={t}
      locale={locale}
      pwOpen={pwOpen}
      setPwOpen={setPwOpen}
      onDeleted={onDeleted}
    />
  );
}

// ─────────────────────────────────────────────
// Security section — password, Google connection, change email, danger zone.
// On mount it calls refreshUser() ONCE so googleSub/hasPassword are
// authoritative even when this session's login response omitted them.
// ─────────────────────────────────────────────

function SecuritySection({
  t,
  locale,
  pwOpen,
  setPwOpen,
  onDeleted,
}: {
  t: AcctDict;
  locale: Locale;
  pwOpen: boolean;
  setPwOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onDeleted: () => Promise<void>;
}) {
  const { refreshUser } = useAuth();
  const authErrors = dictionaries[locale].auth.errors;

  // Refresh /me once so googleSub / hasPassword reflect the backend. Failures
  // degrade silently — the row falls back to whatever `user` already holds.
  useEffect(() => {
    void refreshUser().catch(() => {});
  }, [refreshUser]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "clamp(28px, 3.5vw, 40px)",
      }}
    >
      <div>
        <SectionLabel>{t.sections.password}</SectionLabel>
        <Card>
          <button
            type="button"
            className="tap zw-hover-row"
            onClick={() => setPwOpen((o) => !o)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              width: "100%",
              textAlign: "left",
              padding: "15px 18px",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              font: "inherit",
            }}
          >
            <Icon name="lock" size={20} color="var(--c-700)" />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: "block",
                  fontSize: 15.5,
                  fontWeight: 600,
                  letterSpacing: "-0.012em",
                  color: "var(--c-900)",
                }}
              >
                {t.sections.password}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 12.5,
                  color: "var(--c-500)",
                  marginTop: 2,
                }}
              >
                {t.password.manageHint}
              </span>
            </span>
            <span
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--p-700)",
                textDecoration: "underline",
                flexShrink: 0,
              }}
            >
              {t.buttons.edit}
            </span>
          </button>
          {pwOpen && (
            <div
              style={{
                padding: "18px",
                borderTop: "1px solid rgba(28,28,26,0.06)",
              }}
            >
              <PasswordForm t={t} onDone={() => setPwOpen(false)} />
            </div>
          )}
        </Card>
      </div>

      <div>
        <SectionLabel>{t.sections.security}</SectionLabel>
        <Card>
          <div style={{ padding: "2px 18px" }}>
            <GoogleConnectionRow t={t} authErrors={authErrors} locale={locale} />
            <ChangeEmailForm t={t} authErrors={authErrors} last />
          </div>
        </Card>
      </div>

      <div>
        <SectionLabel>{t.sections.dangerZone}</SectionLabel>
        <DangerZone t={t} onDeleted={onDeleted} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Section header — title + optional sub. On mobile drill-in a round back
// button sits above the title and clears the active section.
// ─────────────────────────────────────────────

function SectionHeader({
  t,
  id,
  showBack,
  onBack,
}: {
  t: AcctDict;
  id: SectionId;
  showBack?: boolean;
  onBack?: () => void;
}) {
  const sub = id === "preferences" ? t.preferencesSub : null;
  return (
    <div style={{ marginBottom: 24 }}>
      {showBack && (
        <button
          type="button"
          className="tap zw-hover-row"
          aria-label={t.backAria}
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "#fff",
            border: "1px solid rgba(28,28,26,0.10)",
            cursor: "pointer",
            marginBottom: 16,
            boxShadow: "var(--sh-sm)",
          }}
        >
          <Icon name="back" size={16} color="var(--c-900)" />
        </button>
      )}
      <h1
        style={{
          margin: 0,
          fontSize: "clamp(23px, 2.4vw, 28px)",
          fontWeight: 600,
          letterSpacing: "-0.03em",
          color: "var(--c-900)",
        }}
      >
        {t.sectionTitles[id]}
      </h1>
      {sub && (
        <p
          className="txt-pretty"
          style={{
            margin: "8px 0 0",
            fontSize: 15,
            lineHeight: 1.5,
            color: "var(--c-600)",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Desktop nav rail — sticky aside; section items with an active accent bar,
// then a hairline divider + danger-styled Log out.
// ─────────────────────────────────────────────

const NAV_ITEMS: { id: SectionId; icon: "pencil" | "bell" | "lock" | "reply" }[] = [
  { id: "personal", icon: "pencil" },
  { id: "preferences", icon: "bell" },
  { id: "security", icon: "lock" },
  { id: "support", icon: "reply" },
];

function RailItem({
  icon,
  label,
  on,
  danger,
  onClick,
}: {
  icon: "pencil" | "bell" | "lock" | "reply" | "logout";
  label: string;
  on?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="tap"
      onClick={onClick}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        textAlign: "left",
        padding: "12px 14px",
        borderRadius: 12,
        border: 0,
        cursor: "pointer",
        font: "inherit",
        background: on ? "var(--c-shade)" : "transparent",
        color: danger ? "var(--s-error-600)" : "var(--c-900)",
        transition: "background-color .15s var(--ease-soft)",
      }}
      onMouseEnter={(e) => {
        if (!on) e.currentTarget.style.background = "var(--c-100)";
      }}
      onMouseLeave={(e) => {
        if (!on) e.currentTarget.style.background = "transparent";
      }}
    >
      <Icon
        name={icon}
        size={18}
        color={
          danger
            ? "var(--s-error-600)"
            : on
              ? "var(--p-600)"
              : "var(--c-600)"
        }
      />
      <span
        style={{
          flex: 1,
          fontSize: 14.5,
          fontWeight: on ? 600 : 500,
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </span>
    </button>
  );
}

function NavRail({
  t,
  active,
  setActive,
  onLogout,
}: {
  t: AcctDict;
  active: SectionId;
  setActive: (id: SectionId) => void;
  onLogout: () => void;
}) {
  return (
    <aside
      style={{
        position: "sticky",
        top: "calc(var(--nav-h) + 24px)",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--c-500)",
            padding: "0 14px",
            marginBottom: 8,
          }}
        >
          {t.sections.profile}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((it) => (
            <RailItem
              key={it.id}
              icon={it.icon}
              label={t.sectionNav[it.id]}
              on={active === it.id}
              onClick={() => setActive(it.id)}
            />
          ))}
        </div>
      </div>
      <div style={{ height: 1, background: "rgba(28,28,26,0.08)" }} />
      <RailItem
        icon="logout"
        label={t.logout}
        danger
        onClick={onLogout}
      />
    </aside>
  );
}

// ─────────────────────────────────────────────
// Mobile hub — centered identity + stats + section list + log out.
// The Saved stat links to /saved; Appointments/Reviews are non-navigating
// (no routes exist for them yet).
// ─────────────────────────────────────────────

function HubStat({
  value,
  label,
  nf,
  onClick,
}: {
  value: number;
  label: string;
  nf: Intl.NumberFormat;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div
        style={{
          fontSize: 21,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--c-900)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {nf.format(value)}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--c-500)", marginTop: 3 }}>
        {label}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className="tap"
        onClick={onClick}
        style={{
          flex: 1,
          textAlign: "center",
          minWidth: 0,
          border: 0,
          padding: 0,
          background: "transparent",
          font: "inherit",
          cursor: "pointer",
        }}
      >
        {inner}
      </button>
    );
  }

  return (
    <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>{inner}</div>
  );
}

function HubNavRow({
  icon,
  label,
  last,
  onClick,
}: {
  icon: "pencil" | "bell" | "lock" | "reply";
  label: string;
  last?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="tap zw-hover-row"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        textAlign: "left",
        padding: "15px 18px",
        background: "transparent",
        border: 0,
        cursor: "pointer",
        font: "inherit",
        borderBottom: last ? 0 : "1px solid rgba(28,28,26,0.06)",
      }}
    >
      <Icon name={icon} size={20} color="var(--c-700)" />
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 15.5,
          fontWeight: 600,
          letterSpacing: "-0.012em",
          color: "var(--c-900)",
        }}
      >
        {label}
      </span>
      <Icon name="chevR" size={16} color="var(--c-400)" />
    </button>
  );
}

function MobileHub({
  t,
  locale,
  profile,
  summary,
  uploadingPhoto,
  onPickPhoto,
  onSavedClick,
  setActive,
  onLogout,
  loggingOut,
}: {
  t: AcctDict;
  locale: Locale;
  profile: CustomerProfile;
  summary: CustomerProfileSummary | null;
  uploadingPhoto: boolean;
  onPickPhoto: (file: File) => void;
  onSavedClick?: () => void;
  setActive: (id: SectionId) => void;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const name =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.email;
  const image = profile.profileImage ?? summary?.profileImage ?? undefined;
  const memberSince = summary?.memberSince
    ? new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
      }).format(new Date(summary.memberSince))
    : null;
  const nf = new Intl.NumberFormat(locale);
  const reviews =
    (summary?.totalBusinessReviews ?? 0) +
    (summary?.totalProfessionalReviews ?? 0);
  const verified = profile.email_verified;

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPickPhoto(f);
          e.target.value = "";
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          marginBottom: 30,
        }}
      >
        <button
          type="button"
          className="zw-avatar-edit"
          aria-label={t.buttons.changePhoto}
          disabled={uploadingPhoto}
          onClick={() => fileRef.current?.click()}
          style={{
            width: 92,
            height: 92,
            borderRadius: "50%",
            border: 0,
            padding: 0,
            background: "transparent",
            flexShrink: 0,
            boxShadow:
              "0 0 0 3px var(--c-canvas), 0 0 0 4px rgba(28,28,26,0.10)",
          }}
        >
          <Avatar src={image} name={name} size={92} />
          <span className="zw-avatar-ov">
            {uploadingPhoto ? (
              <Spinner size={20} color="#fff" />
            ) : (
              <Icon name="pencil" size={18} color="#fff" />
            )}
          </span>
        </button>
        <h1
          style={{
            margin: "15px 0 0",
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            color: "var(--c-900)",
          }}
        >
          {name}
        </h1>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11.5,
            fontWeight: 600,
            color: verified ? "var(--s-success-600)" : "var(--c-600)",
            background: verified ? "var(--s-success-100)" : "var(--c-100)",
            padding: "3px 10px",
            borderRadius: 999,
            marginTop: 10,
          }}
        >
          <Icon
            name={verified ? "check" : "email"}
            size={12}
            color={verified ? "var(--s-success-600)" : "var(--c-600)"}
          />
          {memberSince
            ? `${verified ? t.verifiedPill : t.unverifiedPill} · ${format(
                t.stats.memberSince,
                { date: memberSince },
              )}`
            : verified
              ? t.verifiedPill
              : t.unverifiedPill}
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 8,
            marginTop: 18,
            width: "100%",
            maxWidth: 380,
          }}
        >
          <HubStat
            value={summary?.totalAppointments ?? 0}
            label={t.stats.appointments}
            nf={nf}
          />
          <span style={{ width: 1, background: "rgba(28,28,26,0.08)" }} />
          <HubStat value={reviews} label={t.stats.reviews} nf={nf} />
          <span style={{ width: 1, background: "rgba(28,28,26,0.08)" }} />
          <HubStat
            value={summary?.totalFavorites ?? 0}
            label={t.stats.saved}
            nf={nf}
            onClick={onSavedClick}
          />
        </div>
      </div>

      <div style={{ marginBottom: 26 }}>
        <SectionLabel>{t.hubGroupLabel}</SectionLabel>
        <Card>
          {NAV_ITEMS.map((it, i) => (
            <HubNavRow
              key={it.id}
              icon={it.icon}
              label={t.sectionNav[it.id]}
              last={i === NAV_ITEMS.length - 1}
              onClick={() => setActive(it.id)}
            />
          ))}
        </Card>
      </div>

      <button
        type="button"
        className="tap"
        onClick={onLogout}
        disabled={loggingOut}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          width: "100%",
          padding: "15px 18px",
          borderRadius: 999,
          background: "var(--c-ink)",
          border: 0,
          cursor: loggingOut ? "default" : "pointer",
          fontSize: 15,
          fontWeight: 600,
          color: "#fff",
          letterSpacing: "-0.01em",
          fontFamily: "inherit",
          opacity: loggingOut ? 0.7 : 1,
          boxShadow:
            "0 1px 0 rgba(0,0,0,0.04), 0 8px 20px rgba(28,28,26,0.16)",
        }}
      >
        {loggingOut ? (
          <Spinner size={17} color="#fff" />
        ) : (
          <Icon name="logout" size={17} color="#fff" />
        )}
        {loggingOut ? t.loggingOut : t.logout}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────

function LoadingState({ loadingLabel }: { loadingLabel: string }) {
  return (
    <div
      className="zw-container"
      style={{ paddingTop: 40, paddingBottom: 40, width: "100%" }}
      aria-busy="true"
    >
      <Skeleton w="100%" h={140} r={22} />
      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 24 }}>
        <Skeleton w="100%" h={220} r={16} />
        <Skeleton w="100%" h={180} r={16} />
      </div>
      <p className="sr-only">{loadingLabel}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export function AccountContent({ locale }: { locale: Locale }) {
  const t = dictionaries[locale].account;
  const router = useRouter();
  const toast = useToast();
  const { status, logout, refreshUser } = useAuth();
  const { openAuthModal } = useAuthModal();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [summary, setSummary] = useState<CustomerProfileSummary | null>(null);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);

  const [prefsError, setPrefsError] = useState(false);
  const [loading, setLoading] = useState(true);

  const [savingField, setSavingField] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Responsive flag — SSR-safe (starts false; authenticated content renders
  // client-side after the data load, so there is no hydration mismatch).
  const [isNarrow, setIsNarrow] = useState(false);

  // Client-side section selection (no URL / route changes).
  const [active, setActive] = useState<SectionId | null>(null);

  const authed = status === "authenticated";

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => setIsNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!authed) return;
    let alive = true;
    // `loading` is initialised to true and this effect runs once auth flips to
    // authenticated, so no synchronous setState(true) is needed here.

    // Only what first paint needs: profile (editable fields + banner) and
    // summary (stats, incl. totalFavorites). Notification preferences are
    // deferred until the Preferences section is opened.
    Promise.allSettled([getProfile(), getProfileSummary()]).then((results) => {
      if (!alive) return;
      const [pRes, sRes] = results;

      if (pRes.status === "fulfilled") setProfile(pRes.value);
      // profile failure → null → section/banner shows sectionError fallback.

      if (sRes.status === "fulfilled") setSummary(sRes.value);
      // summary failure degrades silently (stats render as 0).

      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [authed]);

  // Notification preferences are consumed only by the Preferences section, so
  // they load on its first activation. One-shot: setState after a section
  // switch (or unmount) is a harmless no-op, so no cancellation is needed.
  const prefsRequested = useRef(false);
  useEffect(() => {
    if (!authed || active !== "preferences" || prefsRequested.current) return;
    prefsRequested.current = true;
    getNotificationPreferences()
      .then(setPrefs)
      .catch(() => setPrefsError(true));
  }, [authed, active]);

  const saveField = useCallback(
    async (field: keyof UpdateProfileBody, value: string) => {
      if (!profile) return;
      setSavingField(field);
      try {
        const updated = await updateProfile({ [field]: value });
        setProfile(updated); // reconcile from response
        toast(t.toasts.profileSaved, "check");
      } catch {
        toast(t.toasts.genericError, "pencil");
      } finally {
        setSavingField(null);
      }
    },
    [profile, t, toast],
  );

  // All address components save as ONE request (the Address row edits them
  // together); savingField uses the synthetic key "address".
  const saveAddress = useCallback(
    async (patch: Partial<UpdateProfileBody>) => {
      if (!profile) return;
      setSavingField("address");
      try {
        const updated = await updateProfile(patch);
        setProfile(updated); // reconcile from response
        toast(t.toasts.profileSaved, "check");
      } catch {
        toast(t.toasts.genericError, "pencil");
      } finally {
        setSavingField(null);
      }
    },
    [profile, t, toast],
  );

  const handlePhoto = useCallback(
    async (file: File) => {
      setUploadingPhoto(true);
      try {
        const res = await uploadProfileImage(file);
        setProfile((prev) =>
          prev ? { ...prev, profileImage: res.profileImage } : prev,
        );
        // Header avatar reads useAuth().user — reflect the new photo there too.
        void refreshUser().catch(() => {});
        toast(t.toasts.photoUpdated, "check");
      } catch {
        toast(t.toasts.genericError, "pencil");
      } finally {
        setUploadingPhoto(false);
      }
    },
    [t, toast, refreshUser],
  );

  const goHome = useCallback(async () => {
    await logout();
    router.replace(localeHref(locale));
  }, [logout, router, locale]);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await goHome();
    } finally {
      setLoggingOut(false);
    }
  }, [goHome]);

  // ── Auth gating ──
  if (status === "idle" || status === "loading") {
    return <LoadingState loadingLabel={t.loading} />;
  }

  if (status === "unauthenticated" || status === "error") {
    return (
      <SignedOutGate
        icon="user"
        title={t.gate.title}
        body={t.gate.body}
        onCta={() => openAuthModal("signin")}
        secondaryLabel={t.gate.secondary}
        onSecondary={() => router.push(localeHref(locale, "search"))}
      />
    );
  }

  // authenticated but still loading data
  if (loading) {
    return <LoadingState loadingLabel={t.loading} />;
  }

  // ── Mobile: phone-style hub → drill-in ──
  if (isNarrow) {
    return (
      <div
        className="zw-container zw-acct-in"
        style={{ paddingTop: 32, paddingBottom: 24, width: "100%" }}
      >
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          {active === null ? (
            profile ? (
              <MobileHub
                t={t}
                locale={locale}
                profile={profile}
                summary={summary}
                uploadingPhoto={uploadingPhoto}
                onPickPhoto={handlePhoto}
                onSavedClick={() => router.push(localeHref(locale, "saved"))}
                setActive={setActive}
                onLogout={handleLogout}
                loggingOut={loggingOut}
              />
            ) : (
              <Card>
                <SectionError message={t.sectionError} />
              </Card>
            )
          ) : (
            <div className="zw-acct-in" key={active}>
              <SectionHeader
                t={t}
                id={active}
                showBack
                onBack={() => setActive(null)}
              />
              <SectionBody
                id={active}
                t={t}
                locale={locale}
                profile={profile}
                prefs={prefs}
                prefsError={prefsError}
                setPrefs={setPrefs}
                savingField={savingField}
                saveField={saveField}
                saveAddress={saveAddress}
                onDeleted={goHome}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Desktop: full-width banner + two-pane (nav rail · content) ──
  const desktopActive: SectionId = active ?? "personal";
  return (
    <div
      className="zw-container"
      style={{ paddingTop: 40, paddingBottom: 56, width: "100%" }}
    >
      {profile ? (
        <ProfileBanner
          t={t}
          locale={locale}
          profile={profile}
          summary={summary}
          uploadingPhoto={uploadingPhoto}
          onPickPhoto={handlePhoto}
          onSavedClick={() => router.push(localeHref(locale, "saved"))}
        />
      ) : (
        <Card>
          <SectionError message={t.sectionError} />
        </Card>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(200px, 244px) minmax(0, 1fr)",
          gap: "clamp(32px, 4.5vw, 64px)",
          alignItems: "start",
          marginTop: "clamp(28px, 3.5vw, 44px)",
        }}
      >
        <NavRail
          t={t}
          active={desktopActive}
          setActive={setActive}
          onLogout={handleLogout}
        />
        <div
          className="zw-acct-in"
          key={desktopActive}
          style={{ minWidth: 0, maxWidth: 760 }}
        >
          <SectionHeader t={t} id={desktopActive} />
          <SectionBody
            id={desktopActive}
            t={t}
            locale={locale}
            profile={profile}
            prefs={prefs}
            prefsError={prefsError}
            setPrefs={setPrefs}
            savingField={savingField}
            saveField={saveField}
            saveAddress={saveAddress}
            onDeleted={goHome}
          />
        </div>
      </div>
    </div>
  );
}
