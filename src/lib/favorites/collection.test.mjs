import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { createFavoritesCollection } from "./collection.ts";

const source = ts.transpileModule(readFileSync(new URL("./store.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const fixture = (locations = [1, 2], professionals = [3]) => ({
  locations: locations.map((id) => ({ id: id + 100, location: { id, name: `Location ${id}` }, marketplace: {}, createdAt: "2026-10-20T12:00:00Z" })),
  professionals: professionals.map((id) => ({ id: id + 100, professional: { id, displayName: `Person ${id}` }, createdAt: "2026-10-20T12:00:00Z" })),
});
const tick = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

function harness({ shouldRetry } = {}) {
  let session = 1;
  let offline = false;
  let clock = 100_000;
  const sessionListeners = new Set();
  const reads = [];
  const timers = [];
  const fetch = (kind) => new Promise((resolve, reject) => { reads.push({ kind, resolve, reject }); });
  const auth = {
    getAuthenticatedSessionId: () => session,
    subscribeSession: (listener) => { sessionListeners.add(listener); return () => sessionListeners.delete(listener); },
  };
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    Date: class extends Date { static now() { return clock; } },
    require: (path) => {
      if (path.endsWith("session-store")) return auth;
      if (path.endsWith("marketplace/customer")) return {
        getFavoriteLocations: () => fetch("location"),
        getFavoriteProfessionals: () => fetch("professional"),
      };
      throw new Error(`Unexpected dependency: ${path}`);
    },
  }, { filename: "favorites/store.ts" });
  const store = exports;
  const cache = createFavoritesCollection({
    getSession: auth.getAuthenticatedSessionId,
    subscribeSession: auth.subscribeSession,
    isOffline: () => offline,
    fetch: () => fetch("all"),
    getIds: store.getFavoriteIds,
    getPendingIds: store.getPendingFavoriteIds,
    getRevision: store.getFavoriteRevision,
    seedIds: store.seedFavoriteIds,
    subscribeChanges: store.subscribeFavoriteChanges,
    subscribeSnapshots: store.subscribeFavoriteSnapshots,
    shouldRetry,
    setTimer: (run, ms) => {
      const timer = { run, ms, cancelled: false };
      timers.push(timer);
      return () => { timer.cancelled = true; };
    },
    now: () => clock,
  });
  let unsubscribe = cache.subscribe(() => {});
  return {
    cache, store, reads, timers,
    runTimer() { const timer = timers.findLast((t) => !t.cancelled); timer.cancelled = true; timer.run(); },
    get snapshot() { return cache.getSnapshot(); },
    setSession(value) { session = value; for (const listener of sessionListeners) listener(); },
    setOffline(value) { offline = value; cache.connectivityChanged(); },
    advance(ms) { clock += ms; },
    unmount() { unsubscribe(); },
    mount() { unsubscribe = cache.subscribe(() => {}); },
    async load(data = fixture(), reason = "mount") {
      const promise = cache.refresh(reason);
      await tick();
      reads.at(-1).resolve(data);
      await promise;
    },
  };
}

test("collection survives view unmount and deduplicates refreshes while preserving cached errors", async () => {
  const h = harness();
  const first = h.cache.refresh("mount");
  assert.equal(h.cache.refresh("manual"), first);
  await tick();
  assert.equal(h.reads.length, 1);
  assert.equal(h.snapshot.loading, true);
  h.reads[0].resolve(fixture());
  await first;
  h.unmount();
  assert.equal(h.snapshot.favorites.locations.length, 2);
  h.mount();
  const refresh = h.cache.refresh("mount");
  assert.equal(h.snapshot.refreshing, true);
  assert.equal(h.snapshot.loading, false);
  assert.equal(h.snapshot.favorites.professionals.length, 1);
  await tick();
  h.reads.at(-1).reject(new Error("unavailable"));
  await refresh;
  assert.equal(h.snapshot.error, true);
  assert.equal(h.snapshot.refreshing, false);
  assert.equal(h.snapshot.updatedAt, 100_000);
  assert.equal(h.snapshot.favorites.locations.length, 2);
  const retry = h.cache.refresh("retry");
  assert.equal(h.snapshot.retrying, true);
  await tick();
  h.reads.at(-1).resolve(fixture([2]));
  await retry;
  assert.equal(h.snapshot.retrying, false);
  assert.equal(h.snapshot.error, false);
  assert.deepEqual(h.snapshot.favorites.locations.map((row) => row.location.id), [2]);
});

test("offline distinguishes missing content from cached content and reconnect revalidates", async () => {
  const h = harness();
  h.setOffline(true);
  await h.cache.refresh("mount");
  assert.equal(h.reads.length, 0);
  assert.equal(h.snapshot.offline, true);
  assert.equal(h.snapshot.loading, false);
  assert.equal(h.snapshot.favorites, null);
  h.setOffline(false);
  await tick();
  assert.equal(h.reads.length, 1);
  h.reads[0].resolve(fixture());
  await tick();
  h.setOffline(true);
  assert.equal(h.snapshot.offline, true);
  assert.equal(h.snapshot.favorites.locations.length, 2);
  h.setOffline(false);
  await tick();
  assert.equal(h.reads.length, 2);
  h.reads[1].resolve(fixture([1]));
  await tick();
  assert.equal(h.snapshot.favorites.locations.length, 1);
});

test("focus and visibility bursts coalesce, with later focus refreshing normally", async () => {
  const h = harness();
  await h.load();
  h.cache.focus();
  await tick();
  assert.equal(h.reads.length, 1);
  h.advance(1001);
  h.cache.focus();
  h.cache.focus();
  await tick();
  assert.equal(h.reads.length, 2);
  h.reads.at(-1).resolve(fixture());
  await tick();
  h.cache.focus();
  await tick();
  assert.equal(h.reads.length, 2);
});

test("new sessions clear full records and ignore the old session's late request", async () => {
  const h = harness();
  await h.load();
  const oldRead = h.cache.refresh();
  await tick();
  const old = h.reads.at(-1);
  const oldChange = h.store.beginFavoriteChange("location", 1, false);
  h.setSession(2);
  assert.equal(h.snapshot.favorites, null);
  assert.equal(h.snapshot.updatedAt, null);
  assert.equal(oldChange.isCurrent(), false);
  const nextRead = h.cache.refresh("mount");
  await tick();
  h.reads.at(-1).resolve(fixture([9], []));
  await nextRead;
  old.resolve(fixture());
  await oldRead;
  oldChange.rollback();
  oldChange.finish();
  assert.deepEqual(h.snapshot.favorites.locations.map((row) => row.location.id), [9]);
  assert.deepEqual([...h.store.getFavoriteIds("location")], [9]);
});

test("late reads cannot resurrect a removal, and a re-add restores cached metadata in place", async () => {
  const h = harness();
  await h.load();
  const read = h.cache.refresh();
  await tick();
  const removal = h.store.beginFavoriteChange("location", 1, false);
  removal.finish();
  h.unmount();
  h.reads.at(-1).resolve(fixture());
  await read;
  assert.deepEqual(h.snapshot.favorites.locations.map((row) => row.location.id), [2]);
  assert.equal(removal.isCurrent(), true);
  const readd = h.store.beginFavoriteChange("location", 1, true);
  assert.ok(readd);
  assert.equal(removal.isCurrent(), false);
  assert.deepEqual(h.snapshot.favorites.locations.map((row) => row.location.name), ["Location 1", "Location 2"]);
  readd.finish();
  h.mount();
  assert.equal(h.snapshot.favorites.locations.length, 2);
});

test("rollback restores original order and pending completion emits immutable snapshots", async () => {
  const h = harness();
  await h.load();
  let notifications = 0;
  h.store.subscribeFavoriteIds("location", () => { notifications += 1; });
  const before = h.store.getPendingFavoriteIds("location");
  const change = h.store.beginFavoriteChange("location", 1, false);
  const pending = h.store.getPendingFavoriteIds("location");
  assert.notEqual(before, pending);
  assert.equal(pending.has(1), true);
  assert.equal(h.store.beginFavoriteChange("location", 1, true), null);
  change.rollback();
  const count = notifications;
  change.finish();
  assert.ok(notifications > count);
  assert.notEqual(pending, h.store.getPendingFavoriteIds("location"));
  assert.equal(pending.has(1), true);
  assert.equal(h.store.getPendingFavoriteIds("location").has(1), false);
  assert.deepEqual(h.snapshot.favorites.locations.map((row) => row.location.id), [1, 2]);
});

test("background ID refresh immediately removes known rows and fetches unknown metadata", async () => {
  const h = harness();
  await h.load();
  h.advance(61_000);
  const removalRead = h.store.ensureFavoriteIds("professional");
  h.reads.at(-1).resolve([]);
  await removalRead;
  assert.equal(h.snapshot.favorites.professionals.length, 0);
  assert.equal(h.reads.filter((read) => read.kind === "all").length, 1);
  h.advance(61_000);
  const additionRead = h.store.ensureFavoriteIds("professional");
  h.reads.at(-1).resolve(fixture([], [4]).professionals);
  await additionRead;
  await tick();
  assert.equal(h.reads.at(-1).kind, "all");
  h.reads.at(-1).resolve(fixture([1, 2], [4]));
  await tick();
  assert.deepEqual(h.snapshot.favorites.professionals.map((row) => row.professional.id), [4]);
});

test("a per-kind response arriving during a unified read wins stale metadata presence", async () => {
  const h = harness();
  await h.load();
  h.advance(61_000);
  const fullRead = h.cache.refresh();
  await tick();
  const full = h.reads.at(-1);
  const idsRead = h.store.ensureFavoriteIds("professional");
  h.reads.at(-1).resolve([]);
  await idsRead;
  full.resolve(fixture());
  await fullRead;
  assert.equal(h.snapshot.favorites.professionals.length, 0);
  assert.equal(h.store.getFavoriteIds("professional").has(3), false);
});

test("a read begun after removal settles accepts remote re-add without reading intermediate absence", async () => {
  const h = harness();
  await h.load();
  const removal = h.store.beginFavoriteChange("location", 1, false);
  removal.finish();
  await h.load(fixture([1, 2]));
  assert.equal(removal.isCurrent(), false);
  assert.equal(h.snapshot.favorites.locations.length, 2);
  assert.equal(h.store.getFavoriteIds("location").has(1), true);
});

test("a read begun after addition settles accepts remote removal without reading intermediate presence", async () => {
  const h = harness();
  await h.load();
  await h.load(fixture([2]));
  const addition = h.store.beginFavoriteChange("location", 1, true);
  addition.finish();
  await h.load(fixture([2]));
  assert.equal(addition.isCurrent(), false);
  assert.deepEqual(h.snapshot.favorites.locations.map((row) => row.location.id), [2]);
  assert.equal(h.store.getFavoriteIds("location").has(1), false);
});

test("a per-kind read started during an addition cannot erase it after settlement", async () => {
  const h = harness();
  await h.load();
  await h.load(fixture([2]));
  h.advance(61_000);
  const addition = h.store.beginFavoriteChange("location", 1, true);
  const read = h.store.ensureFavoriteIds("location");
  addition.finish();
  h.reads.at(-1).resolve(fixture([2]).locations);
  await read;
  assert.equal(h.store.getFavoriteIds("location").has(1), true);
  assert.equal(addition.isCurrent(), true);
  assert.deepEqual(h.snapshot.favorites.locations.map((row) => row.location.id), [1, 2]);
});

test("an addition that settles during the first load schedules the missing metadata read", async () => {
  const h = harness();
  h.store.seedFavoriteIds("professional", [], 1);
  const initialRead = h.cache.refresh("mount");
  await tick();
  const initial = h.reads.at(-1);
  const addition = h.store.beginFavoriteChange("professional", 7, true);
  addition.finish();
  initial.resolve(fixture([], []));
  await initialRead;
  await tick();
  assert.equal(h.reads.length, 2);
  h.reads.at(-1).resolve(fixture([], [7]));
  await tick();
  assert.deepEqual(h.snapshot.favorites.professionals.map((row) => row.professional.id), [7]);
});

test("a failed first load retries twice while still loading, then reports the error", async () => {
  const h = harness();
  const first = h.cache.refresh("mount");
  await tick();
  h.reads.at(-1).reject(new Error("unavailable"));
  await first;
  assert.equal(h.snapshot.loading, true);
  assert.equal(h.snapshot.error, false);
  assert.deepEqual(h.timers.map((t) => t.ms), [1000]);
  h.runTimer();
  await tick();
  assert.equal(h.snapshot.retrying, false);
  h.reads.at(-1).reject(new Error("unavailable"));
  await tick();
  assert.deepEqual(h.timers.map((t) => t.ms), [1000, 2000]);
  h.runTimer();
  await tick();
  h.reads.at(-1).reject(new Error("unavailable"));
  await tick();
  assert.equal(h.timers.length, 2);
  assert.equal(h.reads.filter((read) => read.kind === "all").length, 3);
  assert.equal(h.snapshot.error, true);
  assert.equal(h.snapshot.loading, false);
  // A manual retry gets a fresh budget and succeeds.
  const retry = h.cache.refresh("retry");
  await tick();
  h.reads.at(-1).resolve(fixture());
  await retry;
  assert.equal(h.snapshot.error, false);
  assert.equal(h.snapshot.favorites.locations.length, 2);
});

test("a refused first load and a failed background refresh report at once", async () => {
  const refused = harness({ shouldRetry: () => false });
  const first = refused.cache.refresh("mount");
  await tick();
  refused.reads.at(-1).reject(new Error("forbidden"));
  await first;
  assert.equal(refused.timers.length, 0);
  assert.equal(refused.snapshot.error, true);
  const h = harness();
  await h.load();
  const background = h.cache.refresh("manual");
  await tick();
  h.reads.at(-1).reject(new Error("unavailable"));
  await background;
  assert.equal(h.timers.length, 0);
  assert.equal(h.snapshot.error, true);
  assert.equal(h.snapshot.favorites.locations.length, 2);
});

test("a session change cancels a scheduled retry", async () => {
  const h = harness();
  const first = h.cache.refresh("mount");
  await tick();
  h.reads.at(-1).reject(new Error("unavailable"));
  await first;
  assert.equal(h.timers[0].cancelled, false);
  h.setSession(2);
  assert.equal(h.timers[0].cancelled, true);
});
