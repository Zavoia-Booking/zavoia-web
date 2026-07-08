"use client";

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
import { BUSINESS_APP_URL, GOOGLE_CLIENT_ID } from "@/lib/env";
import { AuthCard } from "./auth-card";
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

  // Sub-flows (business-account link, Google verify-then-link) replace the
  // tabbed forms inside the same card shell, with the toggle + heading
  // suppressed — they own their headings.
  const panel = linkDetails ? (
    <EnableAccessPanel
      locale={locale}
      details={linkDetails}
      onCancel={() => setLinkDetails(null)}
    />
  ) : googleLink ? (
    <GoogleLinkPanel
      locale={locale}
      context={googleLink}
      onCancel={() => setGoogleLink(null)}
    />
  ) : null;

  return (
    <main
      className="flex flex-col items-center justify-center px-4 py-10"
      style={{ minHeight: "calc(100svh - var(--nav-h))" }}
    >
      <div className="w-full max-w-sm md:max-w-[62.5rem]">
        <AuthCard
          mode={mode}
          title={mode === "login" ? dict.loginHeading : dict.registerHeading}
          subtitle={mode === "login" ? dict.loginSubtitle : dict.registerSubtitle}
          loginHref={tabHref(locale, "login", redirect)}
          registerHref={tabHref(locale, "register", redirect)}
          tabLoginLabel={dict.tabLogin}
          tabRegisterLabel={dict.tabRegister}
          tablistLabel={dict.pageTitle}
          hideHeader={panel !== null}
        >
          {panel ?? (
            <>
              {mode === "login" ? (
                <LoginForm locale={locale} onAccountLinkNeeded={setLinkDetails} />
              ) : (
                <RegisterForm
                  locale={locale}
                  onAccountLinkNeeded={setLinkDetails}
                />
              )}

              {GOOGLE_CLIENT_ID && (
                <div>
                  <div
                    className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-[rgba(28,28,26,0.10)]"
                    aria-hidden="true"
                  >
                    <span className="relative z-10 bg-white px-2 text-c-600">
                      {dict.googleDivider}
                    </span>
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
                      className="mt-4 rounded-[10px] border border-[var(--s-error-300)] bg-[var(--s-error-100)] px-3 py-2 text-sm text-[var(--s-error-600)]"
                    >
                      {googleError}
                    </p>
                  )}
                </div>
              )}

              {mode === "login" && (
                <p className="text-center text-sm text-c-600">
                  {dict.businessOwnerPrompt}{" "}
                  <a
                    href={`${BUSINESS_APP_URL}/login`}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {dict.businessOwnerCta}
                  </a>
                </p>
              )}
            </>
          )}
        </AuthCard>
      </div>
    </main>
  );
}
