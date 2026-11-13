"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { useRef, useState, type ReactNode } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { useTranslation } from "@/i18n/useTranslation";
import { AppleSignInButton } from "@/app/[locale]/auth/_components/apple-signin-button";
import { Button, InlineError, useToast } from "@/components/ui";
import { appleErrorMessage } from "@/lib/api/auth-error-messages";
import { backendCode } from "@/lib/api/error-messages";
import {
  isAppleSignInConfigured,
  type AppleWebCredential,
} from "@/lib/auth/apple-signin";
import { useAuth } from "@/lib/auth/useAuth";
import styles from "./account-content.module.css";
import disclosure from "@/components/ui/disclosure-motion.module.css";

type AcctDict = Dictionary["account"];

/** Same disclosure as account-content's FormReveal (kept local to this file). */
function Reveal({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <Collapsible.Root open={open} className={disclosure.root}>
      <Collapsible.Content className={styles.formReveal} inert={!open} aria-hidden={!open}>
        <div className={styles.formRevealBody}>{children}</div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

function AppleMark() {
  return (
    <svg width={20} height={20} viewBox="0 0 17 20" aria-hidden="true" fill="var(--c-900)">
      <path d="M14.09 10.64c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76-1.47.02-2.83.86-3.59 2.18-1.53 2.66-.39 6.59 1.1 8.75.73 1.05 1.6 2.24 2.73 2.2 1.1-.05 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.41 1.2-2.47-.03-.01-2.3-.88-2.32-3.5zM11.92 4.18c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.64-1.05 1.68-.92 2.67.97.08 1.96-.49 2.56-1.22z" />
    </svg>
  );
}

/**
 * Login & security → Apple. Driven by /me's `user.apple`. Connect opens the
 * Apple popup and posts it to /marketplace/auth/link/apple; Disconnect asks
 * for the password when the account has one (otherwise a plain confirmation)
 * and posts to /unlink/apple, which refuses to remove the last sign-in method.
 *
 * Rendered only when Apple is configured on this deploy, or already linked
 * (e.g. from the iOS app), so it can still be disconnected.
 */
export function AppleConnectionRow({ t, last }: { t: AcctDict; last?: boolean }) {
  const dictionary = useTranslation().dict;
  const authErrors = dictionary.auth.errors;
  const toast = useToast();
  const { user, linkApple, unlinkApple } = useAuth();
  const a = t.appleConnection;

  const apple = user?.apple;
  const isLinked = apple?.linked === true;
  // Same rule as the Google row: only an explicit `false` means no password.
  const hasPassword = user?.hasPassword !== false;
  const configured = isAppleSignInConfigured();

  const [promptOpen, setPromptOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  // Synchronous lock: `busy` disables controls only after a re-render.
  const lockRef = useRef(false);

  if (!configured && !isLinked) return null;

  async function connect(credential: AppleWebCredential) {
    if (lockRef.current) return;
    lockRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await linkApple(credential);
      toast(a.connectedToast, "check");
    } catch (err) {
      setError(appleErrorMessage(err, authErrors, dictionary.errors));
    } finally {
      lockRef.current = false;
      setBusy(false);
    }
  }

  async function submitDisconnect(event: React.FormEvent) {
    event.preventDefault();
    if (lockRef.current) return;
    setError(null);
    if (hasPassword && !password) {
      passwordRef.current?.focus();
      return;
    }
    lockRef.current = true;
    setBusy(true);
    try {
      await unlinkApple(hasPassword ? password : undefined);
      setPromptOpen(false);
      setPassword("");
      toast(a.disconnectedToast, "check");
    } catch (err) {
      setError(
        backendCode(err) === "APPLE_UNLINK_LAST_METHOD"
          ? a.lastMethod
          : appleErrorMessage(err, authErrors, dictionary.errors),
      );
      if (hasPassword) passwordRef.current?.focus();
    } finally {
      lockRef.current = false;
      setBusy(false);
    }
  }

  const errorNode = error ? (
    <InlineError id="apple-connection-error" style={{ marginTop: 4 }}>
      {error}
    </InlineError>
  ) : null;

  return (
    <div
      style={{
        padding: "16px 0",
        borderBottom: last ? 0 : "1px solid rgba(28,28,26,0.06)",
      }}
    >
      <div
        className={styles.connectionHead}
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--c-900)",
            }}
          >
            <AppleMark />
            {a.title}
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
              marginLeft: 34,
            }}
          >
            {isLinked ? a.connected : a.notConnected}
          </div>
          <div style={{ fontSize: 13.5, color: "var(--c-600)", marginTop: 8, marginLeft: 34 }}>
            {isLinked ? a.connectedCaption : a.connectCaption}
          </div>
          {isLinked && apple?.isPrivateEmail && apple.email && (
            <div
              className="txt-pretty"
              style={{ fontSize: 13.5, color: "var(--c-600)", marginTop: 6, marginLeft: 34, overflowWrap: "anywhere" }}
            >
              {format(a.relayNote, { email: apple.email })}
            </div>
          )}
        </div>

        <div style={{ flexShrink: 0 }}>
          {isLinked ? (
            <button
              type="button"
              className="tap"
              onClick={() => {
                setPromptOpen((open) => !open);
                setError(null);
              }}
              disabled={busy}
              aria-expanded={promptOpen}
              style={{
                background: "transparent",
                border: 0,
                cursor: busy ? "default" : "pointer",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--s-error-600)",
                textDecoration: "underline",
                padding: "10px 0",
                minHeight: 44,
                fontFamily: "inherit",
              }}
            >
              {a.disconnect}
            </button>
          ) : (
            <div style={{ minWidth: 220 }}>
              <AppleSignInButton
                label="continue"
                disabled={busy}
                onStart={() => setError(null)}
                onCredential={(credential) => void connect(credential)}
                onError={(err) =>
                  setError(appleErrorMessage(err, authErrors, dictionary.errors))
                }
              />
            </div>
          )}
        </div>
      </div>

      {!isLinked && errorNode && <div style={{ marginTop: 10 }}>{errorNode}</div>}

      <Reveal open={isLinked && promptOpen}>
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
          {hasPassword ? (
            <label htmlFor="apple-disconnect-password" style={{ display: "block" }}>
              <span
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--c-700)",
                  marginBottom: 6,
                }}
              >
                {a.passwordLabel}
              </span>
              <input
                id="apple-disconnect-password"
                ref={passwordRef}
                type="password"
                value={password}
                autoComplete="current-password"
                disabled={busy}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={a.passwordPrompt}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "apple-connection-error" : undefined}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--account-field-border, rgba(28,28,26,0.18))",
                  fontSize: 16,
                  color: "var(--c-900)",
                  background: "#fff",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </label>
          ) : (
            <p className="txt-pretty" style={{ margin: 0, fontSize: 14, color: "var(--c-700)" }}>
              {a.confirmPrompt}
            </p>
          )}
          {isLinked && errorNode}
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              loading={busy}
              kind="primary"
              size="md"
              type="submit"
              disabled={busy || (hasPassword && !password)}
            >
              {a.confirmDisconnect}
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
              {a.cancel}
            </Button>
          </div>
        </form>
      </Reveal>
    </div>
  );
}
