"use client";

import { MapSkeleton } from "@/components/search/map-skeleton";
import { RowSkeleton } from "@/components/business/row-skeleton";
import searchStyles from "@/components/search/search-layout.module.css";

import { Skeleton } from "./skeleton";
import { Icon } from "./icon";
import { Breadcrumb } from "./breadcrumb";
import { Button } from "./button";
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
  return (
    <main className="zw-container" style={{ paddingTop: 22 }} aria-busy="true">
      <div aria-hidden="true">
        <button disabled style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, background: "transparent", border: 0, padding: "4px 0", fontSize: 13.5, fontWeight: 600, color: "var(--c-600)" }}>
          <Icon name="back" size={14} />{t.back}
        </button>
        <Skeleton h="clamp(280px, 36vw, 440px)" r={24} />
        <div data-biz-cols="1" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 372px", gap: "clamp(28px, 4vw, 56px)", marginTop: 30, alignItems: "start" }}>
          <div style={{ minWidth: 0 }}>
            <Skeleton w="65%" h="calc(clamp(26px, 3vw, 36px) * 1.05)" />
            <Skeleton w="54%" h={21} style={{ marginTop: 12 }} />
            <div style={{ display: "flex", gap: 26, marginTop: 28, borderBottom: "1px solid rgba(28,28,26,0.08)" }}>
              {[t.tabServices, t.tabTeam, t.tabReviews, t.tabAbout].map((label) => <span key={label} style={{ padding: "12px 2px 13px", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>{label}</span>)}
            </div>
            <div style={{ paddingTop: 24 }}>
              {Array.from({ length: 3 }, (_, i) => <div key={i} style={{ padding: "18px 0", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid rgba(28,28,26,0.08)" }}>
                <div style={{ flex: 1 }}><Skeleton w="65%" h={22} /><Skeleton w="42%" h={19} style={{ marginTop: 5 }} /></div>
                <Skeleton w={38} h={38} r={999} />
              </div>)}
            </div>
          </div>
          <div className="zw-only-desktop" style={{ padding: "22px 22px 20px", border: "1px solid rgba(28,28,26,0.08)", borderRadius: 22, display: "flex", flexDirection: "column", gap: 14, background: "#fff" }}>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--c-900)" }}>{t.bookHeading}</div>
            <div style={{ fontSize: 13.5, color: "var(--c-600)", lineHeight: 1.5, background: "var(--c-50)", border: "1px dashed rgba(28,28,26,0.14)", borderRadius: 14, padding: "14px 16px" }}>{t.bookRailEmpty}</div>
            <Button kind="accent" size="lg" disabled style={{ width: "100%" }}>{t.bookNow}</Button>
          </div>
        </div>
      </div>
    </main>
  );
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
export function SearchPageSkeleton({ showRail = true, desktopControlsBottom = 24 }: { showRail?: boolean; desktopControlsBottom?: number }) {
  return (
    <main className={searchStyles.shell} aria-hidden="true" inert>
      <div className={`${searchStyles.mapPlaceholder} ${searchStyles.desktopMapPlaceholder}`}><MapSkeleton railInsetLeft="32px + min(424px, 36vw)" controlsBottom={desktopControlsBottom} showRail={showRail} /></div>
      <div className={`${searchStyles.mapPlaceholder} ${searchStyles.mobileMapPlaceholder}`}><MapSkeleton controlsBottom={200} showRail={showRail} /></div>
      <div className={`${searchStyles.panel} ${searchStyles.placeholderPanel}`}>
        <div className={searchStyles.handle}><Skeleton w={36} h={4} r={2} /></div>
        <div className={searchStyles.header}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <div><Skeleton w={100} h={17.25} /><div style={{ marginTop: 5, height: 31.5, display: "flex", alignItems: "center" }}><Skeleton w={144} h={21} /></div></div>
            <Skeleton w={70} h={19.5} />
          </div>
          <div style={{ display: "flex", gap: 8, padding: "2px 2px 4px", overflow: "hidden" }}>
            {[60, 104, 88].map(w => <Skeleton key={w} w={w} h={38.25} r={999} style={{ flexShrink: 0 }} />)}
          </div>
        </div>
        <div style={{ flex: 1, padding: "4px 10px 16px", overflow: "hidden" }}>
          {[0, 1, 2, 3, 4].map(row => <RowSkeleton key={row} />)}
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
