export interface BlogMetaProps {
  date: string;
  read: string;
  /** Byline before the date, on the article page only. */
  author?: string;
  size?: number;
  color?: string;
  dot?: string;
}

// Date and reading time may wrap as whole groups on a narrow card.
export function BlogMeta({
  date,
  read,
  author,
  size = 13.5,
  color = "var(--c-600)",
  dot = "var(--c-400)",
}: BlogMetaProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "4px 8px",
        minWidth: 0,
        fontSize: size,
        lineHeight: 1.45,
        fontVariantNumeric: "tabular-nums",
        color,
      }}
    >
      {author && <span style={{ whiteSpace: "nowrap" }}>{author}</span>}
      <span style={author ? { display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" } : { whiteSpace: "nowrap" }}>
        {author && (
          <span
            aria-hidden="true"
            style={{ width: 3, height: 3, flexShrink: 0, borderRadius: "50%", background: dot }}
          />
        )}
        {date}
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
        <span
          aria-hidden="true"
          style={{ width: 3, height: 3, flexShrink: 0, borderRadius: "50%", background: dot }}
        />
        {read}
      </span>
    </span>
  );
}
