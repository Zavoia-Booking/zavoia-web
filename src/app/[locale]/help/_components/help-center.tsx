"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { QARow } from "@/components/ui/qa-row";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatCount } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { ReportIssue } from "./report-issue";
import m from "@/app/_components/for-business/marketing.module.css";
import faq from "@/app/_components/for-business/faq-section.module.css";
import searchStyles from "@/components/search/search-overlay.module.css";
import styles from "./help-center.module.css";

type QA = {
  q: string;
  a: string;
  searchTerms?: string[];
};
type Topic = { id: string; label: string; items: QA[] };

interface HelpCenterProps {
  locale: Locale;
  head: Dictionary["help"]["head"];
  artwork: ReactNode;
  searchPlaceholder: string;
  searchLabel: string;
  clearSearchLabel: string;
  resultsLabel: Dictionary["help"]["resultsLabel"];
  noResults: string;
  topics: Topic[];
  usefulLinks: { title: string; items: { label: string; href: string }[] };
  report: Dictionary["help"]["report"];
}

/** Romanian search accepts the same words with or without diacritics. */
function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function HelpCenter({
  locale, head, artwork, searchPlaceholder, searchLabel, clearSearchLabel,
  resultsLabel, noResults, topics, usefulLinks, report,
}: HelpCenterProps) {
  const [q, setQ] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const clearSearch = () => { setQ(""); searchRef.current?.focus(); };
  const query = normalizeSearch(q.trim());

  const results = useMemo(() => {
    if (!query) return null;
    const words = query.split(" ");
    return topics.flatMap((tp) => tp.items.flatMap((item, i) => {
      const text = normalizeSearch([item.q, item.a, ...(item.searchTerms ?? [])].join(" "));
      return words.every(word => text.includes(word)) ? [{ id: `${tp.id}-${i}`, item }] : [];
    }));
  }, [query, topics]);
  const resultHeading = query ? `${formatCount(results?.length ?? 0, locale, resultsLabel)} “${q.trim()}”` : "";

  return (
    <div className={styles.page} data-locale={locale}>
      <div className={`zw-container ${faq.layout} ${styles.layout}`}>
        <div className={styles.sidebar}>
          <div className={`${faq.intro} ${styles.intro}`}>
            <div className={`${faq.copy} ${styles.copy}`}>
              <h1 className={`${m.h1} ${styles.title}`} id="help-title">
                {head.title}{" "}<span className={`${m.signature} ${styles.signature}`}>{head.titleAccent}</span>
              </h1>
              <p className={`${faq.lead} ${styles.lead}`}>{head.sub}</p>
            </div>
          </div>
          <div className={styles.support}>
            <ReportIssue t={report} locale={locale} />
          </div>
        </div>

        <div className={styles.main}>
          <div className={styles.searchRow}>
            <div className={`${searchStyles.searchField} ${styles.search}`} role="search" aria-label={searchLabel}>
              <Icon name="search" size={20} color="var(--c-600)" />
              <input
                ref={searchRef}
                type="search"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchLabel}
                aria-controls="help-answers"
                autoComplete="off"
              />
              {q && <button type="button" className={styles.searchClear} onClick={clearSearch} aria-label={clearSearchLabel}>
                <Icon name="x" size={18} />
              </button>}
            </div>
            <div className={styles.artwork} aria-hidden="true">{artwork}</div>
          </div>
          <div className={styles.resultsArea}>
            <div className={query ? styles.resultsHeading : "sr-only"} role="status" aria-live="polite" aria-atomic="true">{resultHeading}</div>
            {query ? (
              results?.length === 0 ? (
                <div className={styles.empty} id="help-answers">
                  <p>{noResults}</p>
                  <div className={styles.emptyActions}>
                    <button type="button" className={`${m.button} ${m.buttonInk}`} onClick={clearSearch}>{clearSearchLabel}</button>
                  </div>
                </div>
              ) : (
                <div className={faq.list} id="help-answers">
                  {results?.map(({ id, item }) => <QARow key={id} item={item} />)}
                </div>
              )
            ) : (
              <div id="help-answers">
                {topics.map(tp => tp.items.length > 0 && (
                  <section key={tp.id} className={styles.group} aria-labelledby={`help-topic-${tp.id}`}>
                    <h2 className={styles.groupHeading} id={`help-topic-${tp.id}`}>
                      {tp.label}
                    </h2>
                    <div className={faq.list}>
                      {tp.items.map((item, i) => <QARow key={`${tp.id}-${i}`} item={item} />)}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
        <section className={styles.resources} aria-labelledby="help-useful-links">
          <h2 className={styles.groupHeading} id="help-useful-links">{usefulLinks.title}</h2>
          <div className={styles.resourceList}>
            {usefulLinks.items.map(link => (
              <Link key={link.href} href={link.href} className={styles.resourceLink}>
                <span>{link.label}</span><Icon name="arrowR" size={18} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
