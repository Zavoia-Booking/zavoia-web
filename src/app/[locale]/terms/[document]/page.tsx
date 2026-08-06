import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
  type Locale,
} from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { Breadcrumb, Icon } from "@/components/ui";
import {
  LEGAL_DOCUMENTS,
  getLegalDocument,
  type LegalAudience,
  type LegalBlock,
} from "@/data/legal";
import { DocRow } from "../_components/doc-row";
import { LegalProgress } from "../_components/legal-progress";
import { LegalToc } from "../_components/legal-toc";
import { PrintButton } from "../_components/print-button";

const AUDIENCE_LABEL_KEY: Record<
  LegalAudience,
  "audienceGeneral" | "audienceCustomer" | "audienceBusiness"
> = {
  general: "audienceGeneral",
  customer: "audienceCustomer",
  business: "audienceBusiness",
};

// Amber callout used by both the document-level draft banner and the inline
// drafting gates. One shape, two sizes — a reader learns it once.
function Callout({ children, banner }: { children: string; banner?: boolean }) {
  return (
    <div
      role="note"
      className={`zw-legal-callout${banner ? " zw-legal-callout--banner" : " zw-legal-note"}`}
    >
      <Icon name="warn" size={16} color="var(--s-warning-600)" />
      <p className="txt-pretty">{children}</p>
    </div>
  );
}

function BlockView({ block, locale }: { block: LegalBlock; locale: Locale }) {
  if (block.kind === "p") {
    return <p className="zw-legal-p txt-pretty">{block.text[locale]}</p>;
  }
  if (block.kind === "list") {
    return (
      <ul className="zw-legal-ul">
        {block.items[locale].map((item, i) => (
          <li key={i} className="txt-pretty">
            {item}
          </li>
        ))}
      </ul>
    );
  }
  // kind === "note" — unresolved drafting gate, highlighted while in draft
  return <Callout>{block.text[locale]}</Callout>;
}

export async function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    LEGAL_DOCUMENTS.map((doc) => ({ locale, document: doc.slug })),
  );
}

type Props = { params: Promise<{ locale: string; document: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, document } = await params;
  if (!isLocale(locale)) return {};
  const doc = getLegalDocument(document);
  if (!doc) return {};

  const languages = Object.fromEntries(
    LOCALES.map((l) => [l, localeHref(l, "terms", doc.slug)]),
  ) as Record<Locale, string>;

  return {
    title: doc.title[locale],
    description: doc.description[locale],
    alternates: {
      canonical: localeHref(locale, "terms", doc.slug),
      languages: {
        ...languages,
        "x-default": localeHref(DEFAULT_LOCALE, "terms", doc.slug),
      },
    },
  };
}

// A single legal document. The reading column is capped at a 68ch measure and
// paired with a numbered contents rail that tracks the reader's position; the
// same contents collapse into a native disclosure once the rail no longer fits.
export default async function LegalDocumentPage({ params }: Props) {
  const { locale, document } = await params;
  if (!isLocale(locale)) notFound();
  const doc = getLegalDocument(document);
  if (!doc) notFound();
  const dict = dictionaries[locale];
  const t = dict.legal;

  const sections = doc.sections.map((s) => ({
    id: s.id,
    title: s.title[locale],
  }));
  const related = LEGAL_DOCUMENTS.filter(
    (d) => d.audience === doc.audience && d.slug !== doc.slug,
  );

  return (
    <>
      <LegalProgress />
      <main
        className="zw-legal-page zw-container"
        style={{ padding: "clamp(26px, 3.4vw, 40px) var(--gutter) clamp(56px, 7vw, 88px)" }}
      >
        <div className="zw-legal-shell zw-legal-shell--doc">
          <header>
            <div className="zw-legal-noprint">
              <Breadcrumb
                items={[
                  { label: dict.breadcrumbHome, href: localeHref(locale) },
                  { label: t.hubHeading, href: localeHref(locale, "terms") },
                  { label: doc.shortTitle[locale] },
                ]}
              />
            </div>

            <h1
              className="txt-balance"
              style={{
                margin: "22px 0 0",
                fontSize: "clamp(30px, 3.8vw, 46px)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1.04,
                color: "var(--c-900)",
                maxWidth: "20ch",
              }}
            >
              {doc.title[locale]}
            </h1>

            <p
              className="txt-pretty"
              style={{
                margin: "18px 0 0",
                fontSize: "clamp(15.5px, 1.4vw, 17.5px)",
                lineHeight: 1.6,
                color: "var(--c-600)",
                maxWidth: "60ch",
              }}
            >
              {doc.description[locale]}
            </p>

            <div className="zw-legal-meta">
              <span>{t[AUDIENCE_LABEL_KEY[doc.audience]]}</span>
              {doc.status === "draft" && (
                <>
                  <span className="zw-legal-meta-sep" aria-hidden="true">
                    /
                  </span>
                  <span className="zw-legal-badge">{t.statusDraft}</span>
                </>
              )}
              {doc.effectiveDate && (
                <>
                  <span className="zw-legal-meta-sep" aria-hidden="true">
                    /
                  </span>
                  <span>
                    {t.lastUpdated} {doc.effectiveDate}
                  </span>
                </>
              )}
              <PrintButton label={t.printDocument} />
            </div>
          </header>

          {doc.status === "draft" && <Callout banner>{t.draftNotice}</Callout>}

          {sections.length > 1 && (
            <details className="zw-legal-toc-m zw-legal-noprint">
              <summary>
                {t.onThisPage}
                <span className="zw-legal-toc-chev" aria-hidden="true">
                  <Icon name="chevD" size={14} color="var(--c-600)" />
                </span>
              </summary>
              <div className="zw-legal-toc-mlist">
                {sections.map((s, i) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="zw-legal-toc-mlink"
                  >
                    <span
                      className="zw-legal-toc-n"
                      aria-hidden="true"
                      style={{ paddingTop: 2 }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{s.title}</span>
                  </a>
                ))}
              </div>
            </details>
          )}

          <div
            className="zw-legal-grid"
            style={{ marginTop: "clamp(34px, 4vw, 48px)" }}
          >
            <article className="zw-legal-main">
              {doc.sections.map((section, i) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="zw-legal-sec"
                >
                  <div className="zw-legal-secn">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h2 className="zw-legal-h2 txt-balance">
                    {section.title[locale]}
                  </h2>
                  {section.body ? (
                    section.body.map((block, j) => (
                      <BlockView key={j} block={block} locale={locale} />
                    ))
                  ) : (
                    <p className="zw-legal-p txt-pretty">
                      {section.summary[locale]}
                    </p>
                  )}
                </section>
              ))}
            </article>

            {sections.length > 1 && (
              <aside className="zw-legal-aside">
                <LegalToc sections={sections} label={t.onThisPage} />
              </aside>
            )}
          </div>

          {related.length > 0 && (
            <section className="zw-legal-related zw-legal-noprint">
              <h2 className="zw-legal-grouphead">
                <span className="zw-legal-grouplbl">{t.relatedTitle}</span>
                <span className="zw-legal-grouprule" aria-hidden="true" />
              </h2>
              <div className="zw-legal-rows">
                {related.map((d) => (
                  <DocRow
                    key={d.slug}
                    doc={d}
                    locale={locale}
                    draftLabel={t.statusDraft}
                  />
                ))}
              </div>
            </section>
          )}

          <div
            className="zw-legal-noprint"
            style={{ marginTop: "clamp(36px, 4vw, 52px)" }}
          >
            <Link href={localeHref(locale, "terms")} className="zw-legal-back">
              <Icon name="chevL" size={15} color="currentColor" />
              {t.backToLegal}
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
