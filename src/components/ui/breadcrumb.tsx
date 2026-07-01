import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

// Mono trail for content/SEO pages. Ported from ZwBreadcrumb
// (docs/web-marketing.jsx:15-32). Linked items use next/link; the last item
// (no href) is the current page and renders as muted, non-interactive text.
export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
        fontFamily: "var(--font-mono)",
        fontSize: 11.5,
        fontWeight: 500,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--c-500)",
      }}
    >
      {items.map((it, i) => (
        <span
          key={i}
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          {i > 0 && (
            <span aria-hidden="true" style={{ color: "var(--c-400)" }}>
              /
            </span>
          )}
          {it.href ? (
            <Link
              href={it.href}
              className="zw-link"
              style={{ color: "var(--c-600)", textDecoration: "none" }}
            >
              {it.label}
            </Link>
          ) : (
            <span style={{ color: "var(--c-800)" }}>{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
