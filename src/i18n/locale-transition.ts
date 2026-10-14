"use client";

export interface LocaleScrollPosition {
  id: string;
  top: number;
  left: number;
  atBottom: boolean;
}

export interface LocaleNavigation {
  scrollPositions: LocaleScrollPosition[];
}

/** One pending navigation hint for motion/scroll, never a source of locale state. */
let pending: {
  source: string;
  target: string;
  scrollPositions: LocaleScrollPosition[];
  dispose: () => void;
} | null = null;

function clearPending() {
  const previous = pending;
  pending = null;
  previous?.dispose();
}

/** Call from a locale Link's onNavigate, after any no-op/prevention checks. */
export function markLocaleNavigation(targetPathname: string) {
  clearPending();
  const target = new URL(targetPathname, window.location.href);
  if (target.origin !== window.location.origin || target.pathname === window.location.pathname) return;

  // Capture runs before Link's onNavigate: the initiating click has already
  // passed this phase, while a subsequent link can supersede the pending one.
  const superseded = (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.target instanceof Element && event.target.closest("a[href]")) clearPending();
  };
  // A failed/abandoned navigation must not affect a later visit to this URL.
  const timeout = window.setTimeout(clearPending, 30_000);
  document.addEventListener("click", superseded, true);
  window.addEventListener("popstate", clearPending);
  window.addEventListener("pagehide", clearPending);
  pending = {
    source: window.location.pathname,
    target: target.pathname,
    // Only explicitly marked page scrollers participate. Do not retain DOM
    // nodes or persist scroll positions beyond this one language navigation.
    scrollPositions: [...document.querySelectorAll<HTMLElement>("[data-locale-scroll]")].map((element) => ({
      id: element.dataset.localeScroll!,
      top: element.scrollTop,
      left: element.scrollLeft,
      atBottom: element.scrollHeight > element.clientHeight
        && element.scrollHeight - element.clientHeight - element.scrollTop <= 2,
    })),
    dispose: () => {
      window.clearTimeout(timeout);
      document.removeEventListener("click", superseded, true);
      window.removeEventListener("popstate", clearPending);
      window.removeEventListener("pagehide", clearPending);
    },
  };
}

/** Consume only at the destination commit; another committed route cancels it. */
export function consumeLocaleNavigation(pathname: string): LocaleNavigation | null {
  if (!pending) return null;
  const matches = pending.target === pathname;
  const navigation = matches ? { scrollPositions: pending.scrollPositions } : null;
  if (matches || pending.source !== pathname) clearPending();
  return navigation;
}

/** Restore the same nested viewport, or its bottom when translated copy changes height. */
export function restoreLocaleScroll(root: HTMLElement, positions: LocaleScrollPosition[]): void {
  for (const element of root.querySelectorAll<HTMLElement>("[data-locale-scroll]")) {
    const position = positions.find((item) => item.id === element.dataset.localeScroll);
    if (!position) continue;
    element.scrollTo({
      top: position.atBottom ? element.scrollHeight - element.clientHeight : position.top,
      left: position.left,
      behavior: "instant",
    });
  }
}
