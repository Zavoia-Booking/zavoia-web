/** Elevate an enhanced disclosure above sticky footers and clipped microsites.
 * Native details remains the fallback when JavaScript or Popover is unavailable.
 */
export function enhanceLanguagePanel(disclosure: HTMLDetailsElement) {
  const trigger = disclosure.querySelector("summary");
  const panel = disclosure.querySelector<HTMLElement>(":scope > nav");
  if (!trigger || !panel || typeof panel.showPopover !== "function") {
    return { sync() {}, dispose() {} };
  }

  const originalStyle = panel.getAttribute("style");
  const originalPopover = panel.getAttribute("popover");
  panel.setAttribute("popover", "manual");
  Object.assign(panel.style, {
    position: "fixed", inset: "auto", margin: "0", maxWidth: "none",
    boxSizing: "border-box", overflowY: "auto", color: "inherit",
  });

  function sync() {
    if (!panel || !trigger) return;
    if (!disclosure.open || !disclosure.isConnected) {
      if (panel.matches(":popover-open")) panel.hidePopover();
      return;
    }
    if (!panel.matches(":popover-open")) panel.showPopover();
    const viewport = window.visualViewport;
    const leftEdge = (viewport?.offsetLeft ?? 0) + 12;
    const topEdge = (viewport?.offsetTop ?? 0) + 12;
    const width = Math.max(0, (viewport?.width ?? document.documentElement.clientWidth) - 24);
    const height = Math.max(0, (viewport?.height ?? window.innerHeight) - 24);
    const rect = trigger.getBoundingClientRect();
    const panelWidth = Math.min(224, width);
    panel.style.width = `${panelWidth}px`;
    panel.style.maxHeight = "none";
    // offsetHeight excludes the disclosure's existing entrance transform.
    const naturalHeight = panel.offsetHeight;
    const above = Math.max(0, rect.top - topEdge - 9);
    const below = Math.max(0, topEdge + height - rect.bottom - 9);
    const preferAbove = disclosure.dataset.placement === "above";
    const preferredSpace = preferAbove ? above : below;
    const otherSpace = preferAbove ? below : above;
    const placeAbove = preferredSpace >= naturalHeight || preferredSpace >= otherSpace
      ? preferAbove : !preferAbove;
    const availableHeight = Math.min(height, placeAbove ? above : below);
    const panelHeight = Math.min(naturalHeight, availableHeight);
    const top = placeAbove ? rect.top - 9 - panelHeight : rect.bottom + 9;
    panel.style.maxHeight = `${availableHeight}px`;
    panel.style.left = `${Math.max(leftEdge, Math.min(rect.right - panelWidth, leftEdge + width - panelWidth))}px`;
    panel.style.top = `${Math.max(topEdge, Math.min(top, topEdge + height - panelHeight))}px`;
    panel.style.transformOrigin = placeAbove ? "bottom right" : "top right";
  }

  const toggle = (event: Event) => { if (event.target === disclosure) sync(); };
  disclosure.addEventListener("toggle", toggle);
  window.addEventListener("resize", sync);
  document.addEventListener("scroll", sync, true);
  window.visualViewport?.addEventListener("resize", sync);
  window.visualViewport?.addEventListener("scroll", sync);
  sync();

  return {
    sync,
    dispose() {
      disclosure.removeEventListener("toggle", toggle);
      window.removeEventListener("resize", sync);
      document.removeEventListener("scroll", sync, true);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      if (panel.matches(":popover-open")) panel.hidePopover();
      if (originalPopover === null) panel.removeAttribute("popover");
      else panel.setAttribute("popover", originalPopover);
      if (originalStyle === null) panel.removeAttribute("style");
      else panel.setAttribute("style", originalStyle);
    },
  };
}
