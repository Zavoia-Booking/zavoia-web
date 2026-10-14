/**
 * The visitor's original pathname, forwarded by `src/proxy.ts`.
 *
 * `global-not-found.tsx` receives no params and bypasses the locale layout, so
 * it uses this header for server-rendered language and address context. Routes
 * excluded by the proxy matcher have no forwarded pathname and use the default
 * locale. Cached segment/root boundaries must not read this request header.
 */
export const PATHNAME_HEADER = "x-zavoia-pathname";
