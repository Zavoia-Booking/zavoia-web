"use client";

import type { Locale } from "@/i18n/locales";
import { AppleLinkPanel } from "./apple-link-panel";
import { AppleNamePanel } from "./apple-name-panel";
import type { AppleOutcome } from "./apple-outcome";
import { ConfirmAccessPanel } from "./confirm-access-panel";
import { EnableAccessPanel } from "./enable-access-panel";

/**
 * The panel for one Sign in with Apple step (the Apple twin of the Google
 * callback's panels). Hosted inside an AuthCard by /auth and by
 * /auth/verify-account-link; each panel redirects once the session exists.
 */
export function ApplePanel({
  locale,
  outcome,
  flowKey,
  redirect,
  onOutcome,
  onCancel,
}: {
  locale: Locale;
  outcome: AppleOutcome;
  /** Identity of this Apple flow; keeps a sent email across locale changes. */
  flowKey: string;
  /** Post-auth target; each panel validates it again before navigating. */
  redirect?: string | null;
  onOutcome: (outcome: AppleOutcome) => void;
  onCancel: () => void;
}) {
  switch (outcome.kind) {
    case "profile":
      return (
        <AppleNamePanel
          key={outcome.details.txId}
          locale={locale}
          details={outcome.details}
          redirect={redirect}
          onOutcome={onOutcome}
          onCancel={onCancel}
        />
      );
    case "link":
      return (
        <AppleLinkPanel
          key={outcome.details.txId}
          locale={locale}
          details={outcome.details}
          redirect={redirect}
          onOutcome={onOutcome}
          onCancel={onCancel}
        />
      );
    case "confirmAccess":
      return (
        <ConfirmAccessPanel
          key={outcome.context.txId}
          locale={locale}
          context={outcome.context}
          redirect={redirect}
          provider="apple"
          onCancel={onCancel}
        />
      );
    case "enableAccess":
      return (
        <EnableAccessPanel
          locale={locale}
          details={outcome.details}
          flowKey={flowKey}
          onCancel={onCancel}
        />
      );
  }
}
