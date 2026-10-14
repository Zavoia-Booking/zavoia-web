"use client";

import { useCallback, useSyncExternalStore } from "react";

// One-time tokens/transactions must survive a locale segment remount, but must
// never enter server state or persistent browser storage. Keep only recent tab
// memory: active consumers plus at most eight idle records, for ten minutes.
const IDLE_TTL_MS = 10 * 60_000;
const MAX_IDLE_RECORDS = 8;
type Entry = {
  value?: unknown;
  listeners: Set<() => void>;
  timer?: ReturnType<typeof setTimeout>;
};
const entries = new Map<string, Entry>();

function remove(key: string, entry: Entry) {
  if (entries.get(key) !== entry) return;
  clearTimeout(entry.timer);
  entries.delete(key);
}

function retainIdle(key: string, entry: Entry) {
  clearTimeout(entry.timer);
  entry.timer = setTimeout(() => remove(key, entry), IDLE_TTL_MS);
  const idle = [...entries].filter(([, value]) => value.listeners.size === 0);
  for (const [oldKey, oldEntry] of idle.slice(0, -MAX_IDLE_RECORDS)) {
    remove(oldKey, oldEntry);
  }
}

function entryFor(key: string): Entry {
  if (typeof window === "undefined") {
    throw new Error("Auth flows may only be started in the browser");
  }
  let entry = entries.get(key);
  if (!entry) {
    entry = { listeners: new Set() };
    entries.set(key, entry);
    retainIdle(key, entry);
  }
  return entry;
}

export function subscribeAuthFlow(key: string, listener: () => void) {
  const entry = entryFor(key);
  clearTimeout(entry.timer);
  entry.listeners.add(listener);
  return () => {
    entry.listeners.delete(listener);
    if (entry.listeners.size === 0) retainIdle(key, entry);
  };
}

/** Call only in an effect or handler. The initializer may consume OAuth state. */
export function retainedAuthFlow<T>(key: string, create: () => T): T {
  const entry = entryFor(key);
  if (entry.value === undefined) entry.value = create();
  return entry.value as T;
}

type ActionSnapshot =
  | { status: "idle" | "pending" | "success"; error?: never }
  | { status: "error"; error: unknown };
type Action = { snapshot: ActionSnapshot; promise?: Promise<void> };
const IDLE: ActionSnapshot = { status: "idle" };

/** Deduplicate a mutation across Strict Mode, double clicks and locale remounts.
 * Only a failed operation can be explicitly retried. Passwords/proofs are never
 * retained in the record; the caller's closure lives only during its request.
 */
export function useRetainedAuthAction(key: string) {
  const subscribe = useCallback(
    (listener: () => void) => subscribeAuthFlow(key, listener),
    [key],
  );
  const getSnapshot = useCallback(
    () => (entries.get(key)?.value as Action | undefined)?.snapshot ?? IDLE,
    [key],
  );
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => IDLE);
  const run = useCallback((operation: () => Promise<void>) => {
    const entry = entryFor(key);
    const action = retainedAuthFlow<Action>(key, () => ({ snapshot: IDLE }));
    if (action.promise && action.snapshot.status !== "error") return action.promise;
    const publish = (next: ActionSnapshot) => {
      action.snapshot = next;
      // A superseded/evicted record must not notify a newer flow.
      if (entries.get(key) === entry) entry.listeners.forEach((listener) => listener());
    };
    publish({ status: "pending" });
    action.promise = Promise.resolve().then(operation).then(
      () => { publish({ status: "success" }); },
      (error: unknown) => { publish({ status: "error", error }); throw error; },
    );
    return action.promise;
  }, [key]);
  return { ...snapshot, run };
}
