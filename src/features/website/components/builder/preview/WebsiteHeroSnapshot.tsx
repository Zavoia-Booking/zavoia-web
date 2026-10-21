"use client";

import type { AnnouncementContent, SectionEntry } from "../../../types";
import { EMPTY_ANNOUNCEMENT } from "../../../publicWebsite";
import { cn } from "../../../../../shared/lib/utils";
import { StaticPreviewContext } from "./shared/hooks";
import type { T } from "./shared/types";
import { AnnouncementBar, normalizeAnnouncementLayout } from "./sections/announcement/Announcement";
import { Hero } from "./sections/hero/Hero";
import type { HeroPreviewData } from "./sections/hero/types";
import { Nav } from "./sections/nav/Nav";

export interface WebsiteHeroSnapshotProps {
  entry: SectionEntry;
  /** The published layout supplies navigation style, visible links, and announcement settings. */
  layout: SectionEntry[];
  data: HeroPreviewData & {
    logo: string | null;
    announcement: AnnouncementContent | null;
    businessTimezone: string | null;
  };
  t: T;
}

/** The public microsite's header and hero at scroll position zero, without its interactive page flow.
 * The host supplies the themed .mc-root and a clipped, inert viewport. */
export function WebsiteHeroSnapshot({ entry, layout, data, t }: WebsiteHeroSnapshotProps) {
  // A cached response from before header metadata was added can still contain only the hero.
  // Keep that preview usable until the feed refreshes instead of guessing its header settings.
  const publishedLayout = layout ?? [];
  const visible = publishedLayout.filter((section) => section.visible);
  const bar = visible.find((section) => section.type === "announcement");
  const announcementLayout = bar ? normalizeAnnouncementLayout(bar.variant) : null;
  const floatingAnnouncement = !!bar && announcementLayout === "pill";
  const first = visible.find((section) => !["announcement", "nav", "footer"].includes(section.type));
  // Match LivePreview: older layouts retain navigation; an explicit hidden entry disables it.
  const navOn = publishedLayout.length > 0 && !publishedLayout.some((section) => section.type === "nav" && !section.visible);
  const firstHeroVariant = (!bar || floatingAnnouncement) && first?.type === "hero"
    ? first.variant
    : null;
  const overHero = firstHeroVariant !== null;
  const announcementNode = bar ? (
    <AnnouncementBar
      entry={bar}
      data={{
        announcement: data.announcement ?? EMPTY_ANNOUNCEMENT,
        locale: data.locale,
        businessTimezone: data.businessTimezone?.trim() || "UTC",
      }}
      t={t}
      showPlaceholder
    />
  ) : null;

  return (
    <StaticPreviewContext.Provider value={true}>
      <div className={cn("mc-content", overHero && "mc-content--nav-overlay")}>
        {bar && !floatingAnnouncement ? (
          <div className="relative z-30">
            {announcementNode}
            {navOn && (
              <Nav data={data} layout={publishedLayout} t={t} overHero={false} progress={0} navRef={null} sticky={false} />
            )}
          </div>
        ) : (
          <>
            {navOn && (
              <Nav
                data={data}
                layout={publishedLayout}
                t={t}
                overHero={overHero}
                overHeroTone={firstHeroVariant === "tumble" ? "light" : "dark"}
                ctaFrost={firstHeroVariant === "default"}
                progress={0}
                navRef={null}
                sticky={false}
              />
            )}
            {floatingAnnouncement && <div className="mc-anno-pill-layer">{announcementNode}</div>}
          </>
        )}
        <div className="mc-page-flow">
          <div className="relative scroll-mt-6" data-preview-section="hero">
            <Hero entry={entry} data={data} t={t} parallax={false} />
          </div>
        </div>
      </div>
    </StaticPreviewContext.Provider>
  );
}
