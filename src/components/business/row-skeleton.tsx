import { Skeleton } from "@/components/ui/skeleton";
import styles from "./business-row.module.css";

// Shimmer placeholder matching BusinessRow's anatomy. Ported from ZwRowSkeleton.
export function RowSkeleton() {
  return (
    <div style={{ display: "flex", gap: 14, padding: 12, border: "1px solid transparent", borderRadius: 16 }} aria-hidden="true">
      <Skeleton w={116} h={96} r={12} style={{ flexShrink: 0 }} />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          paddingTop: 2,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          containerType: "inline-size",
        }}
      >
        <div style={{ height: 28, display: "flex", alignItems: "center" }}><Skeleton w="62%" h={15.5} /></div>
        <div style={{ height: 18.75, display: "flex", alignItems: "center" }}><Skeleton w="58%" h={12.5} /></div>
        <div style={{ height: 18.75, display: "flex", alignItems: "center" }}><Skeleton w="42%" h={12.5} /></div>
        <div className={styles.status} style={{ display: "flex", alignItems: "center" }}><Skeleton w="48%" h={11.5} /></div>
      </div>
    </div>
  );
}
