"use client";

import { useEffect, useState } from "react";

export interface LegalTocProps {
  sections: { id: string; title: string }[];
  label: string;
}

// Sticky numbered contents rail with a scroll-driven scrollspy. Mirrors the
// Journal's ZwToc gesture (scroll position rather than IntersectionObserver,
// rAF-throttled) so the two long-form reading surfaces navigate identically.
// The rail is made sticky, and hidden below 1024px, by globals.css — the
// narrow-viewport contents live in the server-rendered <details> disclosure.
export function LegalToc({ sections, label }: LegalTocProps) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    if (!sections.length) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const line = window.scrollY + window.innerHeight * 0.28;
        let cur = sections[0].id;
        for (const s of sections) {
          const el = document.getElementById(s.id);
          if (el && el.getBoundingClientRect().top + window.scrollY <= line) {
            cur = s.id;
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
  }, [sections]);

  if (!sections.length) return null;

  const jump = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <nav className="zw-legal-toc zw-legal-noprint" aria-label={label}>
      <div className="zw-legal-toc-lbl">
        <span>{label}</span>
        <span className="zw-legal-toc-total">
          {String(sections.length).padStart(2, "0")}
        </span>
      </div>
      {sections.map((s, i) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="zw-legal-toc-link"
          data-on={active === s.id ? "1" : "0"}
          aria-current={active === s.id ? "true" : undefined}
          onClick={(e) => jump(e, s.id)}
        >
          <span className="zw-legal-toc-n" aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span>{s.title}</span>
        </a>
      ))}
    </nav>
  );
}
