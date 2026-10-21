import { Skeleton } from "@/components/ui/skeleton";
import { SectionTitle } from "@/components/ui/section-title";
import type { Dictionary } from "@/i18n/dictionaries";
import categoryStyles from "./category-rail.module.css";
import recentStyles from "./recently-viewed.module.css";

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
              <div className={categoryStyles.label}><Skeleton w={64} h="1em" style={{ marginTop: ".2em" }} /></div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// The title is already known. Keep its actual wrapping and the live grid's
// 4:5 cards; the server requests up to ten brands.
export function BrandsSkeleton({
  labels,
}: {
  labels: Dictionary["homeSections"]["brands"];
}) {
  return (
    <section className="zw-container" style={{ paddingTop: 60 }} aria-hidden="true" inert>
      <SectionTitle title={labels.title} action={labels.action} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(232px, 100%), 1fr))",
          gap: 18,
        }}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} h="auto" r="var(--card-r, 18px)" style={{ aspectRatio: "4 / 5" }} />
        ))}
      </div>
    </section>
  );
}

// Same image ratio, text rows, border and padding as RecentlyViewedCard.
export function RecentlyViewedSkeleton({ count }: { count: number }) {
  return (
    <div className={recentStyles.grid} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={recentStyles.card}>
          <Skeleton h="auto" r={0} className={recentStyles.media} />
          <div className={recentStyles.body}>
            <div className={`${recentStyles.name} ${recentStyles.placeholderName}`}><Skeleton w="80%" h={14.5} /></div>
            <div className={recentStyles.meta}><Skeleton w="55%" h={12} /></div>
          </div>
        </div>
      ))}
    </div>
  );
}
