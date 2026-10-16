import { localeHref, localizedPathname } from "@/i18n/routes";
import { LOCALES, isLocale, type Locale } from "@/i18n/locales";

const LOCAL_ORIGIN = "https://zavoia.invalid";
const SHARED_DETAIL_ROUTES = new Set(["appointments", "brand", "business", "terms"]);

function localUrl(value: string | null): URL | null {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value, LOCAL_ORIGIN);
    return url.origin === LOCAL_ORIGIN && !url.pathname.startsWith("//") ? url : null;
  } catch {
    return null;
  }
}

/** Only these public route shapes use identical path segments in every locale.
 * Blog article and city/category slugs require authoritative alternate URLs.
 */
function hasSharedPathname(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] && isLocale(segments[0])) segments.shift();
  return segments.length <= 1 ||
    (segments.length === 2 && SHARED_DETAIL_ROUTES.has(segments[0]));
}

export function safeRedirectTarget(
  param: string | null,
  locale: Locale,
  fallback: string,
): string {
  const url = localUrl(param) ?? localUrl(fallback);
  if (!url) return defaultPostAuthTarget(locale);
  const pathname = hasSharedPathname(url.pathname)
    ? localizedPathname(url.pathname, locale)
    : url.pathname;
  return `${pathname}${url.search}${url.hash}`;
}

/** Auth entry can carry server-resolved destinations for translated slugs.
 * The selected locale wins; a manually supplied opaque path stays exact.
 * Every candidate still passes the same local-URL validation.
 */
export function authRedirectTarget(
  params: Pick<URLSearchParams, "get">,
  locale: Locale,
  fallback = defaultPostAuthTarget(locale),
): string {
  const original = safeRedirectTarget(params.get("redirect"), locale, fallback);
  return safeRedirectTarget(params.get(`redirect.${locale}`), locale, original);
}

/** Build both native links and programmatic auth entry from the same contract.
 * Alternate paths must come from the originating page, never slug inference.
 */
export function authEntryHref(
  locale: Locale,
  mode: "login" | "register",
  returnTo: string,
  alternates?: Partial<Record<Locale, string>>,
): string {
  const target = safeRedirectTarget(returnTo, locale, defaultPostAuthTarget(locale));
  const original = new URL(target, LOCAL_ORIGIN);
  const query = new URLSearchParams({ mode, redirect: target });
  for (const language of LOCALES) {
    const alternate = localUrl(alternates?.[language] ?? null);
    if (!alternate) continue;
    query.set(`redirect.${language}`, `${alternate.pathname}${original.search}${original.hash}`);
  }
  return `${localeHref(locale, "auth")}?${query.toString()}`;
}

/** Keep the originating destination and source across the auth/recovery flow.
 * Only carry navigation context; tokens and unrelated query values stay on
 * their own route. Redirect validation still happens when the flow finishes.
 */
export function authFlowHref(
  locale: Locale,
  step: "login" | "register" | "forgot-password",
  search: Pick<URLSearchParams, "get">,
): string {
  const query = new URLSearchParams();
  query.set("mode", step === "forgot-password" ? "login" : step);
  if (step === "forgot-password") query.set("forgot", "1");
  for (const key of ["redirect", ...LOCALES.map((language) => `redirect.${language}`), "src"]) {
    const value = search.get(key);
    if (value) query.set(key, value);
  }
  const pathname = localeHref(locale, "auth");
  const suffix = query.toString();
  return suffix ? `${pathname}?${suffix}` : pathname;
}

export function defaultPostAuthTarget(locale: Locale): string {
  return localeHref(locale);
}
