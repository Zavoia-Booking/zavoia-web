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
import { Icon, Kicker } from "@/components/ui";
import {
  LEGAL_AUDIENCE_ORDER,
  LEGAL_DOCUMENTS,
  type LegalAudience,
} from "@/data/legal";
import { DocRow } from "./_components/doc-row";

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = dictionaries[locale];

  const languages = Object.fromEntries(
    LOCALES.map((l) => [l, localeHref(l, "terms")]),
  ) as Record<Locale, string>;

  return {
    title: dict.legal.hubTitle,
    description: dict.legal.hubDescription,
    alternates: {
      canonical: localeHref(locale, "terms"),
      languages: {
        ...languages,
        "x-default": localeHref(DEFAULT_LOCALE, "terms"),
      },
    },
  };
}

const AUDIENCE_LABEL_KEY: Record<
  LegalAudience,
  "audienceGeneral" | "audienceCustomer" | "audienceBusiness"
> = {
  general: "audienceGeneral",
  customer: "audienceCustomer",
  business: "audienceBusiness",
};

// The legal hub — an editorial index of every Zavoia policy, grouped by who it
// binds. Rows rather than cards: eleven documents read faster as a library
// index than as a grid of equal tiles, and the group rules give the page its
// structure without boxing every entry.
export default async function LegalHubPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = dictionaries[locale];
  const t = dict.legal;

  return (
    <main
      className="zw-legal-page zw-container"
      style={{ padding: "clamp(30px, 4vw, 52px) var(--gutter) clamp(56px, 7vw, 88px)" }}
    >
      <div className="zw-legal-shell">
        <header style={{ maxWidth: 660 }}>
          <Kicker style={{ marginBottom: 14 }}>{t.hubKicker}</Kicker>
          <h1
            className="txt-balance"
            style={{
              margin: 0,
              fontSize: "clamp(32px, 4.4vw, 54px)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.0,
              color: "var(--c-900)",
            }}
          >
            {t.hubHeading}
          </h1>
          <p
            className="txt-pretty"
            style={{
              margin: "18px 0 0",
              fontSize: "clamp(15.5px, 1.4vw, 17.5px)",
              lineHeight: 1.6,
              color: "var(--c-600)",
              maxWidth: "62ch",
            }}
          >
            {t.hubIntro}
          </p>
        </header>

        <div style={{ marginTop: "clamp(36px, 4.5vw, 56px)" }}>
          {LEGAL_AUDIENCE_ORDER.map((audience) => {
            const docs = LEGAL_DOCUMENTS.filter((d) => d.audience === audience);
            if (docs.length === 0) return null;
            const label = t[AUDIENCE_LABEL_KEY[audience]];
            return (
              <section key={audience} className="zw-legal-group" id={audience}>
                <h2 className="zw-legal-grouphead">
                  <span className="zw-legal-grouplbl">{label}</span>
                  <span className="zw-legal-grouprule" aria-hidden="true" />
                  <span className="zw-legal-groupn" aria-hidden="true">
                    {String(docs.length).padStart(2, "0")}
                  </span>
                </h2>
                <div className="zw-legal-rows">
                  {docs.map((doc) => (
                    <DocRow
                      key={doc.slug}
                      doc={doc}
                      locale={locale}
                      draftLabel={t.statusDraft}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="zw-legal-hubfoot">
          <span className="zw-legal-hubfoot-q">{t.hubHelp}</span>
          <Link href={localeHref(locale, "help")} className="zw-legal-hubfoot-a">
            {dict.accountMenu.helpSupport}
            <Icon name="arrowR" size={15} color="currentColor" />
          </Link>
        </div>
      </div>
    </main>
  );
}
