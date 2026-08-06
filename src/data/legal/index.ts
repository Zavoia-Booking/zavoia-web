import type { LegalAudience, LegalDocument } from "./types";
import { termsOfUse } from "./terms-of-use";
import { privacyPolicy } from "./privacy-policy";
import { cookiePolicy } from "./cookie-policy";
import { companyInfo } from "./company-info";
import { contentPolicy } from "./content-policy";
import { customerTerms } from "./customer-terms";
import { bookingPolicy } from "./booking-policy";
import { businessTerms } from "./business-terms";
import { providerTerms } from "./provider-terms";
import { accountTerms } from "./account-terms";
import { dpa } from "./dpa";
import { dac7 } from "./dac7";

export type {
  LegalAudience,
  LegalBlock,
  LegalDocument,
  LegalDocumentStatus,
  LegalSection,
} from "./types";

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  // general
  termsOfUse,
  privacyPolicy,
  cookiePolicy,
  companyInfo,
  contentPolicy,
  // customer
  customerTerms,
  bookingPolicy,
  // business
  businessTerms,
  providerTerms,
  accountTerms,
  dpa,
  dac7,
];

export function getLegalDocument(slug: string): LegalDocument | undefined {
  return LEGAL_DOCUMENTS.find((d) => d.slug === slug);
}

export const LEGAL_AUDIENCE_ORDER: LegalAudience[] = [
  "general",
  "customer",
  "business",
];
