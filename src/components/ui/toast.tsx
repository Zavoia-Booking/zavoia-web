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

// ─────────────────────────────────────────────
// Toast — context-driven replacement for the prototype's window.zwToast.
// Port of ZwToastHost (docs/web-shell.jsx): ink pill, primary circle icon,
// optional action button, enter/leave animation. Hold timing: 2600ms,
// 4200ms when an action is present.
// ─────────────────────────────────────────────

export type ToastAction = {
  label: string;
  onClick?: () => void;
};

export type ToastApi = (
  text: string,
  icon?: IconName,
  action?: ToastAction,
) => void;

type ToastState = {
  text: string;
  icon: IconName;
  action: ToastAction | null;
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

  const toast = useCallback<ToastApi>((text, icon = "check", action) => {
    hostRef.current?.({
      text,
      icon,
      action: action ?? null,
      key: Date.now(),
    });
  }, []);

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

export function ToastHost() {
  const register = useContext(HostContext);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [leaving, setLeaving] = useState(false);
  const t1 = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const t2 = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!register) return;
    const show = (s: ToastState) => {
      clearTimeout(t1.current);
      clearTimeout(t2.current);
      setLeaving(false);
      setToast(s);
      const hold = s.action ? 4200 : 2600;
      t1.current = setTimeout(() => setLeaving(true), hold);
      t2.current = setTimeout(() => setToast(null), hold + 350);
    };
    register(show);
    return () => {
      register(null);
      clearTimeout(t1.current);
      clearTimeout(t2.current);
    };
  }, [register]);

  if (!toast) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 400,
        pointerEvents: "none",
      }}
    >
      <div
        key={toast.key}
        className={"zv-toast" + (leaving ? " zv-toast--out" : "")}
        style={{
          background: "var(--c-ink)",
          color: "#fff",
          borderRadius: 999,
          padding: toast.action ? "9px 9px 9px 14px" : "11px 20px 11px 14px",
          fontSize: 14,
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: 9,
          boxShadow: "var(--sh-lg)",
          letterSpacing: "-0.01em",
          pointerEvents: "auto",
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "var(--p-500)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon name={toast.icon} size={12} color="#fff" />
        </span>
        {toast.text}
        {toast.action && (
          <button
            type="button"
            className="tap"
            onClick={() => {
              toast.action?.onClick?.();
              setLeaving(true);
              setTimeout(() => setToast(null), 320);
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
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
    </div>
  );
}
