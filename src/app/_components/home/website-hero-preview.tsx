"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PublicWebsiteShowcaseCard } from "@/lib/api/marketplace/types";
import type { Locale } from "@/i18n/locales";
import { displayFontFor, fontStylesheetFor, previewVars } from "@/features/website/components/builder/theme";
import type { WebsiteHeroSnapshotProps } from "@/features/website/components/builder/preview/WebsiteHeroSnapshot";
import { createWebsiteT } from "@/features/website/i18n/translate";
import "@/features/website/components/builder/preview/shared/animations.css";
import styles from "./website-hero-preview.module.css";

const VIRTUAL_WIDTH = 1040;
const ASSET_TIMEOUT = 5000;

const WebsiteSnapshot = dynamic(async () => {
  const { WebsiteHeroSnapshot } = await import("@/features/website/components/builder/preview/WebsiteHeroSnapshot");
  return function MountedSnapshot({ onReady, ...props }: WebsiteHeroSnapshotProps & { onReady: () => void }) {
    useEffect(() => {
      // Allow the static variants' layout and passive effects to settle before revealing them.
      let second = 0;
      const first = requestAnimationFrame(() => { second = requestAnimationFrame(onReady); });
      return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
    }, [onReady]);
    return <WebsiteHeroSnapshot {...props} />;
  };
});

function within<T>(task: Promise<T>, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(fallback), ASSET_TIMEOUT);
    task.then(resolve, () => resolve(fallback)).finally(() => window.clearTimeout(timer));
  });
}

const fontStylesheets = new Map<string, Promise<boolean>>();

function loadFontStylesheet(href: string): Promise<boolean> {
  const cached = fontStylesheets.get(href);
  if (cached) return cached;
  const request = within(new Promise<boolean>((resolve) => {
    let link = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
      .find((candidate) => candidate.href === href);
    if (link?.sheet) { resolve(true); return; }
    const existing = !!link;
    link ??= document.createElement("link");
    link.addEventListener("load", () => resolve(true), { once: true });
    link.addEventListener("error", () => resolve(false), { once: true });
    if (!existing) {
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
  }), false);
  fontStylesheets.set(href, request);
  return request;
}

async function loadFont(fontKey: string, sample: string): Promise<string> {
  const stylesheet = fontStylesheetFor(fontKey);
  if (stylesheet && !(await loadFontStylesheet(stylesheet))) return "modern";
  const font = displayFontFor(fontKey);
  const loaded = await within(
    document.fonts.load(`${font.weight} 32px ${font.stack}`, sample).then((faces) => !stylesheet || faces.length > 0),
    false,
  );
  return loaded ? fontKey : "modern";
}

function loadImage(src: string | null): Promise<string | null> {
  if (!src) return Promise.resolve(null);
  return within(new Promise<string | null>((resolve) => {
    const image = new Image();
    image.onload = () => { void image.decode().then(() => resolve(src), () => resolve(null)); };
    image.onerror = () => resolve(null);
    image.src = src;
  }), null);
}

type Props = { site: PublicWebsiteShowcaseCard; locale: Locale };

export function WebsiteHeroPreview(props: Props) {
  const { site, locale } = props;
  return <Preview key={`${site.slug}:${site.publishedVersion}:${locale}:${site.heroImageUrl}:${site.logo}:${site.fontKey}`} {...props} />;
}

function Preview({ site, locale }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [screen, setScreen] = useState({ width: 0, height: 0 });
  const [active, setActive] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [assets, setAssets] = useState<{ fontKey: string; cover: string | null; logo: string | null } | null>(null);
  const onReady = useCallback(() => setRendered(true), []);
  const t = useMemo(() => createWebsiteT(locale), [locale]);

  useEffect(() => {
    const screenElement = frameRef.current;
    if (!screenElement) return;
    const observer = new ResizeObserver(([entry]) => {
      // The carousel scales inactive cards. Its visual bounding box is not the layout width.
      if (entry) setScreen({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(screenElement);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    if (typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setActive(true));
      return () => cancelAnimationFrame(id);
    }
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      setActive(true);
      observer.disconnect();
    }, { rootMargin: "400px 0px", threshold: 0 });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    let current = true;
    const usesCover = !["poster", "drift", "tumble"].includes(site.hero.variant);
    void Promise.all([
      loadFont(site.fontKey ?? "modern", site.name),
      loadImage(usesCover ? site.heroImageUrl : null),
      loadImage(site.logo),
    ]).then(([fontKey, cover, logo]) => {
      if (current) setAssets({ fontKey, cover, logo });
    });
    return () => { current = false; };
  }, [active, site.fontKey, site.name, site.hero.variant, site.heroImageUrl, site.logo]);

  const ready = rendered && assets !== null;
  const scale = screen.width / VIRTUAL_WIDTH;
  const virtualHeight = scale > 0 ? screen.height / scale : 0;
  return (
    <div ref={frameRef} className={`${styles.frame} mc-scaled-preview-static`} aria-hidden="true" inert>
      {active && scale > 0 && virtualHeight > 0 && assets && (
        <div
          className={`${styles.viewport} mc-root`}
          style={{
            ...previewVars(site.brandColor, assets.fontKey),
            "--mc-vph": `${virtualHeight}px`,
            width: VIRTUAL_WIDTH,
            height: virtualHeight,
            transform: `scale(${scale})`,
            opacity: ready ? 1 : 0,
          } as CSSProperties}
        >
          <WebsiteSnapshot
            entry={site.hero}
            layout={site.layout}
            data={{
              businessName: site.name,
              logo: assets.logo,
              announcement: site.announcement,
              businessTimezone: site.timezone,
              tagline: site.tagline ?? "",
              heroImageUrl: assets.cover,
              locations: site.locations,
              locale,
            }}
            t={t}
            onReady={onReady}
          />
        </div>
      )}
      {!ready && <Skeleton h="100%" r={0} className={styles.skeleton} />}
    </div>
  );
}
