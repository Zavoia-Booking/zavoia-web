import Link from "next/link";
import { Icon } from "@/components/ui";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import type { LegalDocument } from "@/data/legal";
import { docIcon } from "../_lib/doc-icon";

export interface DocRowProps {
  doc: LegalDocument;
  locale: Locale;
  draftLabel: string;
}

// One line in the legal index: icon badge, title, description, draft marker.
// Shared by the hub's audience groups and the "related documents" footer on a
// document page, so both read as the same object in the same library.
export function DocRow({ doc, locale, draftLabel }: DocRowProps) {
  return (
    <Link
      href={localeHref(locale, "terms", doc.slug)}
      className="zw-legal-row"
      prefetch={false}
    >
      <span className="zw-legal-ic" aria-hidden="true">
        <Icon name={docIcon(doc.slug)} size={18} color="currentColor" />
      </span>

      <span className="zw-legal-rbody">
        <span className="zw-legal-rt" style={{ display: "block" }}>
          {doc.title[locale]}
        </span>
        <span className="zw-legal-rd txt-pretty" style={{ display: "block" }}>
          {doc.description[locale]}
        </span>
      </span>

      <span className="zw-legal-rcluster">
        {doc.status === "draft" && (
          <span className="zw-legal-badge">{draftLabel}</span>
        )}
        <span className="zw-legal-go" aria-hidden="true">
          <Icon name="chevR" size={16} color="currentColor" />
        </span>
      </span>
    </Link>
  );
}
