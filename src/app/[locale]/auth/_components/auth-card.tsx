"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BUSINESS_APP_URL } from "@/lib/env";
import { useAuthMessages } from "./auth-messages";
import { useId, useLayoutEffect, useRef, type ReactNode } from "react";
import { AuthHero } from "./auth-hero";
import "./auth-card.css";

type Mode = "login" | "register";
type AuthCardProps = {
  mode: Mode;
  title?: string;
  subtitle?: string;
  loginHref: string;
  registerHref: string;
  tabLoginLabel: string;
  tabRegisterLabel: string;
  /** Accessible label for the mode navigation. */
  tablistLabel: string;
  hideHeader?: boolean;
  /** Short, standalone auth steps keep their content-sized presentation. */
  compact?: boolean;
  navigationDisabled?: boolean;
  children: ReactNode;
};

export function AuthCard({
  mode, title, subtitle, loginHref, registerHref, tabLoginLabel,
  tabRegisterLabel, tablistLabel, hideHeader, compact = false, navigationDisabled = false, children,
}: AuthCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const card = cardRef.current;
    const body = bodyRef.current;
    if (!card || !body) return;

    function updateErrorSpace() {
      if (!card || !body) return;
      const rows = Array.from(body.querySelectorAll<HTMLElement>('[role="alert"]'))
        .filter((alert) => {
          if (alert.parentElement?.closest('[role="alert"]')) return false;
          return alert.getClientRects().length > 0 && getComputedStyle(alert).visibility === "visible";
        })
        .map((alert) => {
          const style = getComputedStyle(alert);
          const before = parseFloat(style.marginTop) || 0;
          const after = parseFloat(style.marginBottom) || 0;
          return {
            top: alert.getBoundingClientRect().top - before,
            height: alert.offsetHeight + before + after,
          };
        })
        .sort((a, b) => a.top - b.top);

      // Side-by-side name errors share one row. Count its tallest message
      // once, including its spacing, rather than summing both columns.
      let height = 0;
      let end = -Infinity;
      for (const row of rows) {
        const bottom = row.top + row.height;
        height += Math.max(0, bottom - Math.max(row.top, end));
        end = Math.max(end, bottom);
      }
      card.style.setProperty("--auth-error-space", `${Math.ceil(height)}px`);
    }

    updateErrorSpace();
    const resize = new ResizeObserver(updateErrorSpace);
    resize.observe(body);
    const mutation = new MutationObserver(updateErrorSpace);
    mutation.observe(body, { childList: true, subtree: true, characterData: true });
    return () => {
      resize.disconnect();
      mutation.disconnect();
    };
  }, [mode, hideHeader, compact]);

  return (
    <div ref={cardRef} className="auth-card" data-compact={compact || undefined} aria-busy={navigationDisabled}>
      <div className="auth-card-form">
        {!hideHeader && (
          <>
            <nav
              aria-label={tablistLabel}
              className="auth-mode-nav"
              data-mode={mode}
            >
              <span aria-hidden="true" className="auth-mode-thumb" />
              {([
                ["login", loginHref, tabLoginLabel],
                ["register", registerHref, tabRegisterLabel],
              ] as const).map(([linkMode, href, label]) => (
                <Link
                  key={linkMode}
                  href={href}
                  replace
                  scroll={false}
                  aria-current={mode === linkMode ? "page" : undefined}
                  aria-disabled={navigationDisabled || undefined}
                  tabIndex={navigationDisabled ? -1 : undefined}
                  onClick={(event) => {
                    if (navigationDisabled) event.preventDefault();
                  }}
                  className="auth-mode-link"
                >
                  {label}
                </Link>
              ))}
            </nav>
            {title && (
              <div className="auth-card-heading">
                <h1>{title}</h1>
                {subtitle && <p>{subtitle}</p>}
              </div>
            )}
          </>
        )}
        <div ref={bodyRef} className="auth-card-body">
          <div key={mode} className="auth-card-content">
            {children}
          </div>
        </div>
      </div>
      <div className="auth-card-hero" aria-hidden="true">
        <AuthHero />
      </div>
    </div>
  );
}

/** Static business navigation is shared with the initial auth shell. */
export function AuthBusinessSignIn() {
  const { auth: dict } = useAuthMessages();
  const businessHeadingId = useId();
  return (
    <section className="auth-business" aria-labelledby={businessHeadingId}>
      <div className="auth-business-copy">
        <h2 id={businessHeadingId}>{dict.businessSignIn.title}</h2>
        <p>{dict.businessSignIn.description}</p>
      </div>
      <a href={`${BUSINESS_APP_URL}/login`} className="tap auth-business-link">
        <span>{dict.businessSignIn.cta}</span>
        <ArrowRight size={16} aria-hidden="true" className="shrink-0" />
      </a>
    </section>
  );
}
