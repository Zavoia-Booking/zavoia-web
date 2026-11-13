"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { Icon } from "./icon";
import styles from "./month-calendar.module.css";

export type MonthCalendarProps = Omit<HTMLAttributes<HTMLDivElement>, "title" | "children"> & {
  title: ReactNode;
  previousLabel: string;
  nextLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  weekdays?: readonly string[];
  children?: ReactNode;
  body?: ReactNode;
  density?: "stretch" | "compact";
};

/** Calendar presentation only; callers own dates, availability and selection. */
export function MonthCalendar({
  title,
  previousLabel,
  nextLabel,
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
  weekdays,
  children,
  body,
  className,
  density = "stretch",
  ...rest
}: MonthCalendarProps) {
  return (
    <div
      {...rest}
      className={[styles.calendar, className].filter(Boolean).join(" ")}
      data-density={density}
    >
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <div className={styles.navigation}>
          <button
            type="button"
            onClick={onPrevious}
            disabled={previousDisabled}
            className={`${styles.nav} tap`}
            aria-label={previousLabel}
          >
            <Icon name="chevL" size={16} color="var(--c-900)" />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className={`${styles.nav} tap`}
            aria-label={nextLabel}
          >
            <Icon name="chevR" size={16} color="var(--c-900)" />
          </button>
        </div>
      </div>
      {body !== undefined ? body : (
        <>
          {weekdays && (
            <div className={styles.weekdays}>
              {weekdays.map((weekday, index) => (
                <div key={index} className={styles.weekday}>{weekday}</div>
              ))}
            </div>
          )}
          <div className={styles.days}>{children}</div>
        </>
      )}
    </div>
  );
}

export function CalendarDay({
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      type={type}
      className={[styles.day, className].filter(Boolean).join(" ")}
    />
  );
}
