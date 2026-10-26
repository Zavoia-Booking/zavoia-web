"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "./button";
import { PageErrorArt } from "./page-error-art";
import styles from "./page-error.module.css";

export interface PageErrorAction {
  label: string;
  onClick?: () => void;
  href?: string;
  loading?: boolean;
  disabled?: boolean;
  /** Root-layout recovery must also work without the client router. */
  fullReload?: boolean;
}

export interface PageErrorProps {
  title: ReactNode;
  description: ReactNode;
  primary?: PageErrorAction;
  secondary?: PageErrorAction;
  artwork?: ReactNode;
  focusOnMount?: boolean;
  /** Use within an existing page or dialog without another main landmark. */
  variant?: "page" | "contained";
}

/** Provider-free so the same recovery design can survive a root-layout failure. */
export function PageError({ title, description, primary, secondary, artwork, focusOnMount = false, variant = "page" }: PageErrorProps) {
  const titleId = useId();
  const descriptionId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focusOnMount) heading.current?.focus();
  }, [focusOnMount]);
  const Root = variant === "contained" ? "section" : "main";
  const Heading = variant === "contained" ? "h2" : "h1";

  const action = (item: PageErrorAction, kind: "primary" | "secondary") => {
    if (item.href) {
      const props = {
        className: `tap ${styles.action} ${kind === "primary" ? styles.primary : styles.secondary}`,
        children: item.label,
      };
      return item.fullReload ? <a href={item.href} {...props} /> : <Link href={item.href} {...props} />;
    }
    return <Button className={styles.action} kind={kind} size="lg" onClick={item.onClick}
      loading={item.loading} disabled={item.disabled}>{item.label}</Button>;
  };

  return <Root className={variant === "contained" ? styles.contained : styles.page} aria-labelledby={titleId} aria-describedby={descriptionId}>
    <div className={styles.content}>
      <div className={styles.artwork} aria-hidden="true">{artwork ?? <PageErrorArt />}</div>
      <div className={styles.copy}>
        <Heading ref={heading} className={styles.title} id={titleId} tabIndex={focusOnMount ? -1 : undefined}>{title}</Heading>
        <p id={descriptionId}>{description}</p>
      </div>
      {(primary || secondary) && <div className={styles.actions}>
        {primary && action(primary, "primary")}
        {secondary && action(secondary, "secondary")}
      </div>}
    </div>
  </Root>;
}
