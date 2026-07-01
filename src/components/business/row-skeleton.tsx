import { Skeleton } from "@/components/ui/skeleton";

// Shimmer placeholder matching BusinessRow's anatomy. Ported from ZwRowSkeleton.
export function RowSkeleton() {
  return (
    <div style={{ display: "flex", gap: 14, padding: 12 }} aria-hidden="true">
      <Skeleton w={116} h={96} r={12} style={{ flexShrink: 0 }} />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          paddingTop: 6,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <Skeleton w="62%" h={14} />
        <Skeleton w="42%" h={11} />
        <Skeleton w="30%" h={11} />
      </div>
    </div>
  );
}
