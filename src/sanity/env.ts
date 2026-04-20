export const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "placeholder";
export const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01";

// If SANITY_USE_CDN is set, honor it. Otherwise: CDN on in prod, off in dev.
export const useCdn = (() => {
  const v = process.env.NEXT_PUBLIC_SANITY_USE_CDN;
  if (v === "true") return true;
  if (v === "false") return false;
  return process.env.NODE_ENV === "production";
})();

export const isSanityConfigured = projectId !== "placeholder";

export const revalidateSecret = process.env.SANITY_REVALIDATE_SECRET;
