"use client";

import { Button } from "@/components/ui/button";

export interface LocationPermissionModalProps {
  open: boolean;
  onAllow: () => void;
  onSkip: () => void;
  /** Disables both buttons + shows a loading state on the primary while resolving. */
  busy?: boolean;
  title: string;
  body: string;
  allowLabel: string;
  skipLabel: string;
}

// Location-permission "priming" modal shown over the /search map on a fresh
// empty landing. It primes the user before the native geolocation prompt and
// offers an explicit skip (which falls back to IP → Bucharest). Covers the map
// area with a semi-transparent backdrop + a centered card.
export function LocationPermissionModal({
  open,
  onAllow,
  onSkip,
  busy = false,
  title,
  body,
  allowLabel,
  skipLabel,
}: LocationPermissionModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(28,28,26,0.32)",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          width: "min(380px, 100%)",
          background: "#fff",
          borderRadius: 22,
          boxShadow: "var(--sh-xl)",
          border: "1px solid rgba(28,28,26,0.07)",
          padding: "26px 24px 22px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            fontSize: 19,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--c-900)",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: "var(--c-600)",
          }}
        >
          {body}
        </div>
        <div
          style={{
            marginTop: 4,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            width: "100%",
          }}
        >
          <Button
            kind="primary"
            size="md"
            onClick={onAllow}
            disabled={busy}
            style={{ width: "100%" }}
          >
            {busy ? "…" : allowLabel}
          </Button>
          <Button
            kind="ghost"
            size="md"
            onClick={onSkip}
            disabled={busy}
            style={{ width: "100%" }}
          >
            {skipLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
