"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { InlineError } from "@/components/ui/inline-error";
import { Spinner } from "@/components/ui/spinner";
import type { Locale } from "@/i18n/locales";
import { appleErrorMessage } from "@/lib/api/auth-error-messages";
import { backendCode } from "@/lib/api/error-messages";
import { defaultPostAuthTarget, safeRedirectTarget } from "@/lib/auth/redirects";
import { useRetainedAuthAction } from "@/lib/auth/retained-flow";
import type { AppleProfileRequiredDetails } from "@/lib/auth/types";
import { useAuth } from "@/lib/auth/useAuth";
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  isValidPersonName,
  sanitizeName,
} from "@/lib/validation";
import { appleOutcomeFromError, type AppleOutcome } from "./apple-outcome";
import { AuthField } from "./auth-field";
import { useAuthMessages } from "./auth-messages";

type Field = "firstName" | "lastName";

/**
 * Apple name step, after POST /marketplace/auth/apple returned 409
 * `apple_profile_required` (Apple sends the name only on the first
 * authorization, and not always). Same name rules as the register form; the
 * session is issued by POST /marketplace/auth/apple/profile.
 */
export function AppleNamePanel({
  locale,
  details,
  redirect,
  onOutcome,
  onCancel,
}: {
  locale: Locale;
  details: AppleProfileRequiredDetails;
  /** Post-auth target; validated again before navigating. */
  redirect?: string | null;
  /** The API moved the flow to another Apple step (rare race). */
  onOutcome: (outcome: AppleOutcome) => void;
  onCancel: () => void;
}) {
  const dictionary = useAuthMessages();
  const dict = dictionary.auth;
  const t = dict.appleProfile;
  const router = useRouter();
  const { status, completeAppleProfile } = useAuth();

  const [values, setValues] = useState<Record<Field, string>>({
    firstName: "",
    lastName: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const action = useRetainedAuthAction(`apple-profile:${details.txId}`);
  const submitting = action.status === "pending" || action.status === "success";
  const expired =
    action.status === "error" && backendCode(action.error) === "APPLE_STEP_EXPIRED";

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(
        safeRedirectTarget(redirect ?? null, locale, defaultPostAuthTarget(locale)),
      );
    }
  }, [status, locale, router, redirect]);

  function validate(field: Field, raw: string): string | undefined {
    const value = raw.trim();
    if (!value) {
      return field === "firstName"
        ? dict.errors.firstNameRequired
        : dict.errors.lastNameRequired;
    }
    if (value.length < NAME_MIN_LENGTH) return dict.errors.nameTooShort;
    if (value.length > NAME_MAX_LENGTH) return dict.errors.nameTooLong;
    if (!isValidPersonName(value)) return dict.errors.nameNeedsLetter;
    return undefined;
  }

  function setField(field: Field, raw: string) {
    const value = sanitizeName(raw);
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({
      ...previous,
      [field]: previous[field] ? validate(field, value) : undefined,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || expired) return;
    const next: Partial<Record<Field, string>> = {
      firstName: validate("firstName", values.firstName),
      lastName: validate("lastName", values.lastName),
    };
    setErrors(next);
    const invalid = (["firstName", "lastName"] as const).find((field) => next[field]);
    if (invalid) {
      const input = formRef.current?.elements.namedItem(`apple-${invalid}`);
      if (input instanceof HTMLElement) input.focus();
      return;
    }
    const firstName = values.firstName.trim();
    const lastName = values.lastName.trim();
    void action.run(async () => {
      try {
        await completeAppleProfile(details.txId, firstName, lastName, locale);
      } catch (error) {
        const outcome = appleOutcomeFromError(error);
        if (!outcome) throw error;
        onOutcome(outcome);
      }
    }).catch(() => {});
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t.heading}</h1>
      <p className="mt-4 text-sm text-zinc-600">{t.explanation}</p>

      <form ref={formRef} onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
          <AuthField
            id="apple-firstName"
            label={dict.fields.firstName}
            value={values.firstName}
            onChange={(value) => setField("firstName", value)}
            error={errors.firstName}
            autoComplete="given-name"
            disabled={submitting}
            required
          />
          <AuthField
            id="apple-lastName"
            label={dict.fields.lastName}
            value={values.lastName}
            onChange={(value) => setField("lastName", value)}
            error={errors.lastName}
            autoComplete="family-name"
            disabled={submitting}
            required
          />
        </div>

        {action.status === "error" && (
          <InlineError className="rounded-md border border-[var(--s-error-300)] bg-[var(--s-error-100)] px-3 py-2">
            {appleErrorMessage(action.error, dict.errors, dictionary.errors)}
          </InlineError>
        )}

        {expired ? (
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            {dict.appleLink.startAgain}
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            aria-label={t.submit}
            aria-busy={submitting}
            className="relative w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className={submitting ? "invisible" : undefined} aria-hidden={submitting || undefined}>
              {t.submit}
            </span>
            {submitting && (
              <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                <Spinner size={16} color="currentColor" />
              </span>
            )}
          </button>
        )}
        <span role="status" className="sr-only">
          {submitting ? t.submitting : ""}
        </span>
      </form>

      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="mt-6 w-full text-center text-sm text-zinc-500 underline-offset-2 transition hover:text-zinc-900 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t.cancel}
      </button>
    </div>
  );
}
