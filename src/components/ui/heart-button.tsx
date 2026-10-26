"use client";

import { useState, type MouseEvent } from "react";
import { clsx as cn } from "clsx";
import { Icon } from "./icon";
import { Skeleton } from "./skeleton";
import { Spinner } from "./spinner";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./heart-button.module.css";

export interface HeartButtonProps {
  /** undefined is unresolved; null is unavailable after a failed first load. */
  active?: boolean | null;
  onClick?: () => void;
  size?: number;
  /** Scale the glyph independently from the hit target. */
  iconSize?: number;
  floating?: boolean;
  /** Entity-specific action name, once the saved state is known. */
  ariaLabel?: string;
  /** A pending mutation, distinct from initially resolving the saved state. */
  loading?: boolean;
  disabled?: boolean;
}

// Shared favorite affordance. Ported from ZwHeartBtn. Pulses (.zv-heart-pop)
// on click; floating adds a frosted white background. Cancel enclosing card
// handlers and default navigation so selecting a favourite only performs that
// action, including when a consumer places the control inside a link.
export function HeartButton({
  active,
  onClick,
  size = 34,
  iconSize = size * 0.5,
  floating = true,
  ariaLabel,
  loading = false,
  disabled = false,
}: HeartButtonProps) {
  const [pop, setPop] = useState(false);
  const { dict } = useTranslation();
  const known = typeof active === "boolean";
  const pending = active === undefined;
  const actionable = known && !loading && !disabled;
  const label = known
    ? ariaLabel ?? (active ? dict.common.removeSaved : dict.common.save)
    : pending ? dict.common.savedStatusLoading : dict.common.savedStatusUnavailable;
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={known ? active : undefined}
      aria-disabled={!actionable}
      aria-busy={pending || loading}
      disabled={loading || disabled}
      title={active === null ? label : undefined}
      tabIndex={actionable ? 0 : -1}
      onClick={(e: MouseEvent) => {
        // Keep cancellation active while unavailable, including inside a card
        // link. aria-disabled blocks the action without handing it to the link.
        e.preventDefault();
        e.stopPropagation();
        if (!actionable) return;
        setPop(true);
        setTimeout(() => setPop(false), 600);
        onClick?.();
      }}
      className={cn(styles.root, floating && styles.floating, actionable && "tap")}
      style={{
        width: size,
        height: size,
        cursor: actionable ? "pointer" : "default",
      }}
    >
      {loading ? (
        <span aria-hidden="true">
          <Spinner size={iconSize} color={active ? "var(--p-500)" : "var(--c-800)"} />
        </span>
      ) : known ? (
        <span aria-hidden="true" className={pop ? "zv-heart-pop" : ""} style={{ display: "inline-flex" }}>
          <Icon
            name={active ? "heart" : "heartO"}
            size={iconSize}
            color={active ? "var(--p-500)" : "var(--c-800)"}
          />
        </span>
      ) : (
        <span aria-hidden="true">
          <Skeleton w={iconSize} h={iconSize} r={4} style={pending ? undefined : { animation: "none" }} />
        </span>
      )}
    </button>
  );
}
