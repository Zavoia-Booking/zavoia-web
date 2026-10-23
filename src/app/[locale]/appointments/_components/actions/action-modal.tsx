"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Icon } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./action-fields.module.css";

export interface ActionModalProps {
  title: string;
  /** Optional secondary line under the title. */
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Called once the close-out animation completes (~220ms after a close). */
  onClose: () => void;
  /** Prevent user dismissal while the action is being submitted. */
  dismissible?: boolean;
  /** Called synchronously when a user dismissal starts. */
  onClosing?: () => void;
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
 * Radix owns the modal focus scope, background isolation and scroll lock. It stays
 * open through the exit animation so background content cannot receive focus early.
 * Appointment buttons live outside Dialog.Trigger, so focus restoration is explicit.
 */
const CLOSE_ANIM_MS = 220;

export function ActionModal({
  title,
  subtitle,
  children,
  footer,
  onClose,
  dismissible = true,
  onClosing,
  width = 480,
}: ActionModalProps) {
  const { dict } = useTranslation();
  const descriptionId = useId();
  const [closing, setClosing] = useState(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animate out, then close the action that requested dismissal.
  const requestClose = useCallback(() => {
    if (!dismissible || closeTimerRef.current) return;
    onClosing?.();
    setClosing(true);
    closeTimerRef.current = setTimeout(onClose, CLOSE_ANIM_MS);
  }, [dismissible, onClose, onClosing]);

  useEffect(() => {
    const timer = closeTimerRef;
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) requestClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="zv-sheet-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            background: "rgba(28,28,26,0.34)",
            cursor: dismissible ? "pointer" : "default",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <DialogPrimitive.Content
            className={closing ? "zw-modal-out" : "zw-modal-in"}
            aria-describedby={subtitle ? descriptionId : undefined}
            onOpenAutoFocus={() => {
              // Capture before Radix focuses the first enabled control inside the dialog.
              returnFocusRef.current =
                document.activeElement instanceof HTMLElement
                  ? document.activeElement
                  : null;
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (returnFocusRef.current?.isConnected) {
                returnFocusRef.current.focus({ preventScroll: true });
              }
            }}
            onEscapeKeyDown={(event) => {
              if (!dismissible) event.preventDefault();
            }}
            onPointerDownOutside={(event) => {
              if (!dismissible) event.preventDefault();
            }}
            style={{
              width: `min(${width}px, 100%)`,
              cursor: "default",
              maxHeight: "calc(100dvh - 40px)",
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
                <DialogPrimitive.Title asChild>
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
                </DialogPrimitive.Title>
                {subtitle && (
                  <DialogPrimitive.Description asChild id={descriptionId}>
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
                  </DialogPrimitive.Description>
                )}
              </div>
              <button
                type="button"
                className="tap"
                onClick={requestClose}
                disabled={!dismissible}
                aria-label={dict.booking.close}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: 0,
                  background: "var(--c-100)",
                  cursor: dismissible ? "pointer" : "default",
                  opacity: dismissible ? 1 : 0.5,
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
                className={styles.footer}
                style={{
                  padding: "14px 22px",
                  borderTop: "1px solid rgba(28,28,26,0.07)",
                  background: "#fff",
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                {footer}
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
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
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      }}
    />
  );
}
