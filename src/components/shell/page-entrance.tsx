"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import {
  consumeLocaleNavigation, preserveLocaleDocumentScroll, restoreLocaleScroll, type LocaleNavigation,
  waitForLocaleScroll,
} from "@/i18n/locale-transition";

// Audited one-time entrances in the builder CSS. Finish existing instances at
// this commit only: later location/gallery changes and Shuffle still animate.
// Ambient drift loops, lightbox transitions and interactive motion are excluded.
const BUILDER_ENTRANCES = new Set([
  "mcHeroFade", "mcHeroUp", "mcHeroWord", "mcPlateReveal", "mcPlateZoom", "mc-dr-in",
  "mcMaskIn", "mcLocxFade", "mcLocxRowIn", "mcGalleryTitleRise",
  "mcShowcaseImage", "mcShowcaseRise", "mcShowcaseReveal",
  "mcAtlasImage", "mcAtlasRise", "mcAtlasReveal", "mcAtlasSheet",
  "mcPanoramaControlsReveal",
]);

function finishBuilderEntrances(element: HTMLElement): void {
  if (typeof CSSAnimation === "undefined" || !element.getAnimations) return;
  for (const animation of element.getAnimations({ subtree: true })) {
    if (!(animation instanceof CSSAnimation) || !BUILDER_ENTRANCES.has(animation.animationName)) continue;
    const timing = animation.effect?.getComputedTiming();
    if (!timing || !Number.isFinite(timing.endTime) || animation.playbackRate === 0) continue;
    animation.finish();
  }
}

/** Keep first visits animated, but translate the current page without replaying
 * its entrance. The ancestor flag also covers content that streams in later.
 */
export function PageEntrance({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const committed = useRef<{ path: string; navigation: LocaleNavigation } | null>(null);
  const pathname = usePathname();

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    // Read the public URL after commit; the default locale uses a proxy rewrite.
    const currentPath = window.location.pathname;
    const navigation = consumeLocaleNavigation(currentPath);
    if (navigation) committed.current = { path: currentPath, navigation };
    if (committed.current?.path !== currentPath) {
      committed.current = null;
      delete element.dataset.localeNavigation;
      return;
    }
    element.dataset.localeNavigation = "true";
    const positions = committed.current.navigation.scrollPositions;
    const restore = () => {
      finishBuilderEntrances(element);
      return restoreLocaleScroll(element, positions);
    };
    // Restore mounted panes now and wait for panes behind loading boundaries.
    // Repeat once after passive effects to include measured demo dock padding.
    const stopWaitingForScroll = waitForLocaleScroll(element, restore());
    const stopDocumentScroll = preserveLocaleDocumentScroll(committed.current.navigation.documentScroll);
    let frame = 0;
    const cancel = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointerdown", cancel, true);
      window.removeEventListener("wheel", cancel, true);
      window.removeEventListener("keydown", cancel, true);
    };
    frame = requestAnimationFrame(() => { cancel(); restore(); });
    window.addEventListener("pointerdown", cancel, true);
    window.addEventListener("wheel", cancel, true);
    window.addEventListener("keydown", cancel, true);
    return () => { cancel(); stopDocumentScroll(); stopWaitingForScroll(); };
  }, [pathname]);

  return <div ref={ref} className="zw-page-in">{children}</div>;
}
