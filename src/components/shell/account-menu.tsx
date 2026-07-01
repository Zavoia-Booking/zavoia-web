"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Icon, type IconName, useToast } from "@/components/ui";
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

export function AccountMenu({ locale, onClose }: Props) {
  const { status, user, logout } = useAuth();
  const { dict } = useTranslation();
  const pathname = usePathname();
  const toast = useToast();
  const t = dict.accountMenu;

  const isAuthed = status === "authenticated" && !!user;
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "";

  // Signed-out "Sign in" → the dedicated /auth route (login tab), returning to
  // the current page afterwards via ?redirect=.
  const loginHref = `${localeHref(locale, "auth")}?mode=login${
    pathname && pathname !== "/"
      ? `&redirect=${encodeURIComponent(pathname)}`
      : ""
  }`;

  const linkRow = (
    icon: IconName,
    label: string,
    ...segments: string[]
  ) => (
    <Link
      href={localeHref(locale, ...segments)}
      className="tap zw-hover-row"
      onClick={onClose}
      style={{ ...rowStyle, color: "var(--c-800)" }}
    >
      <Icon name={icon} size={16} color="var(--c-600)" />
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

  return (
    <Popover onClose={onClose} label={dict.nav.account} width={300}>
      {isAuthed ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 13,
            padding: "16px 18px 14px",
          }}
        >
          <Avatar name={fullName} size={44} />
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
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 13,
            padding: "16px 18px 14px",
          }}
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
        </div>
      )}

      {isAuthed && (
        <>
          <div className="zv-hair" style={{ height: 1 }} />
          <div style={{ padding: "8px 0" }}>
            {linkRow("cal", t.appointments, "appointments")}
            {linkRow("heartO", t.saved, "saved")}
            {linkRow("user", t.profileSettings, "account")}
          </div>
        </>
      )}

      <div className="zv-hair" style={{ height: 1 }} />
      <div style={{ padding: "8px 0" }}>
        {linkRow("sparkle", t.journal, "blog")}
        {linkRow("info", t.helpSupport, "help")}
      </div>

      <div className="zv-hair" style={{ height: 1 }} />
      <div style={{ padding: "8px 0" }}>
        {linkRow("globe", t.forBusiness, "for-business")}
        {linkRow("wallet", t.pricing, "pricing")}
      </div>

      <div className="zv-hair" style={{ height: 1 }} />
      <div style={{ padding: "8px 0" }}>
        {isAuthed ? (
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
            className="tap zw-hover-row"
            onClick={onClose}
            style={{ ...rowStyle, color: "var(--p-600)" }}
          >
            <Icon name="user" size={16} color="var(--p-600)" />
            {t.login}
          </Link>
        )}
      </div>
    </Popover>
  );
}
