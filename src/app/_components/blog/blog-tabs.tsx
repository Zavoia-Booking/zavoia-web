"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { BlogTab } from "@/lib/blog";
import { useTranslation } from "@/i18n/useTranslation";
import { Skeleton } from "@/components/ui/skeleton";
import styles from "./blog-list.module.css";

export interface BlogTabsProps {
  cats: { id: BlogTab; label: string }[];
  counts: Record<string, number>;
  active: BlogTab;
  onChange: (id: BlogTab) => void;
  pending?: boolean;
}

/** Category filters keep the editorial underline and use native button semantics. */
export function BlogTabs({ cats, counts, active, onChange, pending = false }: BlogTabsProps) {
  const { dict } = useTranslation();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let alive = true;
    const measure = () => {
      if (!alive) return;
      const selected = wrap.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (selected) setIndicator({ left: selected.offsetLeft, width: selected.offsetWidth });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    for (const child of wrap.children) if (child instanceof HTMLElement) observer.observe(child);
    void document.fonts.ready.then(measure);
    return () => { alive = false; observer.disconnect(); };
  }, [active, cats]);

  return (
    <div ref={wrapRef} className={styles.filters} role="group" aria-label={dict.blog.filterLabel}>
      {cats.map((category) => (
        <button
          key={category.id}
          type="button"
          className={styles.filter}
          aria-pressed={active === category.id}
          onClick={() => { if (category.id !== active) onChange(category.id); }}
          disabled={pending}
        >
          {category.label}
          <span className={styles.filterCount}>
            {pending ? <Skeleton w="2ch" h={12} r={3} /> : counts[category.id]}
          </span>
        </button>
      ))}
      <span
        className={styles.indicator}
        aria-hidden="true"
        style={{ transform: `translateX(${indicator.left}px) scaleX(${indicator.width})` }}
      />
    </div>
  );
}
