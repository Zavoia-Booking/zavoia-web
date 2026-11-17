"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { Avatar, Button, Icon, InlineError, Skeleton, useToast } from "@/components/ui";
import { LanguageSwitcher } from "@/app/_components/language-switcher";
import type { Locale } from "@/i18n/locales";
import { useLocaleAlternates } from "@/i18n/locale-navigation";
import { localeHref } from "@/i18n/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { authEntryHref } from "@/lib/auth/redirects";
import { useAuth } from "@/lib/auth/useAuth";
import { useConsent } from "@/lib/consent/ConsentProvider";
import { routeKey } from "./active-route";
import { accountNavigation, AccountNavigationIcon, type AccountNavigationItem } from "./account-navigation";
import styles from "./mobile-navigation.module.css";

type Phase = "closed" | "opening" | "open" | "closing";

function subscribeMotion(notify: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const serverMotion = () => true;

function MenuGlyph() {
  return <span className={styles.glyph} aria-hidden="true"><i /><i /></span>;
}

/** The Studio Underlay pattern, adapted to marketplace routes and account state. */
export function MobileNavigation({ locale, onSearch, showSearch = true }: { locale: Locale; onSearch: () => void; showSearch?: boolean }) {
  const { dict } = useTranslation();
  const { status, user, optimisticUser, initializing, refresh, logout } = useAuth();
  const { openSettings } = useConsent();
  const toast = useToast();
  const pathname = usePathname();
  const key = routeKey(pathname);
  const alternates = useLocaleAlternates(pathname);
  const reduce = useSyncExternalStore(subscribeMotion, reducedMotion, serverMotion);
  const [phase, setPhase] = useState<Phase>("closed");
  const [instant, setInstant] = useState(true);
  const [retryingSession, setRetryingSession] = useState(false);
  const expanded = phase === "opening" || phase === "open";
  const mounted = phase !== "closed";
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const navigating = useRef(false);
  const panelId = useId();
  const account = user ?? optimisticUser;
  const signedIn = status === "authenticated" && !!user;
  const pendingSession = initializing && !signedIn;
  const name = account ? `${account.firstName} ${account.lastName}`.trim() : "";
  const links = accountNavigation(dict);
  const t = dict.accountMenu;

  // Keep the actual page as the moving surface. No transform or compositor
  // promotion remains when closed, so fixed booking bars keep their viewport.
  useLayoutEffect(() => {
    if (!mounted) return;
    const page = document.querySelector<HTMLElement>("[data-marketplace-page]");
    const wasInert = page?.inert;
    if (page) page.inert = true;
    document.body.dataset.mobileMenuEngaged = "true";
    return () => {
      if (page) page.inert = wasInert ?? false;
      delete document.body.dataset.mobileMenuEngaged;
      document.body.style.removeProperty("--zw-mobile-menu-progress");
      progress.current = 0;
    };
  }, [mounted]);

  useLayoutEffect(() => {
    if (!mounted) return;
    const target = expanded ? 1 : 0;
    const from = progress.current;
    const finish = () => setPhase(target === 1 ? "open" : "closed");
    const write = (value: number) => {
      progress.current = value;
      document.body.style.setProperty("--zw-mobile-menu-progress", String(value));
    };
    if (reduce || instant || Math.abs(target - from) < .0001) {
      write(target);
      finish();
      return;
    }
    const duration = target === 1 ? 360 : 180;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - elapsed) ** 3;
      write(from + (target - from) * eased);
      if (elapsed < 1) frame = requestAnimationFrame(tick);
      else finish();
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [mounted, expanded, reduce, instant]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 921px)");
    const close = () => { if (desktop.matches) setPhase("closed"); };
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, []);

  const toggle = (detail: number) => {
    navigating.current = false;
    setInstant(detail === 0);
    setPhase(expanded ? "closing" : "opening");
  };
  const current = mounted ? `${window.location.pathname}${window.location.search}${window.location.hash}` : pathname;
  const accountHref = signedIn ? localeHref(locale, "account") : authEntryHref(locale, "login", current, alternates);
  const navigate = () => {
    navigating.current = true;
    setPhase("closed");
  };
  const retrySession = async () => {
    if (retryingSession) return;
    setRetryingSession(true);
    try { await refresh(); }
    finally { setRetryingSession(false); }
  };
  const onLogout = async () => {
    navigate();
    try { await logout(); }
    finally { toast(t.loggedOut, "check"); }
  };
  const row = (item: AccountNavigationItem, disabled = false) => {
    const content = <>
      <span className={styles.leading}><AccountNavigationIcon icon={item.icon} size={17} color={item.accent ? "var(--p-600)" : "var(--c-600)"} /></span>
      <span className={styles.rowLabel}>{item.label}</span>
    </>;
    return disabled
      ? <span key={item.key} role="link" aria-disabled="true" className={styles.row}>{content}</span>
      : <Link key={item.key} href={localeHref(locale, ...item.segments)} className={styles.row} data-accent={item.accent || undefined} onNavigate={navigate}>{content}</Link>;
  };
  const identity = <>
    <span className={styles.leading}>
      {name || account?.profileImage
        ? <Avatar name={name} src={account?.profileImage ?? undefined} size={36} decorative />
        : pendingSession ? <Skeleton w={36} h={36} r="50%" />
          : <span className={styles.accountIcon}><Icon name="user" size={18} /></span>}
    </span>
    <span className={styles.identityText}>
      {pendingSession ? <>
        {name ? <strong>{name}</strong> : <Skeleton w={108} h={16} />}
        <Skeleton w={128} h={13} />
      </> : <>
        <strong>{signedIn ? name || dict.nav.account : t.welcome}</strong>
        <span>{signedIn ? user?.email || dict.nav.account : t.loginOrSignUp}</span>
      </>}
    </span>
  </>;

  return <Dialog.Root open={mounted} onOpenChange={next => {
    if (!next) setPhase("closing");
  }}>
    <div className={styles.controls}>
      {showSearch && <button type="button" className={styles.search} onClick={onSearch} aria-label={dict.nav.search}>
        <Icon name="search" size={18} />
      </button>}
      <button ref={trigger} type="button" className={styles.toggle} aria-label={dict.nav.openMenu}
        aria-expanded={expanded} aria-controls={panelId} aria-haspopup="dialog" onClick={event => toggle(event.detail)}>
        <MenuGlyph />
      </button>
    </div>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.overlay} />
      <Dialog.Content id={panelId} ref={panel} className={styles.panel} aria-describedby={undefined}
        onEscapeKeyDown={() => setInstant(true)}
        onPointerDownOutside={() => setInstant(false)}
        onCloseAutoFocus={event => {
          event.preventDefault();
          if (!navigating.current) trigger.current?.focus({ preventScroll: true });
        }}
        onClickCapture={event => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[data-locale]");
          if (link && link.getAttribute("aria-current") !== "true") navigating.current = true;
        }}>
        <div className={styles.panelHeader}>
          <Dialog.Title className="sr-only">{dict.nav.navigation}</Dialog.Title>
          <Link href={localeHref(locale)} className={styles.homeLink} aria-label={dict.nav.homeAria}
            aria-current={key === "" ? "page" : undefined} onNavigate={navigate}>
            <Image src="/brand/zavoia-logo.png" alt="Zavoia" width={440} height={145} unoptimized className={styles.wordmark} />
          </Link>
          <button type="button" className={styles.toggle} aria-label={expanded ? dict.nav.closeMenu : dict.nav.openMenu}
            aria-expanded={expanded} onClick={event => toggle(event.detail)}>
            <MenuGlyph />
          </button>
        </div>
        <div className={`${styles.panelBody} zw-noscrollbar`} inert={!expanded}>
          <span role="status" className="sr-only">{pendingSession || retryingSession ? dict.account.loading : ""}</span>
          {status === "error" ? <div className={styles.sessionError}>
            <InlineError>{t.sessionError}</InlineError>
            <Button kind="secondary" size="sm" loading={retryingSession} onClick={() => void retrySession()}>{dict.errors.retry}</Button>
          </div> : pendingSession
            ? <div className={styles.identity} aria-busy="true">{identity}</div>
            : <Link href={accountHref} className={styles.identity} onNavigate={navigate}>{identity}<Icon name="arrowR" size={16} /></Link>}

          <nav className={styles.navigation} aria-label={dict.nav.navigation}>
            <div className={styles.group}>
              <Link href={localeHref(locale, "search")}
                className={styles.row} aria-current={key === "search" ? "page" : undefined}
                prefetch={key === "search" ? false : undefined}
                onClick={event => {
                  if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setInstant(event.detail === 0);
                }}
                onNavigate={event => {
                  if (key === "search") {
                    event.preventDefault();
                    setPhase("closing");
                  } else navigate();
                }}>
                <span className={styles.leading}><Icon name="search" size={17} color="var(--c-600)" /></span>
                <span className={styles.rowLabel}>{dict.mobileTabs.search}</span>
                {key === "search" && <Icon name="arrowR" size={15} />}
              </Link>
            </div>
            {(signedIn || pendingSession) && <div className={styles.group}>{links.personal.map(item => row(item, pendingSession))}</div>}
            <div className={styles.group}>{links.community.map(item => row(item))}</div>
            <div className={styles.group}>{links.business.map(item => row(item))}</div>
            <div className={styles.group}>
              {links.legal.map(item => row(item))}
              <button type="button" className={styles.row} onClick={() => {
                navigate();
                requestAnimationFrame(openSettings);
              }}><span className={styles.leading}><Icon name="cookie" size={17} color="var(--c-600)" /></span><span className={styles.rowLabel}>{dict.footer.cookieSettings}</span></button>
            </div>
          </nav>
          <div className={styles.group}>
            <LanguageSwitcher currentLocale={locale} triggerClassName={styles.languageTrigger} />
          </div>
          {status !== "error" && (signedIn || pendingSession) && <div className={styles.group}>
            {pendingSession
              ? <span role="button" aria-disabled="true" className={styles.row}><span className={styles.leading}><Icon name="logout" size={17} color="var(--c-600)" /></span><span className={styles.rowLabel}>{t.logout}</span></span>
              : <button type="button" className={styles.row} onClick={() => void onLogout()}><span className={styles.leading}><Icon name="logout" size={17} color="var(--c-600)" /></span><span className={styles.rowLabel}>{t.logout}</span></button>}
          </div>}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
