"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/icon";
import type { Locale } from "@/i18n/locales";
import { markLocaleNavigation } from "@/i18n/locale-transition";
import { localizedPathname } from "@/i18n/routes";
import { requiresLocaleAlternates, useLocaleAlternates, type LocaleAlternates } from "@/i18n/locale-navigation";
import { enhanceLanguagePanel } from "./floating-language-panel";
import styles from "./language-switcher.module.css";

const locationListeners = new Set<() => void>();
function notifyLocation() { locationListeners.forEach((notify) => notify()); }
function subscribeToLocation(notify: () => void) {
  locationListeners.add(notify);
  window.addEventListener("hashchange", notify);
  window.addEventListener("popstate", notify);
  return () => {
    locationListeners.delete(notify);
    window.removeEventListener("hashchange", notify);
    window.removeEventListener("popstate", notify);
  };
}
const getLocation = () => window.location.href;
const getServerLocation = () => null;

// Shared layouts survive navigation. Observe query-only router updates too,
// without making the disclosure (or its parent page) depend on client rendering.
function RouterLocationSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(notifyLocation, [pathname, searchParams]);
  return null;
}

function NavigationStatus({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  return (
    <span role="status" className={styles.status}>
      {pending && <><span className={styles.srOnly}>{label}</span><span aria-hidden="true">…</span></>}
    </span>
  );
}

/** One navigation control for the marketplace, microsites and missing pages.
 * Route locale remains authoritative; this only resolves destination links.
 */
export function LanguageDisclosure({
  currentLocale, pathname, label, options, loadingLabel, unavailableLabel,
  placement = "below", compact, alternates,
}: {
  currentLocale: Locale;
  pathname?: string;
  label: string;
  options: { locale: Locale; label: string }[];
  loadingLabel: string;
  unavailableLabel: string;
  placement?: "above" | "below";
  compact?: "responsive";
  alternates?: LocaleAlternates | "same-path";
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const routerPathname = usePathname();
  const previousRoute = useRef({ locale: currentLocale, pathname: routerPathname });
  const location = useSyncExternalStore(subscribeToLocation, getLocation, getServerLocation);
  const browserUrl = location ? new URL(location) : null;
  const visiblePathname = browserUrl?.pathname ?? pathname ?? routerPathname ?? "/";
  const registeredAlternates = useLocaleAlternates(visiblePathname);
  const destinations = alternates === "same-path" ? undefined : alternates ?? registeredAlternates;
  const needsAlternates = alternates !== "same-path" && requiresLocaleAlternates(visiblePathname);
  const currentLabel = options.find((option) => option.locale === currentLocale)?.label;

  useEffect(() => {
    const disclosure = ref.current;
    if (!disclosure) return;
    const trigger = disclosure.querySelector("summary");
    const floating = enhanceLanguagePanel(disclosure);
    const close = () => { disclosure.open = false; floating.sync(); };
    const outside = (event: PointerEvent) => {
      if (disclosure.open && event.target instanceof Node && !disclosure.contains(event.target)) close();
    };
    const focusLeave = (event: FocusEvent) => {
      if (!(event.relatedTarget instanceof Node && disclosure.contains(event.relatedTarget))) close();
    };
    const pointer = () => { disclosure.dataset.input = "pointer"; };
    const keyboard = (event: KeyboardEvent) => {
      disclosure.dataset.input = "keyboard";
      if (event.key === "Escape" && disclosure.open) {
        event.preventDefault();
        close();
        trigger?.focus();
        return;
      }
      // Destinations can arrive after the disclosure mounts.
      const links = [...disclosure.querySelectorAll<HTMLAnchorElement>("a[data-locale]")];
      if (!links.length) return;
      const index = links.indexOf(document.activeElement as HTMLAnchorElement);
      const onTrigger = document.activeElement === trigger;
      let next: number;
      if (event.key === "ArrowDown") next = onTrigger ? 0 : (index + 1) % links.length;
      else if (event.key === "ArrowUp") next = onTrigger ? links.length - 1 : (index - 1 + links.length) % links.length;
      else if (event.key === "Home" && !onTrigger) next = 0;
      else if (event.key === "End" && !onTrigger) next = links.length - 1;
      else return;
      event.preventDefault();
      disclosure.open = true;
      floating.sync();
      links[next]?.focus();
    };
    disclosure.addEventListener("pointerdown", pointer);
    disclosure.addEventListener("keydown", keyboard);
    disclosure.addEventListener("focusout", focusLeave);
    document.addEventListener("pointerdown", outside);
    return () => {
      floating.dispose();
      disclosure.removeEventListener("pointerdown", pointer);
      disclosure.removeEventListener("keydown", keyboard);
      disclosure.removeEventListener("focusout", focusLeave);
      document.removeEventListener("pointerdown", outside);
    };
  }, []);

  useEffect(() => {
    const previous = previousRoute.current;
    previousRoute.current = { locale: currentLocale, pathname: routerPathname };
    if (previous.locale === currentLocale && previous.pathname === routerPathname) return;
    const disclosure = ref.current;
    if (disclosure?.open) {
      if (disclosure.contains(document.activeElement)) disclosure.querySelector("summary")?.focus();
      disclosure.open = false;
    }
  }, [currentLocale, routerPathname]);

  return (
    <>
      {/* Native details can open before hydration; preserve that browser-owned
          attribute. Labels and destination links still undergo hydration checks. */}
      <details ref={ref} className={styles.language} data-placement={placement} data-compact={compact} suppressHydrationWarning>
        <summary className={styles.trigger} aria-label={`${label}: ${currentLabel}`}>
          <span className={styles.globe}><Icon name="globe" size={17} /></span>
          <span className={styles.label} lang={currentLocale} dir="auto">{currentLabel}</span>
          <Icon name="chevD" size={12} className={styles.chevron} />
        </summary>
        <nav className={styles.panel} aria-label={label}>
          <ul className={styles.options}>
            {options.map(({ locale, label: optionLabel }) => {
              const current = locale === currentLocale;
              const target = current ? localizedPathname(visiblePathname, locale)
                : destinations ? destinations[locale]
                : needsAlternates ? undefined : localizedPathname(visiblePathname, locale);
              return (
                <li key={locale}>
                  {target ? (
                    <Link
                      href={`${target}${browserUrl?.search ?? ""}${browserUrl?.hash ?? ""}`}
                      prefetch={false}
                      replace
                      scroll={false}
                      hrefLang={locale}
                      lang={locale}
                      dir="auto"
                      data-locale={locale}
                      aria-current={current ? "true" : undefined}
                      className={styles.option}
                      onNavigate={(event) => {
                        if (!current) {
                          markLocaleNavigation(target);
                          return;
                        }
                        event.preventDefault();
                        if (ref.current) {
                          ref.current.open = false;
                          ref.current.querySelector("summary")?.focus();
                        }
                      }}
                    >
                      <span>{optionLabel}</span>
                      <span className={styles.indicator}>
                        <NavigationStatus label={loadingLabel} />
                        <Icon name="check" size={16} className={styles.check} />
                      </span>
                    </Link>
                  ) : (
                    <span className={styles.option} aria-disabled="true" data-locale={locale}>
                      <span lang={locale} dir="auto">{optionLabel}</span>
                      <span className={styles.unavailable}>{destinations ? unavailableLabel : loadingLabel}</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </details>
      <Suspense fallback={null}><RouterLocationSync /></Suspense>
    </>
  );
}
