import styles from "./blog-list.module.css";

export interface CatChipProps {
  label: string;
}

/** Quiet category text with the Journal's shared accent dot. */
export function CatChip({ label }: CatChipProps) {
  return (
    <span className={styles.category}>
      <span className={styles.categoryDot} aria-hidden="true" />
      {label}
    </span>
  );
}
