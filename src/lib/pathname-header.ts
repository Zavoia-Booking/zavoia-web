/**
 * Request header carrying the visitor's original pathname, set by `src/proxy.ts`.
 *
 * Server components normally get the path from `params`, but `not-found.tsx`
 * receives no props and renders above the [locale] segment, so the 404 reads
 * this instead.
 */
export const PATHNAME_HEADER = "x-zavoia-pathname";
