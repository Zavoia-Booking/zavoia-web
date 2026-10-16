"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { BlogTab } from "@/lib/blog";
import { Skeleton } from "@/components/ui/skeleton";

export interface BlogTabsProps {
  cats: { id: BlogTab; label: string }[];
  counts: Record<string, number>;
  active: BlogTab;
  onChange: (id: BlogTab) => void;
  pending?: boolean;
}

// Editorial tab bar with a sliding ink underline + story counts. Ported from
// ZwBlogTabs (docs/web-blog.jsx:82-110). The indicator is measured from the
// active [data-on="1"] tab's offsetLeft/offsetWidth on mount, on active/cats
// change, on resize, and once more after a short delay (fonts settling).
export function BlogTabs({ cats, counts, active, onChange, pending = false }: BlogTabsProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  useLayoutEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const el = wrap.querySelector<HTMLElement>('[data-on="1"]');
      if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    const t = setTimeout(measure, 60); // after fonts settle
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(t);
    };
  }, [active, cats]);

  return (
    <div
      ref={wrapRef}
      className="zw-jtabs"
      role="tablist"
      aria-label="Filter stories"
    >
      {cats.map((c) => (
        <button
          key={c.id}
          type="button"
          className="zw-jtab"
          role="tab"
          aria-selected={active === c.id}
          data-on={active === c.id ? "1" : "0"}
          onClick={() => onChange(c.id)}
          disabled={pending}
        >
          {c.label}
          <span className="zw-jtab-n" style={{ minWidth: "2ch" }}>
            {pending ? <Skeleton w="2ch" h={10} r={3} /> : counts[c.id]}
          </span>
        </button>
      ))}
      <span className="zw-jtabs-rail" aria-hidden="true" />
      <span
        className="zw-jtabs-ind"
        aria-hidden="true"
        style={{ left: ind.left, width: ind.width }}
      />
    </div>
  );
}
