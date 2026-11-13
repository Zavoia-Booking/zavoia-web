"use client";

import { useLayoutEffect, useRef } from "react";
import { MapSkeleton } from "@/components/search/map-skeleton";
import { RowSkeleton } from "@/components/business/row-skeleton";
import detailStyles from "@/app/[locale]/business/_components/business-detail.module.css";
import galleryStyles from "@/app/[locale]/business/_components/location-gallery.module.css";
import bookingStyles from "@/app/[locale]/business/_components/location-booking-summary.module.css";
import searchStyles from "@/components/search/search-layout.module.css";
import articleStyles from "@/app/_components/blog/blog-post.module.css";

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
  return <main className={detailStyles.page} aria-busy="true">
    <div className={`zw-container ${detailStyles.frame}`} aria-hidden="true">
      <div className={detailStyles.toolbar}>
        <span className={detailStyles.back}><Icon name="back" size={16} /><span className={detailStyles.backLabel}>{t.back}</span></span>
        <div className={detailStyles.identityActions}><span className={detailStyles.toolbarMapAction}><Icon name="pin" size={18} />{t.seeOnMap}</span><Button kind="ghost" size="sm" className={detailStyles.shareAction} aria-label={t.share} disabled><Icon name="share" size={18} /><span className={detailStyles.shareLabel}>{t.share}</span></Button><Skeleton w={44} h={44} r={999} /></div>
      </div>
      <div className={detailStyles.overview}>
        <div className={detailStyles.identity}>
          <div className={detailStyles.identityText}>
            <div className={detailStyles.eyebrow}><span className={detailStyles.categoryLink}><Skeleton w={18} h={18} r={4} /><Skeleton w={75} h={18} /></span><Skeleton w={55} h={19} /></div>
            <div className={detailStyles.titleSkeleton}><Skeleton w="80%" h="100%" /></div>
          </div>
          <div className={detailStyles.trust}>
            <div className={detailStyles.ratingLink}><Skeleton w={20} h={20} r={4} /><Skeleton w={40} h={32} /><Skeleton w={105} h={25} /><Skeleton w={16} h={16} r={4} /></div>
          </div>
          <div className={detailStyles.where} style={{ width: "min(320px, 100%)" }}>
            <Skeleton w={20} h={20} r={4} style={{ flexShrink: 0, marginTop: 2 }} />
            <div className={detailStyles.addressContent} style={{ width: "100%" }}><Skeleton w="100%" h={23} /></div><Skeleton w={14} h={14} r={4} style={{ flexShrink: 0, marginTop: 2 }} />
          </div>
          <div className={detailStyles.brandLink}><Skeleton w={32} h={32} r={999} /><Skeleton w={123} h={25} /><Skeleton w={16} h={16} r={4} style={{ marginInlineStart: "auto" }} /></div>
        </div>
        <div className={galleryStyles.gallery} data-preview-count="4">
          <div className={galleryStyles.collage}>
            {[0, 1, 2, 3].map(index => <div key={index} className={galleryStyles.tile} data-photo-index={index} style={{ cursor: "default" }}><Skeleton h="100%" r="inherit" /></div>)}
            <div className={galleryStyles.seeAll} style={{ cursor: "default" }}><Skeleton w={20} h={20} style={{ alignSelf: "flex-end" }} /><div className={galleryStyles.seeAllText}><Skeleton w={60} h={20} /><Skeleton w={50} h={16} /></div></div>
          </div>
        </div>
      </div>
      <div className={detailStyles.columns}>
        <div className={detailStyles.content}>
          <div className={detailStyles.tabs}>{[t.tabServices, t.tabTeam, t.tabReviews, t.tabAbout].map(label => <button type="button" disabled tabIndex={-1} key={label}>{label}</button>)}</div>
          <div className={detailStyles.tabPanel}>
            <div className={detailStyles.services}>
              <div className={detailStyles.serviceAside}>
                <div className={detailStyles.serviceSearch}><Skeleton w="80%" h={20} /></div>
                <div className={detailStyles.serviceIndex}><div className={detailStyles.indexList}>{[72, 56, 84, 64, 48].map(width => <div key={width} style={{ display: "flex", alignItems: "center", minHeight: 44, paddingInlineStart: 16 }}><Skeleton w={`${width}%`} h={18} /></div>)}</div></div>
                <div className={detailStyles.serviceIndexMobile}><div style={{ display: "flex", alignItems: "center", minHeight: 52 }}><Skeleton w={170} h={20} /></div></div>
              </div>
              <div className={detailStyles.serviceMenu}>
                <div className={detailStyles.serviceGroup}><div className={detailStyles.groupHeading}><Skeleton w={180} h={18} style={{ display: "inline-block", verticalAlign: "middle" }} /></div><div className={detailStyles.ticketList}>{[0, 1, 2].map(index => <div className={detailStyles.ticket} key={index}><div className={detailStyles.ticketBody}><Skeleton w={56} h={16} /><Skeleton w="50%" h={25} /><Skeleton w="78%" h={23} /></div><div className={detailStyles.ticketStub}><span className={detailStyles.perforation} /><Skeleton w={110} h={27} /><span className={detailStyles.addAction}><Skeleton w={42} h={42} r={999} /></span></div></div>)}</div></div>
              </div>
            </div>
          </div>
        </div>
        <div className={bookingStyles.bookingRail}>
          <div className={bookingStyles.summary}>
            <div className={bookingStyles.summaryBody}>
              <div className={bookingStyles.identity}><div className={bookingStyles.summaryLabel}><h2>{dict.locationPage.selectionTitle}</h2></div><Skeleton w="70%" h={23} style={{ marginTop: 8 }} /></div>
              <p className={bookingStyles.bookingIntro}>{dict.locationPage.bookingIntro}</p>
            </div>
            <div className={bookingStyles.summaryFooter}><Button kind="accent" size="lg" className={bookingStyles.bookAction} disabled>{t.bookNow}</Button></div>
          </div>
        </div>
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
    <main className={articleStyles.shell} data-toc="false" aria-busy="true">
      <header className={`zw-container ${articleStyles.header}`}>
        <div className={articleStyles.readingFrame}>
          <div className={articleStyles.head}>
            <Breadcrumb ariaLabel={dict.blog.breadcrumbLabel} items={[{ label: dict.breadcrumbHome, href: localeHref(locale) }, { label: dict.blog.breadcrumbJournal, href: localeHref(locale, "blog") }]} />
            <div aria-hidden="true">
              <Skeleton w="96%" h="calc(clamp(34px, 4.2vw, 58px) * 2.16)" style={{ marginTop: 24 }} />
              <Skeleton h="calc(clamp(16px, 1.5vw, 19px) * 3.2)" style={{ marginTop: 18, maxWidth: 680 }} />
              <div className={articleStyles.metadata}><Skeleton w={190} h={21} /><div className={articleStyles.actions}><Skeleton w={100} h={44} r={22} /><Skeleton w={90} h={44} r={22} /></div></div>
            </div>
          </div>
        </div>
      </header>
      <div className={`zw-container ${articleStyles.coverFrame}`} aria-hidden="true">
        <div className={articleStyles.cover}><Skeleton h="100%" r="inherit" /></div>
      </div>
      <div className={`zw-container ${articleStyles.bodyFrame}`} aria-hidden="true">
        <div className={articleStyles.readingFrame}>
          <div className={articleStyles.readingGrid}>
            <div className={`${articleStyles.body} ${articleStyles.skeletonProse}`}>
              {["100%", "96%", "98%", "72%", "100%", "89%", "94%", "58%"].map((w, i) => <Skeleton key={i} w={w} h={18} />)}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
