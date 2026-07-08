"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./icon";

/**
 * Popover calendar date picker (replaces the bare native `<input
 * type="date">`). Value in/out is an ISO date string ("YYYY-MM-DD") or ""
 * when unset. Tuned for date-of-birth style picking: month + year dropdowns
 * for fast long-range navigation, Monday-first grid, future dates disabled
 * by default (`maxDate` = today). Month/weekday names localize via Intl.
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
  value,
  onChange,
  locale = "en",
  disabled,
  placeholder = "—",
  yearsBack = 110,
}: {
  value: string;
  onChange: (iso: string) => void;
  locale?: string;
  disabled?: boolean;
  placeholder?: string;
  /** How many years before the current one the year dropdown offers. */
  yearsBack?: number;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();

  const selected = parseIso(value);
  const [view, setView] = useState(() => ({
    y: selected?.y ?? todayY,
    m: selected?.m ?? todayM,
  }));

  // Re-anchor the visible month on the current value each time the popover
  // opens (the value may have changed since the last open).
  const openPicker = () => {
    const sel = parseIso(value);
    setView({ y: sel?.y ?? todayY, m: sel?.m ?? todayM });
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
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const monthNames = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { month: "long" });
    return Array.from({ length: 12 }, (_, m) => fmt.format(new Date(2000, m, 1)));
  }, [locale]);

  const weekdayInitials = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
    // 2024-01-01 is a Monday.
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(2024, 0, 1 + i)).slice(0, 2),
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

  const navBtn: React.CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: "1px solid rgba(28,28,26,0.12)",
    background: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  };

  const selectStyle: React.CSSProperties = {
    fontFamily: "inherit",
    fontSize: 13.5,
    fontWeight: 600,
    color: "var(--c-900)",
    border: "1px solid rgba(28,28,26,0.12)",
    borderRadius: 8,
    background: "#fff",
    padding: "5px 6px",
    outline: "none",
    cursor: "pointer",
    minWidth: 0,
  };

  return (
    <div ref={rootRef} style={{ position: "relative", maxWidth: 340 }}>
      {/* Trigger — styled like the account text inputs. */}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{
          marginTop: 8,
          width: "100%",
          boxSizing: "border-box",
          padding: "9px 12px",
          borderRadius: 10,
          border: `1px solid ${open ? "var(--p-500)" : "rgba(28,28,26,0.18)"}`,
          fontSize: 14,
          color: displayLabel ? "var(--c-900)" : "var(--c-400)",
          background: "#fff",
          outline: "none",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          cursor: disabled ? "default" : "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayLabel || placeholder}
        </span>
        <Icon name="cal" size={15} color="var(--p-500)" />
      </button>

      {open && (
        <div
          role="dialog"
          style={{
            position: "absolute",
            zIndex: 40,
            top: "calc(100% + 6px)",
            left: 0,
            width: 292,
            background: "#fff",
            border: "1px solid rgba(28,28,26,0.10)",
            borderRadius: 14,
            boxShadow: "var(--sh-lg)",
            padding: 12,
          }}
        >
          {/* Header: prev / month + year selects / next */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button type="button" className="tap" onClick={prevMonth} style={navBtn} aria-label={monthNames[(view.m + 11) % 12]}>
              <Icon name="chevL" size={14} color="var(--c-700)" />
            </button>
            <div style={{ flex: 1, display: "flex", gap: 6, justifyContent: "center", minWidth: 0 }}>
              <select
                value={view.m}
                onChange={(e) => setView((v) => ({ ...v, m: Number(e.target.value) }))}
                style={{ ...selectStyle, flex: "1 1 auto" }}
              >
                {monthNames.map((name, m) => (
                  <option key={m} value={m}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={view.y}
                onChange={(e) => setView((v) => ({ ...v, y: Number(e.target.value) }))}
                style={selectStyle}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="tap" onClick={nextMonth} style={navBtn} aria-label={monthNames[(view.m + 1) % 12]}>
              <Icon name="chevR" size={14} color="var(--c-700)" />
            </button>
          </div>

          {/* Weekday header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              marginTop: 10,
              marginBottom: 2,
            }}
          >
            {weekdayInitials.map((w, i) => (
              <span
                key={i}
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--c-500)",
                  padding: "4px 0",
                }}
              >
                {w}
              </span>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {Array.from({ length: leadingBlanks }, (_, i) => (
              <span key={`b${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = i + 1;
              const isSelected =
                selected?.y === view.y && selected.m === view.m && selected.d === d;
              const isToday = view.y === todayY && view.m === todayM && d === todayD;
              const future = isFuture(d);
              return (
                <button
                  key={d}
                  type="button"
                  className="tap"
                  disabled={future}
                  onClick={() => {
                    onChange(toIso(view.y, view.m, d));
                    setOpen(false);
                  }}
                  style={{
                    height: 34,
                    borderRadius: 9,
                    border: isToday && !isSelected ? "1px solid rgba(28,28,26,0.18)" : "1px solid transparent",
                    background: isSelected ? "var(--p-500)" : "transparent",
                    color: future
                      ? "var(--c-300)"
                      : isSelected
                        ? "#fff"
                        : "var(--c-800)",
                    fontSize: 13.5,
                    fontWeight: isSelected ? 700 : 500,
                    fontFamily: "inherit",
                    cursor: future ? "default" : "pointer",
                    fontVariantNumeric: "tabular-nums",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !future)
                      e.currentTarget.style.background = "var(--c-100)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
