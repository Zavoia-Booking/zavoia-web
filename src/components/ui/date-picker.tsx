"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { Icon } from "./icon";
import { CalendarDay, MonthCalendar } from "./month-calendar";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./date-picker.module.css";

/**
 * Popover calendar date picker (replaces the bare native `<input
 * type="date">`). Value in/out is an ISO date string ("YYYY-MM-DD") or ""
 * when unset. Reuses Search's calendar presentation, with inline month/year
 * choices for birth dates. Future dates remain disabled; names localize via Intl.
 */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

/** Parse "YYYY-MM-DD" without timezone drift. */
function parseIso(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) };
}

/** Monday-first column index (Mon=0 … Sun=6) for a date. */
function mondayIndex(y: number, m: number, d: number): number {
  return (new Date(y, m, d).getDay() + 6) % 7;
}

export function DatePicker({
  "aria-labelledby": labelledBy,
  value,
  onChange,
  locale = "en",
  disabled,
  placeholder = "—",
  yearsBack = 110,
}: {
  "aria-labelledby"?: string;
  value: string;
  onChange: (iso: string) => void;
  locale?: string;
  disabled?: boolean;
  placeholder?: string;
  /** How many years before the current one the year dropdown offers. */
  yearsBack?: number;
}) {
  const valueId = useId();
  const { dict } = useTranslation();
  const copy = dict.datePicker;
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<"days" | "months" | "years">("days");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const captionRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();

  const selected = parseIso(value);
  const [view, setView] = useState(() => ({
    y: selected?.y ?? todayY,
    m: selected?.m ?? todayM,
  }));
  const [yearPage, setYearPage] = useState(view.y - 5);

  // Re-anchor the visible month on the current value each time the popover
  // opens (the value may have changed since the last open).
  const openPicker = () => {
    const sel = parseIso(value);
    setView({ y: sel?.y ?? todayY, m: sel?.m ?? todayM });
    setPanel("days");
    setOpen(true);
  };

  // Outside click / Escape close.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      const root = rootRef.current;
      const popover = popoverRef.current;
      if (!root || !popover) return;
      const bounds = root.getBoundingClientRect();
      const headerHeight = parseFloat(getComputedStyle(root).getPropertyValue("--nav-h")) || 0;
      const mobileNavigation = document.querySelector<HTMLElement>("nav[data-marketplace-chrome]")?.getBoundingClientRect();
      const bottom = mobileNavigation?.height ? mobileNavigation.top : window.innerHeight;
      const above = Math.max(0, bounds.top - headerHeight - 12);
      const below = Math.max(0, bottom - bounds.bottom - 12);
      const side = popover.scrollHeight > below && above > below ? "top" : "bottom";
      popover.dataset.side = side;
      popover.style.setProperty("--date-picker-max-height", `${side === "top" ? above : below}px`);
    };
    position();
    window.addEventListener("resize", position);
    return () => window.removeEventListener("resize", position);
  }, [open, panel]);

  const monthNames = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { month: "long" });
    return Array.from({ length: 12 }, (_, m) => fmt.format(new Date(2000, m, 1)));
  }, [locale]);

  const weekdayInitials = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
    // 2024-01-01 is a Monday.
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(2024, 0, 1 + i)),
    );
  }, [locale]);

  const displayLabel = useMemo(() => {
    if (!selected) return "";
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(selected.y, selected.m, selected.d));
  }, [locale, selected]);

  const years = useMemo(
    () => Array.from({ length: yearsBack + 1 }, (_, i) => todayY - i),
    [todayY, yearsBack],
  );

  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const leadingBlanks = mondayIndex(view.y, view.m, 1);

  const isFuture = (d: number) =>
    view.y > todayY ||
    (view.y === todayY && view.m > todayM) ||
    (view.y === todayY && view.m === todayM && d > todayD);

  const prevMonth = () =>
    setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  const nextMonth = () =>
    setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));

  const minimumYear = years.at(-1) ?? todayY;
  const lastYearPage = Math.max(minimumYear, todayY - 11);
  const pageStart = Math.max(minimumYear, Math.min(lastYearPage, yearPage));
  const visibleYears = Array.from({ length: 12 }, (_, i) => pageStart + i)
    .filter((year) => year <= todayY);
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" })
    .format(new Date(view.y, view.m, 1));

  const showYears = () => {
    setYearPage(view.y - 5);
    setPanel("years");
  };
  const stepYear = (delta: number) => setView((v) => ({ ...v, y: v.y + delta }));
  const stepYears = (delta: number) => setYearPage(pageStart + delta * 12);
  const caption = panel === "days" ? monthLabel : panel === "months"
    ? String(view.y) : `${pageStart}–${visibleYears.at(-1)}`;

  return (
    <Collapsible.Root ref={rootRef} open={open && !disabled} className={styles.root}>
      <button
        ref={triggerRef}
        type="button"
        aria-labelledby={labelledBy}
        aria-describedby={labelledBy ? valueId : undefined}
        onClick={() => (open ? setOpen(false) : openPicker())}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open && !disabled}
        aria-controls={`${valueId}-calendar`}
        className={styles.trigger}
        data-open={open && !disabled}
        data-empty={!displayLabel || undefined}
      >
        <span id={labelledBy ? valueId : undefined} className={styles.value}>
          {displayLabel || placeholder}
        </span>
        <Icon name="cal" size={17} color="var(--c-600)" />
      </button>

      <Collapsible.Content
        ref={popoverRef}
        id={`${valueId}-calendar`}
        role="dialog"
        aria-labelledby={labelledBy}
        className={styles.popover}
        inert={!open || disabled}
        aria-hidden={!open || disabled}
      >
        <MonthCalendar
          density="compact"
          title={
            <button ref={captionRef} type="button" className={styles.caption}
              aria-label={panel === "days" ? copy.chooseMonth : panel === "months" ? copy.chooseYear : dict.searchOverlay.pickDate}
              onClick={panel === "days" ? () => setPanel("months") : panel === "months" ? showYears : () => setPanel("days")}
            >
              {caption}<Icon name="chevD" size={14} />
            </button>
          }
          previousLabel={panel === "days" ? dict.searchOverlay.prevMonth : panel === "months" ? copy.previousYear : copy.previousYears}
          nextLabel={panel === "days" ? dict.searchOverlay.nextMonth : panel === "months" ? copy.nextYear : copy.nextYears}
          onPrevious={panel === "days" ? prevMonth : panel === "months" ? () => stepYear(-1) : () => stepYears(-1)}
          onNext={panel === "days" ? nextMonth : panel === "months" ? () => stepYear(1) : () => stepYears(1)}
          previousDisabled={panel === "years" ? pageStart <= minimumYear : panel === "months" && view.y <= minimumYear}
          nextDisabled={panel === "years" ? pageStart + 11 >= todayY : panel === "months" && view.y >= todayY}
          weekdays={weekdayInitials}
          body={panel === "days" ? undefined : (
            <div key={panel} className={styles.choices} role="group"
              aria-label={panel === "months" ? copy.chooseMonth : copy.chooseYear}>
              {panel === "months" ? monthNames.map((month, m) => (
                <button key={m} type="button" className={styles.choice} aria-pressed={view.m === m}
                  onClick={() => { setView((v) => ({ ...v, m })); setPanel("days"); captionRef.current?.focus({ preventScroll: true }); }}>
                  {month}
                </button>
              )) : visibleYears.map((year) => (
                <button key={year} type="button" className={styles.choice} aria-pressed={view.y === year}
                  onClick={() => { setView((v) => ({ ...v, y: year })); setPanel("months"); captionRef.current?.focus({ preventScroll: true }); }}>
                  {year}
                </button>
              ))}
            </div>
          )}
        >
          {Array.from({ length: leadingBlanks }, (_, i) => <span key={`blank-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1;
            const isSelected = selected?.y === view.y && selected.m === view.m && selected.d === d;
            const isToday = view.y === todayY && view.m === todayM && d === todayD;
            return (
              <CalendarDay key={d} disabled={isFuture(d)} aria-pressed={isSelected} data-today={isToday}
                onClick={() => { onChange(toIso(view.y, view.m, d)); setOpen(false); triggerRef.current?.focus({ preventScroll: true }); }}>
                {d}
              </CalendarDay>
            );
          })}
        </MonthCalendar>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
