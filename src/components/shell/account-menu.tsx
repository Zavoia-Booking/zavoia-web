"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { LayoutTemplate, Newspaper, type LucideIcon } from "lucide-react";
import { useLocaleAlternates } from "@/i18n/locale-navigation";
import { authEntryHref } from "@/lib/auth/redirects";
import { Avatar, Button, Icon, InlineError, Skeleton, Spinner, type IconName, useToast } from "@/components/ui";
import { useAuth } from "@/lib/auth/useAuth";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import type { Locale } from "@/i18n/locales";
import { Popover } from "./popover";

// Port of ZwAccountMenu (docs/web-account.jsx). Real user from useAuth; all
// links use next/link + localeHref and close the menu on click. Log out calls
// useAuth().logout() then shows a toast.

type Props = {
  locale: Locale;
  onClose: () => void;
};

const rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  background: "transparent",
  border: 0,
  cursor: "pointer",
  padding: "10px 18px",
  fontSize: 14,
  fontWeight: 500,
  letterSpacing: "-0.01em",
  textAlign: "left" as const,
  textDecoration: "none",
};

// The identity block at the top of the menu is itself a link: to the profile
// when signed in, to the auth screen when not.
const identityStyle = {
  display: "flex",
  alignItems: "center",
  gap: 13,
  padding: "16px 18px 14px",
  textDecoration: "none",
};

function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

const getHash = () => window.location.hash;
const getServerHash = () => "";

function MenuIcon({ icon, color }: { icon: IconName | LucideIcon; color: string }) {
  if (typeof icon === "string") return <Icon name={icon} size={16} color={color} />;
  const Glyph = icon;
  return (
    <Glyph
      size={16}
      strokeWidth={1.7}
      color={color}
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    />
  );
}

export function AccountMenu({ locale, onClose }: Props) {
  const { status, user, logout, initializing, optimisticUser, refresh } = useAuth();
  const [retryingSession, setRetryingSession] = useState(false);
  const { dict } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hash = useSyncExternalStore(subscribeHash, getHash, getServerHash);
  const alternates = useLocaleAlternates(pathname);
  const toast = useToast();
  const t = dict.accountMenu;

  const isAuthed = status === "authenticated" && !!user;
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "";
  const pendingSession = initializing && !isAuthed;
  const cachedName = optimisticUser ? `${optimisticUser.firstName} ${optimisticUser.lastName}`.trim() : "";

  // Signed-out "Sign in" → the dedicated /auth route (login tab), returning to
  // the current page afterwards via ?redirect=.
  const query = searchParams.toString();
  const current = `${pathname}${query ? `?${query}` : ""}${hash}`;
  const loginHref = authEntryHref(locale, "login", current, alternates);

  const linkRow = (
    icon: IconName | LucideIcon,
    label: string,
    ...segments: string[]
  ) => (
    <Link
      href={localeHref(locale, ...segments)}
      title={label}
      className="tap zw-hover-row"
      onClick={onClose}
      style={{ ...rowStyle, color: "var(--c-800)" }}
    >
      <MenuIcon icon={icon} color="var(--c-600)" />
      {label}
    </Link>
  );

  // Web Studio is the one promoted row in the menu: it carries the brand accent
  // (icon --p-600, label --p-700 per the terracotta-as-text rule) so it reads as
  // an offer rather than another destination.
  const accentRow = (
    icon: IconName | LucideIcon,
    label: string,
    ...segments: string[]
  ) => (
    <Link
      href={localeHref(locale, ...segments)}
      title={label}
      className="tap zw-hover-row"
      onClick={onClose}
      style={{ ...rowStyle, color: "var(--p-700)", fontWeight: 600 }}
    >
      <MenuIcon icon={icon} color="var(--p-600)" />
      {label}
    </Link>
  );

  const onLogout = async () => {
    onClose();
    try {
      await logout();
    } finally {
      toast(t.loggedOut, "check");
    }
  };

  const retrySession = async () => {
    if (retryingSession) return;
    setRetryingSession(true);
    try { await refresh(); }
    finally { setRetryingSession(false); }
  };

  return (
    <Popover onClose={onClose} label={dict.nav.account} width={300}>
      <span role="status" className="sr-only">
        {pendingSession || retryingSession ? dict.account.loading : ""}
      </span>
      {status === "error" ? (
        <div style={{ display: "grid", gap: 12, padding: "16px 18px" }}>
          <InlineError>{t.sessionError}</InlineError>
          <Button kind="secondary" size="sm" onClick={retrySession} disabled={retryingSession} aria-busy={retryingSession} aria-label={dict.errors.retry} style={{ justifySelf: "start", position: "relative" }}>
            <span aria-hidden={retryingSession || undefined} style={{ visibility: retryingSession ? "hidden" : "visible" }}>{dict.errors.retry}</span>
            {retryingSession && <span aria-hidden="true" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><Spinner size={14} /></span>}
          </Button>
        </div>
      ) : pendingSession ? (
        <div style={identityStyle} aria-busy="true">
          {cachedName || optimisticUser?.profileImage ? (
            <Avatar name={cachedName} src={optimisticUser?.profileImage ?? undefined} size={44} />
          ) : (
            <span aria-hidden="true" style={{ flexShrink: 0 }}><Skeleton w={44} h={44} r="50%" /></span>
          )}
          <div style={{ display: "grid", gap: 7, minWidth: 0 }}>
            {cachedName ? <span style={{ fontSize: 15, fontWeight: 600 }}>{cachedName}</span> : <span aria-hidden="true"><Skeleton w={120} h={17} /></span>}
            <span aria-hidden="true"><Skeleton w={160} h={13} /></span>
          </div>
        </div>
      ) : isAuthed ? (
        <Link
          href={localeHref(locale, "account")}
          title={dict.nav.account}
          className="tap zw-hover-row"
          onClick={onClose}
          style={{ ...identityStyle, color: "inherit" }}
        >
          <Avatar
            name={fullName}
            src={user?.profileImage ?? undefined}
            size={44}
          />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "-0.015em",
                color: "var(--c-900)",
              }}
            >
              {fullName}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--c-600)",
                marginTop: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.email}
            </div>
          </div>
        </Link>
      ) : (
        <Link
          href={loginHref}
          title={t.login}
          className="tap zw-hover-row"
          onClick={onClose}
          style={{ ...identityStyle, color: "inherit" }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--c-200)",
            }}
          >
            <Icon name="user" size={20} color="var(--c-600)" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "-0.015em",
                color: "var(--c-900)",
              }}
            >
              {t.welcome}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--c-600)",
                marginTop: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {t.loginOrSignUp}
            </div>
          </div>
        </Link>
      )}

      {(isAuthed || pendingSession) && (
        <>
          <div className="zv-hair" style={{ height: 1 }} />
          <div style={{ padding: "8px 0" }}>
            {pendingSession ? (
              ([ ["cal", t.appointments], ["heartO", t.saved], ["user", t.profileSettings] ] as const).map(([icon, label]) => (
                <span key={icon} role="link" aria-disabled="true" style={{ ...rowStyle, cursor: "default", opacity: 0.5 }}>
                  <Icon name={icon} size={16} color="var(--c-600)" />{label}
                </span>
              ))
            ) : (
              <>
                {linkRow("cal", t.appointments, "appointments")}
                {linkRow("heartO", t.saved, "saved")}
                {linkRow("user", t.profileSettings, "account")}
              </>
            )}
          </div>
        </>
      )}

      <div className="zv-hair" style={{ height: 1 }} />
      <div style={{ padding: "8px 0" }}>
        {linkRow(Newspaper, t.journal, "blog")}
        {linkRow("info", t.helpSupport, "help")}
      </div>

      <div className="zv-hair" style={{ height: 1 }} />
      <div style={{ padding: "8px 0" }}>
        {linkRow("building", t.forBusiness, "for-business")}
        {accentRow(LayoutTemplate, t.webStudio, "web-studio")}
        {linkRow("wallet", t.pricing, "pricing")}
      </div>

      {status !== "error" && <>
      <div className="zv-hair" style={{ height: 1 }} />
      <div style={{ padding: "8px 0" }}>
        {pendingSession ? (
          <span style={{ ...rowStyle, cursor: "default", opacity: 0.5 }} aria-disabled="true" role="button">
            <Icon name="logout" size={16} color="var(--c-600)" />{t.logout}
          </span>
        ) : isAuthed ? (
          <button
            type="button"
            className="tap zw-hover-row"
            onClick={onLogout}
            style={{ ...rowStyle, color: "var(--c-800)" }}
          >
            <Icon name="logout" size={16} color="var(--c-600)" />
            {t.logout}
          </button>
        ) : (
          <Link
            href={loginHref}
            title={t.login}
            className="tap zw-hover-row"
            onClick={onClose}
            style={{ ...rowStyle, color: "var(--p-600)" }}
          >
            <Icon name="user" size={16} color="var(--p-600)" />
            {t.login}
          </Link>
        )}
      </div>
      </>}
    </Popover>
  );
}
