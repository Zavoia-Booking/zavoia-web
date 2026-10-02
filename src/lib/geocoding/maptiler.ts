// MapTiler geocoding client — pure (no React), client-only in practice.
//
// Mirrors the RN marketplace-app's MapTiler usage: forward city autocomplete
// and reverse geocoding, mapping MapTiler features → a compact CityResult.
//
// Build/runtime safety: with a missing or placeholder key the requests will
// 403 (or never fire), and EVERYTHING degrades to empty results / null. No
// function in this module ever throws — fetch/abort/parse errors are swallowed.

const KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;

const BASE = "https://api.maptiler.com/geocoding";

// City-level place types we care about, for forward search.
const SEARCH_TYPES =
  "region,subregion,county,municipality,municipal_district,locality,place,neighbourhood";

/**
 * Reverse geocoding resolves a coordinate to its CITY, and never anything finer.
 *
 * The resolved name is not just a label: it is sent to the API as the `city`
 * filter, which matches it against the city stored on each location
 * (`map_point.cityNorm`). So it must resolve to the same level a business
 * address stores — the city — and nothing below it:
 *  - `place` in Romania is the neighbourhood ("Berceni", "Titan - Balta Albă")
 *  - `municipal_district` is the sector ("Sector 3")
 * Neither can ever match a stored city, and because every search is `strict`
 * the map comes back EMPTY rather than merely wrong.
 *
 * Hence this chain: municipality ("Cluj-Napoca") → locality (communes and
 * villages) → region. The `region` fallback exists because Bucharest has NO
 * municipality feature in MapTiler — the city itself is `region.557`
 * ("București"). MapTiler orders most-specific-first, so `features[0]` is the
 * municipality wherever one exists and the region only where it does not.
 *
 * Mirrors the RN marketplace-app's `locationApi.reverse`.
 */
const REVERSE_TYPES = "municipality,locality,region";

export interface CityResult {
  id: string;
  label: string;
  city: string;
  region?: string;
  country?: string;
  lat: number;
  lng: number;
}

// ── Loosely-typed MapTiler response shapes (no `any`) ──────────────────────

interface MapTilerContextEntry {
  id?: string;
  text?: string;
}

interface MapTilerFeature {
  id?: string;
  text?: string;
  place_name?: string;
  // MapTiler returns center as [lng, lat].
  center?: number[];
  context?: MapTilerContextEntry[];
}

interface MapTilerResponse {
  features?: MapTilerFeature[];
}

// ── Mapping (mirrors RN api.ts featureToCity) ──────────────────────────────

/**
 * Map a single MapTiler feature → CityResult.
 *
 * - name = feature.text ?? feature.place_name
 * - center is [lng, lat] → lat = center[1], lng = center[0]
 * - country = text of the context entry whose `id` starts with "country"
 * - region  = text of the context entry whose `id` matches
 *             /^(region|subregion|county|municipality)/
 * - label and city both default to `name`
 *
 * Returns null when there is no usable name or no finite center.
 */
function featureToCity(feature: MapTilerFeature): CityResult | null {
  const name = feature.text ?? feature.place_name;
  if (!name) return null;

  const center = feature.center;
  if (!Array.isArray(center) || center.length < 2) return null;
  const lng = center[0];
  const lat = center[1];
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const context = feature.context ?? [];
  const country = context.find((c) => c.id?.startsWith("country"))?.text;
  const region = context.find((c) =>
    /^(region|subregion|county|municipality)/.test(c.id ?? ""),
  )?.text;

  return {
    id: feature.id ?? `${lat},${lng}`,
    label: name,
    city: name,
    region,
    country,
    lat,
    lng,
  };
}

// ── Forward search (autocomplete) ──────────────────────────────────────────

/**
 * Forward city search (autocomplete).
 *
 * Returns [] when: query is shorter than 2 trimmed chars, the API key is
 * absent, the response is non-ok, or any fetch/abort/parse error occurs.
 * Never throws.
 */
export async function searchCities(
  query: string,
  signal?: AbortSignal,
): Promise<CityResult[]> {
  if (query.trim().length < 2) return [];
  if (!KEY) return [];

  const url = `${BASE}/${encodeURIComponent(query)}.json?key=${KEY}&autocomplete=true&limit=8&types=${SEARCH_TYPES}`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const json = (await res.json()) as MapTilerResponse;
    const features = json.features ?? [];
    const out: CityResult[] = [];
    for (const f of features) {
      const city = featureToCity(f);
      if (city) out.push(city);
    }
    return out;
  } catch {
    // Includes AbortError — treated as "no results", never surfaced.
    return [];
  }
}

// ── Reverse geocoding ──────────────────────────────────────────────────────

/**
 * Reverse geocode a coordinate → the enclosing CITY, or null.
 *
 * NOTE: MapTiler's reverse endpoint takes coordinates as `lng,lat`.
 * Returns null when the key is absent, the response is non-ok/empty, or any
 * fetch/abort/parse error occurs. Never throws.
 *
 * The caller's own coordinates are kept: the geocode contributes the city NAME
 * (and a stable feature id), but "near you" must stay anchored to the user, not
 * drift to the city's centroid — which for Bucharest is several km away from
 * anyone who is not standing in Piața Universității.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<CityResult | null> {
  if (!KEY) return null;

  const url = `${BASE}/${lng},${lat}.json?key=${KEY}&types=${REVERSE_TYPES}`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const json = (await res.json()) as MapTilerResponse;
    const first = json.features?.[0];
    if (!first) return null;
    const city = featureToCity(first);
    return city && { ...city, lat, lng };
  } catch {
    // Includes AbortError — treated as "no match", never surfaced.
    return null;
  }
}

// ── IP-based estimate (fallback when the user denies geolocation) ───────────

interface IpWhoResponse {
  success?: boolean;
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Estimate the visitor's city from their IP via ipwho.is (free, no API key).
 * Used as a fallback when `navigator.geolocation` is unavailable or denied, so
 * "use my location" can still resolve an approximate city + coordinates.
 * Returns null on failure / unsuccessful response — never throws.
 */
export async function ipLocate(signal?: AbortSignal): Promise<CityResult | null> {
  try {
    const res = await fetch("https://ipwho.is/", { signal });
    if (!res.ok) return null;
    const json = (await res.json()) as IpWhoResponse;
    if (json.success === false) return null;
    const { latitude: lat, longitude: lng, city } = json;
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    const label = city || "Current location";
    return {
      id: json.ip ? `ip-${json.ip}` : `${lat},${lng}`,
      label,
      city: label,
      region: json.region || undefined,
      country: json.country || undefined,
      lat,
      lng,
    };
  } catch {
    // Includes AbortError — treated as "no estimate", never surfaced.
    return null;
  }
}

// ── Display helper ─────────────────────────────────────────────────────────

/**
 * Secondary display line for a city, e.g. "Cluj · Romania".
 */
export function citySecondary(c: CityResult): string {
  return [c.region, c.country].filter(Boolean).join(" · ");
}
