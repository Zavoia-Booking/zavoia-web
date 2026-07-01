import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { Icon, type IconName } from "@/components/ui/icon";
import { toCat } from "@/lib/marketplace/card-mappers";
import type { CategoryKey } from "@/components/ui/cat-dot";
import type { Industry } from "@/lib/api/marketplace/types";

// Category → icon + dot colour. The colour comes from the per-category CSS var.
const CAT_ICON: Record<CategoryKey, IconName> = {
  hair: "scissors",
  color: "sparkle",
  nails: "sparkle",
  skin: "sparkle",
  massage: "sparkle",
  brow: "sparkle",
  auto: "car",
  dental: "tooth",
  cleaning: "broom",
  fitness: "dumbbell",
  pets: "paw",
  trades: "wrench",
};

// Server component: a horizontal rail of round category chips, one per
// industry TAG, deep-linking to search with a `?tagIds=<id>` querystring.
// Tags are flattened across industries (keeping the parent industry for the
// icon/colour) and de-duplicated by tag id (first occurrence wins).
export function CategoryRail({
  locale,
  industries,
}: {
  locale: Locale;
  industries: Industry[];
}) {
  const seen = new Set<number>();
  const tagChips = industries.flatMap((industry) =>
    industry.tags.map((tag) => ({ tag, industry })),
  );
  const chips = tagChips.filter(({ tag }) => {
    if (seen.has(tag.id)) return false;
    seen.add(tag.id);
    return true;
  });

  if (!chips.length) return null;

  return (
    <section className="zw-container" style={{ paddingTop: 44 }}>
      <div className="zw-scroll-x" style={{ gap: 6, paddingBottom: 6 }}>
        {chips.map(({ tag, industry }) => {
          const cat = toCat(industry);
          const icon = CAT_ICON[cat];
          return (
            <Link
              key={tag.id}
              href={`${localeHref(locale, "search")}?tagIds=${tag.id}`}
              className="tap"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                borderRadius: 16,
                padding: "8px 8px 6px",
                minWidth: 92,
                flexShrink: 0,
                scrollSnapAlign: "start",
              }}
            >
              <span
                className="zw-hover-lift"
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background: "#fff",
                  border: "1px solid rgba(28,28,26,0.07)",
                  boxShadow: "var(--sh-sm)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={icon} size={21} color={`var(--cat-${cat})`} />
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: "var(--c-700)",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                }}
              >
                {tag.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
