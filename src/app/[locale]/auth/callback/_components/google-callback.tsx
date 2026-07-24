"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
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
  defaultPostAuthTarget,
  safeRedirectTarget,
} from "@/lib/auth/redirects";
import { useAuth } from "@/lib/auth/useAuth";
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
  | { kind: "working" }
  | { kind: "error"; message: string; backHref: string; backLabel: string }
  | { kind: "googleLink"; context: GoogleLinkContext; redirect: string | null }
  | {
      kind: "confirmAccess";
      context: ConfirmAccessContext;
      redirect: string | null;
    }
  | { kind: "enableAccess"; details: AccountLinkNeededDetails };

/**
 * Handles the return leg of the Google OAuth redirect flow. Reads ?code= and
 * ?state=, validates them against the sessionStorage context stashed by the
 * button, then:
 *
 * - intent login/register → POST /google/web (exchange + session). The 409
 *   collisions render the same panels the tabbed page uses: verify-then-link
 *   (CUSTOMER without linked Google) and enable-access (business account
 *   without the CUSTOMER role).
 * - intent link → waits for the session to rehydrate (the redirect wiped
 *   in-memory tokens), then POST /link/google/web and returns to /account.
 *
 * A stale reload of this URL (context already consumed, or single-use code
 * already spent) shows the "invalid" screen with a way back — never a dead
 * end. User cancellation on Google's screen returns silently to the origin
 * page.
 *
 * The redirect URI registered with Google is locale-less, so this page always
 * mounts under the DEFAULT locale — the flow's real locale rides in the
 * stored context and is adopted once it's consumed. Every outgoing redirect
 * and message must derive from the context locale, or a Romanian user comes
 * back from Google to an English page.
 */
export function GoogleCallback({ locale }: { locale: Locale }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, googleSignIn, linkGoogle } = useAuth();

  const [view, setView] = useState<View>({ kind: "working" });
  // Prop locale is only the fallback (no/invalid context); the effect below
  // swaps in the locale the flow actually started from.
  const [effectiveLocale, setEffectiveLocale] = useState<Locale>(locale);

  const dict = dictionaries[effectiveLocale].auth;
  const t = dict.googleCallback;

  // consumeGoogleOAuthContext is destructive (removes the stored context), so
  // it must run exactly once; refs carry its result to the link-intent effect
  // below, which re-fires on auth status changes.
  const startedRef = useRef(false);
  const linkStartedRef = useRef(false);
  const contextRef = useRef<GoogleOAuthContext | null>(null);
  const codeRef = useRef<string | null>(null);

  const authHref = localeHref(effectiveLocale, "auth");

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error");
    const context = consumeGoogleOAuthContext(state);
    contextRef.current = context;
    codeRef.current = code;

    if (!context) {
      // Synchronous setState is intentional: we are reading a client-only
      // value (sessionStorage) on first mount and reflecting it into state —
      // same pattern as AuthProvider's cookie hint; no derivable SSR value.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView({
        kind: "error",
        message: t.invalid,
        backHref: authHref,
        backLabel: t.backToSignIn,
      });
      return;
    }

    // Adopt the locale the flow started from (see component doc). The
    // navigations below must use it directly — this render's hrefs were
    // built from the stale default locale.
    setEffectiveLocale(context.locale);
    const loc = context.locale;
    const locDict = dictionaries[loc].auth;
    const locT = locDict.googleCallback;
    const locAuthHref = localeHref(loc, "auth");
    const locAccountHref = localeHref(loc, "account");

    if (oauthError || !code) {
      // Cancelled on Google's screen (error=access_denied) or no code came
      // back — return silently to where the flow started.
      router.replace(
        context.intent === "link"
          ? locAccountHref
          : `${locAuthHref}?mode=${context.intent}`,
      );
      return;
    }

    // Linking waits for session rehydration — handled by the effect below.
    if (context.intent === "link") return;

    const intent = context.intent;
    void (async () => {
      try {
        await googleSignIn(code, intent);
        router.replace(
          safeRedirectTarget(context.redirect, loc, defaultPostAuthTarget(loc)),
        );
      } catch (e) {
        // Branch 1: business account without CUSTOMER role. Two variants:
        // Google identity already linked to it (ownership proven — one-click
        // confirm) vs not (emailed link + password confirmation).
        const accountLink = getAccountLinkNeededDetails(e);
        if (accountLink) {
          if (
            accountLink.suggestedNext === "confirm_enable_marketplace" &&
            accountLink.txId
          ) {
            setView({
              kind: "confirmAccess",
              context: {
                txId: accountLink.txId,
                email: accountLink.email,
                firstName: accountLink.firstName,
              },
              redirect: context.redirect,
            });
            return;
          }
          setView({ kind: "enableAccess", details: accountLink });
          return;
        }
        // Branch 2: CUSTOMER without linked Google — verify-then-link. The
        // web endpoint returns the email in the 409 details.
        const unlinked = getGoogleUnlinkedDetails(e);
        if (unlinked) {
          setView({
            kind: "googleLink",
            context: { txId: unlinked.txId, email: unlinked.email ?? "" },
            redirect: context.redirect,
          });
          return;
        }
        setView({
          kind: "error",
          message: authErrorMessage(e, locDict.errors),
          backHref: locAuthHref,
          backLabel: locT.backToSignIn,
        });
      }
    })();
  }, [searchParams, router, googleSignIn, t, authHref]);

  // intent === "link": the account page started this flow while signed in, but
  // the full-page redirect dropped the in-memory access token. AuthProvider
  // rehydrates on mount (refresh cookie), so wait for a definitive status.
  useEffect(() => {
    const context = contextRef.current;
    const code = codeRef.current;
    if (!context || context.intent !== "link" || !code) return;

    // Same locale adoption as above — this effect can fire before the
    // effectiveLocale state update has re-derived the rendered hrefs.
    const loc = context.locale;
    const locDict = dictionaries[loc].auth;
    const locT = locDict.googleCallback;
    const locAuthHref = localeHref(loc, "auth");
    const locAccountHref = localeHref(loc, "account");

    if (status === "unauthenticated") {
      // Session gone — sign in first, then reconnect from the account page.
      router.replace(
        `${locAuthHref}?redirect=${encodeURIComponent(locAccountHref)}`,
      );
      return;
    }
    if (status !== "authenticated" || linkStartedRef.current) return;
    linkStartedRef.current = true;

    void (async () => {
      try {
        await linkGoogle(code);
        router.replace(locAccountHref);
      } catch (e) {
        setView({
          kind: "error",
          message: authErrorMessage(e, locDict.errors),
          backHref: locAccountHref,
          backLabel: locT.backToAccount,
        });
      }
    })();
  }, [status, router, linkGoogle]);

  return (
    <main
      className="flex flex-col items-center justify-center px-4 py-10"
      style={{ minHeight: "calc(100svh - var(--nav-h))" }}
    >
      <div className="w-full max-w-sm md:max-w-[62.5rem]">
        <AuthCard
          mode="login"
          title={dict.loginHeading}
          subtitle={dict.loginSubtitle}
          loginHref={`${authHref}?mode=login`}
          registerHref={`${authHref}?mode=register`}
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
                {view.message}
              </p>
              <Link
                href={view.backHref}
                className="mt-6 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {view.backLabel}
              </Link>
            </div>
          )}

          {view.kind === "googleLink" && (
            <GoogleLinkPanel
              locale={effectiveLocale}
              context={view.context}
              redirect={view.redirect}
              onCancel={() => router.replace(authHref)}
            />
          )}

          {view.kind === "confirmAccess" && (
            <ConfirmAccessPanel
              locale={effectiveLocale}
              context={view.context}
              redirect={view.redirect}
              onCancel={() => router.replace(authHref)}
            />
          )}

          {view.kind === "enableAccess" && (
            <EnableAccessPanel
              locale={effectiveLocale}
              details={view.details}
              onCancel={() => router.replace(authHref)}
            />
          )}
        </AuthCard>
      </div>
    </main>
  );
}
