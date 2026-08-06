import type { Locale } from "@/i18n/locales";

// Zavoia legal document model — one file per document under this directory,
// assembled in ./index.ts. Body text is DRAFT content pending counsel review;
// facts come from ZAVOIA_TERMS_BLUEPRINT.md / ZAVOIA_PRODUCT_CAPABILITIES_AUDIT.md
// (admin-dashboard repo) — never invented. Unresolved items are `note` blocks.

export type LegalAudience = "general" | "customer" | "business";

export type LegalDocumentStatus = "draft" | "published";

export type LegalBlock =
  /** A paragraph of document text. */
  | { kind: "p"; text: Record<Locale, string> }
  /** A bulleted list. */
  | { kind: "list"; items: Record<Locale, string[]> }
  /**
   * An unresolved drafting gate (missing fact, pending decision, counsel
   * question). Rendered as a highlighted editorial box while status=draft.
   * Every placeholder the business must still supply lives in one of these.
   */
  | { kind: "note"; text: Record<Locale, string> };

export interface LegalSection {
  /** Stable anchor id (also the URL fragment). Never change after publish. */
  id: string;
  title: Record<Locale, string>;
  /** One-paragraph summary — shown as the section lede. */
  summary: Record<Locale, string>;
  /** Blueprint reference (e.g. "A6", "B3") — internal drafting aid. */
  blueprintRef?: string;
  /** Full draft text. When absent, only the summary renders. */
  body?: LegalBlock[];
}

export interface LegalDocument {
  /** URL slug under /terms/ */
  slug: string;
  audience: LegalAudience;
  title: Record<Locale, string>;
  shortTitle: Record<Locale, string>;
  description: Record<Locale, string>;
  status: LegalDocumentStatus;
  /** ISO date, set when a version becomes effective. */
  effectiveDate?: string;
  sections: LegalSection[];
}
