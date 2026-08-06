import type { IconName } from "@/components/ui";

// One icon per legal document, so the index is scannable by shape before it is
// read. Presentation only — the mapping lives with the route, not with the
// document data, which stays purely editorial.
const DOC_ICONS: Record<string, IconName> = {
  "terms-of-use": "doc",
  "privacy-policy": "lock",
  "cookie-policy": "cookie",
  "company-info": "building",
  "content-policy": "shield",
  "customer-terms": "user",
  "booking-policy": "cal",
  "business-terms": "wallet",
  "provider-terms": "scissors",
  "account-terms": "sliders",
  dpa: "layers",
};

export function docIcon(slug: string): IconName {
  return DOC_ICONS[slug] ?? "doc";
}
