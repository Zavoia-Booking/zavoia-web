"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { Icon } from "@/components/ui/icon";
import styles from "./blog-post.module.css";

export interface TocProps {
  headings: { id: string; text: string; level?: 2 | 3 }[];
  label: string;
}

export function Toc({ headings, label }: TocProps) {
  const [active, setActive] = useState(headings[0]?.id);

  useEffect(() => {
    if (!headings.length) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.28;
      let current = headings[0].id;
      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (element && element.getBoundingClientRect().top <= line) current = heading.id;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [headings]);

  const jump = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const details = event.currentTarget.closest("details");
    if (details) details.open = false;
    window.history.pushState(null, "", `#${encodeURIComponent(id)}`);
    target.focus({ preventScroll: true });
    target.scrollIntoView({
      block: "start",
      behavior:
        event.detail === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
    });
    setActive(id);
  };

  const links = headings.map((heading) => (
    <a
      key={heading.id}
      href={`#${encodeURIComponent(heading.id)}`}
      className={styles.tocLink}
      data-level={heading.level ?? 2}
      aria-current={active === heading.id ? "location" : undefined}
      onClick={(event) => jump(event, heading.id)}
    >
      {heading.text}
    </a>
  ));

  return (
    <>
      <nav className={styles.tocDesktop} aria-label={label}>
        <p className={styles.tocLabel}>{label}</p>
        {links}
      </nav>
      <details className={styles.tocMobile}>
        <summary>
          {label}
          <Icon name="chevD" size={16} />
        </summary>
        <nav aria-label={label}>{links}</nav>
      </details>
    </>
  );
}
