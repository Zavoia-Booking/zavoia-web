"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppleSignInError,
  isAppleSignInConfigured,
  prepareAppleAttempt,
  startAppleSignIn,
  type AppleWebCredential,
  type PreparedAppleAttempt,
} from "@/lib/auth/apple-signin";
import { useAuthMessages } from "./auth-messages";

/** Apple logo, white on the black button (Apple Human Interface Guidelines). */
function AppleLogo() {
  return (
    <svg width={18} height={20} viewBox="0 0 17 20" aria-hidden="true" fill="currentColor">
      <path d="M14.09 10.64c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76-1.47.02-2.83.86-3.59 2.18-1.53 2.66-.39 6.59 1.1 8.75.73 1.05 1.6 2.24 2.73 2.2 1.1-.05 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.41 1.2-2.47-.03-.01-2.3-.88-2.32-3.5zM11.92 4.18c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.64-1.05 1.68-.92 2.67.97.08 1.96-.49 2.56-1.22z" />
    </svg>
  );
}

type Props = {
  /** Button title: "Continue with Apple" or "Sign up with Apple". */
  label: "continue" | "signUp";
  disabled?: boolean;
  /**
   * Called before the popup opens; return false to block it (e.g. required
   * terms checkbox not ticked). Same contract as GoogleSignInButton.
   */
  onBeforeStart?: () => boolean;
  /** Called synchronously as the popup opens, e.g. to clear an old error. */
  onStart?: () => void;
  /** Apple returned an authorization. Not called when the person cancels. */
  onCredential: (credential: AppleWebCredential) => void;
  /** A client-side Apple failure (AppleSignInError). Cancellation is silent. */
  onError: (error: unknown) => void;
};

/**
 * "Sign in with Apple" button, Apple JS popup mode (src/lib/auth/apple-signin.ts).
 *
 * Popup blockers only allow window.open inside the click's user activation,
 * so the script, nonce and state for the NEXT attempt are prepared ahead of
 * time — on mount and again right after every attempt — and the click handler
 * calls Apple synchronously, without awaiting anything first.
 *
 * Renders nothing when NEXT_PUBLIC_APPLE_SERVICES_ID or
 * NEXT_PUBLIC_APPLE_REDIRECT_URI is unset (feature flag, as the Google button).
 */
export function AppleSignInButton(props: Props) {
  if (!isAppleSignInConfigured()) return null;
  return <AppleSignInControl {...props} />;
}

type Preparation = "preparing" | "ready" | "unavailable";

function AppleSignInControl({
  label,
  disabled = false,
  onBeforeStart,
  onStart,
  onCredential,
  onError,
}: Props) {
  const t = useAuthMessages().auth.appleButton;
  const attemptRef = useRef<PreparedAppleAttempt | null>(null);
  const mountedRef = useRef(true);
  const [preparation, setPreparation] = useState<Preparation>("preparing");
  const [popupOpen, setPopupOpen] = useState(false);

  // Never sets state synchronously: only once the preparation settles.
  const prepare = useCallback(() => {
    attemptRef.current = null;
    prepareAppleAttempt().then(
      (attempt) => {
        if (!mountedRef.current) return;
        attemptRef.current = attempt;
        setPreparation("ready");
      },
      () => {
        if (mountedRef.current) setPreparation("unavailable");
      },
    );
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    prepare();
    return () => {
      mountedRef.current = false;
    };
  }, [prepare]);

  function handleClick() {
    if (disabled || popupOpen) return;
    if (onBeforeStart && !onBeforeStart()) return;
    const attempt = attemptRef.current;
    if (!attempt) {
      if (preparation === "unavailable") {
        onError(new AppleSignInError("unavailable"));
        setPreparation("preparing");
        prepare();
      }
      return;
    }
    // One attempt = one state + nonce; it is never reused.
    attemptRef.current = null;
    onStart?.();
    const request = startAppleSignIn(attempt); // synchronous popup open
    setPopupOpen(true);
    setPreparation("preparing");
    prepare();
    request
      .then(
        (credential) => {
          if (credential) onCredential(credential);
        },
        (error: unknown) => onError(error),
      )
      .finally(() => {
        if (mountedRef.current) setPopupOpen(false);
      });
  }

  const preparing = preparation === "preparing";
  const blocked = disabled || popupOpen;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={blocked || preparing}
      aria-busy={preparing || popupOpen || undefined}
      className={`auth-apple-button flex h-12 w-full cursor-pointer items-center justify-center gap-3 border border-black bg-black text-[15px] font-medium text-white shadow-[var(--sh-sm)] transition-colors duration-150 hover:bg-[#1d1d1f] disabled:cursor-not-allowed md:h-11${blocked ? " opacity-60" : ""}`}
      style={{
        borderRadius: "var(--r-full)",
        // Apple's guidelines ask for the system font in the button title.
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      <AppleLogo />
      {label === "signUp" ? t.signUp : t.continue}
    </button>
  );
}
