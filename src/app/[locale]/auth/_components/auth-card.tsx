"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AuthHero } from "./auth-hero";
import "./auth-card.css";

type Mode = "login" | "register";

type AuthCardProps = {
  /** Drives which tab in the toggle is shown as active. */
  mode: Mode;
  title: string;
  subtitle?: string;
  loginHref: string;
  registerHref: string;
  tabLoginLabel: string;
  tabRegisterLabel: string;
  /** aria-label for the tablist. */
  tablistLabel: string;
  /** When true, suppress the toggle + heading. Used for sub-flows like
   *  the enable-access and Google-link panels, which own their headings. */
  hideHeader?: boolean;
  /** When true, opens up the gap between the heading and the form. Used
   *  for the forgot-password sub-flow. */
  isForgotMode?: boolean;
  children: ReactNode;
};

const tabBase =
  "relative z-10 flex flex-1 items-center justify-center rounded-full px-4 py-2.5 text-center text-sm font-medium transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";
const tabActive = "text-ink";
const tabInactive = "text-c-600 hover:text-ink";

/**
 * Two-column auth card ported from admin-dashboard's AuthCard: form column
 * on the left, animated wordmark hero on the right (md+ only). The pill
 * toggle slides a white thumb between Sign in / Create account, and the
 * keyed content wrapper replays the staggered enter animation on each
 * tab switch.
 */
export function AuthCard({
  mode,
  title,
  subtitle,
  loginHref,
  registerHref,
  tabLoginLabel,
  tabRegisterLabel,
  tablistLabel,
  hideHeader,
  isForgotMode,
  children,
}: AuthCardProps) {
  const gapClass = isForgotMode ? "gap-16" : mode === "login" ? "gap-8" : "gap-6";
  return (
    <div className="w-full overflow-hidden rounded-[var(--r-2xl)] border border-[rgba(28,28,26,0.08)] bg-white shadow-[var(--sh-lg)]">
      <div className="grid md:grid-cols-2">
        <div className="p-5 sm:p-6 md:min-h-[45rem] md:p-8">
          <div className={`flex flex-col ${gapClass}`}>
            {!hideHeader && (
              <div
                role="tablist"
                aria-label={tablistLabel}
                className="relative flex h-11 w-full rounded-full bg-shade p-1"
              >
                <div
                  aria-hidden="true"
                  className="absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{
                    transform:
                      mode === "register" ? "translateX(100%)" : "translateX(0)",
                  }}
                />
                <Link
                  role="tab"
                  aria-selected={mode === "login"}
                  href={loginHref}
                  replace
                  scroll={false}
                  className={`${tabBase} ${mode === "login" ? tabActive : tabInactive}`}
                >
                  {tabLoginLabel}
                </Link>
                <Link
                  role="tab"
                  aria-selected={mode === "register"}
                  href={registerHref}
                  replace
                  scroll={false}
                  className={`${tabBase} ${mode === "register" ? tabActive : tabInactive}`}
                >
                  {tabRegisterLabel}
                </Link>
              </div>
            )}
            <div key={mode} className={`auth-card-content-enter flex flex-col ${gapClass}`}>
              {!hideHeader && (
                <div className="space-y-1">
                  <h1 className="text-[28px] font-bold tracking-[-0.02em] text-ink md:leading-tight">
                    {title}
                  </h1>
                  {subtitle && <p className="text-base text-c-600">{subtitle}</p>}
                </div>
              )}
              {children}
            </div>
          </div>
        </div>
        <div className="relative hidden md:block">
          <AuthHero />
        </div>
      </div>
    </div>
  );
}
