/**
 * Universal Links (iOS) and App Links (Android) for the marketplace app.
 *
 * Served from /.well-known so a shared location or team-member URL opens the
 * installed app instead of the browser; without the app it stays a normal web
 * page. Both app variants are listed on every deployment: each build only
 * claims its own domain (staging → staging.zavoia.com, production →
 * www.zavoia.com), so the extra entry is inert where it doesn't apply.
 *
 * Only location pages (and their ?tab=team&member=<id> variant) are claimed.
 * Every other path keeps opening in the browser.
 */

const APPLE_TEAM_ID = "732AJ49RCF";

const APP_IDS = [
  "com.zavoia.marketplaceapp",
  "com.zavoia.marketplaceapp.staging",
];

export const APPLE_APP_SITE_ASSOCIATION = {
  applinks: {
    details: [
      {
        appIDs: APP_IDS.map((id) => `${APPLE_TEAM_ID}.${id}`),
        components: [{ "/": "/business/*" }, { "/": "/*/business/*" }],
      },
    ],
  },
};

// SHA-256 of each signing certificate allowed to open the links.
const ANDROID_APPS: { package: string; fingerprints: string[] }[] = [
  {
    package: "com.zavoia.marketplaceapp.staging",
    fingerprints: [
      // EAS-managed staging keystore
      "A0:E0:18:90:94:3A:27:90:72:48:71:7F:36:CF:DE:2F:91:BA:A6:80:CA:58:2E:1E:5F:3D:FD:F8:A5:A1:92:C2",
      // android/app/debug.keystore — locally built staging APKs
      "FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C",
    ],
  },
  // TODO: add com.zavoia.marketplaceapp once its production keystore exists
  // (first EAS production build) and the Play App Signing key fingerprint.
];

export const ANDROID_ASSET_LINKS = ANDROID_APPS.map((app) => ({
  relation: ["delegate_permission/common.handle_all_urls"],
  target: {
    namespace: "android_app",
    package_name: app.package,
    sha256_cert_fingerprints: app.fingerprints,
  },
}));
