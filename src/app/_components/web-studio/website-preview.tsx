"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/locales";
import type { SectionEntry, SectionType } from "@/features/website/types";
import { displayFontFor } from "@/features/website/components/builder/theme";
import { demoExampleData, type DemoExampleId } from "./demo-examples";
import { SpecimenPlate } from "./specimen-plate";
import styles from "./preview-device.module.css";

const mobileQuery = "(max-width: 700px)";
const subscribeDevice = (listener: () => void) => {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
};
const currentDevice = () => window.matchMedia(mobileQuery).matches;
const serverDevice = () => false;

/** A finished website, using the actual renderer and its actual responsive layout. */
export function WebsitePreview({ locale, example, variant, font, accent, portrait = false, label, pending = false, layout, section, browser = false, frameRatio }: {
  locale: Locale;
  example: DemoExampleId;
  variant: string;
  font: string;
  accent: string;
  portrait?: boolean;
  label: string;
  pending?: boolean;
  layout: SectionEntry[];
  /** A detail screen shows one actual section, with the same site navigation. */
  section?: Extract<SectionType, "hero" | "gallery" | "services">;
  browser?: boolean;
  frameRatio?: number;
}) {
  const smallScreen = useSyncExternalStore(subscribeDevice, currentDevice, serverDevice);
  const phone = !browser && (portrait || smallScreen);
  const data = useMemo(() => demoExampleData(locale, accent, font, example), [locale, accent, font, example]);
  const previewLayout = useMemo(() => section && section !== "hero"
    ? layout.map(entry => ({ ...entry, visible: entry.type === section || entry.type === "nav" }))
    : layout, [layout, section]);
  const assetKey = `${locale}:${font}:${data.heroImageUrl}`;
  const [loadedAssets, setLoadedAssets] = useState("");

  useEffect(() => {
    let active = true;
    const fontReady = async () => {
      const display = displayFontFor(font);
      await document.fonts.load(`${display.weight} 32px ${display.stack}`, data.businessName).catch(() => undefined);
    };
    const cover = new Image();
    const coverReady = !data.heroImageUrl || variant === "poster" ? Promise.resolve() : new Promise<void>(resolve => {
      cover.onload = () => { void cover.decode().catch(() => undefined).then(resolve); };
      cover.onerror = () => resolve();
      cover.src = data.heroImageUrl!;
    });
    const timer = window.setTimeout(() => { if (active) setLoadedAssets(assetKey); }, 5000);
    void Promise.all([fontReady(), coverReady]).then(() => {
      window.clearTimeout(timer);
      if (active) setLoadedAssets(assetKey);
    });
    return () => { active = false; window.clearTimeout(timer); cover.onload = null; cover.onerror = null; };
  }, [assetKey, font, data.businessName, data.heroImageUrl, variant]);

  return (
    <figure className={styles.preview} aria-label={label} aria-busy={loadedAssets !== assetKey} data-studio-preview="" data-device={phone ? "phone" : "desktop"}>
      <div className={phone ? styles.phone : styles.browser}>
        {!phone && <div className={styles.browserBar} aria-hidden="true"><span className={styles.browserDots}><i /><i /><i /></span></div>}
        <div className={styles.glass}>
          <SpecimenPlate
            layout={previewLayout}
            data={data}
            chrome
            virtualWidth={phone ? 430 : 1240}
            frameRatio={frameRatio ?? (phone ? 430 / 840 : 1.75)}
            responsive={false}
            deviceViewport
            minHeight={100}
            maxHeight={900}
            pending={pending || loadedAssets !== assetKey}
          />
        </div>
      </div>
    </figure>
  );
}
