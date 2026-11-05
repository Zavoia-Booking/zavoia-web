import { useId } from "react";

/** A reminder note and message slips, in the established paper artwork family. */
export function SmsArtwork() {
  const id = useId();
  const shadow = `sms-shadow-${id}`;
  const paper = `sms-paper-${id}`;
  return (
    <svg width="180" height="148" viewBox="0 0 180 148" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={paper} x1="20" y1="20" x2="145" y2="132" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--c-canvas)" /><stop offset="1" stopColor="var(--c-mist)" />
        </linearGradient>
        <filter id={shadow} x="-25%" y="-25%" width="160%" height="170%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="1" dy="3" stdDeviation="2" floodColor="var(--c-ink)" floodOpacity=".12" />
        </filter>
      </defs>
      <ellipse cx="91" cy="134" rx="70" ry="3" fill="var(--c-ink)" fillOpacity=".04" />
      <path d="M13 138h154" stroke="var(--c-ink)" strokeOpacity=".1" />
      <g transform="rotate(-7 70 75)" filter={`url(#${shadow})`} stroke="var(--c-600)" strokeWidth="1.3">
        <path d="M29 19h70l16 16v89H29Z" fill={`url(#${paper})`} />
        <path d="M99 19v13a3 3 0 0 0 3 3h13Z" fill="var(--c-mist)" />
        <path d="M41 45h38m-38 9h54m-54 15h40m-40 9h48m-48 27h29" strokeOpacity=".4" />
        <path d="M40 28h45" stroke="var(--c-canvas)" strokeWidth="2" />
      </g>
      <g transform="rotate(5 114 93)" filter={`url(#${shadow})`} stroke="var(--p-500)" strokeWidth="1.4">
        <path d="M76 65h69a7 7 0 0 1 7 7v37a7 7 0 0 1-7 7h-36l-14 11v-11H76a7 7 0 0 1-7-7V72a7 7 0 0 1 7-7Z" fill="var(--c-canvas)" />
        <path d="M76 70h69" strokeOpacity=".2" />
        <path d="M83 81h41m-41 9h53m-53 9h31" strokeOpacity=".45" />
        <circle cx="143" cy="66" r="13" fill="var(--p-500)" />
        <path d="m137 66 4 4 8-8" stroke="var(--c-canvas)" strokeWidth="1.8" />
      </g>
    </svg>
  );
}
