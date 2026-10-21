"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { useHomeCoords } from "@/app/_components/home/use-home-coords";
import { SEARCH_RADIUS_KM } from "@/components/search/constants";
import { Icon } from "@/components/ui/icon";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { industryVisual } from "@/lib/marketplace/industry-visuals";
import styles from "./industry-browser.module.css";

type DirectoryIndustry = {
  slug: string;
  label: string;
  searchText: string;
  href: string;
  tags: {
    id: number;
    label: string;
    searchText: string;
    href: string;
  }[];
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function IndustryBrowser({
  industries,
  labels: t,
}: {
  industries: DirectoryIndustry[];
  labels: Dictionary["industryDirectory"];
}) {
  // Preserve the visitor's actual location for searches without substituting
  // a different city when no geographic landing page matches it.
  const location = useHomeCoords();
  const locationQuery = new URLSearchParams();
  if (location.coords) {
    locationQuery.set("lat", String(location.coords.lat));
    locationQuery.set("lng", String(location.coords.lng));
    locationQuery.set("radius", String(SEARCH_RADIUS_KM));
  }
  if (location.city) locationQuery.set("city", location.city);

  function destination(item: { href: string }) {
    // Unknown locations keep the neutral industry/tag search destination;
    // neither the UI language nor the country supplies a substitute city.
    return locationQuery.size ? `${item.href}&${locationQuery}` : item.href;
  }

  const [query, setQuery] = useState("");
  const [activeSlug, setActiveSlug] = useState(industries[0]?.slug);
  const input = useRef<HTMLInputElement>(null);
  const mobileIndex = useRef<HTMLDetailsElement>(null);
  const catalogue = useRef<HTMLDivElement>(null);
  const normalizedQuery = normalize(query);
  // Only this small, already-rendered catalogue is filtered. No search requests,
  // URL variants or changes to the marketplace's business search are involved.
  const visible = useMemo(
    () =>
      industries.flatMap((industry) => {
        if (
          !normalizedQuery ||
          normalize(`${industry.label} ${industry.searchText}`).includes(
            normalizedQuery,
          )
        ) {
          return [industry];
        }
        const tags = industry.tags.filter((tag) =>
          normalize(`${tag.label} ${tag.searchText}`).includes(normalizedQuery),
        );
        return tags.length ? [{ ...industry, tags }] : [];
      }),
    [industries, normalizedQuery],
  );
  const currentSlug = visible.some((industry) => industry.slug === activeSlug)
    ? activeSlug
    : visible[0]?.slug;

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    // Observe section intersections rather than updating React on every scroll.
    const sections = catalogue.current?.querySelectorAll<HTMLElement>(
      "section[data-industry]",
    );
    const inView = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inView.add(entry.target);
          else inView.delete(entry.target);
        }
        const first = Array.from(sections ?? []).find((section) =>
          inView.has(section),
        );
        if (first?.dataset.industry) setActiveSlug(first.dataset.industry);
      },
      { rootMargin: "-100px 0px -55% 0px", threshold: 0 },
    );
    sections?.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [visible]);

  function clearSearch() {
    setQuery("");
    input.current?.focus();
  }

  function navigateToIndustry(event: MouseEvent<HTMLAnchorElement>, slug: string) {
    // Preserve native new-tab/modified-click behaviour and real fragment hrefs.
    if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
      event.ctrlKey || event.shiftKey || event.altKey) return;
    const heading = document.getElementById(`industry-${slug}`);
    if (!heading) return;
    event.preventDefault();
    if (mobileIndex.current) mobileIndex.current.open = false;
    setActiveSlug(slug);
    const hash = `#industry-${slug}`;
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    // Closing the mobile index changes the target's position. Measure after
    // that change, and move keyboard focus without cancelling the smooth scroll.
    heading.focus({ preventScroll: true });
    const instant = event.detail === 0 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    heading.scrollIntoView({ behavior: instant ? "instant" : "smooth", block: "start" });
  }

  function indexLinks() {
    return (
      <ul role="list" className={styles.indexList}>
        {visible.map((industry) => (
          <li key={industry.slug}>
            <a
              href={`#industry-${industry.slug}`}
              className={styles.indexLink}
              aria-current={
                currentSlug === industry.slug ? "location" : undefined
              }
              onClick={(event) => navigateToIndustry(event, industry.slug)}
            >
              {industry.label}
            </a>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={styles.browser}>
      <aside className={styles.sidebar}>
        <nav aria-label={t.indexLabel}>
          {indexLinks()}
        </nav>
      </aside>
      <div className={styles.content}>
        <noscript>
          <style>{`.${styles.filter} { display: none; }`}</style>
        </noscript>
        <div className={styles.toolbar}>
          <div
            className={styles.filter}
            role="search"
            aria-label={t.filterLabel}
          >
            <label htmlFor="industry-filter" className={styles.filterLabel}>
              {t.filterLabel}
            </label>
            <div className={styles.inputWrap}>
              <Icon name="search" size={20} />
              <input
                ref={input}
                id="industry-filter"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.filterPlaceholder}
                autoComplete="off"
                aria-controls="industry-results"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className={styles.clear}
                  aria-label={t.clearSearch}
                >
                  <Icon name="x" size={18} />
                </button>
              )}
            </div>
          </div>
          <p
            className={styles.resultCount}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {format(visible.length === 1 ? t.resultsOne : t.resultsMany, {
              count: String(visible.length),
            })}
          </p>
        </div>
        <details ref={mobileIndex} className={styles.mobileIndex}>
          <summary>
            {t.indexLabel}
            <Icon name="chevD" size={18} />
          </summary>
          <nav aria-label={t.indexLabel}>{indexLinks()}</nav>
        </details>
        <div ref={catalogue} id="industry-results">
          {visible.map((industry) => {
            const visual = industryVisual(industry.slug);
            const headingId = `industry-${industry.slug}`;
            return (
              <section
                key={industry.slug}
                data-industry={industry.slug}
                aria-labelledby={headingId}
                className={styles.industry}
              >
                <h2
                  id={headingId}
                  tabIndex={-1}
                  className={styles.industryTitle}
                >
                  <Link
                    href={destination(industry)}
                    prefetch={false}
                    className={styles.industryIdentity}
                    aria-label={format(t.viewIndustryLabel, {
                      industry: industry.label,
                    })}
                  >
                    <span className={styles.glyph} aria-hidden="true">
                      <Icon name={visual.icon} size={24} color={visual.accent} />
                    </span>
                    <span>{industry.label}</span>
                    <Icon name="arrowR" size={20} className={styles.industryArrow} />
                  </Link>
                </h2>
                {industry.tags.length > 0 && (
                  <ul role="list" className={styles.services}>
                    {industry.tags.map((tag) => (
                      <li key={tag.id}>
                        <Link
                          href={destination(tag)}
                          prefetch={false}
                          className={styles.serviceLink}
                        >
                          <span>{tag.label}</span>
                          <Icon name="chevR" size={14} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
          {visible.length === 0 && (
            <section className={styles.noResults}>
              <Icon name="search" size={28} />
              <h2>{t.noResultsTitle}</h2>
              <p>{t.noResultsBody}</p>
              <button
                type="button"
                className={styles.reset}
                onClick={clearSearch}
              >
                {t.clearSearch}
                <Icon name="arrowR" size={16} />
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
