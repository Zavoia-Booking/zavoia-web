"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { CalendarDay, MonthCalendar } from "@/components/ui/month-calendar";
import { SearchIndustryBrowser, SearchIndustryBrowserSkeleton } from "./search-industry-browser";
import styles from "./search-overlay.module.css";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineError } from "@/components/ui/inline-error";
import { useToast } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import { Img } from "@/components/ui/image";
import {
  taxonomyLabel,
  businessCardToData,
  locationCardToData,
} from "@/lib/marketplace/card-mappers";
import { getIndustries } from "@/lib/api/marketplace/public";
import { otherIndustryLast } from "@/lib/marketplace/industry-order";
import type {
  BusinessCard,
  Industry,
  LocationCard,
} from "@/lib/api/marketplace/types";
import { useSearchPreview } from "@/lib/search/use-search-preview";
import { PLACE_ZOOM, RECENTER_ZOOM, SEARCH_RADIUS_KM } from "./constants";
import type { Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  useCitySearch,
  reverseGeocode,
  searchCities,
  ipLocate,
  citySecondary,
  type CityResult,
} from "@/lib/geocoding";
import {
  getRecentSearches,
  pushRecentSearch,
  clearRecentSearches,
  recentSearchId,
  getRecentLocations,
  pushRecentLocation,
  type RecentSearch,
} from "@/lib/search/recents";
import {
  zwFmtDateISO,
  zwParseDateISO,
  zwSameDay,
  zwToday,
  zwTomorrow,
} from "./date-utils";

// ── Query model ─────────────────────────────────────────────────────────────
// The overlay's internal state. `step` selects which accordion card is open.
// On submit it is mapped to the /search URL params (slice 6a contract).
export type SearchStep = "what" | "where" | "when";

/**
 * The resolved "Where" selection. A picked MapTiler city (or current location)
 * carries coordinates → coordinate search. A bare `label` (e.g. an unlabeled
 * static fallback chip that produced no geocode) → fuzzy `city=` search.
 */
export interface WhereValue {
  label?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
}

export interface QueryModel {
  /** Free-text → `search` param. */
  what: string;
  /** Selected industry SLUG → `industry` param (empty = none). */
  industry: string;
  /** Selected tag ids → `tagIds` CSV param. */
  tagIds: number[];
  /** Resolved location → lat/lng/radius (coords) or `city` (label only). */
  where: WhereValue;
  /** `''` (any) | `'today'` | `'tom'` | `date:YYYY-MM-DD`. */
  when: string;
}

export const EMPTY_QUERY: QueryModel = {
  what: "",
  industry: "",
  tagIds: [],
  where: {},
  when: "",
};

// Static city convenience list — these just prefill the city text box. There is
// no city API; this is the unlabeled fallback shown only when there are no
// recent locations (see manifest).
const POPULAR_CITIES = ["București", "Cluj-Napoca", "Timișoara", "Iași"];

/**
 * Shape accepted by the `initial` prop. Callers (site-header / search-content)
 * prefill from URL params using the flat legacy fields (`city`, `lat`, `lng`).
 * These are normalized into the internal `where` value on mount. The structured
 * `where` field is also accepted for forward-compatibility.
 */
export type InitialQuery = Partial<
  Omit<QueryModel, "where"> & {
    where: WhereValue;
    city: string;
    lat: number;
    lng: number;
  }
>;

export interface SearchOverlayProps {
  open: boolean;
  initialStep: SearchStep;
  initial: InitialQuery;
  browseIndustry?: string;
  initialIndustries?: Industry[];
  returnFocusRef: RefObject<HTMLElement | null>;
  onClose: () => void;
}

/** Build the internal QueryModel from the (legacy-compatible) initial prop. */
function fromInitial(initial: InitialQuery): QueryModel {
  const { city, lat, lng, where, ...rest } = initial;
  const resolvedWhere: WhereValue =
    where ??
    (lat != null && lng != null
      ? { label: city || undefined, lat, lng }
      : city
        ? { label: city }
        : {});
  return { ...EMPTY_QUERY, ...rest, where: resolvedWhere };
}

// ── Eyebrow label style (mono micro-caps) ──
const eyebrow: CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  color: "var(--c-600)",
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 6,
  padding: "0 4px",
  display: "block",
};

// ── Live search-as-you-type preview (Businesses + Places) ──
function PreviewRow({
  image,
  name,
  cat,
  secondary,
  href,
  onSelectResult,
}: {
  image?: string;
  name: string;
  cat?: string;
  secondary?: string;
  href?: string;
  onSelectResult: (href: string) => void;
}) {
  const disabled = !href;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => href && onSelectResult(href)}
      className="tap zw-cal-day"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        width: "100%",
        padding: "10px 12px",
        background: "transparent",
        border: 0,
        borderRadius: 12,
        cursor: disabled ? "default" : "pointer",
        textAlign: "left",
      }}
    >
      <Img
        src={image}
        alt={name}
        label={cat}
        style={{ width: 44, height: 44, borderRadius: 12, objectFit: "cover" }}
      />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--c-900)",
            letterSpacing: "-0.008em",
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </span>
        {secondary && (
          <span
            style={{
              display: "block",
              marginTop: 2,
              fontSize: 12.5,
              color: "var(--c-600)",
              letterSpacing: "-0.005em",
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {secondary}
          </span>
        )}
      </span>
      <Icon
        name="chevR"
        size={14}
        color="var(--c-500)"
        style={{ flexShrink: 0 }}
      />
    </button>
  );
}

function SearchPreviewBlock({
  preview,
  locale,
  t,
  onSelectResult,
}: {
  preview: {
    businesses: BusinessCard[];
    locations: LocationCard[];
    loading: boolean;
    failed: boolean;
    retry: () => void;
  };
  locale: Locale;
  t: Dictionary["searchOverlay"];
  onSelectResult: (href: string) => void;
}) {
  const { businesses, locations, loading, failed, retry } = preview;
  const { dict } = useTranslation();
  const empty = businesses.length === 0 && locations.length === 0;

  const subtle: CSSProperties = {
    padding: "12px 4px",
    fontSize: 13,
    color: "var(--c-600)",
    letterSpacing: "-0.005em",
    textAlign: "center",
  };

  return (
    <div style={{ marginTop: 18 }} aria-busy={loading}>
      <span role="status" className="sr-only">{loading ? t.searching : ""}</span>
      {failed && <div style={{ display: "grid", gap: 10, padding: "12px 4px" }}>
        <InlineError>{t.previewError}</InlineError>
        <Button kind="secondary" size="sm" loading={loading} onClick={retry} style={{ justifySelf: "start" }}>{dict.search.retry}</Button>
      </div>}
      {loading && empty && !failed ? (
        <div aria-hidden="true">
          <span style={eyebrow}>{t.resultsPlaces}</span>
          {[0, 1, 2].map(row => <div key={row} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", minHeight: 64, marginBottom: 2 }}>
            <Skeleton w={44} h={44} r={12} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, display: "grid", gap: 4 }}><Skeleton w="65%" h={16.8} /><Skeleton w="40%" h={15} /></div>
          </div>)}
        </div>
      ) : empty && !failed ? (
        <div style={subtle}>{t.noResults}</div>
      ) : !empty ? (
        <>
          {businesses.length > 0 && (
            <div>
              <span style={eyebrow}>{t.resultsBusinesses}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {businesses.map((b) => {
                  const data = businessCardToData(b, locale);
                  return (
                    <PreviewRow
                      key={`b-${b.id}`}
                      image={data.image}
                      name={data.name}
                      cat={data.cat}
                      secondary={b.city ?? undefined}
                      href={data.href}
                      onSelectResult={onSelectResult}
                    />
                  );
                })}
              </div>
            </div>
          )}
          {locations.length > 0 && (
            <div style={{ marginTop: businesses.length > 0 ? 14 : 0 }}>
              <span style={eyebrow}>{t.resultsPlaces}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {locations.map((l) => {
                  const data = locationCardToData(l, locale);
                  return (
                    <PreviewRow
                      key={`l-${l.id}`}
                      image={data.image}
                      name={data.name}
                      cat={data.cat}
                      secondary={data.city}
                      href={data.href}
                      onSelectResult={onSelectResult}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

// The active card owns scrolling; collapsed headers never shrink or clip.
function Section({ label, summary, open, showSummaryWhenOpen = false, onToggle, children }: {
  label: string;
  summary: string;
  open: boolean;
  showSummaryWhenOpen?: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const id = useId();
  const headerRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(open);
  useEffect(() => {
    if (open && !wasOpen.current) headerRef.current?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open]);
  return (
    <div className={styles.section} data-search-section="" data-open={open}>
      <button
        ref={headerRef}
        type="button"
        onClick={open ? undefined : onToggle}
        className={styles.sectionHeader}
        aria-expanded={open}
        aria-controls={id}
        aria-disabled={open || undefined}
        tabIndex={open ? -1 : 0}
      >
        <span className={styles.sectionLabel}>{label}</span>
        {(!open || showSummaryWhenOpen) && <span className={styles.sectionSummary}>{summary}</span>}
      </button>
      <div id={id} className={styles.sectionReveal} inert={!open}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionScroll} data-search-section-scroll="" onFocusCapture={event => {
            const target = event.target;
            if (!(target instanceof HTMLElement) || !target.matches(':focus-visible')) return;
            const container = event.currentTarget;
            const frame = container.getBoundingClientRect();
            const item = target.getBoundingClientRect();
            const field = container.querySelector<HTMLElement>('[data-search-what-field-shell]');
            const inset = field && !field.contains(target) ? field.getBoundingClientRect().height + 8 : 8;
            if (item.top < frame.top + inset) container.scrollBy({ top: item.top - frame.top - inset, behavior: "instant" });
            else if (item.bottom > frame.bottom - 8) container.scrollBy({ top: item.bottom - frame.bottom + 8, behavior: "instant" });
          }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

function RecentSearches({ entries, onSelect, onClear }: {
  entries: RecentSearch[];
  onSelect: (entry: RecentSearch) => void;
  onClear: () => void;
}) {
  const { dict } = useTranslation();
  const t = dict.searchOverlay;
  return (
    <div className={styles.recents}>
      <div className={styles.recentsHeader}>
        <h3>{t.recentSearches}</h3>
        <button type="button" className={styles.recentsAction} onClick={onClear}>{t.clearRecents}</button>
      </div>
      <ul className={styles.recentList} data-search-recents="">
        {entries.map(entry => {
          const subtitle = [entry.whenLabel, entry.whereLabel].filter(value => value?.trim()).join(" · ");
          return (
            <li key={entry.id}>
              <button type="button" className={styles.recentChoice} onClick={() => onSelect(entry)}>
                <Icon name="arrowUL" size={17} aria-hidden="true" />
                <span className={styles.recentCopy}>
                  <span className={styles.recentLabel}>{entry.label}</span>
                  {subtitle && <span className={styles.recentSubtitle}>{subtitle}</span>}
                </span>
                <Icon name="chevR" size={14} aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── What: free text + recent searches + inline industry disclosures ──
function WhatSection({
  what,
  setWhat,
  industry,
  tagIds,
  industries,
  industriesLoading,
  industriesFailed,
  retryIndustries,
  recentSearches,
  onSelectRecentSearch,
  onClearRecentSearches,
  onSelectTag,
  onSelectResult,
  autoFocus,
  initialBrowseIndustry,
  browsedIndustry,
  onBrowseIndustry,
  onSelectAllIndustries,
  onSelectIndustry,
}: {
  what: string;
  setWhat: (v: string) => void;
  industry: string;
  tagIds: number[];
  industries: Industry[];
  industriesLoading: boolean;
  industriesFailed: boolean;
  retryIndustries: () => void;
  recentSearches: RecentSearch[];
  onSelectRecentSearch: (entry: RecentSearch) => void;
  onClearRecentSearches: () => void;
  onSelectTag: (industrySlug: string, tagId: number) => void;
  onSelectResult: (href: string) => void;
  autoFocus: boolean;
  initialBrowseIndustry?: string;
  browsedIndustry?: string;
  onBrowseIndustry: (slug: string) => void;
  onSelectAllIndustries: () => void;
  onSelectIndustry: (slug: string) => void;
}) {
  const { locale, dict } = useTranslation();
  const t = dict.searchOverlay;
  const inputRef = useRef<HTMLInputElement>(null);

  const preview = useSearchPreview(what);
  const showPreview = what.trim().length >= 2;
  const showHint = what.trim().length === 1;
  const showIndustryBrowser = industries.length > 0 || (!industriesLoading && !industriesFailed);
  const recentHistory = recentSearches.length > 0 && <RecentSearches
    entries={recentSearches}
    onSelect={onSelectRecentSearch}
    onClear={onClearRecentSearches}
  />;
  const industryError = industriesFailed && <div style={{ display: "grid", gap: 10, paddingBlock: 12 }}>
    <InlineError>{t.industriesError}</InlineError>
    <Button kind="secondary" size="sm" loading={industriesLoading} onClick={retryIndustries} style={{ justifySelf: "start" }}>{dict.search.retry}</Button>
  </div>;

  useEffect(() => {
    if (!autoFocus) return;
    const id = setTimeout(() => {
      // Do not steal focus if the visitor already started browsing while the
      // dialog's entrance animation was finishing.
      if (document.activeElement?.closest('[data-search-section-scroll]')) return;
      inputRef.current?.focus({ preventScroll: true });
    }, 240);
    return () => clearTimeout(id);
  }, [autoFocus]);

  return (
    <div>
      <div className={styles.searchFieldShell} data-search-what-field-shell="">
        <div className={styles.searchField}>
          <Icon name="search" size={16} color="var(--c-700)" />
          <input
            ref={inputRef}
            value={what}
            onChange={(e) => setWhat(e.target.value)}
            placeholder={t.whatPlaceholder}
            aria-label={t.whatPlaceholder}
            style={{
              flex: 1,
              minWidth: 0,
              border: 0,
              outline: "none",
              background: "transparent",
              color: "var(--c-900)",
              fontFamily: "var(--font-sans)",
              letterSpacing: "-0.005em",
            }}
          />
          {what && (
            <button
              type="button"
              onClick={() => setWhat("")}
              className="tap"
              aria-label={t.clearInput}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "var(--c-300)",
                color: "var(--c-700)",
                border: 0,
                padding: 0,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="x" size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Live search-as-you-type preview — replaces the recents + categories
          blocks whenever the query has >= 2 chars. */}
      {showPreview && (
        <SearchPreviewBlock
          preview={preview}
          locale={locale}
          t={t}
          onSelectResult={onSelectResult}
        />
      )}

      {/* Keep-typing hint — shown only when the trimmed query is exactly one
          character (preview needs >= 2, recents/categories need empty). Matches
          the subtle status-line style used in the preview block. */}
      {showHint && (
        <div
          style={{
            marginTop: 18,
            padding: "12px 4px",
            fontSize: 13,
            color: "var(--c-600)",
            letterSpacing: "-0.005em",
            textAlign: "center",
          }}
        >
          {t.keepTyping}
        </div>
      )}


      {what.trim().length === 0 && (
        <div style={{ marginTop: 4 }}>
          <span role="status" className="sr-only">{industriesLoading ? t.searching : ""}</span>
          {showIndustryBrowser && industryError}
          <SearchIndustryBrowser
            industries={industries}
            initialIndustry={initialBrowseIndustry}
            browsedIndustry={browsedIndustry}
            industry={industry}
            tagIds={tagIds}
            onBrowseIndustry={onBrowseIndustry}
            onSelectAll={onSelectAllIndustries}
            onSelectIndustry={onSelectIndustry}
            onSelectTag={onSelectTag}
            catalogFallback={!showIndustryBrowser ? <>
              {industryError}
              {industriesLoading && !industriesFailed && <SearchIndustryBrowserSkeleton />}
            </> : undefined}
          >
            {recentHistory}
          </SearchIndustryBrowser>
        </div>
      )}
    </div>
  );
}

// ── Where: current location (radar) + live MapTiler city search ──
function WhereSection({
  hasGeo,
  resolvingLocation,
  recentLocations,
  onUseLocation,
  onSelectCity,
  onSelectStaticCity,
}: {
  hasGeo: boolean;
  resolvingLocation: boolean;
  recentLocations: CityResult[];
  onUseLocation: () => void;
  onSelectCity: (c: CityResult) => void;
  onSelectStaticCity: (name: string) => void;
}) {
  const { dict } = useTranslation();
  const t = dict.searchOverlay;
  const { query, setQuery, results, loading, failed, retry } = useCitySearch();
  const trimmed = query.trim();
  const showStatic = trimmed.length === 0;
  const showNoMatch = trimmed.length >= 2 && !loading && !failed && results.length === 0;

  const rowBtn: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: "transparent",
    border: 0,
    borderRadius: 12,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 11,
    textAlign: "left",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <button
        type="button"
        onClick={onUseLocation}
        className="tap"
        aria-pressed={hasGeo}
        aria-label={t.useCurrentLocation}
        aria-busy={resolvingLocation}
        disabled={resolvingLocation}
        style={{
          position: "relative",
          width: "100%",
          padding: "11px 13px",
          background: "transparent",
          border:
            "1px dashed color-mix(in oklch, var(--p-500) 35%, transparent)",
          borderRadius: 14,
          cursor: resolvingLocation ? "wait" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: 12,
          textAlign: "left",
        }}
      >
        <span
          aria-hidden={resolvingLocation || undefined}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            visibility: resolvingLocation ? "hidden" : undefined,
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "transparent",
              color: "var(--p-700)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              flexShrink: 0,
            }}
          >
            {hasGeo && (
              <span
                aria-hidden="true"
                style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
              >
                <span className="zv-radar-ring" data-i={1} />
                <span className="zv-radar-ring" data-i={2} />
                <span className="zv-radar-ring" data-i={3} />
              </span>
            )}
            <span style={{ position: "relative", display: "inline-flex" }}>
              <Icon name="nav" size={15} color="var(--p-700)" />
            </span>
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--c-900)",
                letterSpacing: "-0.012em",
                lineHeight: 1.2,
              }}
            >
              {t.useCurrentLocation}
            </span>
            <span
              style={{
                display: "block",
                marginTop: 2,
                fontSize: 12,
                color: "var(--c-600)",
                letterSpacing: "-0.005em",
                lineHeight: 1.3,
              }}
            >
              {hasGeo ? t.locationEnabled : t.locationHint}
            </span>
          </span>
          {hasGeo ? (
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "var(--c-ink)",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="check" size={12} />
            </span>
          ) : (
            <Icon name="chevR" size={14} color="var(--c-500)" />
          )}
        </span>
        {resolvingLocation && (
          <span
            aria-hidden="true"
            style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Spinner size={18} />
          </span>
        )}
      </button>
      <span role="status" aria-atomic="true" className="sr-only">
        {resolvingLocation ? t.resolvingLocation : ""}
      </span>

      <div
        style={{
          height: 46,
          padding: "0 14px",
          borderRadius: 12,
          border: "1px solid rgba(28,28,26,0.08)",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 9,
        }}
      >
        <span aria-hidden="true" style={{ width: 14, height: 14, flexShrink: 0 }}>
          {loading ? <Spinner size={14} color="var(--c-700)" /> : <Icon name="search" size={14} color="var(--c-700)" />}
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchCityPlaceholder}
          aria-label={t.searchCityPlaceholder}
          aria-busy={loading}
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            outline: "none",
            background: "transparent",
            fontFamily: "inherit",
            fontSize: 14,
            fontWeight: 500,
            color: "var(--c-900)",
            letterSpacing: "-0.008em",
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="tap"
            aria-label={t.clearInput}
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "var(--c-300)",
              color: "var(--c-700)",
              border: 0,
              padding: 0,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="x" size={11} />
          </button>
        )}
      </div>

      <span role="status" aria-atomic="true" className="sr-only">
        {loading ? t.searchingCities : ""}
      </span>
      {loading && !failed && results.length === 0 && (
        <div aria-busy="true">
          <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[0, 1, 2].map((row) => (
              <div key={row} style={{ ...rowBtn, cursor: "default" }}>
                <Skeleton w={30} h={30} r="50%" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, display: "grid", gap: 5 }}>
                  <Skeleton w="55%" h={16} />
                  <Skeleton w="75%" h={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {failed && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "0 4px" }}>
          <InlineError style={{ flex: "1 1 200px" }}>{t.citySearchError}</InlineError>
          <Button
            kind="secondary"
            size="sm"
            onClick={retry}
            disabled={loading}
            aria-label={dict.search.retry}
            aria-busy={loading}
            style={{ position: "relative", minHeight: 40 }}
          >
            <span aria-hidden={loading || undefined} style={{ visibility: loading ? "hidden" : undefined }}>
              {dict.search.retry}
            </span>
            {loading && (
              <span aria-hidden="true" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Spinner size={16} color="var(--c-700)" />
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Live results list. */}
      {!showStatic && results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {results.map((c) => {
            const secondary = citySecondary(c);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCity(c)}
                className="tap zw-cal-day"
                style={rowBtn}
              >
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "var(--c-100)",
                    color: "var(--c-700)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name="nav" size={13} color="var(--c-700)" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--c-900)",
                      letterSpacing: "-0.008em",
                      lineHeight: 1.2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.city || c.label}
                  </span>
                  {secondary && (
                    <span
                      style={{
                        display: "block",
                        marginTop: 1,
                        fontSize: 12,
                        color: "var(--c-600)",
                        letterSpacing: "-0.005em",
                        lineHeight: 1.3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {secondary}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty state. */}
      {showNoMatch && (
        <div
          style={{
            padding: "0 4px",
            fontSize: 13,
            color: "var(--c-600)",
            letterSpacing: "-0.005em",
          }}
        >
          {t.noCityMatches}
        </div>
      )}

      {/* Recent locations (only when the query is empty and any exist).
          Coords are already stored → select like a live result. */}
      {showStatic && recentLocations.length > 0 && (
        <div>
          <span style={eyebrow}>{t.recentLocations}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {recentLocations.map((c) => {
              const secondary = citySecondary(c);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectCity(c)}
                  className="tap zw-cal-day"
                  style={rowBtn}
                >
                  <Icon
                    name="arrowUL"
                    size={17}
                    color="var(--c-700)"
                    style={{ flexShrink: 0 }}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--c-900)",
                        letterSpacing: "-0.008em",
                        lineHeight: 1.2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.city || c.label}
                    </span>
                    {secondary && (
                      <span
                        style={{
                          display: "block",
                          marginTop: 1,
                          fontSize: 12,
                          color: "var(--c-600)",
                          letterSpacing: "-0.005em",
                          lineHeight: 1.3,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {secondary}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Unlabeled static fallback — ONLY when the query is empty and there are
          no recent locations, so the panel is never empty. Static chips have no
          coords → resolve on select. */}
      {showStatic && recentLocations.length === 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {POPULAR_CITIES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onSelectStaticCity(name)}
              className="tap"
              style={{
                height: 34,
                padding: "0 15px",
                borderRadius: 999,
                background: "#fff",
                color: "var(--c-900)",
                border: "1px solid rgba(28,28,26,0.08)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "-0.005em",
              }}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── When: month calendar (past days disabled) + presets ──
function MonthPicker({
  when,
  onPick,
}: {
  when: string;
  onPick: (v: string) => void;
}) {
  const { locale, dict } = useTranslation();
  const t = dict.searchOverlay;
  const today = useMemo(() => zwToday(), []);

  const pickedDate = useMemo(() => {
    if (when.startsWith("date:")) return zwParseDateISO(when.slice(5));
    if (when === "today") return today;
    if (when === "tom") return zwTomorrow(today);
    return null;
  }, [when, today]);

  const seed = pickedDate ?? today;
  const [view, setView] = useState({
    year: seed.getFullYear(),
    month: seed.getMonth(),
  });

  // Localized month/day names via Intl (no hardcoded English arrays).
  const monthLabel = useMemo(
    () =>
      new Date(view.year, view.month, 1).toLocaleDateString(locale, {
        month: "long",
        year: "numeric",
      }),
    [view, locale],
  );
  const dow = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
    // Mon-first; 2024-01-01 is a Monday.
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(2024, 0, 1 + i)),
    );
  }, [locale]);

  const firstOfMonth = new Date(view.year, view.month, 1);
  const dowMon = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - dowMon);
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  const stepMonth = (delta: number) =>
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  return (
    <MonthCalendar
      data-search-calendar=""
      title={monthLabel}
      previousLabel={t.prevMonth}
      nextLabel={t.nextMonth}
      onPrevious={() => stepMonth(-1)}
      onNext={() => stepMonth(1)}
      weekdays={dow}
    >
      {cells.map((d, i) => {
        const inMonth = d.getMonth() === view.month;
        const isPast = d < today;
        const isToday = zwSameDay(d, today);
        const isPicked = zwSameDay(d, pickedDate);
        const disabled = isPast;
        return (
          <CalendarDay
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onPick(`date:${zwFmtDateISO(d)}`)}
            aria-label={d.toLocaleDateString(locale, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
              aria-pressed={isPicked}
              data-today={isToday}
              data-outside={!inMonth}
              style={{
                color: isPicked
                  ? "#fff"
                  : disabled
                    ? "var(--c-400)"
                    : inMonth
                      ? "var(--c-900)"
                      : "var(--c-500)",
                border:
                  isToday && !isPicked
                    ? "1px solid var(--p-500)"
                    : "1px solid transparent",
                borderRadius: 999,
                cursor: disabled ? "default" : "pointer",
                padding: 0,
                fontWeight: isPicked || isToday ? 700 : 500,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.005em",
              }}
            >
              {d.getDate()}
            </CalendarDay>
          );
        })}
    </MonthCalendar>
  );
}

function WhenSection({
  when,
  onChange,
}: {
  when: string;
  onChange: (v: string) => void;
}) {
  const { dict } = useTranslation();
  const t = dict.searchOverlay;
  const presets: { id: string; label: string }[] = [
    { id: "", label: t.dateAny },
    { id: "today", label: t.dateToday },
    { id: "tom", label: t.dateTomorrow },
  ];
  return (
    <div className={styles.when}>
      <MonthPicker when={when} onPick={onChange} />
      <div className={styles.datePresets}>
        {presets.map((p) => {
          const active = when === p.id;
          return (
            <button
              key={p.id || "any"}
              type="button"
              onClick={() => onChange(p.id)}
              className="tap"
              aria-pressed={active}
              style={{
                height: 44,
                padding: "0 16px",
                background: active ? "var(--c-ink)" : "#fff",
                color: active ? "#fff" : "var(--c-900)",
                border: `1px solid ${active ? "var(--c-ink)" : "rgba(28,28,26,0.10)"}`,
                borderRadius: 999,
                cursor: "pointer",
                fontSize: 13.5,
                fontWeight: 600,
                letterSpacing: "-0.005em",
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Summary resolvers (state → collapsed-header display) ──
function whenSummary(
  when: string,
  t: { dateAny: string; dateToday: string; dateTomorrow: string },
  locale: string,
): string {
  if (!when) return t.dateAny;
  if (when === "today") return t.dateToday;
  if (when === "tom") return t.dateTomorrow;
  if (when.startsWith("date:")) {
    const d = zwParseDateISO(when.slice(5));
    if (!d) return t.dateAny;
    const today = zwToday();
    if (zwSameDay(d, today)) return t.dateToday;
    if (zwSameDay(d, zwTomorrow(today))) return t.dateTomorrow;
    return d.toLocaleDateString(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
  return t.dateAny;
}

// ── Overlay modal ────────────────────────────────────────────────────────────
let cachedIndustries: Industry[] | null = null;
let industriesRequest: Promise<Industry[]> | null = null;

export function SearchOverlay({
  open,
  initialStep,
  initial,
  browseIndustry,
  initialIndustries,
  returnFocusRef,
  onClose,
}: SearchOverlayProps) {
  const { locale, dict } = useTranslation();
  const t = dict.searchOverlay;
  const router = useRouter();
  const toast = useToast();
  const contentRef = useRef<HTMLDivElement>(null);

  // `initialStep`/`initial` are the per-open snapshot — the provider remounts
  // this component (via `key`) each time openSearch() runs, so these useState
  // initializers always reflect the latest open and no re-seed effect is needed.
  const [step, setStep] = useState<SearchStep>(initialStep);
  const [q, setQ] = useState<QueryModel>(() => fromInitial(initial));
  const [industries, setIndustries] = useState<Industry[]>(
    () => otherIndustryLast(initialIndustries ?? cachedIndustries ?? [], (industry) => industry.slug),
  );
  const [industriesLoading, setIndustriesLoading] = useState(initialIndustries === undefined && cachedIndustries === null);
  const [industriesFailed, setIndustriesFailed] = useState(false);
  const [industriesAttempt, setIndustriesAttempt] = useState(0);
  const [browseReset, setBrowseReset] = useState(0);
  // Keep browsing independent from applied query filters, and alive while the
  // text suggestions replace the catalogue. Empty string collapses all rows.
  const [browsedIndustry, setBrowsedIndustry] = useState<string>();
  const openingIndustry = browseReset === 0
    ? browseIndustry ?? (initial.industry || industries.find(industry =>
        industry.tags.some(tag => initial.tagIds?.includes(tag.id)),
      )?.slug)
    : undefined;
  const [resolvingLocation, setResolvingLocation] = useState(false);

  // Recents are localStorage-only → read once on mount (in an effect, never
  // during render) so SSR and the first client render agree (no hydration
  // mismatch). Mirrors the recently-viewed convention.
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [recentLocations, setRecentLocations] = useState<CityResult[]>([]);
  useEffect(() => {
    let alive = true;
    // Defer out of the synchronous effect body (repo convention) so the read
    // runs after the first client render — keeps SSR/CSR markup in sync.
    Promise.resolve().then(() => {
      if (!alive) return;
      setRecentSearches(getRecentSearches());
      setRecentLocations(getRecentLocations());
    });
    return () => {
      alive = false;
    };
  }, []);

  // Reuse successful taxonomy on subsequent openings. Failures stay distinct
  // from an empty catalogue and can be retried inside the existing section.
  useEffect(() => {
    if (!open || initialIndustries !== undefined) return;
    let alive = true;
    Promise.resolve().then(() => { if (alive && !cachedIndustries) setIndustriesLoading(true); });
    industriesRequest ??= cachedIndustries ? Promise.resolve(cachedIndustries) : getIndustries().then(list => { cachedIndustries = list; return list; }).finally(() => { industriesRequest = null; });
    industriesRequest
      .then((list) => {
        if (alive) { setIndustries(list); setIndustriesFailed(false); }
      })
      .catch(() => {
        if (alive) setIndustriesFailed(true);
      }).finally(() => { if (alive) setIndustriesLoading(false); });
    return () => {
      alive = false;
    };
  }, [open, initialIndustries, industriesAttempt]);

  const hasGeo = q.where.lat != null && q.where.lng != null;

  // Persist a CityResult to recent locations and reflect it in local state so
  // it shows immediately on the next empty-query Where view.
  const recordRecentLocation = (city: CityResult) => {
    pushRecentLocation(city);
    setRecentLocations(getRecentLocations());
  };

  // Empty the recent-searches list (storage + local state).
  const onClearRecentSearches = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  // Current location → reverse-geocode for a label, but ALWAYS keep raw coords
  // (even if reverse geocoding returns null / the key is missing). Robust:
  // never throws, falls back to a generic label on resolve failure.
  // Fallback when precise geolocation is unavailable or denied: estimate the
  // city from the visitor's IP (ipwho.is, keyless). Keeps "use my location"
  // useful even without permission. `failMsg` is shown only if the estimate
  // itself fails.
  const applyIpFallback = (failMsg: string) => {
    setResolvingLocation(true);
    ipLocate()
      .then((est) => {
        if (est) {
          setQ((prev) => ({
            ...prev,
            where: { label: est.label, lat: est.lat, lng: est.lng, zoom: RECENTER_ZOOM },
          }));
          recordRecentLocation(est);
          toast(t.locationApproximate, "pin");
          // Resolved a location → close "where", advance to "when".
          setStep("when");
        } else {
          toast(failMsg, "warn", undefined, "error");
        }
      })
      .finally(() => setResolvingLocation(false));
  };

  const onUseLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      applyIpFallback(t.locationUnavailable);
      return;
    }
    setResolvingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        reverseGeocode(lat, lng)
          .then((res) => {
            const label = res?.label ?? t.currentLocationFallback;
            setQ((prev) => ({ ...prev, where: { label, lat, lng, zoom: RECENTER_ZOOM } }));
            // Record as a recent location — build a CityResult when reverse
            // geocoding yielded none.
            recordRecentLocation(
              res ?? { id: `${lat},${lng}`, label, city: label, lat, lng },
            );
          })
          .catch(() => {
            // reverseGeocode never throws, but stay defensive — keep coords.
            const label = t.currentLocationFallback;
            setQ((prev) => ({ ...prev, where: { label, lat, lng, zoom: RECENTER_ZOOM } }));
            recordRecentLocation({
              id: `${lat},${lng}`,
              label,
              city: label,
              lat,
              lng,
            });
          })
          .finally(() => {
            setResolvingLocation(false);
            // Coords resolved → close "where", advance to "when".
            setStep("when");
          });
      },
      () => {
        // Permission denied / position error → IP-based estimate.
        applyIpFallback(t.locationDenied);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  // Pick a live MapTiler result → coordinate search; advance to "when".
  const onSelectCity = (c: CityResult) => {
    setQ((prev) => ({
      ...prev,
      where: { label: c.label, lat: c.lat, lng: c.lng },
    }));
    recordRecentLocation(c);
    setStep("when");
  };

  // Pick a static fallback chip (no coords) → resolve its coords via search;
  // fall back to a label-only where when geocoding yields nothing.
  const onSelectStaticCity = (name: string) => {
    setStep("when");
    searchCities(name)
      .then((cities) => {
        const first = cities[0];
        setQ((prev) => ({
          ...prev,
          where: first
            ? { label: first.label, lat: first.lat, lng: first.lng }
            : { label: name },
        }));
        // Only a resolved CityResult (with coords) becomes a recent location.
        if (first) recordRecentLocation(first);
      })
      .catch(() => {
        setQ((prev) => ({ ...prev, where: { label: name } }));
      });
  };

  const toggleStep = (s: SearchStep) =>
    setStep((prev) => (prev === s ? prev : s));

  const clearAll = () => {
    setQ(EMPTY_QUERY);
    setBrowseReset(value => value + 1);
    setBrowsedIndustry("");
    setStep("what");
  };

  const selectAllIndustries = () => {
    setBrowsedIndustry("");
    setQ(previous => ({ ...previous, what: "", industry: "", tagIds: [] }));
  };

  const selectIndustry = (slug: string) => {
    setBrowsedIndustry(slug);
    setQ(previous => ({ ...previous, what: "", industry: slug, tagIds: [] }));
    setStep("where");
  };

  // Build the /search querystring from a query model (slice 6a contract).
  // Shared by submit() and recent-search re-run so re-running a past search
  // produces an identical querystring.
  const buildSearchUrl = (model: QueryModel): string => {
    const params = new URLSearchParams();
    const what = model.what.trim();
    if (what) params.set("search", what);
    if (model.industry) params.set("industry", model.industry);
    if (model.tagIds.length > 0) params.set("tagIds", model.tagIds.join(","));
    const where = model.where;
    if (where.lat != null && where.lng != null) {
      // Picked city / current location → coordinate search.
      params.set("lat", String(where.lat));
      params.set("lng", String(where.lng));
      params.set("radius", String(SEARCH_RADIUS_KM));
      params.set("mapZoom", String(where.zoom ?? PLACE_ZOOM));
      // Human-readable label for the results-page chip.
      if (where.label?.trim()) params.set("city", where.label.trim());
    } else if (where.label?.trim()) {
      // Label only (no coords) → fuzzy string search fallback.
      params.set("city", where.label.trim());
    }
    if (model.when === "today") {
      params.set("date", zwFmtDateISO(zwToday()));
    } else if (model.when === "tom") {
      params.set("date", zwFmtDateISO(zwTomorrow(zwToday())));
    } else if (model.when.startsWith("date:")) {
      params.set("date", model.when.slice(5));
    }
    const qs = params.toString();
    return localeHref(locale, "search") + (qs ? `?${qs}` : "");
  };

  // Record the "What" portion of a query as a recent search, when it has any
  // content (free text OR a selected industry/tags). Label is what the user
  // actually chose: the text, else the selected tag's name, else the industry
  // name, else a generic caption.
  const recordRecentSearch = (model: QueryModel) => {
    const search = model.what.trim();
    const hasContent =
      search.length > 0 || !!model.industry || model.tagIds.length > 0;
    if (!hasContent) return;
    const selectedTag = industries
      .flatMap((ind) => ind.tags)
      .find((tag) => tag.id === model.tagIds[0]);
    const selectedIndustry = industries.find(
      (ind) => ind.slug === model.industry,
    );
    const label =
      search ||
      (selectedTag
        ? taxonomyLabel(selectedTag, locale, dict.industryTags)
        : selectedIndustry
          ? taxonomyLabel(selectedIndustry, locale, dict.industries)
          : model.industry || t.whatSummary);
    const whenLabel = whenSummary(model.when, t, locale);
    const whereLabel =
      model.where.label?.trim() ||
      (model.where.lat != null && model.where.lng != null
        ? t.whereSummaryCurrent
        : t.whereSummaryAny);
    pushRecentSearch({
      id: recentSearchId({
        search,
        industry: model.industry,
        tagIds: model.tagIds,
      }),
      label,
      search: search || undefined,
      industry: model.industry || undefined,
      tagIds: model.tagIds.length > 0 ? model.tagIds : undefined,
      whereLabel,
      whenLabel,
    });
  };

  const submit = () => {
    recordRecentSearch(q);
    onClose();
    router.push(buildSearchUrl(q));
  };

  // Re-run a recent search: re-apply its What state, record it again (so it
  // bubbles to the top), and navigate with the same querystring contract,
  // preserving the current Where/When selection.
  const onSelectRecentSearch = (entry: RecentSearch) => {
    const model: QueryModel = {
      ...q,
      what: entry.search ?? "",
      industry: entry.industry ?? "",
      tagIds: entry.tagIds ?? [],
    };
    setQ(model);
    recordRecentSearch(model);
    onClose();
    router.push(buildSearchUrl(model));
  };

  if (!open) return null;

  // ── Collapsed summaries ──
  const selectedTag = industries
    .flatMap((ind) => ind.tags)
    .find((tag) => tag.id === q.tagIds[0]);
  const selectedIndustry = industries.find((ind) => ind.slug === q.industry);
  const whatSum =
    q.what.trim() ||
    (selectedTag
      ? taxonomyLabel(selectedTag, locale, dict.industryTags)
      : selectedIndustry
        ? taxonomyLabel(selectedIndustry, locale, dict.industries)
        : q.industry || (q.tagIds.length ? dict.search.selectedServices : dict.serviceCatalog.allIndustries));
  const whereSum = q.where.label?.trim()
    ? q.where.label.trim()
    : hasGeo
      ? t.whereSummaryCurrent
      : t.whereSummaryAny;
  const whenSum = whenSummary(q.when, t, locale);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={`zv-sheet-backdrop ${styles.overlay}`}
        >
          <DialogPrimitive.Content
            ref={contentRef}
            className={`zv-sheet-card ${styles.dialog}`}
            aria-describedby={undefined}
            onOpenAutoFocus={(event) => {
              if (browseIndustry === undefined) return;
              // Category entry points focus the catalogue, without raising the
              // mobile keyboard. Focus the requested industry's disclosure.
              event.preventDefault();
              const filters = Array.from(contentRef.current?.querySelectorAll<HTMLButtonElement>(
                '[data-search-all-industries], [data-industry-filter]',
              ) ?? []).filter(node => node.getClientRects().length > 0);
              const filter = filters.find(node => node.dataset.industryFilter === openingIndustry)
                ?? filters.find(node => node.hasAttribute('data-search-all-industries'));
              (filter ?? contentRef.current)?.focus({ preventScroll: true });
              if (filter) {
                const scroller = filter.closest<HTMLElement>('[data-search-section-scroll]');
                if (scroller) {
                  const frame = scroller.getBoundingClientRect();
                  const item = filter.getBoundingClientRect();
                  if (item.bottom > frame.bottom - 8) scroller.scrollBy({ top: item.bottom - frame.bottom + 8, behavior: "instant" });
                }
              }
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (returnFocusRef.current?.isConnected) {
                returnFocusRef.current.focus({ preventScroll: true });
              }
            }}
          >
            <div className={styles.header}>
              <DialogPrimitive.Title asChild>
                <span
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    color: "var(--c-900)",
                  }}
                >
                  {t.overlayTitle}
                </span>
              </DialogPrimitive.Title>
              <button
                type="button"
                onClick={onClose}
                className={`${styles.close} tap`}
                aria-label={t.close}
              >
                <Icon name="x" size={16} color="var(--c-800)" />
              </button>
            </div>

            <div className={styles.body}>
              <Section
                label={t.what}
                summary={whatSum}
                showSummaryWhenOpen
                open={step === "what"}
                onToggle={() => toggleStep("what")}
              >
                <WhatSection
                  key={browseReset}
                  what={q.what}
                  industry={q.industry}
                  setWhat={(v) =>
                    setQ((p) => ({
                      ...p,
                      what: v,
                      industry: v ? "" : p.industry,
                      tagIds: v ? [] : p.tagIds,
                    }))
                  }
                  tagIds={q.tagIds}
                  industries={industries}
                  industriesLoading={industriesLoading}
                  industriesFailed={industriesFailed}
                  retryIndustries={() => setIndustriesAttempt(value => value + 1)}
                  recentSearches={recentSearches}
                  onSelectRecentSearch={onSelectRecentSearch}
                  onClearRecentSearches={onClearRecentSearches}
                  onSelectResult={(href) => {
                    onClose();
                    router.push(href);
                  }}
                  autoFocus={step === "what" && browseIndustry === undefined}
                  initialBrowseIndustry={openingIndustry}
                  browsedIndustry={browsedIndustry ?? openingIndustry}
                  onBrowseIndustry={setBrowsedIndustry}
                  onSelectAllIndustries={selectAllIndustries}
                  onSelectIndustry={selectIndustry}
                  onSelectTag={(slug, id) => {
                    setBrowsedIndustry(slug);
                    const active = q.tagIds.includes(id);
                    if (active) {
                      // Re-tapping the selected tag clears it; stay on "what".
                      setQ((p) => ({
                        ...p,
                        industry: "",
                        tagIds: [],
                        what: "",
                      }));
                    } else {
                      // Pick the tag, close "what", advance straight to "where".
                      setQ((p) => ({
                        ...p,
                        industry: slug,
                        tagIds: [id],
                        what: "",
                      }));
                      setStep("where");
                    }
                  }}
                />
              </Section>

              <Section
                label={t.where}
                summary={whereSum}
                open={step === "where"}
                onToggle={() => toggleStep("where")}
              >
                <WhereSection
                  hasGeo={hasGeo}
                  resolvingLocation={resolvingLocation}
                  recentLocations={recentLocations}
                  onUseLocation={onUseLocation}
                  onSelectCity={onSelectCity}
                  onSelectStaticCity={onSelectStaticCity}
                />
              </Section>

              <Section
                label={t.when}
                summary={whenSum}
                open={step === "when"}
                onToggle={() => toggleStep("when")}
              >
                <WhenSection
                  when={q.when}
                  onChange={(v) => setQ((p) => ({ ...p, when: v }))}
                />
              </Section>
            </div>

            <div className={styles.footer}>
              <button
                type="button"
                className="tap"
                onClick={clearAll}
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--c-700)",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                {t.clearAll}
              </button>
              <Button
                kind="accent"
                size="lg"
                onClick={submit}
                style={{ padding: "14px 34px" }}
              >
                <Icon name="search" size={16} color="#fff" />
                {t.searchAction}
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
