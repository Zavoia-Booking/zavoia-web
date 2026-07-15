"use client";

import { useEffect, useRef, useState } from "react";
import { BusinessRow, type BusinessCardData } from "@/components/business";
import { Icon } from "@/components/ui/icon";

export interface MapFloatingCardProps {
  data: BusinessCardData | null;
  onClose: () => void;
  closeAria: string;
  favorited?: boolean;
  /** Forwarded to the BusinessRow — the heart only renders when provided. */
  onFavorite?: (id: BusinessCardData["id"]) => void;
  /** Distance from the bottom of the map area (kept clear of the mobile toggle). */
  bottomOffset?: number;
  /** Left inset of the card region (e.g. past the desktop results panel). */
  insetLeft?: string;
  /** Right inset of the card region. */
  insetRight?: string;
}

// Floating card shown over the /search map when a pin is selected. Built from
// already-loaded result data (no fetch). The card body is a BusinessRow that
// becomes a next/link to the detail page; a close button dismisses it without
// triggering navigation. Driven by `selectedId` upstream (pin click only).
//
// It is centered within the region between insetLeft/insetRight (the space to
// the right of the desktop results panel; full width on mobile). Animates in on
// appear and out on dismiss — on close the `zv-card-out` animation plays while a
// fixed timeout fires onClose (~the animation duration) to clear selection and
// unmount, so dismissal is deterministic even if the animation never runs. The
// enter/exit is driven purely by event handlers (no setState-in-effect).
export function MapFloatingCard({
  data,
  onClose,
  closeAria,
  favorited,
  onFavorite,
  bottomOffset = 28,
  insetLeft = "0px",
  insetRight = "0px",
}: MapFloatingCardProps) {
  const [closing, setClosing] = useState(false);
  // Browser timer id (window.setTimeout returns number); client-only component.
  const timerRef = useRef<number | undefined>(undefined);

  // Cancel a pending dismiss timer on unmount so a close-then-quick-reselect
  // can't fire onClose against the new selection. Cleanup-only — no setState.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!data) return null;

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (closing) return; // ignore double-clicks
    setClosing(true); // play the zv-card-out animation
    // Drive dismissal off a timeout (not onAnimationEnd) so the close button
    // always works even if the CSS animation never runs. ~ zv-card-out 0.24s
    // + small buffer → unmount when onClose clears selectedId.
    timerRef.current = window.setTimeout(onClose, 280);
  };

  return (
    <div
      style={{
        position: "absolute",
        left: insetLeft,
        right: insetRight,
        bottom: bottomOffset,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 45,
      }}
    >
      <div
        className={closing ? "zv-card-out" : "zv-card-in"}
        style={{
          position: "relative",
          width: "min(430px, calc(100% - 32px))",
          pointerEvents: "auto",
          background: "var(--c-canvas)",
          borderRadius: 20,
          boxShadow: "var(--sh-xl)",
          border: "1px solid rgba(28,28,26,0.07)",
          padding: 6,
        }}
      >
        <BusinessRow b={data} favorited={favorited} onFavorite={onFavorite} />
        <button
          type="button"
          className="tap"
          aria-label={closeAria}
          onClick={handleClose}
          style={{
            position: "absolute",
            top: -10,
            right: -10,
            zIndex: 2,
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: 0,
            background: "var(--c-ink)",
            color: "#fff",
            boxShadow: "0 2px 8px rgba(28,28,26,0.28)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="x" size={15} />
        </button>
      </div>
    </div>
  );
}
