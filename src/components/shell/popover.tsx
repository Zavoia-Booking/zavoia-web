"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Port of ZwPopover (docs/web-account.jsx). Fixed under the nav, right-aligned
// to the content container; a full-viewport backdrop catches outside clicks and
// Escape closes. Rendered into <body> via a portal because the sticky nav's
// backdrop-filter would otherwise trap position:fixed children to the nav box.
// The portal is guarded behind a mount flag so it never runs during SSR.

export type PopoverProps = {
  onClose: () => void;
  width?: number;
  label: string;
  children: ReactNode;
};

export function Popover({ onClose, width = 380, label, children }: PopoverProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // SSR-safe portal guard: createPortal must only run on the client. Marking
    // mounted on first client effect is the canonical pattern for this.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  const node = (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, zIndex: 190 }}
      />
      <div
        role="dialog"
        aria-label={label}
        className="zv-fade"
        style={{
          position: "fixed",
          zIndex: 191,
          top: "calc(var(--nav-h) + 10px)",
          right:
            "max(var(--gutter), calc((100vw - var(--content-max)) / 2 + var(--gutter)))",
          width: `min(${width}px, calc(100vw - 24px))`,
          background: "#fff",
          borderRadius: 20,
          border: "1px solid rgba(28,28,26,0.08)",
          boxShadow: "var(--sh-lg)",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </>
  );

  return createPortal(node, document.body);
}
