"use client";

export interface LocaleScrollPosition {
  id: string;
  top: number;
  left: number;
  atBottom: boolean;
}

export interface LocaleNavigation {
  scrollPositions: LocaleScrollPosition[];
  documentScroll: {
    top: number;
    left: number;
    bottom: number | null;
  } | null;
}

const SCROLL_INTENT_EVENTS = ["pointerdown", "touchstart", "wheel", "keydown"] as const;

/** One pending navigation hint for motion/scroll, never a source of locale state. */
let pending: {
  source: string;
  target: string;
  navigation: LocaleNavigation;
  dispose: () => void;
} | null = null;

function clearPending() {
  const previous = pending;
  pending = null;
  previous?.dispose();
}

/** Call from a locale Link's onNavigate, after any no-op/prevention checks. */
export function markLocaleNavigation(targetPathname: string, source?: HTMLElement | null) {
  clearPending();
  const target = new URL(targetPathname, window.location.href);
  if (target.origin !== window.location.origin || target.pathname === window.location.pathname) return;

  // Capture runs before Link's onNavigate: the initiating click has already
  // passed this phase, while a subsequent link can supersede the pending one.
  const superseded = (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.target instanceof Element && event.target.closest("a[href]")) clearPending();
  };
  const abandonScroll = () => {
    if (!pending) return;
    // Input during a slow request invalidates the click-time positions, but
    // this is still a translation and should not replay the page's entrance.
    pending.navigation.documentScroll = null;
    pending.navigation.scrollPositions = [];
  };
  // A failed/abandoned navigation must not affect a later visit to this URL.
  const timeout = window.setTimeout(clearPending, 30_000);
  document.addEventListener("click", superseded, true);
  window.addEventListener("popstate", clearPending);
  window.addEventListener("pagehide", clearPending);
  for (const event of SCROLL_INTENT_EVENTS) window.addEventListener(event, abandonScroll, true);
  const scroller = document.scrollingElement ?? document.documentElement;
  const bottom = Math.max(0, scroller.scrollHeight - scroller.clientHeight - window.scrollY);
  pending = {
    source: window.location.pathname,
    target: target.pathname,
    navigation: {
      // A locale subtree remount can briefly shrink the document and clamp its
      // viewport even though the Link disables Next's automatic scrolling.
      documentScroll: source?.closest("[data-locale-scroll]") ? null : {
        top: window.scrollY,
        left: window.scrollX,
        // Keep the footer in view when translated content above it changes height.
        bottom: source?.closest("footer") || (scroller.scrollHeight > scroller.clientHeight && bottom <= 2)
          ? bottom : null,
      },
      // Only explicitly marked nested scrollers participate. Do not retain DOM
      // nodes or persist positions beyond this one language navigation.
      scrollPositions: [...document.querySelectorAll<HTMLElement>("[data-locale-scroll]")].map((element) => ({
        id: element.dataset.localeScroll!,
        top: element.scrollTop,
        left: element.scrollLeft,
        atBottom: element.scrollHeight > element.clientHeight
          && element.scrollHeight - element.clientHeight - element.scrollTop <= 2,
      })),
    },
    dispose: () => {
      window.clearTimeout(timeout);
      document.removeEventListener("click", superseded, true);
      window.removeEventListener("popstate", clearPending);
      window.removeEventListener("pagehide", clearPending);
      for (const event of SCROLL_INTENT_EVENTS) window.removeEventListener(event, abandonScroll, true);
    },
  };
}

/** Consume only at the destination commit; another committed route cancels it. */
export function consumeLocaleNavigation(pathname: string): LocaleNavigation | null {
  if (!pending) return null;
  const matches = pending.target === pathname;
  const navigation = matches ? pending.navigation : null;
  if (matches || pending.source !== pathname) clearPending();
  return navigation;
}

/** Follow streamed/translated document heights until the visitor takes control. */
export function preserveLocaleDocumentScroll(position: LocaleNavigation["documentScroll"]): () => void {
  if (!position) return () => {};
  const pathname = window.location.pathname;
  let active = true;
  let frame = 0;
  let timeout = 0;
  let observer: ResizeObserver | undefined;
  const cancel = () => {
    active = false;
    cancelAnimationFrame(frame);
    window.clearTimeout(timeout);
    observer?.disconnect();
    for (const event of SCROLL_INTENT_EVENTS) window.removeEventListener(event, cancel, true);
    window.removeEventListener("popstate", cancel);
    window.removeEventListener("pagehide", cancel);
  };
  const restore = () => {
    if (!active) return;
    if (window.location.pathname !== pathname) { cancel(); return; }
    const scroller = document.scrollingElement ?? document.documentElement;
    const target = position.bottom === null ? position.top
      : Math.max(0, scroller.scrollHeight - scroller.clientHeight - position.bottom);
    const top = Math.min(target, Math.max(0, scroller.scrollHeight - scroller.clientHeight));
    if (Math.abs(window.scrollY - top) > 1 || Math.abs(window.scrollX - position.left) > 1) {
      window.scrollTo({ top, left: position.left, behavior: "instant" });
    }
  };
  restore();
  // Layout effects run before paint. Recheck after passive effects, and when
  // loading boundaries, fonts or client feeds change the destination's height.
  frame = requestAnimationFrame(restore);
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(restore);
    observer.observe(document.body);
    observer.observe(document.documentElement);
  }
  // No long-lived scroll owner or position storage survives this transition.
  timeout = window.setTimeout(cancel, 30_000);
  for (const event of SCROLL_INTENT_EVENTS) window.addEventListener(event, cancel, true);
  window.addEventListener("popstate", cancel);
  window.addEventListener("pagehide", cancel);
  return cancel;
}

/** Restore the same nested viewport, or its bottom when translated copy changes height. */
export function restoreLocaleScroll(root: HTMLElement, positions: LocaleScrollPosition[]): LocaleScrollPosition[] {
  const missing = new Set(positions);
  for (const element of root.querySelectorAll<HTMLElement>("[data-locale-scroll]")) {
    const position = positions.find((item) => item.id === element.dataset.localeScroll);
    if (!position) continue;
    element.scrollTo({
      top: position.atBottom ? element.scrollHeight - element.clientHeight : position.top,
      left: position.left,
      behavior: "instant",
    });
    missing.delete(position);
  }
  return [...missing];
}

/** A loading boundary can commit before its nested scrolling pane is mounted. */
export function waitForLocaleScroll(root: HTMLElement, positions: LocaleScrollPosition[]): () => void {
  if (!positions.length) return () => {};
  const pathname = window.location.pathname;
  let missing = positions;
  let active = true;
  const cancel = () => {
    active = false;
    observer.disconnect();
    window.clearTimeout(timeout);
    for (const event of SCROLL_INTENT_EVENTS) window.removeEventListener(event, cancel, true);
    window.removeEventListener("popstate", cancel);
    window.removeEventListener("pagehide", cancel);
  };
  const observer = new MutationObserver(() => {
    if (!active) return;
    if (window.location.pathname !== pathname) { cancel(); return; }
    missing = restoreLocaleScroll(root, missing);
    if (!missing.length) cancel();
  });
  observer.observe(root, { childList: true, subtree: true });
  const timeout = window.setTimeout(cancel, 30_000);
  for (const event of SCROLL_INTENT_EVENTS) window.addEventListener(event, cancel, true);
  window.addEventListener("popstate", cancel);
  window.addEventListener("pagehide", cancel);
  return cancel;
}
