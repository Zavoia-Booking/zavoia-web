"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon, Kicker, type IconName } from "@/components/ui";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import { ReportIssue } from "./report-issue";

type QA = { q: string; a: string };
type Topic = { id: string; icon: string; label: string; items: QA[] };
type GoodToKnowLink = { label: string; href: string };

interface HelpCenterProps {
  locale: Locale;
  head: { kicker: string; title: string; sub: string };
  searchPlaceholder: string;
  allLabel: string;
  resultsLabel: string;
  noResults: string;
  topics: Topic[];
  goodToKnowTitle: string;
  goodToKnowLinks: GoodToKnowLink[];
  report: Dictionary["help"]["report"];
}

// One expandable Q&A row. Mirrors ZwHelpQARow — a header button that toggles
// the answer paragraph below. We only carry a single answer string, so the
// body is a single <p> (no "Open full guide" link, no per-article route).
function QARow({
  item,
  open,
  onToggle,
}: {
  item: QA;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="zw-help-qa-row" data-on={open ? "1" : "0"}>
      <button
        type="button"
        className="zw-help-qa-q tap"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="zw-help-qa-qt">{item.q}</span>
        <span className="zw-help-qa-ic">
          <Icon
            name={open ? "chevU" : "chevD"}
            size={14}
            color={open ? "#fff" : "var(--c-700)"}
          />
        </span>
      </button>
      {open && (
        <div
          className="zv-fade"
          style={{ padding: "0 4px 20px", maxWidth: 660 }}
        >
          <p
            className="txt-pretty"
            style={{
              margin: "8px 0",
              fontSize: 14.5,
              lineHeight: 1.65,
              color: "var(--c-600)",
            }}
          >
            {item.a}
          </p>
        </div>
      )}
    </div>
  );
}

export function HelpCenter({
  locale,
  head,
  searchPlaceholder,
  allLabel,
  resultsLabel,
  noResults,
  topics,
  goodToKnowTitle,
  goodToKnowLinks,
  report,
}: HelpCenterProps) {
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const query = q.trim().toLowerCase();

  // Flat, cross-topic search results (only when there's a query). Each entry
  // keeps a stable id so a single-open accordion works across both modes.
  const results = useMemo(() => {
    if (!query) return null;
    const matches: { id: string; item: QA }[] = [];
    topics.forEach((tp) => {
      tp.items.forEach((item, i) => {
        if (
          item.q.toLowerCase().includes(query) ||
          item.a.toLowerCase().includes(query)
        ) {
          matches.push({ id: `${tp.id}-${i}`, item });
        }
      });
    });
    return matches;
  }, [query, topics]);

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  const visibleTopics =
    topic === "all" ? topics : topics.filter((tp) => tp.id === topic);

  return (
    <div
      className="zw-container"
      style={{ paddingTop: "clamp(30px, 4vw, 52px)", width: "100%" }}
    >
      {/* Editorial header */}
      <div style={{ maxWidth: 700 }}>
        <Kicker style={{ marginBottom: 14 }}>{head.kicker}</Kicker>
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
          {head.title}
        </h1>
        <p
          className="txt-pretty"
          style={{
            margin: "18px 0 0",
            fontSize: "clamp(15.5px, 1.4vw, 18px)",
            lineHeight: 1.6,
            color: "var(--c-600)",
            maxWidth: 540,
          }}
        >
          {head.sub}
        </p>
        <div className="zw-help-search">
          <Icon name="search" size={18} color="var(--c-500)" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            style={{
              flex: 1,
              minWidth: 0,
              border: 0,
              outline: 0,
              background: "transparent",
              fontSize: 15.5,
              color: "var(--c-900)",
              fontFamily: "inherit",
              padding: "8px 0",
            }}
          />
          {q && (
            <button
              type="button"
              className="tap"
              onClick={() => setQ("")}
              aria-label="Clear"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: 0,
                background: "var(--c-shade)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="x" size={14} color="var(--c-700)" />
            </button>
          )}
        </div>
      </div>

      {/* Two-column body — Q&A left, "Good to know" right */}
      <div className="zw-help-grid">
        <div className="zw-help-main">
          {query ? (
            <>
              <div className="zw-help-grouphead">
                {results?.length ?? 0} {resultsLabel} &ldquo;{q}&rdquo;
              </div>
              {results && results.length === 0 ? (
                <div style={{ padding: "24px 4px", color: "var(--c-600)" }}>
                  <p
                    className="txt-pretty"
                    style={{ margin: 0, fontSize: 15 }}
                  >
                    {noResults}
                  </p>
                </div>
              ) : (
                <div className="zw-help-qa">
                  {results?.map(({ id, item }) => (
                    <QARow
                      key={id}
                      item={item}
                      open={openId === id}
                      onToggle={() => toggle(id)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Topic filter */}
              <div className="zw-help-chips">
                <button
                  type="button"
                  className="zw-help-chip"
                  data-on={topic === "all" ? "1" : "0"}
                  onClick={() => setTopic("all")}
                >
                  {allLabel}
                </button>
                {topics.map((tp) => (
                  <button
                    key={tp.id}
                    type="button"
                    className="zw-help-chip"
                    data-on={topic === tp.id ? "1" : "0"}
                    onClick={() => setTopic(tp.id)}
                  >
                    {tp.label}
                  </button>
                ))}
              </div>

              {visibleTopics.map((tp) => {
                if (!tp.items.length) return null;
                return (
                  <section key={tp.id} style={{ marginTop: 26 }}>
                    <div className="zw-help-grouphead">
                      <Icon
                        name={tp.icon as IconName}
                        size={14}
                        color="var(--p-600)"
                      />
                      {tp.label}
                    </div>
                    <div className="zw-help-qa">
                      {tp.items.map((item, i) => {
                        const id = `${tp.id}-${i}`;
                        return (
                          <QARow
                            key={id}
                            item={item}
                            open={openId === id}
                            onToggle={() => toggle(id)}
                          />
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </>
          )}
        </div>

        <aside className="zw-help-aside">
          <ReportIssue t={report} locale={locale} />
          <div className="zw-help-card">
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--c-500)",
                marginBottom: 2,
              }}
            >
              {goodToKnowTitle}
            </div>
            {goodToKnowLinks.map((link) => (
              <Link key={link.href} href={link.href} className="zw-help-qlink tap">
                <span>{link.label}</span>
                <Icon name="arrowR" size={13} color="var(--c-400)" />
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
