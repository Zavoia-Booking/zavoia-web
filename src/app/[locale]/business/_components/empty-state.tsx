import { Icon, type IconName } from "@/components/ui";

/**
 * Shared tab/section empty state — used by the location page's Services and
 * Reviews tabs and the team-member profile modal's Reviews section. Mirrors
 * the Saved page's empty-state grammar: shade circle + outline glyph, title,
 * one line of guidance.
 */
export function EmptyState({
  icon,
  title,
  body,
}: {
  icon: IconName;
  title: string;
  body: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "36px 20px",
      }}
    >
      <span
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--c-shade)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Icon name={icon} size={24} color="var(--c-600)" />
      </span>
      <div
        style={{
          fontSize: 16.5,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--c-900)",
        }}
      >
        {title}
      </div>
      <p
        className="txt-pretty"
        style={{
          margin: "7px auto 0",
          fontSize: 13.5,
          lineHeight: 1.55,
          color: "var(--c-600)",
          maxWidth: 300,
        }}
      >
        {body}
      </p>
    </div>
  );
}
