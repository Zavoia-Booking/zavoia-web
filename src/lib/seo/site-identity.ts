import { LOCALES } from "@/i18n/locales";
import { SITE_URL } from "@/lib/site";

// Confirmed in company-info.ts and privacy-policy.ts. The CUI is a tax ID,
// not a claim of VAT registration. Unconfirmed company details stay absent.
export const SITE_IDENTITY = {
  name: "Zavoia",
  legalName: "TNT VENTURES SRL",
  taxID: "48718430",
  email: "support@zavoia.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Sectorul 6, Str. Splaiul Independenței, Nr. 202 B, Camera 42",
    addressLocality: "București",
    postalCode: "060023",
    addressCountry: "RO",
  },
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/brand/zavoia-logo.png`,
} as const;

export const organizationId = `${SITE_IDENTITY.url}#organization`;
export const websiteId = `${SITE_IDENTITY.url}#website`;

/** The same verified publisher and website on every locale and page type. */
export function siteEntities() {
  return [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: SITE_IDENTITY.name,
      legalName: SITE_IDENTITY.legalName,
      taxID: SITE_IDENTITY.taxID,
      email: SITE_IDENTITY.email,
      address: SITE_IDENTITY.address,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: SITE_IDENTITY.email,
        url: `${SITE_URL}/help`,
      },
      url: SITE_IDENTITY.url,
      logo: SITE_IDENTITY.logo,
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: SITE_IDENTITY.name,
      url: SITE_IDENTITY.url,
      inLanguage: [...LOCALES],
      publisher: { "@id": organizationId },
    },
  ];
}
