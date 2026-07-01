"use client";

import { useEffect, useState } from "react";

export interface TocProps {
  headings: { id: string; text: string }[];
  label: string;
}

// Sticky right-hand table of contents with a scroll-driven scrollspy. Ported
// from ZwToc (web-blog.jsx:474-512). Uses scroll position (not an
// IntersectionObserver) for reliability; rAF-throttled. The `.zw-toc` is made
// sticky by globals.css. SSR-safe: window/document are only read inside the
// effect / event handlers, which run after mount.
export function Toc({ headings, label }: TocProps) {
  const [active, setActive] = useState(headings[0]?.id);

  useEffect(() => {
    if (!headings.length) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const line = window.scrollY + window.innerHeight * 0.28;
        let cur = headings[0].id;
        for (const h of headings) {
          const el = document.getElementById(h.id);
          if (el && el.getBoundingClientRect().top + window.scrollY <= line) {
            cur = h.id;
          }
        }
        setActive(cur);
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
  }, [headings]);

  if (!headings.length) return null;

  const jump = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <nav className="zw-toc" aria-label={label}>
      <div className="zw-toc-label">{label}</div>
      {headings.map((h) => (
        <a
          key={h.id}
          href={"#" + h.id}
          className="zw-toc-link"
          data-on={active === h.id ? "1" : "0"}
          onClick={(e) => jump(e, h.id)}
        >
          {h.text}
        </a>
      ))}
    </nav>
  );
}
