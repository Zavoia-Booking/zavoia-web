import { useId } from "react";

type ArtDepth = { paper: string; shadow: string; contact: string };

const buff = "oklch(80% .027 77)";
const buffBack = "oklch(66% .033 69)";
const buffEdge = "oklch(48% .027 61)";
const warmInk = "oklch(34% .017 62)";
const rim = "oklch(94% .015 82)";
const copper = "oklch(64% .098 43)";

/** A bound day planner, service slip and confirmed booking form one folio. */
function BaseArt({ paper, shadow, contact }: ArtDepth) {
  return (
    <>
      <g data-art-object="" stroke="var(--c-600)" strokeWidth="1.4">
        <g transform="rotate(-6 78 65)">
          <rect x="27" y="27" width="108" height="84" rx="5" fill="var(--c-ink)" stroke="none" filter={shadow} />
          <rect x="25" y="24" width="108" height="84" rx="5" fill="var(--c-mist)" />
          <path d="M31 103h94M30 32v57" stroke="var(--c-canvas)" strokeWidth="1.1" />
        </g>
        <rect x="38" y="22" width="105" height="87" rx="5" fill="var(--c-mist)" />
        <path d="M44 106h89" stroke="var(--c-canvas)" strokeOpacity=".9" strokeWidth="1.1" />
        <rect x="32" y="17" width="105" height="87" rx="5" fill={paper} />
        <path d="M37 17h95a5 5 0 0 1 5 5v18H32V22a5 5 0 0 1 5-5Z" fill="var(--p-500)" fillOpacity=".07" stroke="none" />
        <path d="M37 36V24a3 3 0 0 1 3-3h8m12 0h45m12 0h12" stroke="var(--c-canvas)" strokeWidth="1.2" />
        <path d="M32 40h105" stroke="var(--p-500)" strokeOpacity=".55" />
        <rect x="50" y="10" width="5" height="18" rx="2.5" fill="var(--c-canvas)" />
        <rect x="111" y="10" width="5" height="18" rx="2.5" fill="var(--c-canvas)" />
        <path d="M52 13v10m61-10v10" stroke="var(--c-mist)" strokeWidth="1" />
        <path d="M45 48v43m-3-39h6m-6 17h6m-6 17h6M74 47v46m28-46v46M51 64h76m-76 18h76" strokeOpacity=".18" strokeWidth="1.1" />
        <rect x="53" y="49" width="15" height="10" rx="2" fill="var(--c-mist)" stroke="none" />
        <rect x="80" y="68" width="16" height="11" rx="2" fill="var(--p-500)" fillOpacity=".12" stroke="var(--p-500)" />
        <path d="M83 71h10" stroke="var(--c-canvas)" strokeOpacity=".8" strokeWidth="1" />
        <rect x="108" y="49" width="19" height="10" rx="2" fill="var(--c-mist)" stroke="none" />
      </g>
      <g data-art-detail="" transform="rotate(4 66 99)" stroke="var(--c-600)" strokeWidth="1.3">
        <path d="M23 87h88v28H23a5 5 0 0 0 0-10V97a5 5 0 0 0 0-10Z" fill="var(--c-ink)" stroke="none" filter={contact} />
        <path d="M20 84h88v28H20a5 5 0 0 0 0-10v-8a5 5 0 0 0 0-10Z" fill={paper} />
        <path d="M26 87h77" stroke="var(--c-canvas)" strokeWidth="1" />
        <path d="M34 94h35m-35 8h23m26-8h12m-12 8h8" strokeOpacity=".5" />
        <path d="M76 89v18" strokeOpacity=".25" strokeDasharray="1 3" strokeWidth="1" />
      </g>
      <g data-art-detail="" transform="rotate(8 140 86)">
        <path d="M122 61h30l12 12v41l-6-3-6 3-6-3-6 3-6-3-6 3-6-3Z" fill="var(--c-ink)" stroke="none" filter={contact} />
        <path d="M119 58h30l12 12v41l-6-3-6 3-6-3-6 3-6-3-6 3-6-3Z" fill="var(--p-500)" stroke="var(--p-700)" strokeWidth="1.3" />
        <path d="M149 58v9a3 3 0 0 0 3 3h9Z" fill="var(--p-400)" stroke="var(--p-700)" strokeWidth="1.1" />
        <path d="M123 77V63h21" stroke="var(--c-canvas)" strokeOpacity=".32" strokeWidth="1" />
        <path d="m129 80 6 6 12-13" stroke="var(--c-canvas)" strokeWidth="2.1" />
        <path d="M128 95h22m-22 6h14" stroke="var(--c-canvas)" strokeOpacity=".5" strokeWidth="1.2" />
      </g>
    </>
  );
}

/** Layered website studies become a published page, with link and QR details. */
function PlusArt({ paper, shadow, contact }: ArtDepth) {
  return (
    <>
      <g data-art-object="" stroke={warmInk} strokeWidth="1.4">
        <g transform="rotate(7 99 60)">
          <path d="M58 15h70l15 15v79H58Z" fill={warmInk} stroke="none" filter={shadow} />
          <path d="M54 11h70l15 15v79H54Z" fill={buffBack} />
          <path d="M124 11v12a3 3 0 0 0 3 3h12Z" fill={buffEdge} />
          <path d="M59 29V16h58" stroke={rim} strokeOpacity=".48" strokeWidth="1" />
          <path d="M68 23h33m-33 8h22" strokeOpacity=".4" strokeWidth="1.2" />
        </g>
        <rect x="29" y="35" width="119" height="76" rx="5" fill={warmInk} stroke="none" filter={shadow} />
        <rect x="29" y="35" width="119" height="76" rx="5" fill={buffEdge} />
        <path d="M35 108h94" stroke={rim} strokeOpacity=".35" strokeWidth="1.1" />
        <rect x="24" y="29" width="119" height="76" rx="5" fill={paper} />
        <path d="M29 44V36a3 3 0 0 1 3-3h104" stroke={rim} strokeOpacity=".65" strokeWidth="1.1" />
        <path d="M24 46h119" strokeOpacity=".5" />
        <path d="M34 37h1m6 0h1m6 0h1" strokeWidth="2.2" strokeOpacity=".55" />
        <path d="M79 37h42" strokeOpacity=".25" strokeWidth="1.1" />
        <rect x="35" y="56" width="43" height="31" rx="2" fill={copper} stroke="none" />
        <path d="M39 60h35" stroke={rim} strokeOpacity=".35" strokeWidth="1" />
        <path d="M43 87V72a10 10 0 0 1 20 0v15Z" fill={warmInk} fillOpacity=".35" stroke="none" />
        <path d="M49 87V73a4 4 0 0 1 8 0v14" stroke={buff} strokeOpacity=".55" strokeWidth="1.2" />
        <path d="M88 58h39m-39 8h30m-30 12h32m-32 6h22" strokeOpacity=".55" strokeWidth="1.3" />
        <path d="M35 94h21m7 0h15m10 0h18" stroke={buffEdge} strokeWidth="3" strokeOpacity=".5" />
      </g>
      <g data-art-detail="" transform="rotate(9 146 93)" stroke={warmInk} strokeWidth="1.3">
        <rect x="129" y="74" width="37" height="42" rx="3" fill={warmInk} stroke="none" filter={contact} />
        <rect x="126" y="71" width="37" height="42" rx="3" fill={buffBack} />
        <rect x="123" y="68" width="37" height="42" rx="3" fill={paper} />
        <path d="M127 83V72h28M131 111h26" stroke={rim} strokeOpacity=".65" strokeWidth="1" />
        <path d="M130 76h7v7h-7Zm16 0h7v7h-7Zm-16 16h7v7h-7Z" />
        <path d="M132 78h3v3h-3Zm16 0h3v3h-3Zm-16 16h3v3h-3Z" fill={warmInk} stroke="none" />
        <path d="M142 87h6v5h5v8h-6v-4h-5v6m-12-15h6" strokeWidth="2" />
      </g>
      <g data-art-detail="" transform="rotate(-16 83 106)" fill="none">
        <g stroke={warmInk} strokeWidth="5" filter={contact}>
          <rect x="56" y="102" width="32" height="14" rx="7" />
          <rect x="82" y="96" width="32" height="14" rx="7" />
        </g>
        <rect x="80" y="93" width="32" height="14" rx="7" stroke={buffEdge} strokeWidth="5" />
        <rect x="80" y="92" width="32" height="14" rx="7" stroke={copper} strokeWidth="3" />
        <rect x="54" y="99" width="32" height="14" rx="7" stroke={buffEdge} strokeWidth="5" />
        <rect x="54" y="98" width="32" height="14" rx="7" stroke={buff} strokeWidth="3" />
        <path d="M59 100h19m9-6h15" stroke={rim} strokeOpacity=".75" strokeWidth="1" />
        <path d="M82 98h9" stroke={copper} strokeWidth="3" />
      </g>
    </>
  );
}

/** Matching decorative plan illustrations, with light and ink paper materials. */
export function PlanArtwork({ plan }: { plan: "base" | "plus" }) {
  const id = useId();
  const paperId = `plan-${plan}-paper-${id}`;
  const shadowId = `plan-${plan}-shadow-${id}`;
  const contactId = `plan-${plan}-contact-${id}`;
  const dark = plan === "plus";
  const Scene = dark ? PlusArt : BaseArt;
  return (
    <svg width="184" height="128" viewBox="0 0 184 128" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" data-plan-artwork={plan}>
      <defs>
        <linearGradient id={paperId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor={dark ? "oklch(85% .026 80)" : "var(--c-canvas)"} />
          <stop offset="1" stopColor={dark ? "oklch(76% .028 73)" : "oklch(96% .012 78)"} />
        </linearGradient>
        <filter id={shadowId} filterUnits="userSpaceOnUse" x="-12" y="-12" width="208" height="156" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.3" />
          <feOffset dx="1.2" dy="3.2" result="shade" />
          <feFlood floodColor={dark ? "#100C09" : "#594536"} floodOpacity={dark ? ".42" : ".15"} />
          <feComposite in2="shade" operator="in" />
        </filter>
        <filter id={contactId} filterUnits="userSpaceOnUse" x="-12" y="-12" width="208" height="156" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation=".7" />
          <feOffset dx=".6" dy="1.5" result="shade" />
          <feFlood floodColor={dark ? "#100C09" : "#594536"} floodOpacity={dark ? ".35" : ".18"} />
          <feComposite in2="shade" operator="in" />
        </filter>
      </defs>
      <ellipse cx="92" cy="116" rx="65" ry="3" fill={dark ? "#100C09" : "var(--c-ink)"} fillOpacity={dark ? ".24" : ".04"} />
      <path d="M15 119h154" stroke={dark ? rim : "var(--c-ink)"} strokeOpacity={dark ? ".13" : ".1"} strokeWidth="1" />
      <Scene paper={`url(#${paperId})`} shadow={`url(#${shadowId})`} contact={`url(#${contactId})`} />
    </svg>
  );
}
