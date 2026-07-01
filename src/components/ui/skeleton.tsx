import type { CSSProperties } from "react";

export interface SkeletonProps {
  w?: number | string;
  h?: number | string;
  r?: number | string;
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ w = "100%", h = 16, r = 8, className, style }: SkeletonProps) {
  return (
    <div
      className={["zv-skel", className].filter(Boolean).join(" ")}
      style={{ width: w, height: h, borderRadius: r, ...style }}
    />
  );
}
