"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import type { Locale } from "@/i18n/locales";
import {
  AuthMessagesProvider,
  type AuthMessages,
} from "../../_components/auth-messages";
import { localeHref } from "@/i18n/routes";
import { authErrorMessage } from "@/lib/api/auth-error-messages";
import {
  getAccountLinkNeededDetails,
  getGoogleUnlinkedDetails,
} from "@/lib/api/customer-auth";
import {
  consumeGoogleOAuthContext,
  type GoogleOAuthContext,
} from "@/lib/auth/google-oauth";
import {
  authEntryHref,
  defaultPostAuthTarget,
  safeRedirectTarget,
} from "@/lib/auth/redirects";
import { useAuth } from "@/lib/auth/useAuth";
import { retainedAuthFlow, subscribeAuthFlow } from "@/lib/auth/retained-flow";
import type { AccountLinkNeededDetails } from "@/lib/auth/types";
import { AuthCard } from "../../_components/auth-card";
import {
  ConfirmAccessPanel,
  type ConfirmAccessContext,
} from "../../_components/confirm-access-panel";
import { EnableAccessPanel } from "../../_components/enable-access-panel";
import {
  GoogleLinkPanel,
  type GoogleLinkContext,
} from "../../_components/google-link-panel";

type View =
  | { kind: "working" | "done" }
  | { kind: "error"; error?: unknown; invalid?: boolean; back: "auth" | "account" }
  | { kind: "googleLink"; context: GoogleLinkContext }
  | { kind: "confirmAccess"; context: ConfirmAccessContext }
  | { kind: "enableAccess"; details: AccountLinkNeededDetails };

type CallbackFlow = {
  context: GoogleOAuthContext | null;
  canonicalLocale: Locale | null;
  exchange?: Promise<View>;
};

/** A code/state pair is one transaction, independent of the UI language.
 * Validation still consumes sessionStorage exactly once. Only its pending
 * exchange and outcome survive a client locale remount, in bounded tab memory;
 * a document reload must validate fresh OAuth state as before.
 */
export function GoogleCallback({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Record<Locale, AuthMessages>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, googleSignIn, linkGoogle } = useAuth();
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  const query = searchParams.toString();
  const flowKey = JSON.stringify(["google-callback", state, code, oauthError]);
  const [result, setResult] = useState<{
    key: string;
    view: View;
    context: GoogleOAuthContext | null;
  } | null>(null);
  const current = result?.key === flowKey ? result : null;
  const view: View = current?.view ?? { kind: "working" };
  const context = current?.context;
  const dict = messages[locale].auth;
  const t = dict.googleCallback;
  const returnTo = context?.redirect ?? defaultPostAuthTarget(locale);
  const loginHref = authEntryHref(locale, "login", returnTo);
  const registerHref = authEntryHref(locale, "register", returnTo);
  const retryHref = context?.intent === "register" ? registerHref : loginHref;

  useEffect(() => {
    let mounted = true;
    const release = subscribeAuthFlow(flowKey, () => {});
    const flow = retainedAuthFlow<CallbackFlow>(flowKey, () => {
      const validated = consumeGoogleOAuthContext(state);
      return {
        context: validated,
        // Google's registered redirect has no locale. Canonicalize once to
        // the initiating language; later language changes follow the URL.
        canonicalLocale: validated?.locale ?? null,
      };
    });
    const cleanup = () => {
      mounted = false;
      release();
    };
    const saved = flow.context;
    const show = (next: View) => {
      if (mounted) setResult({ key: flowKey, view: next, context: saved });
    };

    if (!saved) {
      // Reflect validated client-only sessionStorage state after hydration.
      show({ kind: "error", invalid: true, back: "auth" });
      return cleanup;
    }
    if (flow.canonicalLocale && flow.canonicalLocale !== locale) {
      router.replace(
        `${localeHref(flow.canonicalLocale, "auth", "callback")}?${query}`,
      );
      return cleanup;
    }
    flow.canonicalLocale = null;
    show({ kind: "working" });
    const accountHref = localeHref(locale, "account");
    const backToAuth = authEntryHref(
      locale,
      saved.intent === "register" ? "register" : "login",
      saved.redirect ?? defaultPostAuthTarget(locale),
    );
    if (oauthError || !code) {
      router.replace(saved.intent === "link" ? accountHref : backToAuth);
      return cleanup;
    }

    if (saved.intent === "link" && !flow.exchange) {
      if (status === "unauthenticated") {
        router.replace(authEntryHref(locale, "login", accountHref));
        return cleanup;
      }
      if (status === "error") {
        show({ kind: "error", back: "account" });
        return cleanup;
      }
      if (status !== "authenticated") return cleanup;
    }

    if (!flow.exchange) {
      // Publish the shared promise before invoking an auth action. Strict Mode
      // and a second locale consumer must never exchange the same code twice.
      flow.exchange = Promise.resolve().then(async (): Promise<View> => {
        try {
          if (saved.intent === "link") await linkGoogle(code);
          else await googleSignIn(code, saved.intent, saved.locale);
          return { kind: "done" };
        } catch (error) {
          if (saved.intent === "link") {
            return { kind: "error", error, back: "account" };
          }
          const accountLink = getAccountLinkNeededDetails(error);
          if (accountLink) {
            if (
              accountLink.suggestedNext === "confirm_enable_marketplace" &&
              accountLink.txId
            ) {
              return {
                kind: "confirmAccess",
                context: {
                  txId: accountLink.txId,
                  email: accountLink.email,
                  firstName: accountLink.firstName,
                },
              };
            }
            return { kind: "enableAccess", details: accountLink };
          }
          const unlinked = getGoogleUnlinkedDetails(error);
          if (unlinked) {
            return {
              kind: "googleLink",
              context: { txId: unlinked.txId, email: unlinked.email ?? "" },
            };
          }
          return { kind: "error", error, back: "auth" };
        }
      });
    }
    void flow.exchange.then((next) => {
      if (!mounted) return;
      if (next.kind === "done") {
        router.replace(
          saved.intent === "link"
            ? accountHref
            : safeRedirectTarget(saved.redirect, locale, defaultPostAuthTarget(locale)),
        );
      } else show(next);
    });
    return cleanup;
  }, [flowKey, code, state, oauthError, query, locale, status, router, googleSignIn, linkGoogle]);

  return (
    <AuthMessagesProvider messages={messages[locale]}>
      <main
        className="flex flex-col items-center justify-center px-4 py-10"
        style={{ minHeight: "calc(100svh - var(--nav-h))" }}
      >
        <div className="w-full max-w-sm md:max-w-[62.5rem]">
          <AuthCard
            mode="login"
            title={dict.loginHeading}
            subtitle={dict.loginSubtitle}
            loginHref={loginHref}
            registerHref={registerHref}
            tabLoginLabel={dict.tabLogin}
            tabRegisterLabel={dict.tabRegister}
            tablistLabel={dict.pageTitle}
            hideHeader
          >
            {view.kind === "working" && (
              <div className="flex flex-col items-center gap-4 py-16">
                <Spinner size={28} />
                <p className="text-sm text-c-600">{t.completing}</p>
              </div>
            )}

            {view.kind === "error" && (
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {t.errorHeading}
                </h1>
                <p
                  role="alert"
                  className="mt-4 rounded-[10px] border border-[var(--s-error-300)] bg-[var(--s-error-100)] px-3 py-2 text-sm text-[var(--s-error-600)]"
                >
                  {view.invalid ? t.invalid : authErrorMessage(view.error, dict.errors, messages[locale].errors)}
                </p>
                <Link
                  href={view.back === "account" ? localeHref(locale, "account") : retryHref}
                  className="mt-6 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {view.back === "account" ? t.backToAccount : t.backToSignIn}
                </Link>
              </div>
            )}

            {view.kind === "googleLink" && (
              <GoogleLinkPanel
                locale={locale}
                context={view.context}
                redirect={context?.redirect}
                onCancel={() => router.replace(retryHref)}
              />
            )}

            {view.kind === "confirmAccess" && (
              <ConfirmAccessPanel
                locale={locale}
                context={view.context}
                redirect={context?.redirect}
                onCancel={() => router.replace(retryHref)}
              />
            )}

            {view.kind === "enableAccess" && (
              <EnableAccessPanel
                locale={locale}
                details={view.details}
                flowKey={flowKey}
                onCancel={() => router.replace(retryHref)}
              />
            )}
          </AuthCard>
        </div>
      </main>
    </AuthMessagesProvider>
  );
}
