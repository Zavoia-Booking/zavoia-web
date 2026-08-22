import { Skeleton } from "./skeleton";

// Route-level loading fallbacks, used from the `loading.tsx` files. The shared
// chrome (header, footer, mobile tabs) lives in the locale layout and paints
// immediately; these only stand in for the page body while its server data is
// in flight.

// Detail routes with a lead image and a two-column body: /business/[slug],
// /brand/[slug], the published microsite at /[city].
export function DetailPageSkeleton() {
  return (
    <main
      className="zw-container"
      style={{ paddingTop: 28 }}
      aria-hidden="true"
    >
      <Skeleton w="100%" h={320} r={20} />
      <div
        style={{
          marginTop: 26,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <Skeleton w="46%" h={30} r={10} />
        <Skeleton w="28%" h={14} />
      </div>
      <div
        style={{
          marginTop: 34,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.7fr) minmax(0, 1fr)",
          gap: 28,
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} w="100%" h={64} r={14} />
          ))}
        </div>
        <Skeleton w="100%" h={260} r={16} />
      </div>
    </main>
  );
}

// The full-bleed /search route: filter chrome, then the map/list split.
export function SearchPageSkeleton() {
  return (
    <main style={{ padding: "18px 20px 0" }} aria-hidden="true">
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} w={104} h={36} r={999} />
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.1fr)",
          gap: 20,
          height: "min(70vh, 640px)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} w="100%" h={104} r={14} />
          ))}
        </div>
        <Skeleton w="100%" h="100%" r={18} />
      </div>
    </main>
  );
}

// Card-grid index routes (the blog list).
export function FeedPageSkeleton() {
  return (
    <main
      className="zw-container"
      style={{ paddingTop: 44 }}
      aria-hidden="true"
    >
      <Skeleton w={280} h={34} r={10} />
      <div
        style={{
          marginTop: 30,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 22,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <Skeleton w="100%" h={172} r={16} />
            <Skeleton w="82%" h={18} />
            <Skeleton w="44%" h={12} />
          </div>
        ))}
      </div>
    </main>
  );
}

// Long-form prose routes (a blog post).
export function ArticlePageSkeleton() {
  return (
    <main
      style={{ maxWidth: 720, margin: "0 auto", padding: "44px 20px 0" }}
      aria-hidden="true"
    >
      <Skeleton w="34%" h={12} />
      <div style={{ marginTop: 16 }}>
        <Skeleton w="88%" h={38} r={10} />
      </div>
      <div style={{ marginTop: 28 }}>
        <Skeleton w="100%" h={300} r={16} />
      </div>
      <div
        style={{
          marginTop: 30,
          display: "flex",
          flexDirection: "column",
          gap: 13,
        }}
      >
        {["100%", "96%", "98%", "72%", "100%", "89%", "94%", "58%"].map(
          (w, i) => (
            <Skeleton key={i} w={w} h={13} />
          ),
        )}
      </div>
    </main>
  );
}
