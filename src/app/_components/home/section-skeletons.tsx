import { Skeleton } from "@/components/ui/skeleton";
import { SectionTitle } from "@/components/ui/section-title";
import { Kicker } from "@/components/ui/kicker";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";
import categoryStyles from "./category-rail.module.css";

// Streaming placeholders for the data-backed home sections. Each one mirrors
// the container/padding/grid of the real section so the shell reserves the
// right space and the swap-in doesn't shift layout.

// Share the live rail's responsive item count and grid geometry.
export function CategoryRailSkeleton() {
  return (
    <section className={`zw-container ${categoryStyles.section}`} aria-hidden="true">
      <ul className={categoryStyles.grid}>
        {Array.from({ length: 12 }).map((_, i) => (
          <li key={i}>
            <div className={categoryStyles.tile}>
              <Skeleton w={56} h={56} r="50%" />
              <div className={categoryStyles.label}><Skeleton w={64} h="1em" style={{ marginTop: ".2em" }} /></div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// The title is already known. Keep its actual wrapping and the live grid's
// 4:5 cards; the server requests up to ten brands.
export function BrandsSkeleton({
  labels,
}: {
  labels: Dictionary["homeSections"]["brands"];
}) {
  return (
    <section className="zw-container" style={{ paddingTop: 60 }} aria-hidden="true" inert>
      <SectionTitle kicker={labels.kicker} title={labels.title} action={labels.action} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(232px, 100%), 1fr))",
          gap: 18,
        }}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} h="auto" r="var(--card-r, 18px)" style={{ aspectRatio: "4 / 5" }} />
        ))}
      </div>
    </section>
  );
}

// Reuse the live split/rail classes, including their mobile breakpoint. This
// reserves the editorial band's height instead of substituting a card grid.
export function EditorsPickSkeleton({ labels }: {
  labels: Dictionary["homeSections"]["editorsPick"];
}) {
  return (
    <section aria-hidden="true" inert style={{ position: "relative", overflow: "hidden", marginTop: 64, background: "var(--c-ink)" }}>
      <div className="zw-container zw-split" style={{ position: "relative", paddingBlock: "clamp(48px, 6vw, 92px)", minHeight: "70vh" }}>
        <div className="zw-split-left">
          <div style={{ display: "flex", gap: "clamp(20px, 2.2vw, 32px)" }}>
            <div className="zw-only-desktop" style={{ width: 1, alignSelf: "stretch", flexShrink: 0, background: "rgba(255,255,255,0.20)" }} />
            <div style={{ minWidth: 0 }}>
              <Kicker color="color-mix(in oklch, var(--p-400) 78%, #fff)" style={{ marginBottom: 16 }}>{labels.kicker}</Kicker>
              <h2 className="txt-balance" style={{ margin: 0, fontSize: "clamp(34px, 3.4vw, 54px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, color: "#fff" }}>{labels.title}</h2>
              <p className="txt-pretty" style={{ margin: "20px 0 30px", fontSize: "clamp(15px, 1.3vw, 17px)", lineHeight: 1.55, color: "rgba(255,255,255,0.76)", maxWidth: 380 }}>{labels.sub}</p>
              <Button kind="secondary" size="lg" tabIndex={-1}>{labels.cta}</Button>
              <div style={{ marginTop: "clamp(30px, 3.2vw, 44px)", display: "flex", gap: 9 }}>
                <Skeleton w={44} h={44} r="50%" />
                <Skeleton w={44} h={44} r="50%" />
              </div>
              <Skeleton w={240} h={3} r={999} style={{ marginTop: 18, maxWidth: "100%" }} />
            </div>
          </div>
        </div>
        <div className="zw-split-right">
          <div className="zw-carousel-rail zw-rail-split">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="zw-carousel-card">
                <Skeleton h="auto" r={22} style={{ aspectRatio: "4 / 4.2" }} />
                <div style={{ margin: "-26px 14px 0", position: "relative", background: "#fff", border: "1px solid rgba(28,28,26,0.06)", borderRadius: 18, padding: "14px 17px 16px" }}>
                  <div style={{ height: 19.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}><Skeleton w="35%" h={10} /><Skeleton w={56} h={13} /></div>
                  <div style={{ marginTop: 6, fontSize: "clamp(20px, 1.4vw, 22px)", height: "2.12em", display: "grid", alignContent: "start", gap: ".16em" }}><Skeleton w="85%" h=".9em" /><Skeleton w="60%" h=".9em" /></div>
                  <div style={{ marginTop: 12, height: 19, display: "flex", alignItems: "center", justifyContent: "flex-end" }}><Skeleton w={88} h={12.5} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Same image ratio, text rows, border and padding as RecentlyViewedCard.
export function RecentlyViewedSkeleton({ count }: { count: number }) {
  return (
    <div className="zw-scroll-x" style={{ gap: 14, paddingBottom: 6 }} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ width: 224, flexShrink: 0, border: "1px solid rgba(28,28,26,0.06)", borderRadius: "var(--card-r, 18px)", overflow: "hidden", background: "#fff" }}>
          <Skeleton h="auto" r={0} style={{ aspectRatio: "16 / 10" }} />
          <div style={{ padding: "11px 14px 13px" }}>
            <div style={{ height: 21.75, display: "flex", alignItems: "center" }}><Skeleton w="80%" h={14.5} /></div>
            <div style={{ height: 18, marginTop: 4, display: "flex", alignItems: "center" }}><Skeleton w="55%" h={12} /></div>
          </div>
        </div>
      ))}
    </div>
  );
}
