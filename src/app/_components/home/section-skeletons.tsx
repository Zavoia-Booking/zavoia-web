import { Skeleton } from "@/components/ui/skeleton";
import categoryStyles from "./category-rail.module.css";

// Streaming placeholders for the data-backed home sections. Each one mirrors
// the container/padding/grid of the real section so the shell reserves the
// right space and the swap-in doesn't shift layout.

// Share the live rail's responsive item count and grid geometry.
export function CategoryRailSkeleton() {
  return (
    <section className={`zw-container ${categoryStyles.section}`} aria-hidden="true">
      <ul className={categoryStyles.grid}>
        {Array.from({ length: 12 }).map((_, i) => (
          <li key={i}>
            <div className={categoryStyles.tile}>
              <Skeleton w={56} h={56} r="50%" />
              <div className={categoryStyles.label}><Skeleton w={64} h={20} /></div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Matches the SectionTitle header block (kicker + title, marginBottom 22).
function SectionTitleSkeleton() {
  return (
    <div style={{ marginBottom: 22 }}>
      <Skeleton w={96} h={10} style={{ marginBottom: 12 }} />
      <Skeleton w={260} h={26} r={10} />
    </div>
  );
}

// Matches AvailableToday / BrandsSection / EditorsPick: a titled auto-fill grid
// of overlay cards.
export function CardGridSkeleton({
  paddingTop = 60,
  count = 8,
}: {
  paddingTop?: number;
  count?: number;
}) {
  return (
    <section className="zw-container" style={{ paddingTop }} aria-hidden="true">
      <SectionTitleSkeleton />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(232px, 1fr))",
          gap: 18,
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} w="100%" h={208} r={18} />
        ))}
      </div>
    </section>
  );
}
