"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import disclosure from "@/components/ui/disclosure-motion.module.css";
import { useTranslation } from "@/i18n/useTranslation";
import type { Industry } from "@/lib/api/marketplace/types";
import { taxonomyLabel } from "@/lib/marketplace/card-mappers";
import { otherIndustryLast } from "@/lib/marketplace/industry-order";
import { industryAccent, industryIcon } from "@/lib/marketplace/industry-visuals";
import styles from "./search-industry-browser.module.css";

interface SearchIndustryBrowserProps {
  industries: Industry[];
  initialIndustry?: string;
  browsedIndustry?: string;
  industry: string;
  tagIds: number[];
  onBrowseIndustry: (industrySlug: string) => void;
  onSelectAll: () => void;
  onSelectIndustry: (industrySlug: string) => void;
  onSelectTag: (industrySlug: string, tagId: number) => void;
  catalogFallback?: ReactNode;
  children?: ReactNode;
}

/** Expanding an industry is browsing; only a scope/category choice applies it. */
export function SearchIndustryBrowser({ industries, initialIndustry, browsedIndustry, industry, tagIds, onBrowseIndustry, onSelectAll, onSelectIndustry, onSelectTag, catalogFallback, children }: SearchIndustryBrowserProps) {
  const { locale, dict } = useTranslation();
  const id = useId();
  const [animated, setAnimated] = useState(false);
  const catalog = useMemo(() => otherIndustryLast(
    [...industries].sort((a, b) => Number(b.slug === initialIndustry) - Number(a.slug === initialIndustry)),
    item => item.slug,
  ), [industries, initialIndustry]);
  const allSelected = !industry && tagIds.length === 0;

  return (
    <div className={styles.browser} data-search-industry-browser="" data-animated={animated}>
      {children}
      <section className={styles.overview} aria-labelledby={`${id}-title`}>
        <h3 id={`${id}-title`} className={styles.overviewTitle}>{dict.searchOverlay.browseByIndustry}</h3>
        <button
          type="button"
          className={styles.allIndustries}
          data-search-all-industries=""
          aria-pressed={allSelected}
          onClick={event => { setAnimated(event.detail > 0); onSelectAll(); }}
        >
          <Icon name="grid" size={20} aria-hidden="true" />
          <span>{dict.serviceCatalog.allIndustries}</span>
          <span className={styles.selectionIndicator} aria-hidden="true">
            <Icon name="check" size={14} />
          </span>
        </button>
        {catalogFallback ?? <>
          <ul className={styles.industries}>
            {catalog.map(item => {
              const expanded = item.slug === browsedIndustry;
              const selected = industry === item.slug || item.tags.some(tag => tagIds.includes(tag.id));
              const wholeIndustrySelected = industry === item.slug && tagIds.length === 0;
              const triggerId = `${id}-${item.id}-trigger`;
              const panelId = `${id}-${item.id}-categories`;
              return (
                <li key={item.id} className={`${styles.industry} ${disclosure.root}`} data-open={expanded}>
                  <h4 className={styles.industryHeading}>
                    <button
                      id={triggerId}
                      type="button"
                      className={styles.industryTrigger}
                      data-industry-filter={item.slug}
                      data-selected={selected}
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      onClick={event => {
                        setAnimated(event.detail > 0);
                        onBrowseIndustry(expanded ? "" : item.slug);
                      }}
                    >
                      <Icon name={industryIcon(item.slug)} size={20} color={industryAccent(item.slug)} aria-hidden="true" />
                      <span>{taxonomyLabel(item, locale, dict.industries)}</span>
                      {selected && <Icon name="check" size={16} aria-hidden="true" />}
                      <Icon name="chevD" size={16} className={styles.chevron} aria-hidden="true" />
                    </button>
                  </h4>
                  <div id={panelId} className={styles.reveal} inert={!expanded} aria-hidden={!expanded}>
                    <div className={styles.revealClip}>
                      <div className={styles.categories}>
                        <button
                          type="button"
                          className={`${styles.choice} ${styles.wholeIndustry}`}
                          data-search-whole-industry={item.slug}
                          aria-pressed={wholeIndustrySelected}
                          onClick={() => onSelectIndustry(item.slug)}
                        >
                          <span>{dict.searchOverlay.allInIndustry}</span>
                          <Icon name={wholeIndustrySelected ? "check" : "chevR"} size={16} aria-hidden="true" />
                        </button>
                        {item.tags.length > 0 && <ul className={styles.serviceList}>
                          {item.tags.map(tag => {
                            const tagSelected = tagIds.includes(tag.id);
                            return <li key={tag.id}>
                              <button
                                type="button"
                                className={styles.choice}
                                data-search-tag={tag.id}
                                aria-pressed={tagSelected}
                                onClick={() => onSelectTag(item.slug, tag.id)}
                              >
                                <span>{taxonomyLabel(tag, locale, dict.industryTags)}</span>
                                <Icon name={tagSelected ? "check" : "chevR"} size={16} aria-hidden="true" />
                              </button>
                            </li>;
                          })}
                        </ul>}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {catalog.length === 0 && <div className={styles.empty}>
            <p className={styles.emptyTitle}>{dict.serviceCatalog.emptyTitle}</p>
            <p className={styles.emptyBody}>{dict.serviceCatalog.emptyBody}</p>
          </div>}
        </>}
      </section>
    </div>
  );
}

/** The heading, All choice and recent searches remain usable while rows load. */
export function SearchIndustryBrowserSkeleton() {
  return (
    <div className={styles.industries} aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className={styles.industry}>
          <div className={styles.industryTrigger}>
            <Skeleton w={20} h={20} r={6} />
            <Skeleton w={`${112 + (index % 3) * 26}px`} h={16} r={5} />
          </div>
        </div>
      ))}
    </div>
  );
}
