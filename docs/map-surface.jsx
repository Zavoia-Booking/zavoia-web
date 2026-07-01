// Zavoia — Map surface (stylised SVG, desaturated) + pin variants.
// Pins are absolute-positioned by normalised mapX/mapY ∈ [0..1].
//
// Pin style: category icon (compact category-dot with a small icon)
// Pin states: "default" | "selected" | "viewed"

const { useState: useStateMap, useMemo: useMemoMap } = React;

// ─────────────────────────────────────────────────────────────
// Stylised map background — desaturated SVG with parks, water, roads, blocks.
// Drawn against a 1000×1500 viewBox; the parent sets aspect/clip.
// ─────────────────────────────────────────────────────────────
function ZvMapBackground() {
  const palette = {
    land:   '#EEEAE0',        // warm canvas-tinted beige
    block:  '#E2DDD0',        // slightly darker buildings
    block2: '#D9D3C4',
    road:   '#FFFDF7',        // off-white roads
    roadStroke: 'rgba(28,28,26,0.05)',
    roadMinor: 'rgba(255,253,247,0.85)',
    park:   '#D9DDC9',        // muted sage green
    park2:  '#CCD2BB',
    water:  '#CFD5D8',        // muted slate blue-grey
    label:  'rgba(28,28,26,0.42)',
  };

  return (
    <svg viewBox="0 0 1000 1500" preserveAspectRatio="xMidYMid slice"
         style={{
           position: 'absolute', inset: 0, width: '100%', height: '100%',
           display: 'block', background: palette.land,
         }} aria-hidden="true">
      {/* Park polygons — soft sage blobs */}
      <path d="M 80 60 Q 220 30 320 100 Q 380 200 280 260 Q 160 280 100 200 Z"
            fill={palette.park} />
      <path d="M 720 1080 Q 860 1040 940 1130 Q 980 1240 880 1290 Q 760 1300 700 1220 Z"
            fill={palette.park} />
      <path d="M 420 880 Q 540 850 600 920 Q 600 1000 520 1020 Q 420 1010 380 950 Z"
            fill={palette.park2} />
      <ellipse cx="180" cy="1140" rx="140" ry="80" fill={palette.park2} />

      {/* Water — winding river right side */}
      <path d="M 950 -20 Q 880 220 960 420 Q 1080 660 920 880 Q 820 1080 1040 1300 L 1100 1300 L 1100 -20 Z"
            fill={palette.water} />
      <path d="M -50 720 Q 80 700 180 760 Q 260 820 200 880 Q 80 920 -50 880 Z"
            fill={palette.water} />

      {/* Building blocks — warm light grey rectangles, slight rotation grid */}
      <g fill={palette.block}>
        {/* upper-left cluster */}
        <rect x="120" y="320" width="80" height="60" rx="3" />
        <rect x="220" y="310" width="60" height="80" rx="3" />
        <rect x="300" y="320" width="90" height="50" rx="3" />
        <rect x="120" y="400" width="120" height="40" rx="3" />
        <rect x="260" y="400" width="50" height="70" rx="3" />
        <rect x="330" y="390" width="70" height="60" rx="3" />

        {/* center cluster */}
        <rect x="430" y="500" width="80" height="60" rx="3" />
        <rect x="520" y="480" width="60" height="100" rx="3" />
        <rect x="590" y="510" width="70" height="50" rx="3" />
        <rect x="430" y="580" width="60" height="80" rx="3" />
        <rect x="500" y="600" width="100" height="50" rx="3" />
        <rect x="610" y="580" width="70" height="80" rx="3" />

        {/* right cluster */}
        <rect x="730" y="380" width="60" height="80" rx="3" />
        <rect x="800" y="380" width="50" height="50" rx="3" />
        <rect x="730" y="470" width="120" height="60" rx="3" />
        <rect x="780" y="540" width="70" height="40" rx="3" />

        {/* lower */}
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
      <g fill="none" stroke={palette.road} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round">
        <path d="M -20 460 Q 220 420 480 480 Q 720 540 1020 500" />
        <path d="M 500 -20 Q 480 280 540 580 Q 620 880 580 1180 L 580 1520" />
        <path d="M -20 980 Q 240 940 480 1000 Q 720 1060 1020 1020" />
      </g>
      {/* Hairline along primary roads */}
      <g fill="none" stroke={palette.roadStroke} strokeWidth="23" strokeLinecap="round" strokeLinejoin="round" opacity="1">
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
        {/* Diagonal — bring some natural feel */}
        <path d="M 120 800 L 360 1140" />
        <path d="M 700 200 L 920 360" />
      </g>

      {/* Faint road labels — orientation only */}
      <g fill={palette.label} fontFamily="Geist, sans-serif" fontSize="11" fontWeight="500">
        <text x="180" y="455" transform="rotate(-3 180 455)">Greek St</text>
        <text x="820" y="492" transform="rotate(3 820 492)">Oxford St</text>
        <text x="535" y="320" transform="rotate(90 535 320)">Dean St</text>
        <text x="285" y="900" transform="rotate(90 285 900)">Wardour St</text>
        <text x="600" y="975" transform="rotate(-2 600 975)">Shaftesbury Ave</text>
      </g>

      {/* Park labels */}
      <g fill={palette.label} fontFamily="Geist, sans-serif" fontSize="13" fontWeight="500" opacity="0.7">
        <text x="180" y="180">Soho Sq</text>
        <text x="830" y="1180">Lincoln's Inn</text>
        <text x="200" y="1150">St James's</text>
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// User location dot — pulsing blue
// ─────────────────────────────────────────────────────────────
function ZvUserDot({ x, y }) {
  return (
    <div style={{
      position: 'absolute',
      left: `${x * 100}%`, top: `${y * 100}%`,
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute', inset: -16,
        borderRadius: '50%',
        background: 'rgba(82,120,255,0.16)',
        animation: 'zv-pulse 1.8s ease-out infinite',
      }}/>
      <div style={{
        width: 16, height: 16, borderRadius: '50%',
        background: '#3D6FF2',
        boxShadow: '0 0 0 3px #fff, 0 2px 8px rgba(61,111,242,0.4)',
      }}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PIN — category icon. State controls scale/color/elevation.
//   default  : white circle, category-color icon
//   selected : ink circle, ring in category color, scaled up
//   viewed   : faded
// ─────────────────────────────────────────────────────────────
function ZvPin({ b, state = 'default', onClick, onEnter, onLeave, z = 1, dropIndex = null }) {
  const isSelected = state === 'selected';
  const isViewed   = state === 'viewed';
  const cat = `var(--cat-${b.cat})`;

  return (
    <button onClick={onClick} onMouseEnter={onEnter} onMouseLeave={onLeave}
            className="tap" aria-label={b.name}
            style={{
              position: 'absolute',
              left: `${b.mapX * 100}%`, top: `${b.mapY * 100}%`,
              transform: `translate(-50%, -50%) scale(${isSelected ? 1.45 : 1})`,
              cursor: 'pointer',
              transition: 'transform .35s var(--ease-spring), opacity .2s linear',
              zIndex: isSelected ? 5 : z,
              opacity: isViewed ? 0.55 : 1,
              filter: isViewed ? 'saturate(0.5)' : 'none',
              padding: 0, border: 0, background: 'transparent',
            }}>
      <span className={dropIndex != null ? 'zv-pin-drop' : ''} style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28,
        borderRadius: '50%',
        animationDelay: dropIndex != null ? `${Math.min(dropIndex * 35, 600)}ms` : undefined,
        // Inverted vocabulary (ported 1:1 from the app): default = white
        // plate w/ colored icon; selected = colored plate w/ white icon.
        // The CATEGORY COLOR is the cue itself, not a ring around it.
        background: isSelected ? cat : '#fff',
        color: isSelected ? '#fff' : cat,
        border: isSelected ? 0 : '2px solid rgba(28,28,26,0.06)',
        boxShadow: isSelected
          ? `0 0 0 3px rgba(255,255,255,0.92), 0 0 18px color-mix(in oklch, ${cat} 55%, transparent), 0 6px 16px rgba(28,28,26,0.28)`
          : '0 2px 6px rgba(28,28,26,0.12)',
        transition: 'background-color .25s var(--ease-soft), color .25s var(--ease-soft), border-color .25s var(--ease-soft), box-shadow .3s var(--ease-soft)',
      }}>
        <ZIcon name={window.ZV_CATEGORIES.find(c => c.id === b.cat)?.icon || 'pin'}
               size={14} />
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Map controls — recenter, layers. Each button is skipped when its
// handler is null/undefined, so callers can opt out of either.
// ─────────────────────────────────────────────────────────────
function ZvMapControls({ onRecenter, onLayers }) {
  const btn = {
    width: 40, height: 40, borderRadius: 12, border: 0,
    background: '#fff', color: 'var(--c-900)',
    boxShadow: '0 2px 8px rgba(28,28,26,0.16), 0 0 0 1px rgba(28,28,26,0.04)',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  if (!onLayers && !onRecenter) return null;
  return (
    <div style={{
      position: 'absolute', right: 12, zIndex: 25,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {onLayers && (
        <button className="tap" style={btn} onClick={onLayers} aria-label="Layers">
          <ZIcon name="layers" size={18} />
        </button>
      )}
      {onRecenter && (
        <button className="tap" style={btn} onClick={onRecenter} aria-label="Recenter">
          <ZIcon name="nav" size={17} />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Map surface — composes everything. Children = floating overlay.
// ─────────────────────────────────────────────────────────────
function ZvMap({
  businesses = [],
  selectedId = null,
  viewedIds = new Set(),
  onSelect, onHover, onRecenter, onLayers,
  wave = '',
  userPos = { x: 0.46, y: 0.50 },
  children,
}) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      overflow: 'hidden',
      background: '#EEEAE0',
    }}>
      <ZvMapBackground />

      {/* Pins — keyed on the filter wave so they re-drop when results change */}
      {businesses.map((b, i) => {
        const isSelected = b.id === selectedId;
        const isViewed = !isSelected && viewedIds.has(b.id);
        const state = isSelected ? 'selected' : (isViewed ? 'viewed' : 'default');
        return (
          <ZvPin key={wave + ':' + b.id} b={b} state={state} dropIndex={wave ? i : null}
                 onClick={() => onSelect?.(b)}
                 onEnter={onHover ? () => onHover(b) : undefined}
                 onLeave={onHover ? () => onHover(null) : undefined}
                 z={isSelected ? 5 : 2} />
        );
      })}

      <ZvUserDot x={userPos.x} y={userPos.y} />

      <div style={{
        position: 'absolute', right: 0, top: 56, bottom: 0,
        pointerEvents: 'none',
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          <ZvMapControls onRecenter={onRecenter} onLayers={onLayers} />
        </div>
      </div>

      {children}
    </div>
  );
}

Object.assign(window, {
  ZvMap, ZvMapBackground, ZvPin, ZvUserDot,
  ZvMapControls,
});
