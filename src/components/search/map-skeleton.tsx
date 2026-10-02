import { Skeleton } from "@/components/ui/skeleton";

/**
 * First-load stand-in for the map itself.
 *
 * The route's own skeleton lifts as soon as React has something to render,
 * which on this page is several seconds before mapbox-gl has tiles on screen —
 * so the page used to hand over to a blank grey canvas. This covers the map
 * area until the map's first idle (tiles actually painted), then crossfades.
 *
 * It draws the map's chrome, not a grey box: the browse rail and the control
 * stack land in the same places the real ones do, so nothing jumps when it goes.
 */
export function MapSkeleton({ railInsetLeft = 0 }: { railInsetLeft?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        background: "#EEEAE0",
        overflow: "hidden",
      }}
    >
      {/* A faint street grid, so the field reads as a map rather than a panel. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px, 48px 48px",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 18,
          left: railInsetLeft + 12,
          right: 12,
          display: "flex",
          gap: 8,
          overflow: "hidden",
        }}
      >
        {[112, 88, 132, 96, 76].map((w, i) => (
          <Skeleton key={i} w={w} h={34} r={999} />
        ))}
      </div>
      <div style={{ position: "absolute", right: 12, bottom: 24 }}>
        <Skeleton w={40} h={40} r={12} />
      </div>
    </div>
  );
}
