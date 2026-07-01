"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon } from "@/components/ui";

export interface ActionModalProps {
  title: string;
  /** Optional secondary line under the title. */
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Called once the close-out animation completes (~220ms after a close). */
  onClose: () => void;
  /** Card max width in px. Defaults to 480. */
  width?: number;
}

/**
 * Shared centered-modal shell for the appointment action dialogs.
 *
 * Ports `ZwModal` from `docs/web-appointment-actions.jsx:14-69`: a centered card
 * over a blurred backdrop, scale-in on open (`zw-modal-in`) and scale-out on
 * close (`zw-modal-out`) with a ~220ms delay before the parent unmounts it.
 *
 * Accessibility / UX (mirrors BookingDrawer):
 * - `role="dialog"`, `aria-modal`, an accessible label from `title`.
 * - Closes on ESC, on backdrop click, and via the header close button.
 * - Locks body scroll while mounted; restores the previous value on unmount.
 * - Restores focus to the previously-focused element on unmount.
 */
const CLOSE_ANIM_MS = 220;

export function ActionModal({
  title,
  subtitle,
  children,
  footer,
  onClose,
  width = 480,
}: ActionModalProps) {
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animate out, then ask the parent to unmount us. `onClose` comes from the
  // provider's useCallback-stable `close`, so closing over it here is safe.
  const requestClose = useCallback(() => {
    if (closeTimerRef.current) return;
    setClosing(true);
    closeTimerRef.current = setTimeout(onClose, CLOSE_ANIM_MS);
  }, [onClose]);

  // ── ESC to close + scroll-lock + focus restore (effect-based, like BookingDrawer). ──
  useEffect(() => {
    const previouslyFocused =
      typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = closeTimerRef;
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (timer.current) clearTimeout(timer.current);
      // Restore focus politely (do not steal focus if it has already moved on).
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [requestClose]);

  return (
    <div
      className="zv-sheet-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(28,28,26,0.34)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        className={closing ? "zw-modal-out" : "zw-modal-in"}
        style={{
          width: `min(${width}px, 100%)`,
          maxHeight: "calc(100vh - 40px)",
          background: "var(--c-canvas)",
          borderRadius: 24,
          boxShadow: "var(--sh-xl)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 22px 16px",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            borderBottom: "1px solid rgba(28,28,26,0.07)",
            background: "#fff",
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--c-900)",
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div
                className="txt-pretty"
                style={{
                  fontSize: 13.5,
                  color: "var(--c-600)",
                  marginTop: 4,
                  lineHeight: 1.45,
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
          <button
            type="button"
            className="tap"
            onClick={requestClose}
            aria-label="Close"
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: 0,
              background: "var(--c-100)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="x" size={15} color="var(--c-800)" />
          </button>
        </div>

        {/* Body */}
        <div
          className="zw-scroll-y"
          style={{ flex: 1, minHeight: 0, padding: "20px 22px" }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: "14px 22px",
              borderTop: "1px solid rgba(28,28,26,0.07)",
              background: "#fff",
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact venue/service header used inside every action modal.
 * Ports `ZwApptMini` (web-appointment-actions.jsx:72-89): a ~52px photo from the
 * location image (falling back to the business logo), the booked service line,
 * and a `business · staff` sub-line.
 */
export function ApptMini({
  photo,
  serviceLine,
  business,
  staffName,
  photoLabel,
}: {
  photo: string | null;
  serviceLine: string;
  business: string;
  staffName: string | null;
  photoLabel?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        background: "#fff",
        border: "1px solid rgba(28,28,26,0.08)",
        borderRadius: 14,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 11,
          overflow: "hidden",
          background: "var(--c-300)",
          flexShrink: 0,
        }}
      >
        <ApptMiniImg src={photo} label={photoLabel} alt={business} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            color: "var(--c-900)",
            letterSpacing: "-0.015em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {serviceLine}
        </div>
        <div style={{ fontSize: 13, color: "var(--c-600)", marginTop: 2 }}>
          {business}
          {staffName ? ` · ${staffName}` : ""}
        </div>
      </div>
    </div>
  );
}

// Small local image with a graceful fallback (mirrors the prototype's ZImg use
// inside ZwApptMini without depending on the shared Img's i18n placeholder).
function ApptMiniImg({
  src,
  alt,
  label,
}: {
  src: string | null;
  alt: string;
  label?: string;
}) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div
        className="zv-stripe"
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {label && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: "var(--c-600)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {label}
          </span>
        )}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setErr(true)}
      loading="lazy"
      decoding="async"
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}
