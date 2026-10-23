"use client";

import { useLayoutEffect, useRef } from "react";
import { MapSkeleton } from "@/components/search/map-skeleton";
import { RowSkeleton } from "@/components/business/row-skeleton";
import detailStyles from "@/app/[locale]/business/_components/business-detail.module.css";
import galleryStyles from "@/app/[locale]/business/_components/location-gallery.module.css";
import searchStyles from "@/components/search/search-layout.module.css";

import { Skeleton } from "./skeleton";
import { Icon } from "./icon";
import { Breadcrumb } from "./breadcrumb";
import { Button } from "./button";
import { Kicker } from "./kicker";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import { BlogList } from "@/app/_components/blog/blog-list";

// Route-level loading fallbacks, used from the `loading.tsx` files. The shared
// chrome (header, footer, mobile tabs) lives in the locale layout and paints
// immediately; these only stand in for the page body while its server data is
// in flight.

// Location detail: gallery, services and the desktop booking rail.
export function DetailPageSkeleton() {
  const { dict } = useTranslation();
  const t = dict.business;
  return <main className={`zw-container ${detailStyles.page}`} aria-busy="true">
    <div aria-hidden="true">
      <span className={detailStyles.back}><Icon name="back" size={15} />{t.back}</span>
      <div className={galleryStyles.gallery}><Skeleton h="100%" r="inherit" /></div>
      <div className={detailStyles.columns}>
        <div className={detailStyles.content}>
          <div className={detailStyles.identity}>
            <div className={detailStyles.identityTop}>
              <div className={detailStyles.identityText} style={{ flex: 1 }}>
                <span className={detailStyles.brandLink}><Skeleton w={22} h={22} r={999} /><Skeleton w={123} h={16} /></span>
                <div className={detailStyles.titleSkeleton}><Skeleton w="70%" h="100%" /></div>
              </div>
              <div className={detailStyles.identityActions}><Skeleton w={44} h={44} r={999} /><Skeleton w={44} h={44} r={999} /></div>
            </div>
            <div className={detailStyles.meta}><Skeleton w={70} h={24} /><Skeleton w={55} h={18} /><Skeleton w={110} h={18} /></div>
            <div className={detailStyles.addressLine}><Skeleton w={240} h={18} /></div>
          </div>
          <div className={detailStyles.tabs}>{[t.tabServices, t.tabTeam, t.tabReviews, t.tabAbout].map(label => <button type="button" disabled tabIndex={-1} key={label}>{label}</button>)}</div>
          <div className={detailStyles.tabPanel}>
            <div className={detailStyles.serviceToolbar}><div className={detailStyles.serviceSearch}><Skeleton w="80%" h={16} /></div><div className={detailStyles.categoryFilters}>{[65, 90, 115].map(width => <Skeleton key={width} w={width} h="var(--location-filter-height)" r={999} />)}</div></div>
            <div className={detailStyles.serviceGroup}><Skeleton w={130} h={17} style={{ marginBottom: 8 }} />{[0, 1, 2].map(index => <div className={detailStyles.serviceRow} key={index}><div className={detailStyles.serviceContent}><Skeleton w="50%" h={20} /><Skeleton w="78%" h={19} /><Skeleton w="32%" h={19} /></div><Skeleton w={80} h={44} r={999} /></div>)}</div>
          </div>
        </div>
        <div className={detailStyles.bookingRail}><div className={detailStyles.railIdentity}><span className={detailStyles.eyebrow}>{dict.locationPage.selectionTitle}</span><Skeleton w="70%" h={25} style={{ marginTop: 9 }} /></div><p className={detailStyles.bookingIntro}>{dict.locationPage.bookingIntro}</p><Button kind="accent" size="lg" disabled>{t.bookNow}</Button></div>
      </div>
    </div>
  </main>;
}

/** Brand pages open with identity and locations, never the location gallery. */
export function BrandPageSkeleton() {
  const { dict } = useTranslation();
  return <main className="zw-container" style={{ paddingTop: 22 }} aria-busy="true">
    <div aria-hidden="true">
      <button disabled style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20, background: "transparent", border: 0, padding: "4px 0", fontSize: 13.5, fontWeight: 600, color: "var(--c-600)" }}><Icon name="back" size={14} />{dict.business.back}</button>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "clamp(16px, 2.5vw, 26px)" }}>
        <Skeleton w={84} h={84} r={999} style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 240, flex: 1 }}><Skeleton w="65%" h="calc(clamp(28px, 3.4vw, 40px) * 1.04)" /><Skeleton w="45%" h={21} style={{ marginTop: 10 }} /></div>
      </div>
      <section style={{ marginTop: "clamp(30px, 4.5vw, 46px)" }}>
        <Skeleton w={180} h="calc(clamp(20px, 2.2vw, 26px) * 1.5)" style={{ marginBottom: 18 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 18 }}>
          {Array.from({ length: 3 }, (_, i) => <div key={i} style={{ border: "1px solid rgba(28,28,26,0.07)", borderRadius: 20, overflow: "hidden" }}>
            <Skeleton h="auto" r={0} style={{ aspectRatio: "16 / 9" }} />
            <div style={{ padding: "16px 18px 18px" }}><Skeleton w="65%" h={27} /><Skeleton w="80%" h={20} style={{ marginTop: 8 }} /><Skeleton w="40%" h={21} style={{ marginTop: 14 }} /></div>
          </div>)}
        </div>
      </section>
    </div>
  </main>;
}

// The full-bleed /search route: filter chrome, then the map/list split.
export function SearchPageSkeleton({ showRail = true, desktopControlsBottom = 24, activeFilterCount = 0 }: { showRail?: boolean; desktopControlsBottom?: number; activeFilterCount?: number }) {
  const { dict } = useTranslation();
  const shellRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const header = headerRef.current;
    const handle = handleRef.current;
    if (!panel || !header || !handle) return;
    const measure = () => {
      const peek = header.getBoundingClientRect().height + handle.getBoundingClientRect().height;
      shellRef.current?.style.setProperty("--zv-search-placeholder-peek-h", `${peek}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    observer.observe(handle);
    return () => observer.disconnect();
  }, []);
  return (
    <main ref={shellRef} className={`${searchStyles.shell} ${searchStyles.placeholderShell}`} aria-busy="true">
      <span role="status" className="sr-only">{dict.search.updating}</span>
      <div aria-hidden="true" inert>
        <div className={`${searchStyles.mapPlaceholder} ${searchStyles.desktopMapPlaceholder}`}><MapSkeleton railInsetLeft="32px + min(424px, 36vw)" controlsBottom={desktopControlsBottom} showRail={showRail} /></div>
        <div className={`${searchStyles.mapPlaceholder} ${searchStyles.mobileMapPlaceholder}`}><MapSkeleton controlsBottom="calc(100% - var(--zv-search-placeholder-sheet-top) + 12px)" showRail={showRail} /></div>
        <div ref={panelRef} className={`${searchStyles.panel} ${searchStyles.placeholderPanel}`}>
          <div ref={handleRef} className={searchStyles.handle} style={{ paddingTop: 2 }}><div style={{ width: 44, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}><Skeleton w={36} h={4} r={2} /></div></div>
          <div ref={headerRef} className={searchStyles.header}>
            <div className={searchStyles.headerRow}>
              <div className={searchStyles.summary}>
                <Kicker style={{ marginBottom: 5 }}>{dict.search.inThisArea}</Kicker>
                <div className={searchStyles.resultLine}>
                  <div className={searchStyles.count}>
                    <div style={{ height: "1.5em", display: "flex", alignItems: "center" }}><Skeleton w={114} h={21} /></div>
                    <span style={{ width: 14, height: 14, flexShrink: 0 }} />
                  </div>
                  {activeFilterCount > 0 && <span className={searchStyles.clearButton}>{dict.search.clearFilters}</span>}
                </div>
              </div>
              <span className={searchStyles.filtersButton}>
                <Icon name="sliders" size={16} />
                {dict.search.filters.title}
                {activeFilterCount > 0 && <span className={searchStyles.filterCount}>{activeFilterCount}</span>}
              </span>
            </div>
          </div>
          <div className={`${searchStyles.resultsFrame} ${searchStyles.placeholderResults}`}>
            <div className={searchStyles.resultItems}>
              {[0, 1, 2, 3, 4].map(row => <RowSkeleton key={row} />)}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Card-grid index routes (the blog list).
export function FeedPageSkeleton() {
  const { locale } = useTranslation();
  return <BlogList locale={locale} posts={[]} pending />;
}

// Long-form prose routes (a blog post).
export function ArticlePageSkeleton() {
  const { locale, dict } = useTranslation();
  return (
    <main className="zw-post-shell" aria-busy="true">
      <header className="zw-container" style={{ paddingTop: "clamp(36px, 4.5vw, 60px)" }}>
        <div className="zw-post-head">
          <Breadcrumb items={[{ label: dict.breadcrumbHome, href: localeHref(locale) }, { label: dict.blog.breadcrumbJournal, href: localeHref(locale, "blog") }]} />
          <div aria-hidden="true">
            <Skeleton w={90} h={25} r={999} style={{ marginTop: 24 }} />
            <Skeleton w="96%" h="calc(clamp(32px, 4.2vw, 54px) * 2.04)" style={{ marginTop: 14 }} />
            <Skeleton h="calc(clamp(16px, 1.5vw, 19px) * 3.2)" style={{ marginTop: 20, maxWidth: 680 }} />
            <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid rgba(28,28,26,0.08)" }}><Skeleton w={190} h={21} /></div>
          </div>
        </div>
      </header>
      <div className="zw-container" aria-hidden="true" style={{ paddingTop: "clamp(28px, 3.5vw, 44px)" }}>
        <Skeleton h="auto" r="var(--r-2xl)" style={{ aspectRatio: "21 / 9" }} />
      </div>
      <div className="zw-container" aria-hidden="true" style={{ paddingTop: "clamp(36px, 4.5vw, 56px)" }}>
        <div className="zw-post-grid">
          <div className="zw-post-main" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {["100%", "96%", "98%", "72%", "100%", "89%", "94%", "58%"].map((w, i) => <Skeleton key={i} w={w} h={17} />)}
          </div>
          <div className="zw-only-desktop"><Skeleton h={180} /></div>
        </div>
      </div>
    </main>
  );
}
