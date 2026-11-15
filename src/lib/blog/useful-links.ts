const LOCAL_ORIGIN = "https://zavoia.invalid";

/** Keep authored, locale-specific paths intact while accepting only web links.
 * Shared by Studio validation and the article renderer. */
export function getArticleLinkHref(value: unknown): string | undefined {
  if (typeof value !== "string" || /[\\\u0000-\u001f\u007f]/.test(value)) return undefined;
  const href = value.trim();
  const local = href.startsWith("/") && !href.startsWith("//");
  if (!local && !/^https?:\/\//i.test(href)) return undefined;

  try {
    const url = new URL(href, LOCAL_ORIGIN);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) return undefined;
    if (local && url.origin !== LOCAL_ORIGIN) return undefined;
    return href;
  } catch {
    return undefined;
  }
}
