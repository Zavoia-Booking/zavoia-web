import { useId } from "react";
import type { BlogCategory } from "@/sanity/types";

type Materials = { paper: string; shade: string; terracotta: string; shadow: string; contact: string };

/** A folded route and field notes, with a small compass to find the next step. */
function GuidesArtwork({ paper, shade, terracotta, shadow, contact }: Materials) {
  return (
    <>
      <g transform="rotate(7 290 121)" stroke="var(--c-600)" strokeWidth="1.5">
        <path d="M249 48h84l15 16v129H249Z" fill="var(--c-ink)" stroke="none" filter={shadow} />
        <path d="M246 45h84l15 16v129H246Z" fill="var(--c-mist)" />
        <path d="M241 40h84l15 16v129H241Z" fill={paper} />
        <path d="M325 40v12a4 4 0 0 0 4 4h11Z" fill="var(--c-mist)" />
        <path d="M246 72V46h72m16 20v105" stroke="var(--c-canvas)" strokeWidth="1.2" />
        <path d="M257 65h42m-42 9h29" stroke="var(--p-500)" strokeWidth="1.8" />
        <path d="M257 92h65m-65 10h52m-52 10h61m-61 22h65m-65 10h47m-47 10h57" strokeOpacity=".3" strokeWidth="1.4" />
      </g>

      <g transform="rotate(-5 182 165)" stroke="var(--c-600)" strokeWidth="1.6">
        <path d="m58 105 79-25 83 22 77-26 24 145-77 26-83-22-79 25Z" fill="var(--c-ink)" stroke="none" filter={shadow} />
        <path d="m56 101 79-25 83 22 77-26 24 145-77 26-83-22-79 25Z" fill="var(--c-mist)" />
        <path d="m53 96 79-25 83 22 77-26 24 145-77 26-83-22-79 25Z" fill={paper} />
        <path d="m132 71 83 22 24 145-83-22Z" fill={shade} fillOpacity=".24" stroke="none" />
        <path d="m132 71 24 145m59-123 24 145" strokeOpacity=".5" strokeWidth="1.3" />
        <path d="m137 78 21 131m61-110 21 131M59 100l69-22m94 19 64-22" stroke="var(--c-canvas)" strokeOpacity=".85" strokeWidth="1.2" />
        <path d="m69 124 29-9 4 25-29 9Zm9 47 29-9 5 30-29 9Zm79-71 28 7 4 25-28-7Zm8 47 28 7 5 29-28-7Zm75-41 37-12 5 28-37 12Z" fill="var(--c-mist)" fillOpacity=".7" stroke="none" />
        <path d="m67 157 75-24 83 22 75-25M75 203l75-24 83 22 75-25m-196-91 22 135m61-133 23 137m42-142 22 130" strokeOpacity=".18" strokeWidth="1.2" />
        <path d="m96 209 26-8c12-4 13-12 11-21l-2-9c-2-11 6-17 17-14l31 8c11 3 17-3 15-14l-1-6c-2-11 5-18 15-15l17 4c9 2 16-1 20-11l11-27" stroke="var(--c-canvas)" strokeWidth="6" />
        <path d="m96 209 26-8c12-4 13-12 11-21l-2-9c-2-11 6-17 17-14l31 8c11 3 17-3 15-14l-1-6c-2-11 5-18 15-15l17 4c9 2 16-1 20-11l11-27" stroke="var(--p-500)" strokeWidth="2.3" strokeDasharray="3 6" />
        <circle cx="96" cy="209" r="5" fill="var(--c-canvas)" stroke="var(--p-500)" />
        <circle cx="179" cy="165" r="4" fill="var(--c-canvas)" stroke="var(--p-500)" strokeWidth="1.4" />
        <path d="m250 99 7-6 3 9" stroke="var(--p-500)" strokeWidth="2" />
        <path d="m91 222 26-8m133-6 40-13" strokeOpacity=".25" strokeWidth="1.2" />
      </g>

      <g transform="rotate(14 312 207)" strokeWidth="1.5">
        <circle cx="312" cy="160" r="8" fill="var(--c-mist)" stroke="var(--p-700)" />
        <circle cx="312" cy="160" r="4" fill="var(--c-canvas)" stroke="var(--c-600)" strokeWidth="1.1" />
        <circle cx="314" cy="211" r="43" fill="var(--c-ink)" filter={shadow} />
        <circle cx="313" cy="209" r="42" fill="var(--p-700)" stroke="var(--p-700)" />
        <circle cx="311" cy="205" r="42" fill={terracotta} stroke="var(--p-700)" />
        <circle cx="311" cy="205" r="35" fill={paper} stroke="var(--p-700)" />
        <circle cx="311" cy="205" r="29" stroke="var(--c-600)" strokeOpacity=".3" strokeWidth="1.1" />
        <path d="M311 176v5m0 48v5m-29-29h5m48 0h5m-49-20 3 3m35-3-3 3m-35 34 3-3m35 3-3-3" stroke="var(--c-600)" strokeOpacity=".6" strokeWidth="1.4" />
        <path d="m311 181 7 24-7 24-7-24Z" fill="var(--c-ink)" fillOpacity=".25" stroke="none" filter={contact} />
        <path d="m311 181 7 24h-14Z" fill="var(--p-500)" stroke="var(--p-700)" strokeWidth="1.1" />
        <path d="m311 229 7-24h-14Z" fill="var(--c-mist)" stroke="var(--c-600)" strokeWidth="1.1" />
        <circle cx="311" cy="205" r="3" fill="var(--c-canvas)" stroke="var(--c-600)" strokeWidth="1.1" />
        <path d="M283 180a37 37 0 0 1 47-7" stroke="var(--c-canvas)" strokeOpacity=".45" strokeWidth="1.2" />
      </g>
    </>
  );
}

/** The working week and a small shopfront share the same paper desktop. */
function BusinessArtwork({ paper, shade, terracotta, shadow, contact }: Materials) {
  return (
    <>
      <g transform="rotate(-7 164 148)" stroke="var(--c-600)" strokeWidth="1.6">
        <rect x="66" y="58" width="207" height="175" rx="8" fill="var(--c-ink)" stroke="none" filter={shadow} />
        <rect x="63" y="54" width="207" height="175" rx="8" fill="var(--c-mist)" />
        <path d="M72 223h185m-188-11h188" strokeOpacity=".24" strokeWidth="1.1" />
        <rect x="57" y="47" width="207" height="175" rx="7" fill={paper} />
        <path d="M64 47h193a7 7 0 0 1 7 7v39H57V54a7 7 0 0 1 7-7Z" fill="var(--p-500)" fillOpacity=".06" stroke="none" />
        <path d="M57 93h207" strokeOpacity=".55" />
        <path d="M64 80V58a4 4 0 0 1 4-4h18m30 0h90m30 0h20" stroke="var(--c-canvas)" strokeWidth="1.4" />
        <rect x="91" y="34" width="8" height="30" rx="4" fill="var(--c-canvas)" />
        <rect x="223" y="34" width="8" height="30" rx="4" fill="var(--c-canvas)" />
        <path d="M94 39v17m132-17v17" stroke="var(--c-mist)" strokeWidth="1.4" />
        <path d="M81 77h48m82 0h29" strokeOpacity=".4" strokeWidth="1.8" />
        <path d="M80 108h161M80 139h161M80 170h161M80 201h161m-121-93v93m41-93v93m40-93v93" strokeOpacity=".2" strokeWidth="1.2" />
        <rect x="85" y="114" width="28" height="18" rx="3" fill="var(--c-mist)" stroke="none" />
        <rect x="126" y="145" width="28" height="18" rx="3" fill="var(--p-500)" fillOpacity=".15" stroke="var(--p-500)" strokeWidth="1.2" />
        <path d="m133 154 4 4 10-11" stroke="var(--p-500)" strokeWidth="1.8" />
        <rect x="167" y="114" width="28" height="18" rx="3" fill="var(--c-mist)" stroke="none" />
        <rect x="85" y="176" width="28" height="18" rx="3" fill="var(--c-mist)" stroke="none" />
      </g>

      <g transform="rotate(5 290 182)" stroke="var(--c-600)" strokeWidth="1.5">
        <path d="M228 114h118l16 13v116H228Z" fill="var(--c-ink)" stroke="none" filter={shadow} />
        <path d="m345 110 15 12v117l-15-8Z" fill="var(--c-mist)" />
        <path d="M220 110h125v121H220Z" fill={paper} />
        <path d="M217 98h131v12H217Z" fill={paper} />
        <path d="M220 110h125v5H220Z" fill="var(--c-ink)" fillOpacity=".06" stroke="none" />
        <path d="M223 101h119m-117 17v10" stroke="var(--c-canvas)" strokeWidth="1.2" />
        <path d="M235 205v-23a14 14 0 0 1 28 0v23Z" fill="var(--c-canvas)" />
        <path d="M249 168v37m-14-13h28" strokeOpacity=".35" strokeWidth="1.2" />
        <path d="M283 231v-46a20 20 0 0 1 40 0v46Z" fill={shade} />
        <path d="M288 230v-45a15 15 0 0 1 30 0v45m-28-40h25" strokeOpacity=".4" strokeWidth="1.2" />
        <path d="M310 208v6" stroke="var(--p-500)" strokeWidth="2" />
        <path d="M216 231h132l5 7H216Z" fill="var(--c-mist)" />
        <path d="M222 234h120" stroke="var(--c-canvas)" strokeWidth="1.2" />
        <path d="M228 125h109l15 23H213Z" fill={terracotta} stroke="var(--p-700)" />
        <path d="m244 125-5 23h14l2-23Zm28 0-1 23h14l-1-23Zm28 0 3 23h14l-5-23Zm28 0 7 23h14l-11-23Z" fill="var(--c-canvas)" fillOpacity=".8" stroke="none" />
        <path d="M213 148h139v6q-7 8-14 0-7 8-14 0-7 8-14 0-7 8-14 0-7 8-14 0-7 8-14 0-7 8-14 0-7 8-14 0-7 8-14 0-7 8-13 0Z" fill="var(--p-500)" stroke="var(--p-700)" />
        <path d="M231 128h101m-114 22h128" stroke="var(--c-canvas)" strokeOpacity=".4" strokeWidth="1.1" />
      </g>

      <g transform="rotate(12 176 230)" strokeWidth="1.2">
        <path d="m111 226 113-3 12 6-12 6-113 3Z" fill="var(--c-ink)" filter={contact} />
        <path d="m108 223 113-3 12 6-12 6-113 3Z" fill="var(--c-mist)" stroke="var(--c-600)" />
        <path d="m108 223 104-3v12l-104 3Z" fill="var(--p-500)" stroke="var(--p-700)" />
        <path d="m112 226 95-3" stroke="var(--c-canvas)" strokeOpacity=".4" />
        <path d="m227 223 6 3-6 3Z" fill="var(--c-ink)" />
      </g>
    </>
  );
}

/** An announcement laid on the desk, with a small copper speaking trumpet. */
function UpdatesArtwork({ paper, shade, terracotta, shadow, contact }: Materials) {
  return (
    <>
      <g transform="rotate(-6 189 145)" stroke="var(--c-600)" strokeWidth="1.5">
        <path d="M88 50h191l25 24v161H88Z" fill="var(--c-ink)" stroke="none" filter={shadow} />
        <path d="M84 47h190l25 24v161H84Z" fill="var(--c-mist)" />
        <path d="M81 42h189l24 25v159H81Z" fill={paper} />
        <path d="M270 42v20a5 5 0 0 0 5 5h19Z" fill="var(--c-mist)" />
        <path d="M87 77V48h175m26 25v139" stroke="var(--c-canvas)" strokeWidth="1.3" />
        <path d="M100 64h120m-120 9h79" stroke="var(--p-500)" strokeWidth="2.8" />
        <path d="M96 87h179" strokeOpacity=".4" strokeWidth="1.2" />
        <path d="M101 101h89v60h-89Z" fill="var(--c-mist)" strokeOpacity=".5" strokeWidth="1.2" />
        <path d="m110 150 24-28 19 18 13-13 16 23Z" fill="var(--c-canvas)" strokeOpacity=".4" strokeWidth="1.2" />
        <circle cx="173" cy="114" r="6" fill="var(--p-500)" fillOpacity=".45" stroke="none" />
        <path d="M204 103h65m-65 10h55m-55 10h62m-62 10h47m-47 18h65m-65 10h52" strokeOpacity=".35" strokeWidth="1.5" />
        <path d="M102 177h168m-168 11h158m-158 11h101m-101 12h65" strokeOpacity=".28" strokeWidth="1.4" />
        <path d="M186 43v181" stroke="var(--c-ink)" strokeOpacity=".04" strokeWidth="6" />
        <path d="M188 45v177" stroke="var(--c-canvas)" strokeOpacity=".55" strokeWidth="1.2" />
      </g>

      <g transform="rotate(-13 291 203)" strokeWidth="1.6">
        <path d="m247 201 23 9-7 34c-2 5-17 5-19 0Z" fill="var(--c-ink)" filter={contact} />
        <path d="m244 198 24 9-8 34c-2 5-16 5-18 0Z" fill="var(--c-mist)" stroke="var(--c-600)" />
        <path d="m249 213-3 23m10-21-3 18" stroke="var(--c-canvas)" strokeWidth="1.2" />
        <path d="M233 170h35l70-37v89l-70-28h-35a11 11 0 0 1-11-11v-2a11 11 0 0 1 11-11Z" fill="var(--c-ink)" filter={shadow} />
        <path d="M231 167h35l70-37v89l-70-28h-35a11 11 0 0 1-11-11v-2a11 11 0 0 1 11-11Z" fill={terracotta} stroke="var(--p-700)" />
        <path d="M266 167v24m-34-17h23m-23 7h23" stroke="var(--c-canvas)" strokeOpacity=".35" strokeWidth="1.3" />
        <path d="m274 168 54-28m-54 44 54 23" stroke="var(--c-canvas)" strokeOpacity=".3" strokeWidth="1.2" />
        <ellipse cx="337" cy="174" rx="16" ry="45" fill="var(--c-mist)" stroke="var(--p-700)" />
        <ellipse cx="339" cy="174" rx="11" ry="37" fill={shade} stroke="var(--c-600)" strokeWidth="1.3" />
        <path d="M338 149c7 12 7 38 0 50" stroke="var(--c-canvas)" strokeOpacity=".8" strokeWidth="1.2" />
        <path d="M232 167v24" stroke="var(--p-700)" strokeWidth="1.3" />
      </g>
    </>
  );
}

/** Three article destinations, illustrated in the site's existing paper-and-ink materials. */
export function BlogCategoryArtwork({ category }: { category: BlogCategory }) {
  const id = useId();
  const prefix = `blog-category-${category}-${id}`;
  const materials: Materials = {
    paper: `url(#${prefix}-paper)`,
    shade: `url(#${prefix}-shade)`,
    terracotta: `url(#${prefix}-terracotta)`,
    shadow: `url(#${prefix}-shadow)`,
    contact: `url(#${prefix}-contact)`,
  };
  const Scene = category === "guides" ? GuidesArtwork : category === "business" ? BusinessArtwork : UpdatesArtwork;

  return (
    <svg width="420" height="280" viewBox="0 0 420 280" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" data-blog-category-artwork={category}>
      <defs>
        <linearGradient id={`${prefix}-paper`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="var(--c-canvas)" /><stop offset="1" stopColor="var(--c-mist)" stopOpacity=".7" />
        </linearGradient>
        <linearGradient id={`${prefix}-shade`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop stopColor="var(--c-600)" stopOpacity=".19" /><stop offset="1" stopColor="var(--c-mist)" />
        </linearGradient>
        <linearGradient id={`${prefix}-terracotta`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="var(--p-500)" /><stop offset="1" stopColor="var(--p-700)" />
        </linearGradient>
        <filter id={`${prefix}-shadow`} x="-24" y="-24" width="468" height="328" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3.6" />
          <feOffset dx="1.5" dy="5" result="shade" />
          <feFlood floodColor="var(--c-ink)" floodOpacity=".13" />
          <feComposite in2="shade" operator="in" />
        </filter>
        <filter id={`${prefix}-contact`} x="-24" y="-24" width="468" height="328" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
          <feOffset dx=".8" dy="2" result="shade" />
          <feFlood floodColor="var(--c-ink)" floodOpacity=".17" />
          <feComposite in2="shade" operator="in" />
        </filter>
      </defs>
      <ellipse cx="211" cy="250" rx="155" ry="5" fill="var(--c-ink)" fillOpacity=".035" />
      <path d="M40 253h339m-314 7h24m241 0h28" stroke="var(--c-600)" strokeOpacity=".14" strokeWidth="1.3" />
      <Scene {...materials} />
    </svg>
  );
}
