import type { ReactNode } from "react";

/** Small objects on the same warm paper as the marketplace streetscape. */
function Artwork({ children }: { children: ReactNode }) {
  return (
    <svg
      width="240"
      height="160"
      viewBox="0 0 240 160"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="var(--c-ink)" strokeOpacity="0.11" strokeWidth="1.4">
        <path d="M15 143h210M29 150h29m12 0h12m88 0h32" />
      </g>
      {children}
    </svg>
  );
}

/** A real tear-off calendar: the number comes from the current trial offer. */
export function TrialArt({ days }: { days: number }) {
  return (
    <Artwork>
      <g stroke="var(--c-600)" strokeWidth="1.4">
        <path d="M32 129h17l-3 14H35Z" fill="var(--c-mist)" />
        <path d="M40 128v-29m0 17c-9 0-13-8-10-13 7 0 10 5 10 13Zm1-7c0-10 5-16 11-18 3 8-2 16-11 18Z" fill="var(--c-canvas)" />
      </g>

      {/* The rear sheet and turned corner make this a paper calendar. */}
      <g stroke="var(--p-500)" strokeWidth="1.5">
        <rect x="67" y="36" width="114" height="107" rx="7" fill="var(--c-canvas)" />
        <rect x="67" y="36" width="114" height="107" rx="7" fill="var(--p-500)" fillOpacity="0.06" stroke="none" />
        <path d="M77 138h91a8 8 0 0 0 8-8" strokeOpacity="0.28" strokeWidth="1.1" />
        <path d="M66 28h103a7 7 0 0 1 7 7v83l-20 20H66a7 7 0 0 1-7-7V35a7 7 0 0 1 7-7Z" fill="var(--c-canvas)" />
        <path d="M66 28h103a7 7 0 0 1 7 7v25H59V35a7 7 0 0 1 7-7Z" fill="var(--p-500)" fillOpacity="0.07" stroke="none" />
        <path d="M59 60h117" strokeWidth="1.3" />
        <path d="M76 44h12m59 0h12" strokeOpacity="0.3" />
        <rect x="79" y="17" width="7" height="27" rx="3.5" fill="var(--c-canvas)" />
        <rect x="150" y="17" width="7" height="27" rx="3.5" fill="var(--c-canvas)" />
        <path d="M108 45h18" strokeOpacity="0.35" />
        <path d="M87 121h44" strokeWidth="1.2" strokeOpacity="0.22" />
        <path d="M156 138v-13a7 7 0 0 1 7-7h13Z" fill="var(--c-canvas)" />
        <path d="M156 138v-13a7 7 0 0 1 7-7h13Z" fill="var(--p-500)" fillOpacity="0.07" stroke="none" />
      </g>
      <text
        x="117"
        y="109"
        fill="var(--p-700)"
        fontFamily="var(--font-sans)"
        fontSize="43"
        fontWeight="550"
        letterSpacing="-2"
        textAnchor="middle"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {days}
      </text>

      {/* The small desk clock gives the trial time a tangible companion. */}
      <g stroke="var(--c-600)" strokeWidth="1.4">
        <path d="m169 135-4 8m30-8 4 8" />
        <circle cx="182" cy="118" r="22" fill="var(--c-mist)" />
        <circle cx="182" cy="118" r="17.5" fill="var(--c-canvas)" />
        <path d="M182 104v3m14 11h-3m-11 14v-3m-14-11h3" strokeOpacity="0.4" />
        <path d="M182 109v9l7 4" stroke="var(--p-500)" strokeWidth="1.6" />
        <path d="M177 92h10m-5 0v4" />
      </g>
    </Artwork>
  );
}

/** The payment card stays in its sleeve; the key is already on the counter. */
export function NoCardArt() {
  return (
    <Artwork>
      <g stroke="var(--c-600)" strokeWidth="1.4">
        <path d="M32 79a6 6 0 0 1 6-6h116a6 6 0 0 1 6 6v58H32Z" fill="var(--c-mist)" />

        {/* A slight tilt shows the physical card resting behind the sleeve. */}
        <g transform="rotate(-8 97 78)">
          <rect x="42" y="40" width="115" height="74" rx="8" fill="var(--c-canvas)" />
          <path d="M42 56h115v12H42Z" fill="var(--c-mist)" stroke="none" />
          <path d="M42 56h115m-115 12h115" strokeOpacity="0.25" strokeWidth="1" />
          <rect x="54" y="80" width="19" height="14" rx="3" fill="var(--c-mist)" strokeOpacity="0.55" />
          <path d="M63.5 80v14m-9.5-7h19M83 89h17m9 0h20" strokeOpacity="0.3" strokeWidth="1" />
        </g>

        <path d="M32 88h36l13 13h79v36a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6Z" fill="var(--c-canvas)" />
        <path d="M32 88h36l13 13h79v36a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6Z" fill="var(--c-mist)" fillOpacity="0.45" stroke="none" />
        <path d="M39 132v3a2 2 0 0 0 2 2h101" strokeOpacity="0.22" strokeDasharray="2 4" strokeWidth="1.1" />
      </g>

      {/* An unbranded cut key, drawn as one solid object rather than a badge. */}
      <g stroke="var(--p-500)" strokeWidth="1.6">
        <path
          d="M160 81a23 23 0 1 1 33 24 23 23 0 0 1-19 2l-11 11h-9v9h-9v9h-17v-10l34-34a23 23 0 0 1-2-11Z"
          fill="var(--c-canvas)"
        />
        <path
          d="M160 81a23 23 0 1 1 33 24 23 23 0 0 1-19 2l-11 11h-9v9h-9v9h-17v-10l34-34a23 23 0 0 1-2-11Z"
          fill="var(--p-500)"
          fillOpacity="0.07"
          stroke="none"
        />
        <circle cx="184" cy="81" r="8" fill="var(--c-canvas)" strokeWidth="1.4" />
        <path d="m136 127 29-29" strokeWidth="1.2" strokeOpacity="0.35" />
        <path d="M194 65a17 17 0 0 1 6 21" strokeWidth="1.1" strokeOpacity="0.28" />
      </g>
    </Artwork>
  );
}

/** The booking receipt takes zero commission, leaving the coins intact. */
export function NoCommissionArt() {
  return (
    <Artwork>
      <g stroke="var(--c-600)" strokeWidth="1.4">
        <path d="M68 36h98a6 6 0 0 1 6 6v96H68Z" fill="var(--c-mist)" />
        <path d="M172 126h10a8 8 0 0 1 8 8v4h-18" fill="var(--c-canvas)" />
        <path d="M76 46h84" strokeOpacity="0.2" />
      </g>

      {/* Torn paper, a perforation, and the total form a printed receipt. */}
      <g stroke="var(--p-500)" strokeWidth="1.5">
        <path d="m58 22 9 5 9-5 9 5 9-5 9 5 9-5 9 5 9-5 9 5 9-5v119l-9-5-9 5-9-5-9 5-9-5-9 5-9-5-9 5-9-5-9 5Z" fill="var(--c-canvas)" />
        <path d="M75 43h56m-47 8h38" strokeWidth="1.3" strokeOpacity="0.3" />
        <path d="M69 65h68" strokeWidth="1.1" strokeOpacity="0.4" strokeDasharray="2 4" />
        <path d="M69 110h68" strokeWidth="1.1" strokeOpacity="0.4" strokeDasharray="2 4" />
        <path d="M84 123h38" strokeWidth="1.3" strokeOpacity="0.25" />
      </g>
      <text
        x="103"
        y="99"
        fill="var(--p-700)"
        fontFamily="var(--font-sans)"
        fontSize="33"
        fontWeight="550"
        letterSpacing="-1.4"
        textAnchor="middle"
      >
        0%
      </text>

      {/* Whole coins, with milled edges, stay beside the receipt. */}
      <g stroke="var(--c-600)" strokeWidth="1.4">
        <path d="M154 128v8c0 4 12 7 27 7s27-3 27-7v-8" fill="var(--c-mist)" />
        <ellipse cx="181" cy="128" rx="27" ry="7" fill="var(--c-canvas)" />
        <path d="M160 132v5m9-3v6m12-5v6m12-7v6m9-8v5" strokeOpacity="0.35" strokeWidth="1" />
        <path d="M150 117v8c0 4 12 7 27 7s27-3 27-7v-8" fill="var(--c-mist)" />
        <ellipse cx="177" cy="117" rx="27" ry="7" fill="var(--c-canvas)" />
        <path d="M156 121v5m9-3v6m12-5v6m12-7v6m9-8v5" strokeOpacity="0.35" strokeWidth="1" />
        <path d="M156 106v8c0 4 12 7 27 7s27-3 27-7v-8" fill="var(--c-mist)" />
        <ellipse cx="183" cy="106" rx="27" ry="7" fill="var(--c-canvas)" />
        <ellipse cx="183" cy="106" rx="19" ry="3.5" strokeOpacity="0.28" strokeWidth="1" />
        <path d="M162 110v5m9-3v6m12-5v6m12-7v6m9-8v5" strokeOpacity="0.35" strokeWidth="1" />
      </g>
    </Artwork>
  );
}
