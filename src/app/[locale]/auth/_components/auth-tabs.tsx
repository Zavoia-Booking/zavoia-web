"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import type { AccountLinkNeededDetails } from "@/lib/auth/types";
import { BUSINESS_APP_URL, GOOGLE_CLIENT_ID } from "@/lib/env";
import { AuthCard } from "./auth-card";
import { EnableAccessPanel } from "./enable-access-panel";
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
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const mode: Mode = searchParams.get("mode") === "register" ? "register" : "login";

  const [linkDetails, setLinkDetails] =
    useState<AccountLinkNeededDetails | null>(null);

  // Terms consent for register mode. Lives here (not in RegisterForm) because
  // the Google button below the form must gate on the same checkbox — users
  // must accept the terms whether they register with email or with Google.
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);

  // Switching login/register tabs only changes the ?mode param — this
  // component stays mounted — so reset the consent state on tab change
  // (guarded adjust-during-render): the checkbox unticks so returning to
  // register always asks for a fresh, deliberate acceptance.
  const [prevMode, setPrevMode] = useState(mode);
  if (prevMode !== mode) {
    setPrevMode(mode);
    setTermsAccepted(false);
    setTermsError(false);
  }

  // Sub-flow (business-account link) replaces the tabbed forms inside the same
  // card shell, with the toggle + heading suppressed — it owns its heading.
  // The Google collision panels live on /auth/callback now: the Google button
  // is a full-page redirect, so its outcomes land there, not here.
  const panel = linkDetails ? (
    <EnableAccessPanel
      locale={locale}
      details={linkDetails}
      onCancel={() => setLinkDetails(null)}
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

                  <div className="mt-6">
                    <GoogleSignInButton
                      intent={mode}
                      locale={locale}
                      redirect={redirect}
                      onBeforeStart={
                        mode === "register"
                          ? () => {
                              if (!termsAccepted) {
                                setTermsError(true);
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
                <p className="text-center text-xs text-c-500">
                  {dict.terms.continueNotice}{" "}
                  <a
                    href={localeHref(locale, "legal", "terms")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    {dict.terms.termsLink}
                  </a>{" "}
                  {dict.terms.and}{" "}
                  <a
                    href={localeHref(locale, "legal", "privacy")}
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
