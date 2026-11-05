import type { ReactNode } from "react";
import type { IconName } from "@/components/ui";
import styles from "./empty-state.module.css";

/** Quiet section artwork for the location's empty catalog, team and search. */
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  /** Sits centred under the copy. */
  action?: ReactNode;
}) {
  return (
    <div className={styles.root}>
      <div className={styles.art}><SectionArt icon={icon} /></div>
      <div className={styles.copy}>
        <h2 className={styles.title}>{title}</h2>
        <p className={`txt-pretty ${styles.body}`}>{body}</p>
        {action && <div className={styles.action}>{action}</div>}
      </div>
    </div>
  );
}

function SectionArt({ icon }: { icon: IconName }) {
  return (
    <svg width="260" height="144" viewBox="0 16 260 144" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M24 146h212m-192 8h25m9 0h9m82 0h29m9 0h12" stroke="var(--c-ink)" strokeOpacity=".12" strokeWidth="1.3" />
      {icon === "user" ? (
        <>
          <g transform="rotate(-7 91 87)" stroke="var(--c-600)" strokeWidth="1.3">
            <rect x="41" y="36" width="91" height="105" rx="9" fill="var(--c-mist)" />
            <path d="M57 121h29m-29 7h49" strokeOpacity=".35" />
            <circle cx="87" cy="72" r="15" fill="var(--c-canvas)" />
            <path d="M61 109c2-17 12-24 26-24s24 7 26 24" fill="var(--c-canvas)" />
          </g>
          <g transform="rotate(6 170 91)" stroke="var(--p-500)" strokeWidth="1.4">
            <rect x="123" y="39" width="91" height="107" rx="9" fill="var(--c-canvas)" />
            <path d="M123 115h91" strokeOpacity=".18" />
            <circle cx="168" cy="74" r="15" fill="var(--p-500)" fillOpacity=".05" />
            <path d="M143 110c2-17 11-23 25-23s24 6 26 23" fill="var(--p-500)" fillOpacity=".05" />
            <path d="M140 128h41m-41 8h26" strokeOpacity=".35" />
          </g>
        </>
      ) : (
        <>
          <g transform="rotate(-7 119 85)" stroke="var(--c-600)" strokeWidth="1.3">
            <path d="M70 29h101a8 8 0 0 1 8 8v101a8 8 0 0 1-8 8H70a8 8 0 0 1-8-8V37a8 8 0 0 1 8-8Z" fill="var(--c-mist)" />
            <path d="M77 44h84m-84 8h46" strokeOpacity=".25" />
          </g>
          <g stroke="var(--p-500)" strokeWidth="1.4">
            <rect x="85" y="40" width="106" height="106" rx="8" fill="var(--c-canvas)" />
            <path d="M85 68h106" strokeOpacity=".22" />
            <path d="M101 54h52" />
            <path d="M101 83h53m-53 7h35m-35 20h53m-53 7h35" strokeOpacity=".35" />
            <path d="M167 83h8m-8 27h8" strokeOpacity=".6" />
          </g>
          {icon === "search" ? (
            <g stroke="var(--c-600)" strokeWidth="1.6">
              <circle cx="184" cy="109" r="23" fill="var(--c-canvas)" />
              <path d="m201 126 22 22a4 4 0 0 0 6-6l-22-22" fill="var(--c-mist)" />
              <path d="M172 108a12 12 0 0 1 12-12" strokeOpacity=".35" />
            </g>
          ) : (
            <g transform="rotate(18 213 110)" stroke="var(--c-600)" strokeWidth="1.3">
              <path d="M208 77a5 5 0 0 1 10 0v55l-5 11-5-11V77Z" fill="var(--c-canvas)" />
              <path d="M208 85h10m-10 6h10m-5 0v41m-5 0h10m-5 11v-5" />
              <path d="M209 78a4 4 0 0 1 8 0v7h-8v-7Z" fill="var(--p-500)" fillOpacity=".12" stroke="none" />
            </g>
          )}
        </>
      )}
    </svg>
  );
}
