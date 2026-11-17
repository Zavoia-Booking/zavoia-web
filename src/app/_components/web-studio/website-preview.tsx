"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/locales";
import type { SectionEntry, SectionType } from "@/features/website/types";
import { demoExampleData, type DemoExampleId } from "./demo-examples";
import { withDemoSectionCopy } from "./demo-catalog";
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
  const previewLayout = useMemo(() => {
    const authored = withDemoSectionCopy(layout, example);
    return section && section !== "hero"
      ? authored.map(entry => ({ ...entry, visible: entry.type === section || entry.type === "nav" }))
      : authored;
  }, [layout, example, section]);
  const assetKey = `${locale}:${font}:${accent}:${example}:${variant}:${section ?? "hero"}:${phone}`;
  const [loadedAssets, setLoadedAssets] = useState("");
  const onReady = useCallback(() => setLoadedAssets(assetKey), [assetKey]);

  return (
    <figure className={styles.preview} aria-label={label} aria-busy={pending || loadedAssets !== assetKey} data-studio-preview="" data-device={phone ? "phone" : "desktop"} data-responsive-phone={!browser && !portrait ? "" : undefined}>
      <div className={phone ? styles.phone : styles.browser}>
        {!phone && <div className={styles.browserBar} aria-hidden="true"><span className={styles.browserDots}><i /><i /><i /></span></div>}
        <div className={styles.glass}>
          <SpecimenPlate
            key={assetKey}
            layout={previewLayout}
            data={data}
            chrome
            virtualWidth={phone ? 430 : 1240}
            frameRatio={frameRatio ?? (phone ? 430 / 840 : 1.75)}
            responsive={false}
            deviceViewport
            heroOnly={!section || section === "hero"}
            onReady={onReady}
            minHeight={100}
            maxHeight={900}
            pending={pending}
          />
        </div>
      </div>
    </figure>
  );
}
