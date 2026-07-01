export interface CatChipProps {
  label: string;
  accent: string;
}

// Mono uppercase category chip with a 6px accent dot. Ported from
// ZwBlogCatChip (docs/web-blog.jsx:56-67). Accent drives both the text colour
// and the dot, matching how featured/cards pass the per-category accent for
// both `color` and `dot` in the prototype.
export function CatChip({ label, accent }: CatChipProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: accent,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: accent,
        }}
      />
      {label}
    </span>
  );
}
