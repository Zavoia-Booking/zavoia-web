"use client";

import { useLayoutEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { SectionEntry } from "@/features/website/types";
import type { PreviewData } from "@/features/website/components/builder/preview/shared/types";
import { Skeleton } from "@/components/ui/skeleton";

const LivePreview = dynamic(() =>
  import("@/features/website/components/builder/preview/Microsite").then(
    (module) => module.LivePreview,
  ),
);

/**
 * A catalogue plate: the real microsite renderer at a fixed desktop width,
 * scaled down to the plate's width — the same trick a browser zoom uses, so a
 * small plate still shows the true desktop arrangement instead of the
 * mobile-collapsed one a narrow container query would trigger.
 *
 * Unlike the builder's ScaledPreview (which clips to a caller-sized box), this
 * plate reserves a responsive frame before its renderer, fonts or images load.
 * Compact sections use a shallow frame; the other specimens share a 16:10
 * viewport. Content beyond that frame fades at the edge.
 *
 * `inert` makes the subtree fully non-interactive (pointer, focus, assistive
 * tech) — the sections contain real links and buttons that must never be
 * reachable from a specimen.
 */
export function SpecimenPlate({
  layout,
  data,
  chrome = false,
  virtualWidth = 1240,
  minHeight = 140,
  maxHeight = 620,
  pending = false,
}: {
  layout: SectionEntry[];
  data: PreviewData;
  chrome?: boolean;
  virtualWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  pending?: boolean;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  // Server-render as desktop; the phone arrangement resolves on mount.
  const [phone, setPhone] = useState(false);

  useLayoutEffect(() => {
    const query = window.matchMedia("(max-width: 600px)");
    const sync = () => setPhone(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    // Fractional width keeps the scale exact — clientWidth rounds to an integer.
    const update = () => setWidth(el.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const update = () => setContentHeight(el.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The sections are container-query driven (cqw throughout), so the virtual
  // width decides which arrangement a specimen shows. That choice keys off the
  // VIEWPORT, not the plate: a desktop plate is often only ~560px wide, and
  // sizing by its own width would hand a desktop visitor the phone layout
  // (hamburger nav and all). On a phone the specimen renders near 1:1, which
  // is both legible and the honest proof of the "right on a phone" claim.
  const effectiveWidth = phone ? Math.max(width, 430) : virtualWidth;
  const scale = width > 0 ? width / effectiveWidth : 0;
  const natural = contentHeight * scale;
  const compact = layout.every((section) => !section.visible || ["nav", "announcement", "marquee"].includes(section.type));
  const height = Math.min(Math.max(width / (compact ? 8 : 1.6), minHeight), maxHeight);
  const cropped = natural > height + 1;
  const ready = !pending && width > 0 && contentHeight > 0;

  return (
    <div
      ref={outerRef}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: compact ? "8 / 1" : "16 / 10",
        minHeight,
        maxHeight,
        overflow: "hidden",
        background: "var(--c-shade)",
      }}
    >
      <div
        ref={innerRef}
        // Boolean, not `inert=""` — React 19 reads an empty string as false and
        // the specimen's real links and buttons would stay focusable.
        inert
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: effectiveWidth,
          transform: `scale(${scale || 0.0001})`,
          transformOrigin: "top left",
          opacity: ready ? 1 : 0,
        }}
      >
        {!pending && <LivePreview layout={layout} data={data} chrome={chrome} />}
      </div>
      {!ready && <Skeleton h="100%" r={0} style={{ position: "absolute", inset: 0 }} />}
      {ready && cropped && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            insetInline: 0,
            bottom: 0,
            height: 84,
            pointerEvents: "none",
            background:
              "linear-gradient(to bottom, transparent, color-mix(in oklch, var(--c-canvas) 92%, transparent))",
          }}
        />
      )}
    </div>
  );
}
