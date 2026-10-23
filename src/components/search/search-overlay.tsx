"use client";

import {
  useEffect,
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
import {
  industryAccent,
  industryIcon,
  resolveIndustrySlug,
} from "@/lib/marketplace/industry-visuals";
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

// ── Stacked accordion card — header + collapsing body ──
function Section({
  label,
  summary,
  open,
  onToggle,
  children,
}: {
  label: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        border: "1px solid rgba(28,28,26,0.06)",
        boxShadow: "var(--sh-sm)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="tap"
        aria-expanded={open}
        style={{
          width: "100%",
          minHeight: 54,
          background: "transparent",
          border: 0,
          cursor: "pointer",
          padding: "13px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "var(--c-900)",
            letterSpacing: "-0.01em",
          }}
        >
          {label}
        </span>
        {!open && (
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--c-600)",
              letterSpacing: "-0.005em",
              textAlign: "right",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "60%",
            }}
          >
            {summary}
          </span>
        )}
      </button>
      {/* Grid-rows collapse (0fr ↔ 1fr) animates to the CONTENT's real height —
          a max-height sized for the tallest section makes short ones appear to
          snap. Children stay mounted so the close animates too; `inert` keeps
          the hidden body out of tab order and accessibility tree. */}
      <div
        inert={!open}
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: open
            ? "grid-template-rows .42s var(--ease-out)"
            : "grid-template-rows .3s var(--ease-soft)",
        }}
      >
        <div
          style={{
            overflow: "hidden",
            minHeight: 0,
            opacity: open ? 1 : 0,
            transition: open
              ? "opacity .25s var(--ease-out) .05s"
              : "opacity .15s var(--ease-soft)",
          }}
        >
          <div style={{ padding: "0 20px 20px" }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

// ── Browse by category: industries grouped like the dashboard amenities
// section — an icon + name header per industry, plain tag chips beneath it,
// and an inline "see more" that expands that industry's full tag list in
// place (no popup, no navigation). The whole block scrolls past a reasonable
// height. Chips carry no per-tag icon anymore; the icon lives on the header.
const TAGS_COLLAPSED = 6;

function CategoryBrowse({
  industries,
  initialIndustry,
  selectedIndustries,
  onIndustriesChange,
  tagIds,
  onSelectTag,
}: {
  industries: Industry[];
  initialIndustry?: string;
  selectedIndustries: string[];
  onIndustriesChange: (slugs: string[]) => void;
  tagIds: number[];
  onSelectTag: (industrySlug: string, tagId: number) => void;
}) {
  const { locale, dict } = useTranslation();
  const t = dict.searchOverlay;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const showingAll = selectedIndustries.length === 0;
  // Keep the opening industry first, except Other, which always stays last.
  // Toggling filters changes their state, never their position beneath the pointer.
  const orderedIndustries = useMemo(
    () => otherIndustryLast(
      initialIndustry
        ? [
            ...industries.filter((ind) => ind.slug === initialIndustry),
            ...industries.filter((ind) => ind.slug !== initialIndustry),
          ]
        : industries,
      (industry) => industry.slug,
    ),
    [industries, initialIndustry],
  );
  const visibleIndustries = showingAll
    ? industries
    : industries.filter((ind) => selectedIndustries.includes(ind.slug));
  const filterStyle = (active: boolean): CSSProperties => ({
    flexShrink: 0,
    minHeight: 44,
    padding: "8px 14px",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    border: `1px solid ${active ? "var(--c-ink)" : "rgba(28,28,26,0.10)"}`,
    borderRadius: 999,
    background: active ? "var(--c-ink)" : "#fff",
    color: active ? "#fff" : "var(--c-800)",
    fontSize: 13.5,
    fontWeight: 600,
    whiteSpace: "nowrap",
    cursor: "pointer",
  });

  return (
    <div>
      <div
        role="group"
        aria-label={t.browseByIndustry}
        className="zw-scroll-x"
        style={{ gap: 8, padding: "2px 0 12px" }}
      >
        <button
          type="button"
          className="tap"
          data-industry-filter
          aria-pressed={showingAll}
          onClick={() => onIndustriesChange([])}
          style={filterStyle(showingAll)}
        >
          {t.allInCategory}
        </button>
        {orderedIndustries.map((ind) => {
          const active = selectedIndustries.includes(ind.slug);
          const visualSlug = resolveIndustrySlug(ind.slug);
          return (
            <button
              key={ind.id}
              type="button"
              className="tap"
              data-industry-filter
              aria-pressed={active}
              onClick={() =>
                onIndustriesChange(
                  active
                    ? selectedIndustries.filter((slug) => slug !== ind.slug)
                    : [...selectedIndustries, ind.slug],
                )
              }
              style={filterStyle(active)}
            >
              <Icon
                name={industryIcon(visualSlug)}
                size={16}
                color={active ? "#fff" : industryAccent(visualSlug)}
              />
              {taxonomyLabel(ind, locale, dict.industries)}
            </button>
          );
        })}
      </div>
      <div
        className="zw-noscrollbar"
        style={{
          marginTop: 6,
          maxHeight: 340,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          padding: "2px 0",
        }}
      >
        {visibleIndustries.map((ind) => {
          const slug = resolveIndustrySlug(ind.slug);
          const isExpanded = !!expanded[ind.slug];
          const overflow = ind.tags.length > TAGS_COLLAPSED;
          // Collapsed → first N tags, plus any selected tag beyond the window
          // so an active choice never disappears behind "see more".
          const visible =
            !overflow || isExpanded
              ? ind.tags
              : [
                  ...ind.tags.slice(0, TAGS_COLLAPSED),
                  ...ind.tags
                    .slice(TAGS_COLLAPSED)
                    .filter(
                      (tag) => tagIds.includes(tag.id),
                    ),
                ];
          return (
            <div key={ind.id}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                  padding: "0 2px",
                }}
              >
                <Icon
                  name={industryIcon(slug)}
                  size={15}
                  color={industryAccent(slug)}
                />
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: "var(--c-900)",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                  }}
                >
                  {taxonomyLabel(ind, locale, dict.industries)}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {visible.map((tag) => {
                  const active = tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => onSelectTag(ind.slug, tag.id)}
                      className="tap zw-chip-lift"
                      aria-pressed={active}
                      style={{
                        flex: "0 0 auto",
                        minHeight: 44,
                        padding: "8px 13px",
                        background: active ? "var(--c-ink)" : "#fff",
                        border: `1px solid ${active ? "var(--c-ink)" : "rgba(28,28,26,0.09)"}`,
                        borderRadius: 999,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: active ? "#fff" : "var(--c-800)",
                          letterSpacing: "-0.008em",
                          lineHeight: 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {taxonomyLabel(tag, locale, dict.industryTags)}
                      </span>
                    </button>
                  );
                })}
              </div>
              {overflow && (
                <button
                  type="button"
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [ind.slug]: !prev[ind.slug],
                    }))
                  }
                  className="tap"
                  aria-expanded={isExpanded}
                  style={{
                    marginTop: 7,
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                    minHeight: 44,
                    padding: "6px 2px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--c-600)",
                    letterSpacing: "-0.005em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  {isExpanded
                    ? t.seeLessTags
                    : `${t.seeMoreTags} (${ind.tags.length - TAGS_COLLAPSED})`}
                  <Icon
                    name="chevR"
                    size={11}
                    color="var(--c-500)"
                    style={{
                      transform: isExpanded
                        ? "rotate(-90deg)"
                        : "rotate(90deg)",
                    }}
                  />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── What: free text + recent searches + browse-by-category grid ──
function WhatSection({
  what,
  setWhat,
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
  browseIndustries,
  onBrowseIndustriesChange,
}: {
  what: string;
  setWhat: (v: string) => void;
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
  browseIndustries: string[];
  onBrowseIndustriesChange: (slugs: string[]) => void;
}) {
  const { locale, dict } = useTranslation();
  const t = dict.searchOverlay;
  const inputRef = useRef<HTMLInputElement>(null);

  const preview = useSearchPreview(what);
  const showPreview = what.trim().length >= 2;
  const showHint = what.trim().length === 1;

  // Industries with no tags have nothing to offer in the browse list — an
  // icon + name header with zero chips under it — so they are not rendered.
  const browsable = industries.filter((ind) => ind.tags.length > 0);

  useEffect(() => {
    if (!autoFocus) return;
    const id = setTimeout(() => inputRef.current?.focus(), 240);
    return () => clearTimeout(id);
  }, [autoFocus]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "12px 15px",
          background: "var(--c-100)",
          borderRadius: 13,
        }}
      >
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
            fontSize: 15,
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

      {/* Recent searches — shown only when the text box is empty AND no preview
          is active. Selecting a row re-applies the past query and re-runs it. */}
      {initialBrowseIndustry === undefined &&
        !showPreview &&
        what.trim().length === 0 &&
        recentSearches.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span style={{ ...eyebrow, marginBottom: 0 }}>
                {t.recentSearches}
              </span>
              <button
                type="button"
                onClick={onClearRecentSearches}
                className="tap"
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--c-600)",
                  padding: "0 4px",
                }}
              >
                {t.clearRecents}
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {recentSearches.map((entry) => {
                const subtitle = [entry.whenLabel, entry.whereLabel]
                  .filter((v) => v && v.trim())
                  .join(" · ");
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onSelectRecentSearch(entry)}
                    className="tap zw-cal-day"
                    style={{
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
                    }}
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
                        {entry.label}
                      </span>
                      {subtitle && (
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
                          {subtitle}
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
              })}
            </div>
          </div>
        )}

      {what.trim().length === 0 && (browsable.length > 0 || industriesLoading || industriesFailed) && (
        <div style={{ marginTop: 18 }}>
          <span style={eyebrow}>{t.browseByIndustry}</span>
          <span role="status" className="sr-only">{industriesLoading ? t.searching : ""}</span>
          {industriesFailed && <div style={{ display: "grid", gap: 10, paddingBlock: 12 }}>
            <InlineError>{t.industriesError}</InlineError>
            <Button kind="secondary" size="sm" loading={industriesLoading} onClick={retryIndustries} style={{ justifySelf: "start" }}>{dict.search.retry}</Button>
          </div>}
          {industriesLoading && !industriesFailed && browsable.length === 0 && <div aria-hidden="true" style={{ display: "grid", gap: 20 }}>
            <div style={{ display: "flex", gap: 8, overflow: "hidden" }}>{[80, 112, 96].map(w => <Skeleton key={w} w={w} h={44} r={999} style={{ flexShrink: 0 }} />)}</div>
            {[0, 1, 2].map(row => <div key={row} style={{ display: "grid", gap: 12 }}><Skeleton w="45%" h={21} /><div style={{ display: "flex", gap: 8 }}><Skeleton w="36%" h={40} r={999} /><Skeleton w="42%" h={40} r={999} /></div></div>)}
          </div>}
          {browsable.length > 0 &&
          <CategoryBrowse
            industries={browsable}
            initialIndustry={initialBrowseIndustry}
            selectedIndustries={browseIndustries}
            onIndustriesChange={onBrowseIndustriesChange}
            tagIds={tagIds}
            onSelectTag={onSelectTag}
          />
          }
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

  const navBtn: CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "transparent",
    border: "1px solid rgba(28,28,26,0.08)",
    cursor: "pointer",
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div
      style={{
        padding: "14px 14px 12px",
        borderRadius: 14,
        border: "1px solid rgba(28,28,26,0.07)",
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 10,
          padding: "0 2px",
        }}
      >
        <span
          style={{
            fontSize: 14.5,
            fontWeight: 700,
            color: "var(--c-900)",
            letterSpacing: "-0.012em",
            textTransform: "capitalize",
          }}
        >
          {monthLabel}
        </span>
        <div style={{ display: "inline-flex", gap: 6 }}>
          <button
            type="button"
            onClick={() => stepMonth(-1)}
            className="tap"
            aria-label={t.prevMonth}
            style={navBtn}
          >
            <Icon name="chevL" size={14} color="var(--c-900)" />
          </button>
          <button
            type="button"
            onClick={() => stepMonth(1)}
            className="tap"
            aria-label={t.nextMonth}
            style={navBtn}
          >
            <Icon name="chevR" size={14} color="var(--c-900)" />
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
          marginBottom: 4,
        }}
      >
        {dow.map((d, i) => (
          <div
            key={i}
            style={{
              textAlign: "center",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.05em",
              color: "var(--c-500)",
              padding: "4px 0",
              textTransform: "capitalize",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
        }}
      >
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === view.month;
          const isPast = d < today;
          const isToday = zwSameDay(d, today);
          const isPicked = zwSameDay(d, pickedDate);
          const disabled = isPast;
          return (
            <button
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
              className={disabled ? undefined : "zw-cal-day"}
              style={{
                height: 38,
                background: isPicked ? "var(--p-500)" : "transparent",
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
                fontSize: 13.5,
                fontWeight: isPicked || isToday ? 700 : 500,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.005em",
              }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <MonthPicker when={when} onPick={onChange} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
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
                height: 40,
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
  const [browseIndustries, setBrowseIndustries] = useState<string[]>(() =>
    browseIndustry ? [browseIndustry] : [],
  );
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
    setBrowseIndustries([]);
    setStep("what");
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
        : t.whatSummary);
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
          className="zv-sheet-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            background: "rgba(28,28,26,0.40)",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "6vh 16px 40px",
            overflowY: "auto",
          }}
        >
          <DialogPrimitive.Content
            ref={contentRef}
            className="zv-sheet-card"
            aria-describedby={undefined}
            onOpenAutoFocus={(event) => {
              if (browseIndustry === undefined) return;
              // Category entry points focus the selected filter, not the text
              // field: opening a catalogue should not raise the mobile keyboard.
              event.preventDefault();
              const filter =
                contentRef.current?.querySelector<HTMLButtonElement>(
                  '[data-industry-filter][aria-pressed="true"]',
                );
              (filter ?? contentRef.current)?.focus({ preventScroll: true });
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (returnFocusRef.current?.isConnected) {
                returnFocusRef.current.focus({ preventScroll: true });
              }
            }}
            style={{
              width: "100%",
              maxWidth: 600,
              cursor: "default",
              background: "var(--c-canvas)",
              borderRadius: 28,
              boxShadow: "var(--sh-xl)",
              border: "1px solid rgba(28,28,26,0.06)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              maxHeight: "88vh",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 20px 14px",
                flexShrink: 0,
              }}
            >
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
                className="tap"
                aria-label={t.close}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "1px solid rgba(28,28,26,0.10)",
                  background: "#fff",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name="x" size={16} color="var(--c-800)" />
              </button>
            </div>

            <div
              className="zw-noscrollbar"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0 16px 8px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <Section
                label={t.what}
                summary={whatSum}
                open={step === "what"}
                onToggle={() => toggleStep("what")}
              >
                <WhatSection
                  what={q.what}
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
                  initialBrowseIndustry={browseIndustry}
                  browseIndustries={browseIndustries}
                  onBrowseIndustriesChange={setBrowseIndustries}
                  onSelectTag={(slug, id) => {
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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 20px",
                borderTop: "1px solid rgba(28,28,26,0.07)",
                background: "#fff",
                flexShrink: 0,
              }}
            >
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
