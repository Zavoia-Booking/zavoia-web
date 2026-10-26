"use client";

import { Children, createContext, useContext, type CSSProperties, type FocusEventHandler, type ReactNode } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import styles from "./actions.module.css";

export interface WebsiteBookIntent {
  locationId?: number;
  serviceId?: number;
  bundleId?: number;
  teamMemberId?: number;
}

export interface MicrositeActions {
  book: (intent?: WebsiteBookIntent) => void;
  pending: boolean;
  pendingIntent?: WebsiteBookIntent | null;
  /** Supplied only by the published renderer, never by Studio specimens. */
  professionalHref?: (uuid: string) => string;
}

/** Only the published website supplies actions. Studio specimens remain inert. */
export const MicrositeActionsContext = createContext<MicrositeActions | null>(null);

export function useMicrositeActions() {
  return useContext(MicrositeActionsContext);
}

/** Busy feedback belongs to the requested action; other actions only disable. */
export function isPendingBooking(actions: MicrositeActions | null, intent: WebsiteBookIntent = {}) {
  if (!actions?.pending || !actions.pendingIntent) return false;
  return (["locationId", "serviceId", "bundleId", "teamMemberId"] as const)
    .every((key) => actions.pendingIntent?.[key] === intent[key]);
}

type MicrositeActionProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
  "aria-hidden"?: boolean;
  onFocus?: FocusEventHandler<HTMLElement>;
  intent?: WebsiteBookIntent;
  previewTag?: "span" | "div" | "button";
};

/** Profile links keep native navigation while ordinary clicks retain the scoped modal. */
export function MicrositeProfessionalAction({ uuid, children, previewTag, ...props }: MicrositeActionProps & { uuid?: string }) {
  const actions = useMicrositeActions();
  if (!uuid || !actions?.professionalHref) {
    return <MicrositeBookAction {...props} previewTag={previewTag}>{children}</MicrositeBookAction>;
  }
  const busy = isPendingBooking(actions, props.intent);
  const { intent, ...linkProps } = props;
  return (
    <Link
      {...linkProps}
      href={actions.professionalHref(uuid)}
      prefetch={false}
      className={[props.className, styles.action, styles.professional].filter(Boolean).join(" ")}
      style={{ ...props.style, cursor: actions.pending ? "wait" : "pointer" }}
      aria-busy={actions.pending || undefined}
      aria-disabled={actions.pending || undefined}
      data-pending={busy || undefined}
      onNavigate={(event) => {
        event.preventDefault();
        if (!actions.pending) actions.book(intent);
      }}
    >
      {Children.map(children, (child) => typeof child === "string" || typeof child === "number" ? <span>{child}</span> : child)}
      {busy && <span className={styles.spinner} aria-hidden="true"><Spinner size={18} color="currentColor" /></span>}
    </Link>
  );
}

/** Preserve each variant's markup and styling while making public actions real buttons. */
export function MicrositeBookAction({
  intent,
  previewTag = "span",
  children,
  ...props
}: MicrositeActionProps) {
  const actions = useMicrositeActions();
  const busy = isPendingBooking(actions, intent);
  if (!actions) {
    const PreviewTag = previewTag;
    return <PreviewTag {...props}>{children}</PreviewTag>;
  }
  return (
    <button
      {...props}
      className={[props.className, styles.action].filter(Boolean).join(" ")}
      type="button"
      style={{ ...props.style, cursor: actions.pending ? "wait" : "pointer" }}
      disabled={actions.pending}
      aria-busy={actions.pending || undefined}
      data-pending={busy || undefined}
      onClick={(event) => {
        event.stopPropagation();
        actions.book(intent);
      }}
    >
      {Children.map(children, (child) => typeof child === "string" || typeof child === "number" ? <span>{child}</span> : child)}
      {busy && <span className={styles.spinner} aria-hidden="true"><Spinner size={18} color="currentColor" /></span>}
    </button>
  );
}
