"use client";

import { useState, type CSSProperties } from "react";

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: number;
  ring?: boolean;
}

export function Avatar({ src, name = "?", size = 40, ring = false }: AvatarProps) {
  const [err, setErr] = useState(false);
  const initial = (name || "?").trim()[0]?.toUpperCase() || "?";
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    background: "var(--c-200)",
    color: "var(--c-700)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    fontSize: size * 0.42,
    flexShrink: 0,
    overflow: "hidden",
    boxShadow: ring ? "0 0 0 2px var(--c-canvas), 0 0 0 3px var(--c-300)" : "none",
  };
  if (!src || err) {
    return (
      <div style={style} aria-label={name}>
        {initial}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} onError={() => setErr(true)} style={{ ...style, objectFit: "cover" }} />
  );
}
