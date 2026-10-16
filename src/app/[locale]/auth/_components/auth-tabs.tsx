"use client";

import { useAuthMessages } from "@/app/[locale]/auth/_components/auth-messages";
import { useSearchParams } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/locales";
import { authFlowHref, authRedirectTarget } from "@/lib/auth/redirects";
import { useRetainedAuthState } from "@/lib/auth/retained-flow";
import { localeHref, localizedPathname } from "@/i18n/routes";
import type { AccountLinkNeededDetails } from "@/lib/auth/types";
import { GOOGLE_CLIENT_ID } from "@/lib/env";
import { AuthCard, AuthBusinessSignIn } from "./auth-card";
import { AuthShell } from "./auth-shell";
import { EnableAccessPanel } from "./enable-access-panel";
import { GoogleSignInButton } from "./google-signin-button";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { ForgotPasswordForm } from "../forgot-password/_components/forgot-password-form";

type Mode = "login" | "register";
type AccessFlow = { id: string; details: AccountLinkNeededDetails };

// Use the same navigation context as the auth links, without a locale prefix.
function authEntryKey(search: Pick<URLSearchParams, "get">): string {
  const view = search.get("mode") === "register"
    ? "register"
    : search.get("forgot") === "1" ? "forgot-password" : "login";
  return JSON.stringify(["auth-entry", authFlowHref(DEFAULT_LOCALE, view, search)]);
}

function isCurrentEntry(key: string): boolean {
  return localizedPathname(window.location.pathname, DEFAULT_LOCALE) === localeHref(DEFAULT_LOCALE, "auth")
    && authEntryKey(new URLSearchParams(window.location.search)) === key;
}

export function AuthTabs({ locale }: { locale: Locale }) {
  const dictionary = useAuthMessages();
  const dict = dictionary.auth;
  const searchParams = useSearchParams();
  const redirect = authRedirectTarget(searchParams, locale);
  const mode: Mode = searchParams.get("mode") === "register" ? "register" : "login";
  const isForgotPassword = mode === "login" && searchParams.get("forgot") === "1";
  const view = isForgotPassword ? "forgot-password" : mode;

  const entryKey = authEntryKey(searchParams);
  const [linkFlow, setLinkFlow] = useRetainedAuthState<AccessFlow>(entryKey);
  const [submitting, setSubmitting] = useState(false);

  useLayoutEffect(() => () => {
    // A locale remount keeps the entry. A committed exit or a different auth
    // view/context abandons it, including when a request finishes afterwards.
    queueMicrotask(() => {
      if (linkFlow && !isCurrentEntry(entryKey)) {
        setLinkFlow((current) => current === linkFlow ? null : current);
      }
    });
  }, [entryKey, linkFlow, setLinkFlow]);

  function handleAccountLinkNeeded(details: AccountLinkNeededDetails) {
    // A same-mode form can stay mounted while its return destination changes.
    // A late response from that previous entry must not reopen its panel.
    if (!isCurrentEntry(entryKey)) return;
    setLinkFlow({ id: crypto.randomUUID(), details });
  }

  // Terms consent for register mode. Lives here (not in RegisterForm) because
  // the Google button below the form must gate on the same checkbox — users
  // must accept the terms whether they register with email or with Google.
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);

  // The card stays mounted across query-driven auth views. Reset consent and
  // pending controls when leaving a view, including browser Back/Forward.
  const [prevView, setPrevView] = useState(view);
  if (prevView !== view) {
    setPrevView(view);
    setTermsAccepted(false);
    setTermsError(false);
    setSubmitting(false);
  }

  // Sub-flow (business-account link) replaces the tabbed forms inside the same
  // card shell, with the toggle + heading suppressed — it owns its heading.
  // The Google collision panels live on /auth/callback now: the Google button
  // is a full-page redirect, so its outcomes land there, not here.
  const panel = linkFlow ? (
    <EnableAccessPanel
      locale={locale}
      details={linkFlow.details}
      flowKey={linkFlow.id}
      onCancel={() => {
        setLinkFlow(null);
        window.history.replaceState(null, "", authFlowHref(locale, "login", searchParams));
      }}
    />
  ) : null;

  return (
    <AuthShell>
      <AuthCard
        mode={mode}
        loginHref={authFlowHref(locale, "login", searchParams)}
        registerHref={authFlowHref(locale, "register", searchParams)}
        tabLoginLabel={dict.tabLogin}
        tabRegisterLabel={dict.tabRegister}
        tablistLabel={dict.pageTitle}
        hideHeader={panel !== null}
        compact={panel !== null}
        navigationDisabled={submitting}
      >
        {panel ?? (isForgotPassword ? (
          <ForgotPasswordForm
            locale={locale}
            embedded
            onSubmittingChange={setSubmitting}
          />
        ) : (
          <>
            {mode === "login" ? (
              <LoginForm
                locale={locale}
                onAccountLinkNeeded={handleAccountLinkNeeded}
                disabled={submitting}
                onSubmittingChange={setSubmitting}
              />
            ) : (
              <RegisterForm
                locale={locale}
                onAccountLinkNeeded={handleAccountLinkNeeded}
                disabled={submitting}
                onSubmittingChange={setSubmitting}
                termsAccepted={termsAccepted}
                termsError={termsError}
                onTermsChange={(accepted) => {
                  setTermsAccepted(accepted);
                  if (accepted) setTermsError(false);
                }}
                onTermsInvalid={() => setTermsError(true)}
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

                <div className="mt-3">
                  <GoogleSignInButton
                    intent={mode}
                    locale={locale}
                    redirect={redirect}
                    disabled={submitting}
                    onBeforeStart={
                      mode === "register"
                        ? () => {
                            if (!termsAccepted) {
                              setTermsError(true);
                              document.getElementById("acceptTerms")?.focus();
                              return false;
                            }
                            return true;
                          }
                        : undefined
                    }
                  />
                </div>
              </div>
            )}

            {mode === "login" && (
              /* New Google users are auto-registered by the backend even on
                 login intent, so the login tab carries the passive consent
                 notice (register has the explicit checkbox instead) —
                 mirroring the admin-dashboard AuthLayout footer. */
              <p className="text-center text-xs leading-relaxed text-c-600">
                {dict.terms.continueNotice}{" "}
                <a
                  href={localeHref(locale, "terms", "customer-terms")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  {dict.terms.termsLink}
                </a>{" "}
                {dict.terms.and}{" "}
                <a
                  href={localeHref(locale, "terms", "privacy-policy")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  {dict.terms.privacyLink}
                </a>
                .
              </p>
            )}

            {mode === "login" && (
              <AuthBusinessSignIn />
            )}
          </>
        ))}
      </AuthCard>
    </AuthShell>
  );
}
