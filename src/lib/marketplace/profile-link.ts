const webProtocol = /^https?:\/\//i;
const dnsLabel = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const topLevelDomain = /^(?:[a-z]{2,63}|xn--[a-z0-9-]+)$/i;
const ipv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/;

/** Public profile fields can contain a bare domain from an older dashboard. */
export function profileLinkHref(value: string | null | undefined): string | null {
  const source = typeof value === "string" ? value.trim() : "";
  if (!source || /[\s\\<>\u0000-\u001f\u007f]/u.test(source)) return null;
  const authority = source.replace(webProtocol, "").split(/[/?#]/, 1)[0];
  if (!authority || /[@%]/.test(authority) || authority.endsWith(":")) return null;

  try {
    const url = new URL(webProtocol.test(source) ? source : `https://${source}`);
    if (url.port === "0") return null;
    if (url.hostname.startsWith("[")) return url.href;
    if (ipv4.test(url.hostname)) {
      return authority.replace(/:\d+$/, "") === url.hostname ? url.href : null;
    }
    const labels = url.hostname.split(".");
    const domainIsValid = url.hostname.length <= 253 && labels.length >= 2
      && topLevelDomain.test(labels[labels.length - 1]) && labels.every(label => dnsLabel.test(label));
    return domainIsValid ? url.href : null;
  } catch {
    return null;
  }
}
