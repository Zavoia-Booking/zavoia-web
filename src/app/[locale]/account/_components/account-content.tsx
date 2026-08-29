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
import { ResendVerification } from "../../auth/_components/resend-verification";
import { authErrorMessage } from "@/lib/api/auth-error-messages";
import { customerErrorMessage } from "@/lib/api/customer-error-messages";
import { ApiError } from "@/lib/api/http";
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
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REGEX,
  isValidPhone,
  normalizePhone,
  sanitizeName,
} from "@/lib/validation";

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
      role="alert"
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
// Inline-editable field row
// ─────────────────────────────────────────────

function EditableRow({
  id,
  label,
  value,
  type = "text",
  locale = "en",
  emptyLabel,
  saving,
  buttons,
  onSave,
  last,
  validate,
  sanitize,
}: {
  /** Root id for the input + its error message; must be unique on the page. */
  id: string;
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
  /** Live client-side check, mirroring the backend rule for this field. */
  validate?: (raw: string) => string | undefined;
  /** Strips characters the field may not contain, applied as the user types. */
  sanitize?: (raw: string) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
  }, [editing]);

  // Derived from `draft` on every render rather than held in its own state —
  // there is exactly one field here, so there is no risk of it going stale
  // the way a multi-field form's errors object can.
  const error = editing && validate ? validate(draft) : undefined;
  const errorId = `${id}-error`;

  const start = () => {
    setDraft(value);
    setEditing(true);
  };
  const commit = () => {
    // Re-check rather than trust `error`: a keyboard Enter can fire commit()
    // in the same tick as the last keystroke's re-render. If it's still
    // invalid, keep editing open and return focus to the field instead of
    // silently saving nothing (or nothing at all, per the double-submit note
    // in register-form.tsx — this is the same "synchronous, not state" idea
    // applied to a validity check instead of a lock).
    if (validate?.(draft)) {
      ref.current?.focus();
      return;
    }
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
              <>
                <input
                  id={id}
                  ref={ref}
                  type={type}
                  value={draft}
                  disabled={saving}
                  onChange={(e) =>
                    setDraft(
                      sanitize ? sanitize(e.target.value) : e.target.value,
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commit();
                    if (e.key === "Escape") cancel();
                  }}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? errorId : undefined}
                  style={{
                    marginTop: 8,
                    width: "100%",
                    maxWidth: 340,
                    boxSizing: "border-box",
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: error
                      ? "1px solid var(--s-error-600)"
                      : "1px solid rgba(28,28,26,0.18)",
                    fontSize: 14,
                    color: "var(--c-900)",
                    background: "#fff",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
                {error && (
                  <div
                    id={errorId}
                    role="alert"
                    style={{
                      fontSize: 12.5,
                      color: "var(--s-error-600)",
                      marginTop: 5,
                      maxWidth: 340,
                    }}
                  >
                    {error}
                  </div>
                )}
              </>
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
              disabled={saving || Boolean(error)}
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                border: 0,
                background: "var(--c-ink)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: saving || error ? "default" : "pointer",
                opacity: error ? 0.6 : 1,
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

// Backend limits (admin-api update-profile.dto.ts, @MaxLength per field) —
// free text, so the only rule is length. Verified against the DTO directly
// rather than assumed, since the four fields do NOT share one limit.
const ADDRESS_MAX_LENGTH = {
  country: 64,
  city: 64,
  street: 128,
  number: 16,
  mentions: 500,
} as const;
type AddressKey = keyof typeof ADDRESS_MAX_LENGTH;
const ADDRESS_FIELD_ORDER: AddressKey[] = [
  "country",
  "city",
  "street",
  "number",
  "mentions",
];

function AddressRow({
  fields,
  errors: errorsDict,
  buttons,
  profile,
  saving,
  onSave,
  last,
}: {
  fields: AcctDict["fields"];
  errors: AcctDict["errors"];
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
  const [errors, setErrors] = useState<Partial<Record<AddressKey, string>>>(
    {},
  );
  const fieldRefs = useRef<Partial<Record<AddressKey, HTMLInputElement | null>>>(
    {},
  );

  useEffect(() => {
    if (editing) fieldRefs.current.country?.focus();
  }, [editing]);

  const validateAddressField = useCallback(
    (key: AddressKey, raw: string): string | undefined => {
      const max = ADDRESS_MAX_LENGTH[key];
      return raw.trim().length > max
        ? format(errorsDict.addressTooLong, { max: String(max) })
        : undefined;
    },
    [errorsDict],
  );

  const setField = (key: AddressKey, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: validateAddressField(key, value) }));
  };

  const start = () => {
    setDraft({
      country: profile.addressCountry ?? "",
      city: profile.addressCity ?? "",
      street: profile.addressStreet ?? "",
      number: profile.addressNumber ?? "",
      mentions: profile.addressMentions ?? "",
    });
    setErrors({});
    setEditing(true);
  };
  const commit = () => {
    const nextErrors: Partial<Record<AddressKey, string>> = {};
    for (const key of ADDRESS_FIELD_ORDER) {
      const err = validateAddressField(key, draft[key]);
      if (err) nextErrors[key] = err;
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const firstInvalid = ADDRESS_FIELD_ORDER.find((k) => nextErrors[k]);
      if (firstInvalid) fieldRefs.current[firstInvalid]?.focus();
      return;
    }
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

  const hasError = Object.values(errors).some(Boolean);

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
  const errorTextStyle: CSSProperties = {
    fontSize: 11.5,
    color: "var(--s-error-600)",
    marginTop: 4,
  };
  const onKeys = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") cancel();
  };
  // One input per address field, each wired the same way: id for the label's
  // htmlFor, aria-invalid/aria-describedby pointing at its own error message,
  // and setField() so a fix-as-you-type keeps the Save button's disabled
  // state (and the error text) in sync with what would actually be sent.
  const addressInput = (key: AddressKey, label: string) => {
    const inputId = `address-${key}`;
    const errorId = `${inputId}-error`;
    const fieldError = errors[key];
    return (
      <label htmlFor={inputId}>
        <span style={subLabelStyle}>{label}</span>
        <input
          id={inputId}
          ref={(el) => {
            fieldRefs.current[key] = el;
          }}
          type="text"
          value={draft[key]}
          disabled={saving}
          placeholder={
            key === "mentions" ? fields.addressMentionsPlaceholder : undefined
          }
          onChange={(e) => setField(key, e.target.value)}
          onKeyDown={onKeys}
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? errorId : undefined}
          style={
            fieldError
              ? { ...inputStyle, border: "1px solid var(--s-error-600)" }
              : inputStyle
          }
        />
        {fieldError && (
          <div id={errorId} role="alert" style={errorTextStyle}>
            {fieldError}
          </div>
        )}
      </label>
    );
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
              {addressInput("country", fields.addressCountry)}
              {addressInput("city", fields.addressCity)}
              {addressInput("street", fields.addressStreet)}
              {addressInput("number", fields.addressNumber)}
              <div style={{ gridColumn: "1 / -1" }}>
                {addressInput("mentions", fields.addressMentions)}
              </div>
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
              disabled={saving || hasError}
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                border: 0,
                background: "var(--c-ink)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: saving || hasError ? "default" : "pointer",
                opacity: hasError ? 0.6 : 1,
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

const NOTIF_CHANNELS: { id: NotifChannel; icon: "bell" | "phone" | "email" }[] =
  [
    { id: "push", icon: "bell" },
    { id: "sms", icon: "phone" },
    { id: "email", icon: "email" },
  ];

const NOTIF_GROUPS: NotifGroup[] = ["marketing", "reminders"];

// One matrix card: group rows (title + caption) × channel columns (icon-headed
// switches). Column headers hide ≤600px, where each switch becomes a labeled
// tile — see .zw-notif-* in globals.css.
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
      toast(t.toasts.genericError, "bell", undefined, "error");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <Card>
      <div className="zw-notif-grid zw-notif-head" aria-hidden="true">
        <div />
        {NOTIF_CHANNELS.map((c) => (
          <div key={c.id} className="zw-notif-col">
            <Icon name={c.icon} size={15} color="var(--c-600)" />
            <span>{t.notif[c.id]}</span>
          </div>
        ))}
      </div>
      {NOTIF_GROUPS.map((g) => (
        <div key={g} className="zw-notif-grid zw-notif-group">
          <div className="zw-notif-desc">
            <span className="zw-notif-title">{t.notif[g]}</span>
            <span className="zw-notif-caption txt-pretty">
              {g === "marketing"
                ? t.notif.marketingCaption
                : t.notif.remindersCaption}
            </span>
          </div>
          {NOTIF_CHANNELS.map((c) => (
            <button
              key={c.id}
              type="button"
              role="switch"
              aria-checked={prefs[g][c.id]}
              aria-label={`${t.notif[g]} — ${t.notif[c.id]}`}
              disabled={busyKey === `${g}.${c.id}`}
              onClick={() => toggle(g, c.id)}
              className="zw-notif-cell tap"
            >
              <span className="zw-notif-cell-label">{t.notif[c.id]}</span>
              <span
                className="zw-switch"
                data-on={prefs[g][c.id] ? "1" : "0"}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      ))}
    </Card>
  );
}

// ─────────────────────────────────────────────
// Password form
// ─────────────────────────────────────────────

function PasswordForm({
  t,
  sharedErrors,
  onDone,
}: {
  t: AcctDict;
  sharedErrors: SharedErrorsDict;
  onDone: () => void;
}) {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Which field the current `error` is about, so the right input gets
  // aria-invalid/aria-describedby and keyboard focus — there's one shared
  // message, not one per field, so this has to be tracked separately.
  const [invalidField, setInvalidField] = useState<
    "current" | "next" | "confirm" | null
  >(null);
  const currentRef = useRef<HTMLInputElement | null>(null);
  const nextRef = useRef<HTMLInputElement | null>(null);
  const confirmRef = useRef<HTMLInputElement | null>(null);

  const ERROR_ID = "password-form-error";

  const field = (
    id: string,
    label: string,
    val: string,
    set: (v: string) => void,
    autoComplete: string,
    ref: React.RefObject<HTMLInputElement | null>,
    invalid: boolean,
  ) => (
    <label htmlFor={id} style={{ display: "block" }}>
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
        id={id}
        ref={ref}
        type="password"
        value={val}
        autoComplete={autoComplete}
        disabled={saving}
        onChange={(e) => set(e.target.value)}
        aria-invalid={invalid}
        aria-describedby={invalid ? ERROR_ID : undefined}
        style={{
          width: "100%",
          maxWidth: 360,
          boxSizing: "border-box",
          padding: "10px 12px",
          borderRadius: 10,
          border: invalid
            ? "1px solid var(--s-error-600)"
            : "1px solid rgba(28,28,26,0.18)",
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
    setInvalidField(null);
    if (next.length < PASSWORD_MIN_LENGTH) {
      setError(t.password.tooShort);
      setInvalidField("next");
      nextRef.current?.focus();
      return;
    }
    // The backend applies PASSWORD_REGEX here too (change-password.dto.ts).
    // Without this check the form accepted exactly what its own hint text
    // told the user to type ("at least 8 characters"), then failed on the
    // server with a message carrying no code — so the user was told only
    // that something went wrong, never that a special character was missing.
    if (!PASSWORD_REGEX.test(next)) {
      setError(t.password.weak);
      setInvalidField("next");
      nextRef.current?.focus();
      return;
    }
    if (next !== confirm) {
      setError(t.password.mismatch);
      setInvalidField("confirm");
      confirmRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      await changePassword({
        currentPassword: current,
        newPassword: next,
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      // NOT `res.message || …`: the backend always returns a truthy English
      // string ("Password changed successfully"), so the localized fallback
      // could never win and a Romanian user always saw English.
      toast(t.toasts.passwordChanged, "check");
      onDone();
    } catch (err) {
      // /marketplace/customer/profile/change-password (customer.service.ts
      // changePassword) is migrating to CUSTOMER.E08 (Google-linked account,
      // no password to change) / CUSTOMER.E09 (wrong current password) —
      // customerErrorMessage is the mapper that already knows those two
      // codes (see customer-error-messages.ts), so this call starts
      // benefiting the moment the backend sends them, with no client change.
      // Inline, not a toast: this is a field-level failure the user has to
      // fix in the form that is still in front of them, and the client-side
      // checks a few lines above already report inline. A toast for the same
      // class of error vanished in seconds while the wrong password sat in
      // the field behind it.
      setError(customerErrorMessage(err, sharedErrors));
      // Both mapped codes are about the current-password field; anything
      // unmapped is at least as likely to be that as any other field.
      setInvalidField("current");
      currentRef.current?.focus();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 360 }}
    >
      {field(
        "password-current",
        t.password.current,
        current,
        setCurrent,
        "current-password",
        currentRef,
        invalidField === "current",
      )}
      {field(
        "password-new",
        t.password.new,
        next,
        setNext,
        "new-password",
        nextRef,
        invalidField === "next",
      )}
      {field(
        "password-confirm",
        t.password.confirm,
        confirm,
        setConfirm,
        "new-password",
        confirmRef,
        invalidField === "confirm",
      )}
      <div style={{ fontSize: 12.5, color: "var(--c-500)" }}>
        {t.password.rules}
      </div>
      {error && (
        <div
          id={ERROR_ID}
          role="alert"
          style={{ fontSize: 13, color: "var(--s-error-600)" }}
        >
          {error}
        </div>
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
type SharedErrorsDict = (typeof dictionaries)[Locale]["errors"];

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
  const passwordRef = useRef<HTMLInputElement | null>(null);
  // Disconnecting Google is a dangerous, hard-to-undo action (it can leave the
  // account with only a password to sign in with, or vice versa) — the same
  // synchronous-lock reasoning as register-form.tsx's submitLockRef applies:
  // `busy` state disables the button only after a re-render, so a fast double
  // Enter/click can still fire unlinkGoogle() twice.
  const submitLockRef = useRef(false);

  const submitDisconnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current) return;
    setError(null);
    if (!password) {
      passwordRef.current?.focus();
      return;
    }
    submitLockRef.current = true;
    setBusy(true);
    try {
      await unlinkGoogle(password);
      setPromptOpen(false);
      setPassword("");
      toast(g.disconnectedToast, "check");
    } catch (err) {
      setError(
        authErrorMessage(err, authErrors, dictionaries[locale].errors),
      );
      passwordRef.current?.focus();
    } finally {
      setBusy(false);
      submitLockRef.current = false;
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
          <label htmlFor="google-disconnect-password" style={{ display: "block" }}>
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
              id="google-disconnect-password"
              ref={passwordRef}
              type="password"
              value={password}
              autoComplete="current-password"
              disabled={busy}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={g.passwordPrompt}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "google-disconnect-error" : undefined}
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
            <div
              id="google-disconnect-error"
              role="alert"
              style={{ fontSize: 13, color: "var(--s-error-600)" }}
            >
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
// Change email row — lives in Personal info and mirrors the admin-dashboard
// flow: the user retypes the CURRENT address alongside the new one, both
// validated with the shared EMAIL_RE before anything leaves the browser.
// The backend (POST /marketplace/auth/change-email) swaps the address
// instantly, mails BOTH the old and the new address, and revokes every OTHER
// session — this one survives. Backend codes land on the field they belong to:
// CURRENT_EMAIL_MISMATCH → current, EMAIL_TAKEN / SAME_EMAIL → new.
// ─────────────────────────────────────────────

type ResendCopy = (typeof dictionaries)[Locale]["auth"]["resendVerification"];

function ChangeEmailRow({
  t,
  authErrors,
  sharedErrors,
  currentEmail,
  emailVerified,
  resendCopy,
  onChanged,
  last,
}: {
  t: AcctDict;
  authErrors: AuthErrorsDict;
  sharedErrors: SharedErrorsDict;
  currentEmail: string;
  /** From GET /me. `undefined` = not known yet; render neither state. */
  emailVerified?: boolean;
  resendCopy: ResendCopy;
  onChanged: (email: string) => void;
  last?: boolean;
}) {
  const toast = useToast();
  const { changeEmail } = useAuth();
  const c = t.changeEmail;
  const rv = resendCopy;

  const [open, setOpen] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [newInput, setNewInput] = useState("");
  const [errors, setErrors] = useState<{ current?: string; next?: string }>({});
  const [saving, setSaving] = useState(false);
  const currentRef = useRef<HTMLInputElement | null>(null);
  const nextRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    setCurrentInput("");
    setNewInput("");
    setErrors({});
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const current = currentInput.trim();
    const next = newInput.trim();

    // Validate both fields in one pass so the user sees every problem at once
    // instead of one server round-trip at a time.
    const local: { current?: string; next?: string } = {};
    if (!EMAIL_RE.test(current)) local.current = c.invalidEmail;
    if (!EMAIL_RE.test(next)) {
      local.next = c.invalidEmail;
    } else if (!local.current && next.toLowerCase() === current.toLowerCase()) {
      local.next = authErrors.sameEmail;
    }
    if (local.current || local.next) {
      setErrors(local);
      // Current is the first field in the form, so it wins when both are
      // invalid — matches reading order for keyboard/screen-reader users.
      (local.current ? currentRef : nextRef).current?.focus();
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      const res = await changeEmail(current, next);
      close();
      onChanged(res.email);
      // The response also carries revokedSessionCount; deliberately not
      // surfaced — the confirmation is the only thing the user needs here.
      toast(c.changedToast, "check");
    } catch (err) {
      const code =
        err instanceof ApiError && err.code ? err.code.toUpperCase() : null;
      const message = authErrorMessage(err, authErrors, sharedErrors);
      // CURRENT_EMAIL_MISMATCH is the only code about the first field;
      // EMAIL_TAKEN / SAME_EMAIL and anything unmapped belong to the new one.
      if (code === "CURRENT_EMAIL_MISMATCH") {
        setErrors({ current: message });
        currentRef.current?.focus();
      } else {
        setErrors({ next: message });
        nextRef.current?.focus();
      }
    } finally {
      setSaving(false);
    }
  };

  // Label + input styling is lifted verbatim from EditableRow (First name /
  // Last name) so the expanded form reads as one more row in the list.
  const inputStyle: CSSProperties = {
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
  };
  const subLabelStyle: CSSProperties = {
    display: "block",
    fontSize: 14.5,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    color: "var(--c-900)",
  };
  const errorStyle: CSSProperties = {
    fontSize: 12.5,
    color: "var(--s-error-600)",
    marginTop: 5,
    maxWidth: 340,
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
            {t.fields.email}
          </div>
          <div
            style={{
              fontSize: 14,
              color: "var(--c-600)",
              marginTop: 4,
              overflowWrap: "anywhere",
            }}
          >
            <span style={{ color: "var(--c-400)" }}>{c.currentValueLabel}:</span>{" "}
            {currentEmail}
          </div>
          {/* Verification state. `emailVerified` is only guaranteed by /me, so
              `undefined` renders nothing at all — "unknown yet" must never be
              shown as unverified. */}
          {emailVerified === false && (
            <div
              style={{
                marginTop: 10,
                padding: "12px 14px",
                borderRadius: 12,
                background: "var(--c-100)",
                border: "1px solid rgba(28,28,26,0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--c-900)",
                }}
              >
                <Icon name="warn" size={14} color="var(--c-700)" />
                {rv.unverifiedTitle}
              </div>
              <div
                className="txt-pretty"
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  color: "var(--c-600)",
                  marginTop: 4,
                }}
              >
                {rv.unverifiedBody}
              </div>
              <ResendVerification email={currentEmail} />
            </div>
          )}
          {emailVerified === true && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                marginTop: 7,
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--p-700)",
              }}
            >
              <Icon name="check" size={13} color="var(--p-700)" />
              {c.verifiedLabel}
            </div>
          )}
          <div
            className="txt-pretty"
            style={{ fontSize: 12.5, color: "var(--c-400)", marginTop: 6 }}
          >
            {c.caption}
          </div>
        </div>
        {!open && (
          <button
            type="button"
            className="tap"
            onClick={() => setOpen(true)}
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
        )}
      </div>

      {open && (
        <form
          onSubmit={submit}
          style={{
            marginTop: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            maxWidth: 420,
          }}
        >
          <label htmlFor="change-email-current" style={{ display: "block" }}>
            <span style={subLabelStyle}>{c.currentLabel}</span>
            <input
              id="change-email-current"
              ref={currentRef}
              type="email"
              value={currentInput}
              autoComplete="email"
              disabled={saving}
              placeholder={c.currentPlaceholder}
              aria-invalid={!!errors.current}
              aria-describedby={
                errors.current ? "change-email-current-error" : undefined
              }
              onChange={(e) => {
                setCurrentInput(e.target.value);
                if (errors.current)
                  setErrors((prev) => ({ ...prev, current: undefined }));
              }}
              style={
                errors.current
                  ? { ...inputStyle, border: "1px solid var(--s-error-600)" }
                  : inputStyle
              }
            />
            {errors.current && (
              <div
                id="change-email-current-error"
                role="alert"
                style={errorStyle}
              >
                {errors.current}
              </div>
            )}
          </label>
          <label htmlFor="change-email-next" style={{ display: "block" }}>
            <span style={subLabelStyle}>{c.newLabel}</span>
            <input
              id="change-email-next"
              ref={nextRef}
              type="email"
              value={newInput}
              autoComplete="email"
              disabled={saving}
              placeholder={c.newPlaceholder}
              aria-invalid={!!errors.next}
              aria-describedby={
                errors.next ? "change-email-next-error" : undefined
              }
              onChange={(e) => {
                setNewInput(e.target.value);
                if (errors.next)
                  setErrors((prev) => ({ ...prev, next: undefined }));
              }}
              style={
                errors.next
                  ? { ...inputStyle, border: "1px solid var(--s-error-600)" }
                  : inputStyle
              }
            />
            {errors.next && (
              <div id="change-email-next-error" role="alert" style={errorStyle}>
                {errors.next}
              </div>
            )}
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              kind="primary"
              size="md"
              type="submit"
              disabled={saving || !currentInput.trim() || !newInput.trim()}
            >
              {saving ? <Spinner size={16} color="#fff" /> : c.submit}
            </Button>
            <Button
              kind="secondary"
              size="md"
              type="button"
              disabled={saving}
              onClick={close}
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
  // Account deletion is irreversible, so it gets the same synchronous lock as
  // register-form.tsx's submitLockRef: `deleting` state disables the confirm
  // button only after a re-render, and a fast double Enter/click on the modal
  // can still fire deleteAccount() twice before that render happens.
  const submitLockRef = useRef(false);

  const doDelete = async () => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setDeleting(true);
    try {
      await deleteAccount();
      toast(t.toasts.accountDeleted, "check");
      await onDeleted();
      // Stay locked: onDeleted() navigates away (logout + redirect home), so
      // there is no further state in this component worth unlocking for.
    } catch {
      submitLockRef.current = false;
      setDeleting(false);
      setConfirming(false);
      toast(t.toasts.genericError, "trash", undefined, "error");
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
  onEmailChanged,
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
  onEmailChanged: (email: string) => void;
  onDeleted: () => Promise<void>;
}) {
  const [pwOpen, setPwOpen] = useState(false);
  // Verification state lives on the session user (GET /me), not on the profile
  // payload — the profile endpoint doesn't carry it.
  const { user } = useAuth();
  if (id === "personal") {
    if (!profile) {
      return (
        <Card>
          <SectionError message={t.sectionError} />
        </Card>
      );
    }
    const dobValue = profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : "";
    const authErrors = dictionaries[locale].auth.errors;
    return (
      <div>
        <EditableRow
          id="acct-firstName"
          label={t.fields.firstName}
          value={profile.firstName ?? ""}
          emptyLabel={t.fields.phoneEmpty}
          saving={savingField === "firstName"}
          buttons={t.buttons}
          onSave={(v) => saveField("firstName", v)}
          sanitize={sanitizeName}
          validate={(raw) => {
            const v = raw.trim();
            if (!v) return authErrors.firstNameRequired;
            if (v.length < NAME_MIN_LENGTH) return authErrors.nameTooShort;
            if (v.length > NAME_MAX_LENGTH) return authErrors.nameTooLong;
            return undefined;
          }}
        />
        <EditableRow
          id="acct-lastName"
          label={t.fields.lastName}
          value={profile.lastName ?? ""}
          emptyLabel={t.fields.phoneEmpty}
          saving={savingField === "lastName"}
          buttons={t.buttons}
          onSave={(v) => saveField("lastName", v)}
          sanitize={sanitizeName}
          validate={(raw) => {
            const v = raw.trim();
            if (!v) return authErrors.lastNameRequired;
            if (v.length < NAME_MIN_LENGTH) return authErrors.nameTooShort;
            if (v.length > NAME_MAX_LENGTH) return authErrors.nameTooLong;
            return undefined;
          }}
        />
        <EditableRow
          id="acct-phone"
          label={t.fields.phone}
          value={profile.phone ?? ""}
          type="tel"
          emptyLabel={t.fields.phoneEmpty}
          saving={savingField === "phone"}
          buttons={t.buttons}
          // Phone is optional — an empty value clears it, so only a non-empty,
          // ill-formed one is an error. Sent normalized (no spaces/dashes),
          // matching what the backend's PHONE_REGEX accepts.
          onSave={(v) => saveField("phone", normalizePhone(v))}
          validate={(raw) => {
            const v = raw.trim();
            return v && !isValidPhone(v) ? authErrors.phoneInvalid : undefined;
          }}
        />
        <EditableRow
          id="acct-dob"
          label={t.fields.dateOfBirth}
          value={dobValue}
          type="date"
          locale={locale}
          emptyLabel={t.fields.phoneEmpty}
          saving={savingField === "dateOfBirth"}
          buttons={t.buttons}
          onSave={(v) => saveField("dateOfBirth", v)}
        />
        <ChangeEmailRow
          t={t}
          authErrors={authErrors}
          sharedErrors={dictionaries[locale].errors}
          currentEmail={profile.email}
          emailVerified={user?.emailVerified}
          resendCopy={dictionaries[locale].auth.resendVerification}
          onChanged={onEmailChanged}
        />
        <AddressRow
          fields={t.fields}
          errors={t.errors}
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
              <PasswordForm
                t={t}
                sharedErrors={dictionaries[locale].errors}
                onDone={() => setPwOpen(false)}
              />
            </div>
          )}
        </Card>
      </div>

      <div>
        <SectionLabel>{t.sections.security}</SectionLabel>
        <Card>
          <div style={{ padding: "2px 18px" }}>
            <GoogleConnectionRow t={t} authErrors={authErrors} locale={locale} last />
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
        toast(t.toasts.genericError, "pencil", undefined, "error");
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
        toast(t.toasts.genericError, "pencil", undefined, "error");
      } finally {
        setSavingField(null);
      }
    },
    [profile, t, toast],
  );

  // The change-email request returns only the new address, so reconcile it into
  // the locally-held profile rather than re-fetching. AuthProvider already
  // mirrors it into `user` (header/avatar), so no refreshUser() is needed.
  const handleEmailChanged = useCallback((email: string) => {
    setProfile((prev) => (prev ? { ...prev, email } : prev));
  }, []);

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
        toast(t.toasts.genericError, "pencil", undefined, "error");
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
                onEmailChanged={handleEmailChanged}
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
            onEmailChanged={handleEmailChanged}
            onDeleted={goHome}
          />
        </div>
      </div>
    </div>
  );
}
