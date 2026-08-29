/**
 * Promise-wrapped `navigator.geolocation`. Resolves to a coordinate on success, or `null`
 * when the API is absent, the user denies the prompt, or the request times out — so callers
 * can chain an IP fallback instead of branching on an error object. Never rejects.
 *
 * SSR-safe: returns null when there is no `navigator.geolocation`.
 */
export interface BrowserCoords {
  lat: number;
  lng: number;
}

export function getBrowserLocation(
  options: PositionOptions = { enableHighAccuracy: true, timeout: 8000 },
): Promise<BrowserCoords | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      options,
    );
  });
}
