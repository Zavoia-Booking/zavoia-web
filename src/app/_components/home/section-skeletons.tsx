import { Skeleton } from "@/components/ui/skeleton";

// Streaming placeholders for the data-backed home sections. Each one mirrors
// the container/padding/grid of the real section so the shell reserves the
// right space and the swap-in doesn't shift layout.

// Matches CategoryRail: a scroll-x rail of round chips with a label under each.
export function CategoryRailSkeleton() {
  return (
    <section
      className="zw-container"
      style={{ paddingTop: 44 }}
      aria-hidden="true"
    >
      <div className="zw-scroll-x" style={{ gap: 6, paddingBottom: 6 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              padding: "8px 8px 6px",
              minWidth: 92,
              flexShrink: 0,
            }}
          >
            <Skeleton w={54} h={54} r="50%" />
            <Skeleton w={56} h={11} />
          </div>
        ))}
      </div>
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
