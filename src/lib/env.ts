export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// Mapbox GL access token for the search-page map. Empty string when unset —
// callers MUST guard on it (an empty token makes mapbox-gl throw).
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

// Google Identity Services (GIS) OAuth client ID for the web "Sign in with
// Google" button. Empty string when unset — this acts as a feature flag: when
// empty, no Google UI is rendered and nothing else breaks. The configured
// client ID must list this deploy's origin under "Authorized JavaScript
// origins" in Google Cloud Console for GIS to issue ID tokens.
export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
