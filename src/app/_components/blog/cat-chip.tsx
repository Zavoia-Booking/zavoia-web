import styles from "./blog-list.module.css";

export interface CatChipProps {
  label: string;
  accent: string;
}

/** Quiet category text; the small dot carries its category colour. */
export function CatChip({ label, accent }: CatChipProps) {
  return (
    <span className={styles.category}>
      <span className={styles.categoryDot} style={{ background: accent }} aria-hidden="true" />
      {label}
    </span>
  );
}
