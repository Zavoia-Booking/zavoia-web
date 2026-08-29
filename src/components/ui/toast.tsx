"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "./icon";
import { useTranslation } from "@/i18n/useTranslation";

// ─────────────────────────────────────────────
// Toast — context-driven replacement for the prototype's window.zwToast.
// Port of ZwToastHost (docs/web-shell.jsx): ink pill, circle icon, optional
// action button, enter/leave animation.
//
// Three things this host does that the original port did not:
//
//  1. It QUEUES. The port kept a single slot and overwrote it, so a second
//     toast firing within the hold window destroyed the first one outright —
//     two failures in quick succession (two favourite toggles, a session
//     expiry racing an in-flight action) meant one of them was shown to
//     nobody. Messages now wait their turn instead of being dropped.
//  2. It distinguishes severity. Every toast used to render the same
//     terracotta circle, so a failure and a confirmation were told apart only
//     by the small white glyph inside them.
//  3. It is announced. The live region is always mounted — a region that
//     appears at the same moment as its content is not reliably read out.
// ─────────────────────────────────────────────

export type ToastAction = {
  label: string;
  onClick?: () => void;
};

/**
 * `error` paints the circle with the error token and announces assertively.
 * The default keeps the terracotta circle, so every existing call site looks
 * exactly as it did.
 */
export type ToastTone = "default" | "error";

export type ToastApi = (
  text: string,
  icon?: IconName,
  action?: ToastAction,
  tone?: ToastTone,
) => void;

type ToastState = {
  text: string;
  icon: IconName;
  action: ToastAction | null;
  tone: ToastTone;
  key: number;
};

const ToastContext = createContext<ToastApi | null>(null);

// Internal channel: <ToastHost/> registers its dispatcher here so the public
// `toast()` API can forward calls to whichever host is currently mounted.
type ShowFn = (s: ToastState) => void;
type RegisterFn = (fn: ShowFn | null) => void;
const HostContext = createContext<RegisterFn | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const hostRef = useRef<ShowFn | null>(null);
  const seqRef = useRef(0);

  const toast = useCallback<ToastApi>(
    (text, icon = "check", action, tone = "default") => {
      // A monotonic counter, not Date.now(): two toasts fired in the same
      // millisecond would otherwise share a key and React would treat the
      // second as the same element, skipping the re-entry animation.
      seqRef.current += 1;
      hostRef.current?.({
        text,
        icon,
        action: action ?? null,
        tone,
        key: seqRef.current,
      });
    },
    [],
  );

  const register = useCallback<RegisterFn>((fn) => {
    hostRef.current = fn;
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      <HostContext.Provider value={register}>{children}</HostContext.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

// Hold timings. Longer than the original 2600/4200: a message the reader has
// to find, read and act on inside three seconds is a message some readers
// never get.
const HOLD_MS = 4000;
const HOLD_WITH_ACTION_MS = 6000;
const EXIT_MS = 350;

export function ToastHost() {
  const register = useContext(HostContext);
  const { dict } = useTranslation();
  const dismissLabel = dict.errors.dismiss;
  const [current, setCurrent] = useState<ToastState | null>(null);
  const [leaving, setLeaving] = useState(false);
  const queueRef = useRef<ToastState[]>([]);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Whether a toast currently occupies the slot. A ref rather than reading
  // `current`, so `advance` never has to be re-created and `register` is never
  // handed a stale dispatcher — and so nothing touches a ref during render.
  const showingRef = useRef(false);
  // `advance` re-arms itself on a timer; the indirection keeps it from
  // referencing its own binding before it exists.
  const advanceRef = useRef<() => void>(() => {});

  const advance = useCallback(() => {
    const next = queueRef.current.shift();
    if (!next) {
      showingRef.current = false;
      setCurrent(null);
      return;
    }
    showingRef.current = true;
    setLeaving(false);
    setCurrent(next);
    const hold = next.action ? HOLD_WITH_ACTION_MS : HOLD_MS;
    leaveTimer.current = setTimeout(() => setLeaving(true), hold);
    clearTimer.current = setTimeout(() => advanceRef.current(), hold + EXIT_MS);
  }, []);

  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  useEffect(() => {
    if (!register) return;
    const show = (s: ToastState) => {
      queueRef.current.push(s);
      // Only kick the queue when nothing is on screen; otherwise the running
      // timers will pick this up when the current one finishes.
      if (!showingRef.current) advance();
    };
    register(show);
    return () => {
      register(null);
      clearTimeout(leaveTimer.current);
      clearTimeout(clearTimer.current);
      queueRef.current = [];
      showingRef.current = false;
    };
  }, [register, advance]);

  const dismiss = useCallback(() => {
    clearTimeout(leaveTimer.current);
    clearTimeout(clearTimer.current);
    setLeaving(true);
    clearTimer.current = setTimeout(() => advanceRef.current(), EXIT_MS);
  }, []);

  return (
    // Always mounted: a live region inserted at the same moment as its text is
    // not reliably announced. Errors are assertive, everything else polite.
    <div
      aria-live={current?.tone === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 400,
        pointerEvents: "none",
        maxWidth: "min(92vw, 460px)",
      }}
    >
      {current && (
        <div
          key={current.key}
          role={current.tone === "error" ? "alert" : "status"}
          className={"zv-toast" + (leaving ? " zv-toast--out" : "")}
          style={{
            background: "var(--c-ink)",
            color: "#fff",
            borderRadius: 999,
            padding: current.action
              ? "9px 9px 9px 14px"
              : "11px 20px 11px 14px",
            fontSize: 14,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 9,
            boxShadow: "var(--sh-lg)",
            letterSpacing: "-0.01em",
            pointerEvents: "auto",
            // Long copy — the rate-limit message carries a countdown — used to
            // push the pill past both edges of a narrow screen with nothing to
            // wrap it.
            textWrap: "pretty",
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background:
                current.tone === "error"
                  ? "var(--s-error-600)"
                  : "var(--p-500)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name={current.icon} size={12} color="#fff" />
          </span>
          {current.text}
          {!current.action && (
            // A toast WITH an action can already be dismissed by pressing it.
            // One without had no way out at all — it could only be waited out,
            // which is the reason it needed longer timings in the first place.
            // Deliberately understated: a faint hairline circle that doesn't
            // compete with the message for attention on a pill this compact.
            <button
              type="button"
              className="tap"
              onClick={dismiss}
              aria-label={dismissLabel}
              style={{
                marginLeft: 2,
                width: 20,
                height: 20,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                border: 0,
                padding: 0,
                cursor: "pointer",
                background: "rgba(255,255,255,0.12)",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
          {current.action && (
            <button
              type="button"
              className="tap"
              onClick={() => {
                current.action?.onClick?.();
                dismiss();
              }}
              style={{
                marginLeft: 4,
                padding: "6px 14px",
                borderRadius: 999,
                border: 0,
                cursor: "pointer",
                background: "rgba(255,255,255,0.16)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "inherit",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {current.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
