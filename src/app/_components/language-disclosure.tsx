"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Suspense, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { DrawerHandle } from "@/components/ui/drawer-handle";
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
function subscribeMobile(notify: () => void) {
  const media = window.matchMedia("(max-width: 920px)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}
const getMobile = () => window.matchMedia("(max-width: 920px)").matches;
const getServerMobile = () => false;

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
      {pending && (
        <>
          <span className={styles.srOnly}>{label}</span>
          <span aria-hidden="true"><Spinner size={14} color="currentColor" /></span>
        </>
      )}
    </span>
  );
}

type LanguageChoice = {
  locale: Locale;
  label: string;
  current: boolean;
  target?: string;
  href?: string;
  unavailable: boolean;
};

function LanguageChoices({ choices, loadingLabel, unavailableLabel, source, onCurrent }: {
  choices: LanguageChoice[];
  loadingLabel: string;
  unavailableLabel: string;
  source: RefObject<HTMLElement | null>;
  onCurrent: () => void;
}) {
  return <ul className={styles.options}>
    {choices.map(choice => <li key={choice.locale}>
      {choice.href && choice.target ? (
        <Link title={choice.label} href={choice.href} prefetch={false} replace scroll={false}
          hrefLang={choice.locale} lang={choice.locale} dir="auto" data-locale={choice.locale}
          aria-current={choice.current ? "true" : undefined} className={styles.option}
          onNavigate={event => {
            if (choice.current) {
              event.preventDefault();
              onCurrent();
            } else {
              markLocaleNavigation(choice.target!, source.current);
            }
          }}>
          <span>{choice.label}</span>
          <span className={styles.indicator}>
            <NavigationStatus label={loadingLabel} />
            <Icon name="check" size={16} className={styles.check} />
          </span>
        </Link>
      ) : (
        <span className={styles.option} aria-disabled="true" data-locale={choice.locale}>
          <span lang={choice.locale} dir="auto">{choice.label}</span>
          {choice.unavailable ? <span className={styles.unavailable}>{unavailableLabel}</span> : (
            <span role="status" className={styles.indicator}>
              <span className={styles.srOnly}>{loadingLabel}</span>
              <span aria-hidden="true"><Spinner size={14} color="currentColor" /></span>
            </span>
          )}
        </span>
      )}
    </li>)}
  </ul>;
}

function MobileLanguageDrawer({ label, currentLabel, closeLabel, compact, triggerClassName, choices, loadingLabel, unavailableLabel }: {
  label: string;
  currentLabel?: string;
  closeLabel: string;
  compact?: "responsive";
  triggerClassName?: string;
  choices: LanguageChoice[];
  loadingLabel: string;
  unavailableLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState<"pointer" | "keyboard">("pointer");
  const [entryInput, setEntryInput] = useState<"pointer" | "keyboard">("pointer");
  const trigger = useRef<HTMLButtonElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <div className={styles.language} data-compact={compact} data-mobile-language>
      <Dialog.Trigger asChild>
        <button ref={trigger} type="button" className={`${styles.trigger} ${styles.drawerTrigger}${triggerClassName ? ` ${triggerClassName}` : ""}`} aria-label={`${label}: ${currentLabel}`}
          onClick={event => {
            const nextInput = event.detail === 0 ? "keyboard" : "pointer";
            setInput(nextInput);
            setEntryInput(nextInput);
          }}>
          <span className={styles.globe}><Icon name="globe" size={17} /></span>
          <span className={styles.label} lang={choices.find(choice => choice.current)?.locale} dir="auto">{currentLabel}</span>
          <span className={styles.chevron} aria-hidden="true"><Icon name="chevD" size={12} /></span>
        </button>
      </Dialog.Trigger>
    </div>
    <Dialog.Portal>
      <Dialog.Overlay ref={overlay} className={styles.drawerOverlay} data-input={input} data-entry={entryInput} />
      <Dialog.Content ref={content} className={styles.drawer} data-input={input} data-entry={entryInput} aria-describedby={undefined}
        onPointerDownCapture={() => setInput("pointer")}
        onPointerDownOutside={() => setInput("pointer")}
        onEscapeKeyDown={() => setInput("keyboard")}
        onKeyDown={event => {
          setInput("keyboard");
          if (event.defaultPrevented || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
          const links = [...(content.current?.querySelectorAll<HTMLAnchorElement>("a[data-locale]") ?? [])];
          if (!links.length) return;
          event.preventDefault();
          const index = links.indexOf(document.activeElement as HTMLAnchorElement);
          const next = event.key === "Home" ? 0 : event.key === "End" ? links.length - 1
            : event.key === "ArrowDown" ? (index + 1) % links.length : (index + links.length - 1) % links.length;
          links[next]?.focus();
        }}
        onOpenAutoFocus={event => {
          event.preventDefault();
          (content.current?.querySelector<HTMLAnchorElement>('a[aria-current="true"]') ?? content.current)?.focus({ preventScroll: true });
        }}
        onCloseAutoFocus={event => {
          event.preventDefault();
          if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true });
        }}>
        <DrawerHandle contentRef={content} overlayRef={overlay} onClose={() => setOpen(false)} label={closeLabel} />
        <div className={styles.drawerHeader}>
          <Dialog.Title className={styles.drawerTitle}>{label}</Dialog.Title>
          <Dialog.Close asChild>
            <button type="button" className={styles.drawerClose} aria-label={closeLabel}
              onClick={event => setInput(event.detail === 0 ? "keyboard" : "pointer")}><Icon name="x" size={20} /></button>
          </Dialog.Close>
        </div>
        <LanguageChoices choices={choices} loadingLabel={loadingLabel} unavailableLabel={unavailableLabel} source={content}
          onCurrent={() => setOpen(false)} />
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

/** One navigation control for the marketplace, microsites and missing pages.
 * Route locale remains authoritative; this only resolves destination links.
 */
export function LanguageDisclosure({
  currentLocale, pathname, label, options, loadingLabel, unavailableLabel, closeLabel,
  placement = "below", compact, triggerClassName, alternates,
}: {
  currentLocale: Locale;
  pathname?: string;
  label: string;
  options: { locale: Locale; label: string }[];
  loadingLabel: string;
  unavailableLabel: string;
  closeLabel: string;
  placement?: "above" | "below";
  compact?: "responsive";
  triggerClassName?: string;
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
  const mobile = useSyncExternalStore(subscribeMobile, getMobile, getServerMobile);
  const choices: LanguageChoice[] = options.map(option => {
    const current = option.locale === currentLocale;
    const target = current ? localizedPathname(visiblePathname, option.locale)
      : destinations ? destinations[option.locale]
      : needsAlternates ? undefined : localizedPathname(visiblePathname, option.locale);
    return { ...option, current, target, href: target ? `${target}${browserUrl?.search ?? ""}${browserUrl?.hash ?? ""}` : undefined, unavailable: destinations !== undefined };
  });

  useEffect(() => {
    const disclosure = ref.current;
    if (!disclosure) return;
    if (mobile) {
      disclosure.open = false;
      return;
    }
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
        trigger?.focus({ preventScroll: true });
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
  }, [mobile]);

  useEffect(() => {
    const previous = previousRoute.current;
    previousRoute.current = { locale: currentLocale, pathname: routerPathname };
    if (previous.locale === currentLocale && previous.pathname === routerPathname) return;
    const disclosure = ref.current;
    if (disclosure?.open) {
      if (disclosure.contains(document.activeElement)) disclosure.querySelector("summary")?.focus({ preventScroll: true });
      disclosure.open = false;
    }
  }, [currentLocale, routerPathname]);

  return (
    <>
      {/* Native details can open before hydration; preserve that browser-owned
          attribute. Labels and destination links still undergo hydration checks. */}
      <details ref={ref} className={styles.language} data-placement={placement} data-compact={compact} data-mobile-drawer={mobile || undefined} suppressHydrationWarning>
        <summary className={`${styles.trigger}${triggerClassName ? ` ${triggerClassName}` : ""}`} aria-label={`${label}: ${currentLabel}`}>
          <span className={styles.globe}><Icon name="globe" size={17} /></span>
          <span className={styles.label} lang={currentLocale} dir="auto">{currentLabel}</span>
          <span className={styles.chevron} aria-hidden="true"><Icon name="chevD" size={12} /></span>
        </summary>
        <nav className={styles.panel} aria-label={label}>
          <LanguageChoices choices={choices} loadingLabel={loadingLabel} unavailableLabel={unavailableLabel} source={ref}
            onCurrent={() => {
              if (ref.current) { ref.current.open = false; ref.current.querySelector("summary")?.focus({ preventScroll: true }); }
            }} />
        </nav>
      </details>
      {mobile && <MobileLanguageDrawer key={`${currentLocale}:${routerPathname}`} label={label} currentLabel={currentLabel}
        closeLabel={closeLabel} compact={compact} triggerClassName={triggerClassName} choices={choices} loadingLabel={loadingLabel} unavailableLabel={unavailableLabel} />}
      <Suspense fallback={null}><RouterLocationSync /></Suspense>
    </>
  );
}
