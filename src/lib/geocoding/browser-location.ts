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

/**
 * Whether the visitor has already allowed location for this site, so a position can be read
 * without the browser showing its dialog. False whenever the browser can't say: Chrome on
 * iPhone reports "prompt" even after a grant, so there callers fall back without asking.
 */
export async function isLocationAllowed(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.geolocation || !navigator.permissions?.query) {
    return false;
  }
  try {
    const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    return status.state === "granted";
  } catch {
    return false;
  }
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

/**
 * The device position, but only when location is already allowed — never shows the browser's
 * dialog. Null otherwise, and on any failure.
 */
export async function getBrowserLocationIfAllowed(): Promise<BrowserCoords | null> {
  if (!(await isLocationAllowed())) return null;
  return getBrowserLocation({ timeout: 8000, maximumAge: 5 * 60_000 });
}
