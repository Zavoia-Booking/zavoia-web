"use client";

import { useEffect, useRef } from "react";

// Reading-progress hairline pinned under the site nav. Long legal documents
// run past a dozen sections, so the bar answers "how much is left" without the
// reader hunting for a scrollbar (they are hidden site-wide by globals.css).
// Writes the scale directly to the node — this repaints on every scroll frame
// and has no business re-rendering React.
export function LegalProgress() {
  const fill = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        if (fill.current) fill.current.style.transform = `scaleX(${p})`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="zw-legal-prog zw-legal-noprint" aria-hidden="true">
      <div ref={fill} className="zw-legal-prog-fill" style={{ transform: "scaleX(0)" }} />
    </div>
  );
}
