// Stylised, desaturated map backdrop. Ported verbatim from ZvMapBackground
// (docs/map-surface.jsx): parks, water, roads and blocks drawn against a
// 1000×1500 viewBox; the parent sets aspect/clip. Purely decorative.

const palette = {
  land: "#EEEAE0",
  block: "#E2DDD0",
  block2: "#D9D3C4",
  road: "#FFFDF7",
  roadStroke: "rgba(28,28,26,0.05)",
  roadMinor: "rgba(255,253,247,0.85)",
  park: "#D9DDC9",
  park2: "#CCD2BB",
  water: "#CFD5D8",
  label: "rgba(28,28,26,0.42)",
};

export function MapBackground() {
  return (
    <svg
      viewBox="0 0 1000 1500"
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        background: palette.land,
      }}
      aria-hidden="true"
    >
      {/* Park polygons — soft sage blobs */}
      <path
        d="M 80 60 Q 220 30 320 100 Q 380 200 280 260 Q 160 280 100 200 Z"
        fill={palette.park}
      />
      <path
        d="M 720 1080 Q 860 1040 940 1130 Q 980 1240 880 1290 Q 760 1300 700 1220 Z"
        fill={palette.park}
      />
      <path
        d="M 420 880 Q 540 850 600 920 Q 600 1000 520 1020 Q 420 1010 380 950 Z"
        fill={palette.park2}
      />
      <ellipse cx="180" cy="1140" rx="140" ry="80" fill={palette.park2} />

      {/* Water — winding river right side */}
      <path
        d="M 950 -20 Q 880 220 960 420 Q 1080 660 920 880 Q 820 1080 1040 1300 L 1100 1300 L 1100 -20 Z"
        fill={palette.water}
      />
      <path
        d="M -50 720 Q 80 700 180 760 Q 260 820 200 880 Q 80 920 -50 880 Z"
        fill={palette.water}
      />

      {/* Building blocks — warm light grey rectangles */}
      <g fill={palette.block}>
        <rect x="120" y="320" width="80" height="60" rx="3" />
        <rect x="220" y="310" width="60" height="80" rx="3" />
        <rect x="300" y="320" width="90" height="50" rx="3" />
        <rect x="120" y="400" width="120" height="40" rx="3" />
        <rect x="260" y="400" width="50" height="70" rx="3" />
        <rect x="330" y="390" width="70" height="60" rx="3" />

        <rect x="430" y="500" width="80" height="60" rx="3" />
        <rect x="520" y="480" width="60" height="100" rx="3" />
        <rect x="590" y="510" width="70" height="50" rx="3" />
        <rect x="430" y="580" width="60" height="80" rx="3" />
        <rect x="500" y="600" width="100" height="50" rx="3" />
        <rect x="610" y="580" width="70" height="80" rx="3" />

        <rect x="730" y="380" width="60" height="80" rx="3" />
        <rect x="800" y="380" width="50" height="50" rx="3" />
        <rect x="730" y="470" width="120" height="60" rx="3" />
        <rect x="780" y="540" width="70" height="40" rx="3" />

        <rect x="240" y="1240" width="80" height="60" rx="3" />
        <rect x="340" y="1230" width="60" height="80" rx="3" />
        <rect x="420" y="1240" width="70" height="50" rx="3" />
        <rect x="240" y="1320" width="100" height="40" rx="3" />
      </g>

      <g fill={palette.block2}>
        <rect x="500" y="200" width="80" height="60" rx="3" />
        <rect x="590" y="190" width="60" height="80" rx="3" />
        <rect x="500" y="280" width="50" height="70" rx="3" />
        <rect x="570" y="290" width="80" height="50" rx="3" />
        <rect x="120" y="540" width="80" height="60" rx="3" />
        <rect x="220" y="530" width="60" height="80" rx="3" />
        <rect x="120" y="620" width="120" height="40" rx="3" />
        <rect x="730" y="800" width="80" height="60" rx="3" />
        <rect x="820" y="790" width="60" height="80" rx="3" />
        <rect x="730" y="880" width="100" height="40" rx="3" />
        <rect x="500" y="1180" width="80" height="60" rx="3" />
        <rect x="590" y="1170" width="60" height="80" rx="3" />
      </g>

      {/* Primary roads — broad off-white strokes */}
      <g
        fill="none"
        stroke={palette.road}
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M -20 460 Q 220 420 480 480 Q 720 540 1020 500" />
        <path d="M 500 -20 Q 480 280 540 580 Q 620 880 580 1180 L 580 1520" />
        <path d="M -20 980 Q 240 940 480 1000 Q 720 1060 1020 1020" />
      </g>
      {/* Hairline along primary roads */}
      <g
        fill="none"
        stroke={palette.roadStroke}
        strokeWidth="23"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="1"
      >
        <path d="M -20 460 Q 220 420 480 480 Q 720 540 1020 500" />
        <path d="M 500 -20 Q 480 280 540 580 Q 620 880 580 1180 L 580 1520" />
        <path d="M -20 980 Q 240 940 480 1000 Q 720 1060 1020 1020" />
      </g>

      {/* Minor streets — thinner grid */}
      <g fill="none" stroke={palette.roadMinor} strokeWidth="9" strokeLinecap="round">
        <path d="M 60 200 L 460 200" />
        <path d="M 60 700 L 460 700" />
        <path d="M 60 1240 L 460 1240" />
        <path d="M 700 200 L 1020 200" />
        <path d="M 700 720 L 1020 720" />
        <path d="M 700 1240 L 1020 1240" />
        <path d="M 280 60 L 280 460" />
        <path d="M 760 60 L 760 460" />
        <path d="M 280 540 L 280 980" />
        <path d="M 760 540 L 760 980" />
        <path d="M 280 1020 L 280 1480" />
        <path d="M 760 1020 L 760 1480" />
        <path d="M 120 800 L 360 1140" />
        <path d="M 700 200 L 920 360" />
      </g>

      {/* Faint road labels — orientation only */}
      <g
        fill={palette.label}
        fontFamily="Geist, sans-serif"
        fontSize="11"
        fontWeight="500"
      >
        <text x="180" y="455" transform="rotate(-3 180 455)">
          Greek St
        </text>
        <text x="820" y="492" transform="rotate(3 820 492)">
          Oxford St
        </text>
        <text x="535" y="320" transform="rotate(90 535 320)">
          Dean St
        </text>
        <text x="285" y="900" transform="rotate(90 285 900)">
          Wardour St
        </text>
        <text x="600" y="975" transform="rotate(-2 600 975)">
          Shaftesbury Ave
        </text>
      </g>

      {/* Park labels */}
      <g
        fill={palette.label}
        fontFamily="Geist, sans-serif"
        fontSize="13"
        fontWeight="500"
        opacity="0.7"
      >
        <text x="180" y="180">
          Soho Sq
        </text>
        <text x="830" y="1180">
          Lincoln&apos;s Inn
        </text>
        <text x="200" y="1150">
          St James&apos;s
        </text>
      </g>
    </svg>
  );
}
