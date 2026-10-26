"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "./icon";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "./toast.module.css";

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
 * `error` uses a red warning triangle and announces assertively.
 * The default keeps the terracotta circle and the caller's chosen icon.
 */
export type ToastTone = "default" | "error";

/**
 * `interrupt` shows the toast at once instead of queueing it; a message it cuts
 * short returns to the front of the queue. `hold: null` keeps it on screen until
 * its handle dismisses it, for callers that own their own deadline.
 */
export type ToastOptions = {
  interrupt?: boolean;
  hold?: number | null;
};

export type ToastHandle = { dismiss: () => void };

export type ToastApi = (
  text: string,
  icon?: IconName,
  action?: ToastAction,
  tone?: ToastTone,
  options?: ToastOptions,
) => ToastHandle;

// Hold timings. Longer than the original 2600/4200: a message the reader has
// to find, read and act on inside three seconds is a message some readers
// never get.
const HOLD_MS = 4000;
export const ACTION_TOAST_HOLD_MS = 6000;
const EXIT_MS = 350;

type ToastState = {
  text: string;
  icon: IconName;
  action: ToastAction | null;
  tone: ToastTone;
  hold: number | null;
  interrupt: boolean;
  key: number;
};

const ToastContext = createContext<ToastApi | null>(null);

// Internal channel: <ToastHost/> registers its dispatcher here so the public
// `toast()` API can forward calls to whichever host is currently mounted.
type HostFns = { show: (s: ToastState) => void; dismiss: (key: number) => void };
type RegisterFn = (host: HostFns | null) => void;
const HostContext = createContext<RegisterFn | null>(null);
const ContainerContext = createContext<{
  container: HTMLElement | null;
  setContainer: (container: HTMLElement | null) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const hostRef = useRef<HostFns | null>(null);
  const seqRef = useRef(0);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const placement = useMemo(() => ({ container, setContainer }), [container]);

  const toast = useCallback<ToastApi>(
    (text, icon = "check", action, tone = "default", options) => {
      // A monotonic counter, not Date.now(): two toasts fired in the same
      // millisecond would otherwise share a key and React would treat the
      // second as the same element, skipping the re-entry animation.
      seqRef.current += 1;
      const key = seqRef.current;
      hostRef.current?.show({
        text,
        icon,
        action: action ?? null,
        tone,
        hold:
          options?.hold === undefined
            ? action ? ACTION_TOAST_HOLD_MS : HOLD_MS
            : options.hold,
        interrupt: options?.interrupt ?? false,
        key,
      });
      return { dismiss: () => hostRef.current?.dismiss(key) };
    },
    [],
  );

  const register = useCallback<RegisterFn>((host) => {
    hostRef.current = host;
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      <HostContext.Provider value={register}>
        <ContainerContext.Provider value={placement}>{children}</ContainerContext.Provider>
      </HostContext.Provider>
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

/** Keep notification controls inside an open dialog's keyboard focus scope. */
export function useToastContainerRef() {
  return useContext(ContainerContext)?.setContainer;
}

export function ToastHost() {
  const register = useContext(HostContext);
  const container = useContext(ContainerContext)?.container;
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

  // The toast occupying the slot, and whether it is already on its way out.
  // Refs rather than reading `current`, so the dispatcher never has to be
  // re-created or handed a stale render — and nothing touches a ref in render.
  const currentRef = useRef<ToastState | null>(null);
  const leavingRef = useRef(false);
  // `advance` re-arms itself on a timer; the indirection keeps it from
  // referencing its own binding before it exists.
  const advanceRef = useRef<() => void>(() => {});

  const start = useCallback((next: ToastState) => {
    currentRef.current = next;
    leavingRef.current = false;
    setLeaving(false);
    setCurrent(next);
    if (next.hold === null) return;
    leaveTimer.current = setTimeout(() => {
      leavingRef.current = true;
      setLeaving(true);
    }, next.hold);
    clearTimer.current = setTimeout(() => advanceRef.current(), next.hold + EXIT_MS);
  }, []);

  const advance = useCallback(() => {
    const next = queueRef.current.shift();
    if (!next) {
      currentRef.current = null;
      setCurrent(null);
      return;
    }
    start(next);
  }, [start]);

  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  const leave = useCallback(() => {
    clearTimeout(leaveTimer.current);
    clearTimeout(clearTimer.current);
    leavingRef.current = true;
    setLeaving(true);
    clearTimer.current = setTimeout(() => advanceRef.current(), EXIT_MS);
  }, []);

  useEffect(() => {
    if (!register) return;
    const show = (next: ToastState) => {
      const shown = currentRef.current;
      if (!shown) {
        start(next);
      } else if (next.interrupt) {
        clearTimeout(leaveTimer.current);
        clearTimeout(clearTimer.current);
        // A message cut short is shown again afterwards; one already leaving is done.
        if (!leavingRef.current) queueRef.current.unshift(shown);
        start(next);
      } else {
        // The running timers pick this up when the current toast finishes.
        queueRef.current.push(next);
      }
    };
    const dismiss = (key: number) => {
      if (currentRef.current?.key === key) {
        if (!leavingRef.current) leave();
      } else {
        queueRef.current = queueRef.current.filter((queued) => queued.key !== key);
      }
    };
    register({ show, dismiss });
    return () => {
      register(null);
      clearTimeout(leaveTimer.current);
      clearTimeout(clearTimer.current);
      queueRef.current = [];
      currentRef.current = null;
    };
  }, [register, start, leave]);

  const content = (
    // Always mounted: a live region inserted at the same moment as its text is
    // not reliably announced. Errors are assertive, everything else polite.
    <div
      data-toast-host=""
      className={container ? `${styles.host} ${styles.dialogHost}` : styles.host}
      aria-live={current?.tone === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      style={{
        position: container ? "static" : "fixed",
        left: container ? undefined : "50%",
        transform: container ? undefined : "translateX(-50%)",
        zIndex: 400,
        pointerEvents: "none",
        width: container ? undefined : "min(92vw, 460px)",
        maxWidth: "min(92vw, 460px)",
      }}
    >
      {current && (
        <div
          key={current.key}
          role={current.tone === "error" ? "alert" : "status"}
          data-tone={current.tone}
          className={`${styles.toast} zv-toast${leaving ? " zv-toast--out" : ""}`}
        >
          <span className={styles.leading} aria-hidden="true">
            {current.tone === "error"
              ? <Icon name="warn" size={18} color="var(--s-error-600)" />
              : <span className={styles.defaultIcon}><Icon name={current.icon} size={12} color="#fff" /></span>}
          </span>
          <span className={styles.message}>{current.text}</span>
          {!current.action && (
            // The 44px target keeps the smaller visual close control easy to hit.
            <button
              type="button"
              className={`tap ${styles.dismiss}`}
              onClick={leave}
              aria-label={dismissLabel}
            >
              <Icon name="x" size={18} />
            </button>
          )}
          {current.action && (
            <button
              type="button"
              className={`tap ${styles.action}`}
              onClick={() => {
                current.action?.onClick?.();
                leave();
              }}
            >
              {current.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
  return container ? createPortal(content, container) : content;
}
