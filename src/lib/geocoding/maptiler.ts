// MapTiler geocoding client — pure (no React), client-only in practice.
//
// Mirrors the RN marketplace-app's MapTiler usage: forward city autocomplete
// and reverse geocoding, mapping MapTiler features → a compact CityResult.
//
// Optional location resolution degrades to empty results / null on failure.
// Autocomplete opts into errors so a failed request cannot look like no matches.

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
  /** ISO 3166-1 alpha-2, independent of the display language. */
  countryCode?: string;
  lat: number;
  lng: number;
}

// ── Loosely-typed MapTiler response shapes (no `any`) ──────────────────────

interface MapTilerContextEntry {
  id?: string;
  text?: string;
  country_code?: string;
}

interface MapTilerFeature {
  id?: string;
  text?: string;
  place_name?: string;
  // MapTiler returns center as [lng, lat].
  center?: number[];
  context?: MapTilerContextEntry[];
  properties?: { country_code?: string };
}

interface MapTilerResponse {
  features?: MapTilerFeature[];
}

function countryCode(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : undefined;
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
  const countryContext = context.find((c) => c.id?.startsWith("country"));
  const country = countryContext?.text;
  const region = context.find((c) =>
    /^(region|subregion|county|municipality)/.test(c.id ?? ""),
  )?.text;

  return {
    id: feature.id ?? `${lat},${lng}`,
    label: name,
    city: name,
    region,
    country,
    countryCode: countryCode(feature.properties?.country_code)
      ?? countryCode(countryContext?.country_code),
    lat,
    lng,
  };
}

// ── Forward search (autocomplete) ──────────────────────────────────────────

/**
 * Forward city search (autocomplete).
 *
 * By default, failures return [] for optional location resolution. Interactive
 * autocomplete uses throwOnError to distinguish failed requests from no matches.
 */
export async function searchCities(
  query: string,
  signal?: AbortSignal,
  options?: { exact?: boolean; countryCode?: string; throwOnError?: boolean },
): Promise<CityResult[]> {
  if (query.trim().length < 2) return [];
  if (!KEY) {
    if (options?.throwOnError) throw new Error("City search is unavailable");
    return [];
  }

  const params = new URLSearchParams({
    key: KEY,
    autocomplete: options?.exact ? "false" : "true",
    limit: "8",
    types: options?.exact ? REVERSE_TYPES : SEARCH_TYPES,
  });
  if (options?.exact) params.set("fuzzyMatch", "false");
  if (options?.countryCode) params.set("country", options.countryCode.toLowerCase());
  const url = `${BASE}/${encodeURIComponent(query)}.json?${params}`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error("City search request failed");
    const json = (await res.json()) as MapTilerResponse;
    if (!Array.isArray(json.features)) throw new Error("Invalid city search response");
    const features = json.features;
    const out: CityResult[] = [];
    for (const f of features) {
      const city = featureToCity(f);
      if (city) out.push(city);
    }
    return out;
  } catch (error) {
    if (options?.throwOnError) throw error;
    return [];
  }
}

/** Resolve a city-only link for the camera, without changing its search scope.
 * Ambiguous or unavailable matches stay unresolved rather than picking another city.
 */
export async function resolveCity(
  query: string,
  signal: AbortSignal,
  options?: { countryCode?: string; aliases?: string[] },
): Promise<CityResult | null> {
  const normalize = (name: string) => name.normalize("NFD")
    .replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  const names = new Set([query, ...(options?.aliases ?? [])].map(normalize));
  const results = await searchCities(query, signal, {
    exact: true,
    countryCode: options?.countryCode,
  });
  const matches = results.filter((city) => names.has(normalize(city.city)));
  // A municipality/locality is more specific than a region with the same name.
  // Regions remain valid for cities such as Bucharest, which is itself a region.
  const cities = matches.filter((city) => /^(municipality|locality)\./.test(city.id));
  const candidates = cities.length ? cities : matches;
  return candidates.length === 1 ? candidates[0] : null;
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
  country_code?: string;
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
    if (typeof lat !== "number" || typeof lng !== "number"
      || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const label = city || "Current location";
    return {
      id: json.ip ? `ip-${json.ip}` : `${lat},${lng}`,
      label,
      city: label,
      region: json.region || undefined,
      country: json.country || undefined,
      countryCode: countryCode(json.country_code),
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
