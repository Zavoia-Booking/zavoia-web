export interface BlogMetaProps {
  date: string;
  read: string;
  size?: number;
  color?: string;
  dot?: string;
}

// Inline "date · read" meta line with a 3px separator dot. Ported from
// ZwBlogMeta (docs/web-blog.jsx:69-77).
export function BlogMeta({
  date,
  read,
  size = 13,
  color = "var(--c-600)",
  dot = "var(--c-400)",
}: BlogMetaProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: size,
        color,
        whiteSpace: "nowrap",
      }}
    >
      <span>{date}</span>
      <span
        aria-hidden="true"
        style={{ width: 3, height: 3, borderRadius: "50%", background: dot }}
      />
      <span>{read}</span>
    </span>
  );
}
