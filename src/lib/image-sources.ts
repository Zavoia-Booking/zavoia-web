// Share the public image allowlist with Next's optimizer. Other business-supplied
// hosts keep their original URL rather than turning into rejected proxy requests.
// Uploads are served from admin-api's R2_PUBLIC_URL: assets.zavoia.com is its
// production default and assets-staging.zavoia.com the staging bucket.
export const publicImagePatterns = [
  { protocol: "https" as const, hostname: "assets.zavoia.com", port: "", pathname: "/**" },
  { protocol: "https" as const, hostname: "assets-staging.zavoia.com", port: "", pathname: "/**" },
  { protocol: "https" as const, hostname: "picsum.photos", port: "", pathname: "/seed/**" },
];

export function canOptimizePublicImage(src: string): boolean {
  if (/^\/(?:brand|images|legal)\//.test(src)) return true;
  try {
    const url = new URL(src);
    return publicImagePatterns.some((pattern) =>
      url.protocol === `${pattern.protocol}:` &&
      url.hostname === pattern.hostname &&
      url.port === pattern.port &&
      !url.username && !url.password &&
      url.pathname.startsWith(pattern.pathname.replace(/\*\*$/, "")),
    );
  } catch {
    return false;
  }
}
