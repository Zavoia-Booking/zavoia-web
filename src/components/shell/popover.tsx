"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Port of ZwPopover (docs/web-account.jsx). Fixed under the nav, right-aligned
// to the content container; a full-viewport backdrop catches outside clicks and
// Escape closes. Rendered into <body> via a portal because the sticky nav's
// backdrop-filter would otherwise trap position:fixed children to the nav box.
// The portal is guarded behind a mount flag so it never runs during SSR.

export type PopoverProps = {
  onClose: () => void;
  triggerId: string;
  width?: number;
  label: string;
  children: ReactNode;
};

function tabbableElements(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(
    'a[href], button, input, select, textarea, summary, [tabindex]',
  )).filter((element) =>
    element.tabIndex >= 0 && !element.matches(":disabled") &&
    !element.closest("[inert]") && element.getClientRects().length > 0 &&
    getComputedStyle(element).visibility === "visible",
  );
}

export function Popover({ onClose, triggerId, width = 380, label, children }: PopoverProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // SSR-safe portal guard: createPortal must only run on the client. Marking
    // mounted on first client effect is the canonical pattern for this.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !panelRef.current) return;
    const panel = panelRef.current;
    (tabbableElements(panel)[0] ?? panel).focus({ preventScroll: true });
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const panel = panelRef.current;
      const trigger = document.getElementById(triggerId);
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        if (trigger?.isConnected) trigger.focus({ preventScroll: true });
      } else if (e.key === "Tab" && panel?.contains(document.activeElement)) {
        const controls = tabbableElements(panel);
        const active = document.activeElement;
        if (active === panel && controls.length > 0) {
          e.preventDefault();
          (e.shiftKey ? controls[controls.length - 1] : controls[0]).focus();
          return;
        }
        const boundary = e.shiftKey ? controls[0] : controls[controls.length - 1];
        if (active === boundary || controls.length === 0) {
          // The portal is at the end of body; resume the page's tab order
          // beside its trigger instead of sending focus through the whole page.
          const pageControls = tabbableElements(document).filter((element) => !panel.contains(element));
          const index = trigger ? pageControls.indexOf(trigger) : -1;
          const next = index >= 0 ? pageControls[index + (e.shiftKey ? -1 : 1)] : undefined;
          onClose();
          if (next) {
            e.preventDefault();
            next.focus();
          }
        }
      }
    };
    const onFocus = (e: FocusEvent) => {
      const target = e.target;
      if (target instanceof Node && !panelRef.current?.contains(target) &&
          target !== document.getElementById(triggerId)) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
    };
  }, [mounted, onClose, triggerId]);

  if (!mounted) return null;

  const node = (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, zIndex: 190, cursor: "pointer" }}
      />
      <div
        ref={panelRef}
        id={`${triggerId}-panel`}
        role="dialog"
        tabIndex={-1}
        aria-label={label}
        className="zv-fade"
        style={{
          position: "fixed",
          zIndex: 191,
          top: "calc(var(--nav-h) + 10px)",
          right:
            "max(var(--gutter), calc((100vw - var(--content-max)) / 2))",
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
