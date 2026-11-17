"use client";

import { useEffect, type RefObject } from "react";

type DrawerViewportRefs = {
  contentRef: RefObject<HTMLElement | null>;
  overlayRef: RefObject<HTMLElement | null>;
};

const properties = [
  "--drawer-viewport-top",
  "--drawer-viewport-height",
  "--drawer-viewport-bottom",
] as const;

type Original = {
  properties: { name: typeof properties[number]; value: string; priority: string }[];
  keyboard: string | null;
};

function isEditable(element: Element | null): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;
  if (element.isContentEditable) return true;
  if (element instanceof HTMLTextAreaElement) return !element.disabled && !element.readOnly;
  return element instanceof HTMLInputElement && !element.disabled && !element.readOnly
    && !["button", "checkbox", "color", "file", "hidden", "image", "radio", "range", "reset", "submit"].includes(element.type);
}

/** Keep a mounted mobile drawer inside the area above the software keyboard. */
export function useDrawerViewport({ contentRef, overlayRef }: DrawerViewportRefs) {
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 920px)");
    const viewport = window.visualViewport;
    const originals = new Map<HTMLElement, Original>();
    let frame = 0;
    let keyboard = false;
    let restingHeight = 0;
    let restingWidth = 0;

    const restore = () => {
      for (const [element, original] of originals) {
        for (const property of original.properties) {
          if (property.value) element.style.setProperty(property.name, property.value, property.priority);
          else element.style.removeProperty(property.name);
        }
        if (original.keyboard === null) element.removeAttribute("data-drawer-keyboard");
        else element.setAttribute("data-drawer-keyboard", original.keyboard);
      }
      originals.clear();
    };

    const sync = () => {
      frame = 0;
      if (!mobile.matches) {
        restore();
        keyboard = false;
        restingHeight = 0;
        restingWidth = 0;
        return;
      }
      // Follow keyboard resizing, while leaving deliberate pinch zoom alone.
      if (viewport && Math.abs(viewport.scale - 1) > .01) return;
      const layoutHeight = Math.max(window.innerHeight, document.documentElement.clientHeight);
      const height = viewport?.height ?? window.innerHeight;
      if (height <= 0) return;
      if (Math.abs(window.innerWidth - restingWidth) > 1) {
        restingWidth = window.innerWidth;
        restingHeight = layoutHeight;
        keyboard = false;
      }
      const top = Math.max(0, viewport?.offsetTop ?? 0);
      const bottom = Math.max(0, layoutHeight - top - height);
      const active = document.activeElement;
      const editing = isEditable(active) && !!contentRef.current?.contains(active);
      if (!keyboard && !editing) restingHeight = Math.max(layoutHeight, height);
      const shrink = Math.max(layoutHeight, restingHeight) - height;
      const threshold = Math.max(120, Math.max(layoutHeight, restingHeight) * .18);
      // Blurring an input must not expand the paper during keyboard dismissal.
      keyboard = (editing && shrink > threshold) || (keyboard && shrink > 80);

      const values = [`${top}px`, `${height}px`, `${bottom}px`];
      for (const element of new Set([contentRef.current, overlayRef.current])) {
        if (!element) continue;
        if (!originals.has(element)) originals.set(element, {
          properties: properties.map(name => ({ name, value: element.style.getPropertyValue(name), priority: element.style.getPropertyPriority(name) })),
          keyboard: element.getAttribute("data-drawer-keyboard"),
        });
        properties.forEach((name, index) => {
          if (element.style.getPropertyValue(name) !== values[index]) element.style.setProperty(name, values[index]);
        });
        if (keyboard) element.setAttribute("data-drawer-keyboard", "true");
        else element.removeAttribute("data-drawer-keyboard");
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };

    schedule();
    mobile.addEventListener("change", schedule);
    window.addEventListener("resize", schedule);
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", schedule);
    return () => {
      cancelAnimationFrame(frame);
      mobile.removeEventListener("change", schedule);
      window.removeEventListener("resize", schedule);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      document.removeEventListener("focusin", schedule);
      document.removeEventListener("focusout", schedule);
      restore();
    };
  }, [contentRef, overlayRef]);
}
