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
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

// Sign in with Apple (Apple JS, popup mode). Both must be set, or no Apple UI
// is rendered (same feature-flag pattern as GOOGLE_CLIENT_ID). The Services ID
// is the web client id from the Apple developer portal; the redirect URI must
// be registered there as a Return URL AND listed in the API's
// APPLE_WEB_REDIRECT_URIS, and must match this deploy's origin exactly.
//   staging: com.zavoia.signin.web.staging · https://staging.zavoia.com/auth/apple/callback
//   prod:    com.zavoia.signin.web         · https://www.zavoia.com/auth/apple/callback
export const APPLE_SERVICES_ID = process.env.NEXT_PUBLIC_APPLE_SERVICES_ID ?? "";
export const APPLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI ?? "";

// Zavoia Business dashboard (admin-dashboard app). Overridable so staging
// deploys can point at staging-app.zavoia.com.
export const BUSINESS_APP_URL =
  process.env.NEXT_PUBLIC_BUSINESS_APP_URL ?? "https://app.zavoia.com";

// Shared secret for POST /api/revalidate/business, the endpoint admin-api
// calls when a business publishes or changes. Server-only (no NEXT_PUBLIC_
// prefix) so it never reaches the browser bundle. Unset = the endpoint refuses
// every request, which is the safe default: pages still self-heal on their
// revalidate window.
export const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET ?? "";
