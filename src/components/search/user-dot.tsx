// Pulsing user-location dot. Ported from ZvUserDot (docs/map-surface.jsx).


// Inner pulsing dot — the shared visual, with NO outer positioning. Reused by
// both the absolutely-positioned <UserDot> and the react-map-gl user Marker
// (which positions via lat/lng instead of normalised %).
export function UserDotGlyph() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        width: 16,
        height: 16,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -16,
          borderRadius: "50%",
          background: "rgba(82,120,255,0.16)",
          animation: "zv-pulse 1.8s ease-out infinite",
        }}
      />
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#3D6FF2",
          boxShadow: "0 0 0 3px #fff, 0 2px 8px rgba(61,111,242,0.4)",
        }}
      />
    </div>
  );
}

