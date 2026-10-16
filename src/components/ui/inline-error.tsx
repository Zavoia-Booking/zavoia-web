import type { ComponentPropsWithoutRef } from "react";
import { AlertCircle } from "lucide-react";
import styles from "./inline-error.module.css";

type InlineErrorProps = ComponentPropsWithoutRef<"span"> & {
  /** Sign-in fields use the admin dashboard's text-only treatment. */
  showIcon?: boolean;
};

/** Shared presentation for inline validation, action and request failures. */
export function InlineError({
  children,
  showIcon = true,
  className,
  ...props
}: InlineErrorProps) {
  return (
    <span
      {...props}
      role="alert"
      aria-live="polite"
      className={className ? `${styles.root} ${className}` : styles.root}
    >
      {showIcon && <AlertCircle className={styles.icon} aria-hidden="true" />}
      <span className={styles.message}>{children}</span>
    </span>
  );
}
