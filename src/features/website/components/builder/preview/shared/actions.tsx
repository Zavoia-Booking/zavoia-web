"use client";

import { createContext, useContext, type CSSProperties, type FocusEventHandler, type ReactNode } from "react";

export interface WebsiteBookIntent {
  locationId?: number;
  serviceId?: number;
  bundleId?: number;
  teamMemberId?: number;
}

export interface MicrositeActions {
  book: (intent?: WebsiteBookIntent) => void;
  pending: boolean;
}

/** Only the published website supplies actions. Studio specimens remain inert. */
export const MicrositeActionsContext = createContext<MicrositeActions | null>(null);

export function useMicrositeActions() {
  return useContext(MicrositeActionsContext);
}

/** Preserve each variant's markup and styling while making public actions real buttons. */
export function MicrositeBookAction({
  intent,
  previewTag = "span",
  children,
  ...props
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
  "aria-hidden"?: boolean;
  onFocus?: FocusEventHandler<HTMLElement>;
  intent?: WebsiteBookIntent;
  previewTag?: "span" | "div";
}) {
  const actions = useMicrositeActions();
  if (!actions) {
    const PreviewTag = previewTag;
    return <PreviewTag {...props}>{children}</PreviewTag>;
  }
  return (
    <button
      {...props}
      type="button"
      style={{ ...props.style, cursor: actions.pending ? "wait" : "pointer" }}
      disabled={actions.pending}
      aria-busy={actions.pending || undefined}
      onClick={(event) => {
        event.stopPropagation();
        actions.book(intent);
      }}
    >
      {children}
    </button>
  );
}
