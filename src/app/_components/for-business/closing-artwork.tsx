import { useId } from "react";

/** An open neighbourhood shop and a new appointment, in the street's paper materials. */
export function ClosingArtwork() {
  const id = useId();
  const paperId = `closing-paper-${id}`;
  const wallId = `closing-wall-${id}`;
  const recessId = `closing-recess-${id}`;
  const shadowId = `closing-shadow-${id}`;
  const contactId = `closing-contact-${id}`;
  const paper = `url(#${paperId})`;

  return (
    <svg
      width="460"
      height="350"
      viewBox="0 0 460 350"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-closing-artwork=""
    >
      <defs>
        <linearGradient id={paperId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="var(--c-canvas)" />
          <stop offset="1" stopColor="oklch(94% .018 78)" />
        </linearGradient>
        <linearGradient id={wallId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop stopColor="var(--c-mist)" />
          <stop offset="1" stopColor="oklch(81% .025 75)" />
        </linearGradient>
        <linearGradient id={recessId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="oklch(64% .022 72)" />
          <stop offset="1" stopColor="var(--c-mist)" />
        </linearGradient>
        <filter id={shadowId} x="0" y="0" width="460" height="350" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3.2" />
          <feOffset dx="1.5" dy="4" result="shade" />
          <feFlood floodColor="var(--c-ink)" floodOpacity=".12" />
          <feComposite in2="shade" operator="in" />
        </filter>
        <filter id={contactId} x="0" y="0" width="460" height="350" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" />
          <feOffset dx="1" dy="1.8" result="shade" />
          <feFlood floodColor="var(--c-ink)" floodOpacity=".17" />
          <feComposite in2="shade" operator="in" />
        </filter>
      </defs>

      <ellipse cx="229" cy="298" rx="179" ry="8" fill="var(--c-ink)" fillOpacity=".045" />
      <path d="M39 300h371m-330 8h41m218 0h44" stroke="var(--c-600)" strokeOpacity=".18" strokeWidth="1.4" />

      {/* The side wall, cornice and inset openings share the hero's left-hand light. */}
      <g stroke="var(--c-600)" strokeWidth="1.6">
        <path d="M85 92h213l17 12v181H85Z" fill="var(--c-ink)" stroke="none" filter={`url(#${shadowId})`} />
        <path d="m298 92 17 12v181l-17-9Z" fill={`url(#${wallId})`} />
        <path d="M85 276V92h213v184Z" fill={paper} />
        <path d="M81 92V78h221v14ZM94 78V64h195v14" fill={paper} />
        <path d="m302 78 17 12v14l-17-12ZM289 64l16 12v2h-16Z" fill={`url(#${wallId})`} />
        <path d="M85 92h213v6H85Z" fill="var(--c-ink)" fillOpacity=".06" stroke="none" />
        <path d="M98 67h186M85 81h212M89 102v31" stroke="var(--c-canvas)" strokeWidth="1.4" />
        <path d="M95 266h64m113 0h16M307 115v148" strokeOpacity=".2" strokeWidth="1.4" />

        <path d="M108 238v-40a24 24 0 0 1 48 0v40Z" fill="var(--c-canvas)" />
        <path d="M108 238v-40a24 24 0 0 1 48 0h-4a20 20 0 0 0-40 0v40Z" fill="var(--c-ink)" fillOpacity=".065" stroke="none" />
        <path d="M132 174v64m-24-24h48" strokeOpacity=".35" strokeWidth="1.4" />
        <path d="M104 238h56l-3 5h-50Z" fill="var(--c-mist)" />
        <path d="M116 202v29m35-29v30" stroke="var(--c-mist)" strokeOpacity=".65" strokeWidth="1.4" />

        <path d="M187 276v-91a32 32 0 0 1 64 0v91Z" fill={`url(#${recessId})`} />
        <path d="M187 276v-91a32 32 0 0 1 64 0h-5a27 27 0 0 0-54 0v91Z" fill="var(--c-ink)" fillOpacity=".12" stroke="none" />
        <path d="M198 185h47m-26-25v24" stroke="var(--c-canvas)" strokeOpacity=".5" strokeWidth="1.4" />
        <path d="m251 185 24 14v89l-24-12Z" fill={`url(#${wallId})`} />
        <path d="m255 194 15 9v70l-15-8Z" fill="var(--c-canvas)" fillOpacity=".5" strokeOpacity=".55" />
        <path d="M267 239v9" stroke="var(--p-600)" strokeWidth="1.8" />
        <path d="M180 276h72l11 9h-83Z" fill="var(--c-mist)" />
        <path d="M182 279h65" stroke="var(--c-canvas)" strokeWidth="1.4" />
      </g>

      {/* A shallow canvas awning gives the open entrance its copper accent. */}
      <g stroke="var(--p-700)" strokeWidth="1.5">
        <path d="M80 147h220l-7 12H87Z" fill="var(--c-ink)" fillOpacity=".09" stroke="none" />
        <path d="M92 112h194l19 32H73Z" fill="var(--p-500)" />
        <path d="m119 112-6 32h24l2-32Zm47 0-1 32h24l-2-32Zm47 0 4 32h24l-8-32Zm47 0 9 32h24l-13-32Z" fill="var(--c-canvas)" fillOpacity=".72" stroke="none" />
        <path d="M73 144h232v8q-11.6 12-23.2 0-11.6 12-23.2 0-11.6 12-23.2 0-11.6 12-23.2 0-11.6 12-23.2 0-11.6 12-23.2 0-11.6 12-23.2 0-11.6 12-23.2 0-11.6 12-23.2 0-11.6 12-23.2 0Z" fill="var(--p-500)" />
        <path d="M96 115h185M78 146h221" stroke="var(--c-canvas)" strokeOpacity=".3" strokeWidth="1.4" />
      </g>

      <g stroke="var(--c-600)" strokeWidth="1.5">
        <ellipse cx="65" cy="293" rx="19" ry="3" fill="var(--c-ink)" fillOpacity=".09" stroke="none" />
        <path d="M65 270c-2-15-1-29 3-44m-4 28-11-13m13 1 10-16" />
        <path d="M64 249c-13-1-19-9-18-19 11 1 18 8 18 19Zm3-14c-3-14 2-23 13-28 2 13-3 24-13 28Zm1-5c-9-5-12-14-8-22 8 6 11 13 8 22Z" fill="var(--c-mist)" />
        <path d="M46 267h38l-6 24H52Z" fill={paper} />
        <path d="M46 267h38v5H46Z" fill="var(--c-mist)" />
        <path d="m54 277 2 10m24-12-3 13" stroke="var(--c-mist)" strokeWidth="1.4" />
      </g>

      {/* Keep the motion hook untransformed; the paper's resting angle belongs inside it. */}
      <g data-closing-note="">
        <g transform="rotate(7 337 237)" stroke="var(--c-600)" strokeWidth="1.5">
          <path d="M286 168h93l15 16v113H286Z" fill="var(--c-ink)" stroke="none" filter={`url(#${shadowId})`} />
          <path d="M289 170h94l13 15v110H289Z" fill="var(--c-mist)" />
          <path d="M293 291h96m3-98v89" stroke="var(--c-canvas)" strokeWidth="1.4" />
          <path d="M281 163h91l16 17v110H281Z" fill={paper} />
          <path d="M372 163v14a3 3 0 0 0 3 3h13Z" fill="var(--c-mist)" />
          <path d="M285 195v-25h79M285 284h94" stroke="var(--c-canvas)" strokeWidth="1.4" />
          <path d="M296 183h47" stroke="var(--p-500)" strokeWidth="1.8" />
          <path d="M296 193h65" strokeOpacity=".25" strokeWidth="1.4" />
          <path d="M291 205h87" strokeOpacity=".24" strokeDasharray="2 5" strokeWidth="1.4" />
          <rect x="297" y="219" width="26" height="26" rx="4" fill="var(--c-ink)" stroke="none" filter={`url(#${contactId})`} />
          <rect x="295" y="217" width="26" height="26" rx="4" fill="var(--s-success-600)" fillOpacity=".1" stroke="var(--s-success-600)" />
          <path d="m302 230 5 5 9-12" stroke="var(--s-success-600)" strokeWidth="1.8" />
          <path d="M333 224h33m-33 10h24M296 260h68m-68 10h43" strokeOpacity=".45" />
        </g>
      </g>
    </svg>
  );
}
