"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuthMessages } from "./auth-messages";
import { AuthCard, AuthBusinessSignIn } from "./auth-card";
import { AuthShell } from "./auth-shell";
import { GOOGLE_CLIENT_ID } from "@/lib/env";
import { localeHref } from "@/i18n/routes";
import { useTranslation } from "@/i18n/useTranslation";

type Variant = "login" | "register" | "forgot" | "callback";

/** Reuse the live shell, artwork and known copy while the form is unavailable. */
export function AuthSkeleton({ variant = "login" }: { variant?: Variant }) {
  const { auth: t } = useAuthMessages();
  const { locale } = useTranslation();
  const register = variant === "register";
  const forgot = variant === "forgot";
  const callback = variant === "callback";
  return (
    <AuthShell>
      <AuthCard
        mode={register ? "register" : "login"}
        loginHref={`${localeHref(locale, "auth")}?mode=login`}
        registerHref={`${localeHref(locale, "auth")}?mode=register`}
        tabLoginLabel={t.tabLogin}
        tabRegisterLabel={t.tabRegister}
        tablistLabel={t.pageTitle}
        hideHeader={callback}
        compact={callback}
        navigationDisabled
        title={forgot ? t.forgotPassword.heading : undefined}
        subtitle={forgot ? t.forgotPassword.subtitle : undefined}
      >
        {callback ? (
          <AuthStepSkeleton />
        ) : (
          <>
            <div aria-hidden="true">
              <div className={register ? "space-y-3 pb-3" : "space-y-4 pb-4"}>
                {register && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
                    <FieldSkeleton label={t.fields.firstName} />
                    <FieldSkeleton label={t.fields.lastName} />
                  </div>
                )}
                <FieldSkeleton label={t.fields.email} />
                {register && <FieldSkeleton label={t.fields.phoneOptional} />}
                {!forgot && (
                  <div>
                    <FieldSkeleton label={t.fields.password} />
                    {register && (
                      <div className="mt-1 min-h-8 py-1.5 text-xs font-medium text-c-600">
                        {t.passwordStrength.label}
                      </div>
                    )}
                  </div>
                )}
                {register && (
                  <div className="flex items-start gap-2.5">
                    <Skeleton w={16} h={16} r={2} className="mt-0.5 shrink-0" />
                    <span className="text-sm text-c-600">
                      {t.terms.agreementPrefix}{" "}
                      <span className="font-medium text-primary">
                        {t.terms.termsLink}
                      </span>
                      ,{" "}
                      <span className="font-medium text-primary">
                        {t.terms.cookiesLink}
                      </span>{" "}
                      {t.terms.and}{" "}
                      <span className="font-medium text-primary">
                        {t.terms.privacyLink}
                      </span>
                    </span>
                  </div>
                )}
                <div className={register ? "pt-2" : "pt-4"}>
                  <ControlSkeleton />
                </div>
              </div>
              <div className={register ? "hidden" : "mt-4 flex justify-center"}>
                {forgot ? (
                  <ControlSkeleton />
                ) : (
                  !register && (
                    <span className="text-sm text-c-600">
                      {t.forgotPasswordLink}
                    </span>
                  )
                )}
              </div>
            </div>
            {!forgot && GOOGLE_CLIENT_ID && (
              <div aria-hidden="true">
                <div className="text-center text-sm text-c-600">
                  {t.googleDivider}
                </div>
                <div className="mt-3">
                  <ControlSkeleton />
                </div>
              </div>
            )}
            {variant === "login" && (
              <>
                <p
                  aria-hidden="true"
                  className="text-center text-xs leading-relaxed text-c-600"
                >
                  {t.terms.continueNotice}{" "}
                  <span className="underline underline-offset-4">
                    {t.terms.termsLink}
                  </span>{" "}
                  {t.terms.and}{" "}
                  <span className="underline underline-offset-4">
                    {t.terms.privacyLink}
                  </span>
                  .
                </p>
                <AuthBusinessSignIn />
              </>
            )}
          </>
        )}
      </AuthCard>
    </AuthShell>
  );
}

function ControlSkeleton({ compact = false }: { compact?: boolean }) {
  return <Skeleton r={compact ? 6 : 9999} className={compact ? "h-9!" : "h-12! md:h-11!"} />;
}

function FieldSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-ink">{label}</span>
      <Skeleton r={10} className="h-12! md:h-11!" />
    </div>
  );
}

/** Shared by route Suspense and token-check states; no guessed success wording. */
export function AuthStepSkeleton({ password = false }: { password?: boolean }) {
  return (
    <div aria-hidden="true">
      <Skeleton w="75%" h={32} />
      <div className="mt-2">
        <Skeleton h={40} />
      </div>
      {password && (
        <div className="mt-8 space-y-1.5">
          <Skeleton w={72} h={20} />
          <Skeleton r={10} className="h-12! md:h-11!" />
        </div>
      )}
      <div className={password ? "mt-4" : "mt-6"}>
        <ControlSkeleton compact />
      </div>
    </div>
  );
}

export function AuthStandaloneSkeleton({
  reset = false,
  password = false,
}: {
  reset?: boolean;
  password?: boolean;
}) {
  const { auth: t } = useAuthMessages();
  return (
    <main
      className="mx-auto min-h-[30rem] max-w-md px-6 py-16"
      aria-busy="true"
    >
      {reset ? (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.resetPassword.heading}
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            {t.resetPassword.subtitle}
          </p>
          <div className="mt-8 space-y-4" aria-hidden="true">
            <FieldSkeleton label={t.resetPassword.newPassword} />
            <FieldSkeleton label={t.resetPassword.confirmPassword} />
            <ControlSkeleton compact />
          </div>
        </>
      ) : (
        <AuthStepSkeleton password={password} />
      )}
    </main>
  );
}
