import { Skeleton } from "@/components/ui/skeleton";
import styles from "./business-row.module.css";

// Reserve the same photo, content and footer geometry as a loaded result.
export function RowSkeleton() {
  return (
    <div className={styles.row} aria-hidden="true">
      <div className={styles.photo}>
        <Skeleton h="100%" r={0} />
      </div>
      <div className={styles.content}>
        <div className={styles.category}><Skeleton w={14} h={14} r={3} /><Skeleton w="65%" h={15} /></div>
        <div className={styles.address}>
          {["95%", "70%"].map(width => (
            <div key={width} style={{ height: 18, display: "flex", alignItems: "center" }}>
              <Skeleton w={width} h={12} />
            </div>
          ))}
        </div>
        <div className={styles.metadata}>
          <Skeleton w={68} h={17} />
          <div className={styles.footer}>
            <Skeleton w={60} h={15} />
            <Skeleton w={52} h={15} />
          </div>
        </div>
      </div>
    </div>
  );
}
