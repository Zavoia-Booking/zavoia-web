"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { authErrorMessage } from "@/lib/api/auth-error-messages";
import {
  getAccountLinkNeededDetails,
  getGoogleUnlinkedDetails,
} from "@/lib/api/customer-auth";
import { decodeJwt } from "@/lib/auth/jwt";
import {
  defaultPostAuthTarget,
  safeRedirectTarget,
} from "@/lib/auth/redirects";
import { useAuth } from "@/lib/auth/useAuth";
import type { AccountLinkNeededDetails } from "@/lib/auth/types";
import { GOOGLE_CLIENT_ID } from "@/lib/env";
import { EnableAccessPanel } from "./enable-access-panel";
import {
  GoogleLinkPanel,
  type GoogleLinkContext,
} from "./google-link-panel";
import { GoogleSignInButton } from "./google-signin-button";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

type Mode = "login" | "register";

function tabHref(locale: Locale, mode: Mode, redirect: string | null): string {
  const params = new URLSearchParams();
  params.set("mode", mode);
  if (redirect) params.set("redirect", redirect);
  return `${localeHref(locale, "auth")}?${params.toString()}`;
}

export function AuthTabs({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale].auth;
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const mode: Mode = searchParams.get("mode") === "register" ? "register" : "login";

  const { googleSignIn } = useAuth();

  const [linkDetails, setLinkDetails] =
    useState<AccountLinkNeededDetails | null>(null);
  const [googleLink, setGoogleLink] = useState<GoogleLinkContext | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);

  async function handleGoogleCredential(idToken: string) {
    setGoogleError(null);
    try {
      await googleSignIn(idToken, mode);
      // 200 — session established. Redirect like the email/password forms.
      const target = safeRedirectTarget(
        redirect,
        locale,
        defaultPostAuthTarget(locale),
      );
      router.replace(target);
    } catch (e) {
      // Branch 1: business account without CUSTOMER role — reuse Slice 2 panel.
      const accountLink = getAccountLinkNeededDetails(e);
      if (accountLink) {
        setLinkDetails(accountLink);
        return;
      }
      // Branch 2: CUSTOMER without linked Google — verify-then-link panel. The
      // backend does not return the email, so decode it from the ID token.
      const unlinked = getGoogleUnlinkedDetails(e);
      if (unlinked) {
        const claims = decodeJwt<{ email?: string }>(idToken);
        setGoogleLink({
          txId: unlinked.txId,
          email: typeof claims?.email === "string" ? claims.email : "",
        });
        return;
      }
      // Anything else (verification failure, network, etc.).
      setGoogleError(authErrorMessage(e, dict.errors));
    }
  }

  // When the email already belongs to a business account, surface the
  // dedicated "enable marketplace access" panel instead of the tabbed forms.
  if (linkDetails) {
    return (
      <main className="mx-auto max-w-md px-6 py-16">
        <EnableAccessPanel
          locale={locale}
          details={linkDetails}
          onCancel={() => setLinkDetails(null)}
        />
      </main>
    );
  }

  // When the email belongs to a CUSTOMER without a linked Google account,
  // surface the verify-then-link panel.
  if (googleLink) {
    return (
      <main className="mx-auto max-w-md px-6 py-16">
        <GoogleLinkPanel
          locale={locale}
          context={googleLink}
          onCancel={() => setGoogleLink(null)}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div
        role="tablist"
        aria-label={dict.pageTitle}
        className="mb-8 grid grid-cols-2 rounded-md border border-zinc-200 p-1"
      >
        <Link
          role="tab"
          aria-selected={mode === "login"}
          href={tabHref(locale, "login", redirect)}
          replace
          scroll={false}
          className={`rounded-sm px-3 py-2 text-center text-sm font-medium transition ${
            mode === "login"
              ? "bg-zinc-900 text-white"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          {dict.tabLogin}
        </Link>
        <Link
          role="tab"
          aria-selected={mode === "register"}
          href={tabHref(locale, "register", redirect)}
          replace
          scroll={false}
          className={`rounded-sm px-3 py-2 text-center text-sm font-medium transition ${
            mode === "register"
              ? "bg-zinc-900 text-white"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          {dict.tabRegister}
        </Link>
      </div>

      {mode === "login" ? (
        <LoginForm locale={locale} onAccountLinkNeeded={setLinkDetails} />
      ) : (
        <RegisterForm locale={locale} onAccountLinkNeeded={setLinkDetails} />
      )}

      {GOOGLE_CLIENT_ID && (
        <div className="mt-8">
          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              {dict.googleDivider}
            </span>
            <span className="h-px flex-1 bg-zinc-200" />
          </div>

          <div className="mt-6">
            <GoogleSignInButton
              locale={locale}
              text={mode === "register" ? "signup_with" : "continue_with"}
              onCredential={handleGoogleCredential}
            />
          </div>

          {googleError && (
            <p
              role="alert"
              className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {googleError}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
