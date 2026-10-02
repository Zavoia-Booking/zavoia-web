"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import { Icon } from "@/components/ui/icon";
import {
  INDUSTRY_SLUGS,
  industryIcon,
} from "@/lib/marketplace/industry-visuals";

/**
 * Registers one map image per industry, so the pin symbol layer can draw the
 * right glyph inside each badge (`icon-image: ['get', 'glyph']`).
 *
 * The glyphs are the app's own `<Icon>`s — rendered once into a hidden node,
 * serialised, and handed to `map.addImage`. Rendering them is what keeps this
 * honest: a second copy of the paths, written out as strings for the map, would
 * drift from the icons every other surface draws.
 *
 * Registration is deliberately belt-and-braces, because a badge with no glyph
 * is a silent failure — it still looks like a pin, just a blank one:
 *
 *  - it does not wait on the map's `load` event, which never fires again for a
 *    pooled map that is already loaded (`reuseMaps`) — it checks the map's
 *    current state as well, and listens for `style.load`;
 *  - it stays subscribed to `styleimagemissing`, so a style swap that drops
 *    every registered image re-registers them on demand;
 *  - the decoded bitmaps are cached for the page's lifetime, so a remount
 *    re-registers instantly rather than re-decoding.
 *
 * Mirrors the RN app's `<Images>` block, which registers the same set from the
 * same registry.
 */

/** Source size in device pixels. Registered at PIXEL_RATIO → 96 logical px,
 *  which is what the `icon-size` stops on the symbol layer are calibrated for. */
const GLYPH_PX = 192;
const PIXEL_RATIO = 2;
/** Glyph colour: the app's off-white surface, on a coloured badge. */
const GLYPH_COLOR = "#FEFBF9";
/** The app's icons are drawn for UI at 1.6–1.8; a glyph on a coloured disc at
 *  ~24px needs the heavier weight the mobile pins use. */
const GLYPH_STROKE = "2.2";

/** Map image key for an industry slug. Must match `pinGlyphKey` on mobile. */
export function pinGlyphKey(slug: string): string {
  return `pin-${slug}`;
}

/** slug → decoded bitmap, for the page's lifetime. */
const decoded = new Map<string, HTMLImageElement>();

function svgToDataUrl(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(GLYPH_PX));
  clone.setAttribute("height", String(GLYPH_PX));
  // `currentColor` has nothing to inherit from inside a standalone data URL,
  // so the colour has to be pinned on the root before serialising.
  clone.style.color = GLYPH_COLOR;
  for (const el of Array.from(clone.querySelectorAll("[stroke-width]"))) {
    el.setAttribute("stroke-width", GLYPH_STROKE);
  }
  const markup = new XMLSerializer().serializeToString(clone);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

function decodeAll(host: HTMLElement): Promise<void> {
  const svgs = Array.from(host.querySelectorAll<SVGSVGElement>("svg[data-slug]"));
  return Promise.all(
    svgs.map(
      (svg) =>
        new Promise<void>((resolve) => {
          const slug = svg.dataset.slug;
          if (!slug || decoded.has(slug)) return resolve();
          const img = new window.Image(GLYPH_PX, GLYPH_PX);
          // A glyph that fails to decode leaves that badge blank rather than
          // failing the whole set — the other pins are still legible.
          img.onerror = () => resolve();
          img.onload = () => {
            decoded.set(slug, img);
            resolve();
          };
          img.src = svgToDataUrl(svg);
        }),
    ),
  ).then(() => undefined);
}

export interface PinGlyphsProps {
  mapRef: RefObject<MapRef | null>;
  /** The mapbox Map exists. NOT "the style has loaded" — see the note above. */
  mapReady: boolean;
}

export function PinGlyphs({ mapRef, mapReady }: PinGlyphsProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    const host = hostRef.current;
    if (!mapReady || !map || !host) return;

    let cancelled = false;

    const register = (slug: string) => {
      const img = decoded.get(slug);
      const key = pinGlyphKey(slug);
      if (!img || map.hasImage(key)) return;
      try {
        map.addImage(key, img, { pixelRatio: PIXEL_RATIO });
      } catch {
        // Raced with another registration — the image is already there.
      }
    };

    const registerAll = () => {
      if (cancelled) return;
      for (const slug of decoded.keys()) register(slug);
    };

    // Mapbox asks for an image the moment a feature references one it lacks.
    // This is what makes registration survive a style reload, which drops every
    // registered image without warning and would otherwise leave every badge
    // permanently blank.
    const onMissing = (e: { id: string }) => {
      const slug = e.id.startsWith("pin-") ? e.id.slice(4) : null;
      if (slug) register(slug);
    };
    map.on("styleimagemissing", onMissing);
    // A style swap re-runs the whole registration, not just the missing ones.
    map.on("style.load", registerAll);

    void decodeAll(host).then(registerAll);

    return () => {
      cancelled = true;
      map.off("styleimagemissing", onMissing);
      map.off("style.load", registerAll);
    };
  }, [mapRef, mapReady]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        width: 0,
        height: 0,
        overflow: "hidden",
        visibility: "hidden",
        pointerEvents: "none",
      }}
    >
      {INDUSTRY_SLUGS.map((slug) => (
        <Icon
          key={slug}
          name={industryIcon(slug)}
          size={GLYPH_PX}
          color={GLYPH_COLOR}
          data-slug={slug}
        />
      ))}
    </div>
  );
}
