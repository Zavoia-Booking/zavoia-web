import { useId, type CSSProperties } from "react";

export type StudioFeatureArtKind = "content" | "design" | "publish";

type ArtDepth = { paperShadow: string; contactShadow: string };

// Buff paper catches the studio's warm light without becoming a white badge.
const paper = "var(--studio-art-paper, oklch(81% .026 78))";
const paperBack = "var(--studio-art-back, oklch(69% .031 70))";
const paperEdge = "var(--studio-art-edge, oklch(51% .026 65))";
const ink = "var(--studio-art-ink, oklch(36% .017 65))";
const rim = "var(--studio-art-rim, oklch(91% .018 85))";
const clay = "var(--studio-art-clay, oklch(61% .09 40))";

/** A service sheet, photograph and team slip already belong to one folio. */
function ContentArt({ paperShadow, contactShadow }: ArtDepth) {
  return (
    <>
      <g data-art-object="">
        <path d="M25 35h35l9 9h70v53H25Z" fill={ink} stroke="none" filter={paperShadow} />
        <path d="M24 33h35l9 9h69v53H24Z" fill={paperEdge} />
        <g transform="rotate(-6 70 52)">
          <rect x="40" y="17" width="66" height="76" rx="3" fill={paperBack} />
          <rect x="37" y="13" width="66" height="76" rx="3" fill={paper} />
          <path d="M41 43V20a3 3 0 0 1 3-3h52" stroke={rim} strokeOpacity=".6" strokeWidth="1" />
          <path d="M49 25h31" stroke={clay} strokeWidth="2" />
          <path d="M49 39h23m-23 13h19m-19 13h27" strokeOpacity=".65" />
          <path d="M86 39h6m-6 13h6m-6 13h6" stroke={clay} />
          <path d="M49 44h15m-15 13h12" strokeOpacity=".3" strokeWidth="1" />
        </g>
        <g transform="rotate(8 117 51)">
          <rect x="93" y="29" width="47" height="48" rx="2" fill={ink} stroke="none" filter={contactShadow} />
          <rect x="91" y="26" width="47" height="48" rx="2" fill={paper} />
          <path d="M95 42V30h39" stroke={rim} strokeOpacity=".6" strokeWidth="1" />
          <path d="M97 32h35v30H97Z" fill={paperEdge} stroke="none" />
          <circle cx="122" cy="40" r="4" fill={paperBack} stroke="none" />
          <path d="m97 59 11-13 9 9 6-6 9 10v3H97Z" fill={clay} stroke="none" />
          <path d="M99 68h18" strokeOpacity=".35" strokeWidth="1" />
        </g>
        <path d="M23 59h31l10 9h76v28a4 4 0 0 1-4 4H27a4 4 0 0 1-4-4Z" fill={paperBack} />
        <path d="M27 62h25l10 9h73M28 94v2h49" stroke={rim} strokeOpacity=".5" strokeWidth="1.1" />
        <path d="M35 81h27m-27 7h18" strokeOpacity=".35" strokeWidth="1.2" />
      </g>
      <g data-art-detail="" transform="rotate(-5 110 85)">
        <rect x="86" y="73" width="51" height="26" rx="3" fill={ink} stroke="none" filter={contactShadow} />
        <rect x="84" y="70" width="51" height="26" rx="3" fill={paper} />
        <path d="M88 74h42" stroke={rim} strokeOpacity=".65" strokeWidth="1" />
        <circle cx="96" cy="80" r="3" fill={paperBack} strokeWidth="1.2" />
        <path d="M90 90v-2c0-7 12-7 12 0v2Z" fill={clay} strokeWidth="1.1" />
        <path d="M110 80h15m-15 7h10" strokeOpacity=".5" strokeWidth="1.2" />
      </g>
    </>
  );
}

/** Layout studies, weighted type rules and a hinged book of colour swatches. */
function DesignArt({ paperShadow, contactShadow }: ArtDepth) {
  return (
    <>
      <g data-art-object="" transform="rotate(-5 78 53)">
        <rect x="39" y="18" width="79" height="79" rx="4" fill={ink} stroke="none" filter={paperShadow} />
        <rect x="39" y="18" width="79" height="79" rx="4" fill={paperBack} />
        <rect x="35" y="13" width="79" height="79" rx="4" fill={paper} />
        <path d="M39 40V21a4 4 0 0 1 4-4h64M45 94h64" stroke={rim} strokeOpacity=".6" strokeWidth="1.1" />
        <path d="M47 25h29" stroke={clay} strokeWidth="2" />
        <rect x="47" y="35" width="55" height="22" rx="2" fill={paperBack} stroke="none" />
        <path d="M51 39h47" stroke={rim} strokeOpacity=".35" strokeWidth="1" />
        <rect x="47" y="65" width="21" height="16" rx="1.5" fill={clay} stroke="none" />
        <path d="M76 67h26m-26 6h20m-20 6h23" strokeOpacity=".45" strokeWidth="1.2" />
      </g>
      <g data-art-detail="" transform="rotate(5 59 84)">
        <rect x="20" y="70" width="76" height="29" rx="3" fill={ink} stroke="none" filter={contactShadow} />
        <rect x="18" y="67" width="76" height="29" rx="3" fill={paper} />
        <path d="M23 70h65" stroke={rim} strokeOpacity=".6" strokeWidth="1" />
        <path d="M29 76h37" strokeWidth="3.2" />
        <path d="M29 83h52" strokeWidth="1.8" strokeOpacity=".65" />
        <path d="M29 89h45" strokeWidth="1" strokeOpacity=".45" />
      </g>
      <g data-art-detail="">
        <g transform="rotate(24 125 94)">
          <rect x="115" y="45" width="22" height="54" rx="3" fill={paperEdge} />
          <path d="M119 50h14v16h-14Z" fill={ink} stroke="none" />
        </g>
        <g transform="rotate(11 125 94)">
          <rect x="115" y="44" width="22" height="54" rx="3" fill={paperBack} />
          <path d="M119 49h14v16h-14Z" fill={clay} stroke="none" />
        </g>
        <rect x="113" y="43" width="22" height="55" rx="3" fill={ink} stroke="none" filter={contactShadow} />
        <rect x="111" y="41" width="22" height="55" rx="3" fill={paper} />
        <path d="M114 63V46h15" stroke={rim} strokeOpacity=".65" strokeWidth="1" />
        <path d="M116 48h12v14h-12Z" fill={clay} stroke="none" />
        <path d="M116 67h12v14h-12Z" fill={paperEdge} stroke="none" />
        <circle cx="122" cy="89" r="2" fill={paperBack} strokeWidth="1.1" />
      </g>
    </>
  );
}

/** The published page is shared through its link or a printed QR card. */
function PublishArt({ paperShadow, contactShadow }: ArtDepth) {
  return (
    <>
      <g data-art-object="">
        <rect x="29" y="23" width="107" height="72" rx="5" fill={ink} stroke="none" filter={paperShadow} />
        <rect x="29" y="23" width="107" height="72" rx="5" fill={paperEdge} />
        <rect x="24" y="18" width="107" height="72" rx="5" fill={paper} />
        <path d="M29 35V25a3 3 0 0 1 3-3h92M36 92h82" stroke={rim} strokeOpacity=".6" strokeWidth="1.1" />
        <path d="M24 36h107" strokeOpacity=".45" />
        <path d="M33 27h1m6 0h1m6 0h1" strokeWidth="2.2" strokeOpacity=".65" />
        <path d="M73 27h35" strokeOpacity=".25" strokeWidth="1.2" />
        <rect x="36" y="47" width="34" height="28" rx="2" fill={clay} stroke="none" />
        <path d="M40 51h26" stroke={rim} strokeOpacity=".3" strokeWidth="1" />
        <path d="M80 49h36m-36 8h28m-28 8h20M36 81h49" strokeOpacity=".5" strokeWidth="1.3" />
      </g>
      <g data-art-detail="" transform="rotate(7 125 80)">
        <rect x="108" y="61" width="40" height="41" rx="3" fill={ink} stroke="none" filter={contactShadow} />
        <rect x="105" y="58" width="40" height="41" rx="3" fill={paper} />
        <path d="M109 74V62h31" stroke={rim} strokeOpacity=".65" strokeWidth="1" />
        <path d="M112 65h8v8h-8Zm17 0h8v8h-8Zm-17 17h8v8h-8Z" strokeWidth="1.5" />
        <path d="M115 68h2v2h-2Zm17 0h2v2h-2Zm-17 17h2v2h-2Z" fill={ink} stroke="none" />
        <path d="M125 77h5v4h7v5h-5v5h-7v-6h3M112 77h8m17 14h1" strokeWidth="2" />
      </g>
      <g data-art-detail="" transform="rotate(-15 68 88)" strokeWidth="1.5">
        <path d="M43 83h18a7 7 0 0 1 0 14H43a7 7 0 0 1 0-14Zm23-5h18a7 7 0 0 1 0 14H66a7 7 0 0 1 0-14Z" fill={ink} stroke="none" filter={contactShadow} />
        <rect x="59" y="75" width="32" height="14" rx="7" fill={paperBack} />
        <rect x="36" y="80" width="32" height="14" rx="7" fill={paper} />
        <path d="M40 86a4 4 0 0 1 4-3h15m6-5h18" stroke={rim} strokeOpacity=".6" strokeWidth="1" />
        <path d="M47 89h12a3 3 0 0 0 0-6m8 1h13a3 3 0 0 0 0-6M61 80h10" stroke={clay} strokeWidth="1.8" />
      </g>
    </>
  );
}

const scenes = { content: ContentArt, design: DesignArt, publish: PublishArt };

/** Decorative server-rendered paper objects, lit for the ink Studio section. */
export function StudioFeatureArt({ kind, tone = "dark" }: { kind: StudioFeatureArtKind; tone?: "light" | "dark" }) {
  const id = useId();
  const paperId = `studio-paper-${id}`;
  const contactId = `studio-contact-${id}`;
  const Scene = scenes[kind];
  const light = tone === "light";
  const palette = light ? {
    "--studio-art-paper": "var(--c-canvas)",
    "--studio-art-back": "var(--c-mist)",
    "--studio-art-edge": "oklch(83% .018 78)",
    "--studio-art-ink": "var(--c-600)",
    "--studio-art-rim": "oklch(99.5% .003 85)",
    "--studio-art-clay": "var(--p-500)",
  } as CSSProperties : undefined;
  return (
    <svg width="168" height="112" viewBox="0 0 168 112" fill="none" stroke={ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" data-studio-feature-art={kind} style={palette}>
      <defs>
        {/* Only silhouettes cast shadows; the paper edges and rules stay sharp. */}
        <filter id={paperId} filterUnits="userSpaceOnUse" x="-12" y="-12" width="192" height="144" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.4" />
          <feOffset dx="1.2" dy="3.2" result="shade" />
          <feFlood floodColor="#100C09" floodOpacity={light ? .15 : .42} />
          <feComposite in2="shade" operator="in" />
        </filter>
        <filter id={contactId} filterUnits="userSpaceOnUse" x="-12" y="-12" width="192" height="144" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation=".7" />
          <feOffset dx=".6" dy="1.5" result="shade" />
          <feFlood floodColor="#100C09" floodOpacity={light ? .18 : .35} />
          <feComposite in2="shade" operator="in" />
        </filter>
      </defs>
      <ellipse cx="84" cy="102" rx="56" ry="3" fill="#100C09" fillOpacity={light ? .04 : .28} stroke="none" />
      <path d="M16 104h136" stroke={rim} strokeOpacity=".13" strokeWidth="1" />
      <Scene paperShadow={`url(#${paperId})`} contactShadow={`url(#${contactId})`} />
    </svg>
  );
}
