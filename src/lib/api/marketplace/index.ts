/**
 * Barrel for the typed marketplace API data layer.
 *
 * Re-exports every client function (flat) plus all shared types. Auth is handled
 * by the underlying `apiFetch` (token + 401 refresh); see customer-auth.ts for the
 * auth wrappers, which are intentionally not duplicated here.
 */

export * from "./types";
export { buildQuery } from "./query";

export * from "./public";
export * from "./booking";
export * from "./appointments";
export * from "./customer";
export * from "./support";
