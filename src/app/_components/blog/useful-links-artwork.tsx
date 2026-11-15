import { useId } from "react";
import { Icon } from "@/components/ui/icon";

/** A few useful things to take with you: a folded map, saved pages and a booking. */
export function UsefulLinksArtwork() {
  const id = useId();
  const paperId = `resources-paper-${id}`;
  const foldId = `resources-fold-${id}`;
  const ticketId = `resources-ticket-${id}`;
  const shadowId = `resources-shadow-${id}`;
  const contactId = `resources-contact-${id}`;
  const mapClipId = `resources-map-${id}`;
  const paper = `url(#${paperId})`;
  const fold = `url(#${foldId})`;
  const shadow = `url(#${shadowId})`;
  const contact = `url(#${contactId})`;
  const mapShape = "M87 112 179 94 270 113 355 95 369 254 284 273 193 254 101 273Z";

  return (
    <svg
      width="500"
      height="340"
      viewBox="0 0 500 340"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-useful-links-artwork=""
    >
      <defs>
        <linearGradient id={paperId} x1="0%" y1="0%" x2="85%" y2="100%">
          <stop stopColor="var(--c-canvas)" />
          <stop offset="1" stopColor="var(--c-mist)" />
        </linearGradient>
        <linearGradient id={foldId} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop stopColor="var(--c-ink)" stopOpacity=".045" />
          <stop offset=".52" stopColor="var(--c-ink)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--c-canvas)" stopOpacity=".5" />
        </linearGradient>
        <linearGradient id={ticketId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="var(--p-500)" />
          <stop offset="1" stopColor="var(--p-700)" />
        </linearGradient>
        <filter id={shadowId} x="-60" y="-60" width="620" height="460" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
          <feOffset dx="2" dy="7" result="shade" />
          <feFlood floodColor="var(--c-ink)" floodOpacity=".12" />
          <feComposite in2="shade" operator="in" />
        </filter>
        <filter id={contactId} x="-60" y="-60" width="620" height="460" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.3" />
          <feOffset dx="1" dy="2.5" result="shade" />
          <feFlood floodColor="var(--c-ink)" floodOpacity=".16" />
          <feComposite in2="shade" operator="in" />
        </filter>
        <clipPath id={mapClipId}>
          <path d={mapShape} />
        </clipPath>
      </defs>

      <ellipse cx="252" cy="301" rx="184" ry="6" fill="var(--c-ink)" fillOpacity=".035" />
      <path d="M46 308h406m-383 7h31m292 0h20" stroke="var(--c-ink)" strokeOpacity=".1" strokeWidth="1.3" />

      {/* Saved sheets sit behind the map, with exposed paper edges and a ribbon. */}
      <g transform="rotate(10 323 139)" stroke="var(--c-600)" strokeWidth="1.5">
        <path d="M267 50h116l15 15v161H267Z" fill="var(--c-ink)" stroke="none" filter={shadow} />
        <path d="M265 46h116l14 14v162H265Z" fill="var(--c-mist)" />
        <path d="M261 42h116l14 14v162H261Z" fill="var(--c-canvas)" />
        <path d="M257 38h115l15 15v161H257Z" fill={paper} />
        <path d="M372 38v11a4 4 0 0 0 4 4h11Z" fill="var(--c-mist)" />
        <path d="M261 74V42h103m17 19v143h-15" stroke="var(--c-canvas)" strokeOpacity=".9" strokeWidth="1.2" />
        <path d="M277 67h42m-42 10h31" strokeOpacity=".45" strokeWidth="1.6" />
        <path d="M277 98h73m-73 11h61m-61 11h69m-69 11h45m-45 27h73m-73 11h62" strokeOpacity=".22" strokeWidth="1.3" />
        <path d="M337 38v50l11-9 11 9V38" fill="var(--p-500)" stroke="var(--p-700)" strokeWidth="1.3" />
        <path d="M341 42v33" stroke="var(--c-canvas)" strokeOpacity=".35" strokeWidth="1.1" />
      </g>

      {/* The accordion folds carry a quiet street grid and one useful route. */}
      <g transform="rotate(-5 228 186)">
        <path d={mapShape} fill="var(--c-ink)" filter={shadow} />
        <path d="M87 117 179 99 270 118 355 100 370 260 284 279 193 260 101 279Z" fill="var(--c-mist)" stroke="var(--c-600)" strokeWidth="1.5" />
        <path d={mapShape} fill={paper} stroke="var(--c-600)" strokeWidth="1.6" />
        <path d="M179 94 270 113 284 273 193 254Z" fill="var(--c-canvas)" fillOpacity=".75" />
        <path d="M179 94 270 113 284 273 193 254Z" fill={fold} />

        <g clipPath={`url(#${mapClipId})`}>
          <g fill="var(--c-mist)" fillOpacity=".6">
            <path d="m101 131 37-7 3 34-37 7Zm6 53 37-7 3 35-37 8Zm43-62 18-3 3 34-18 4Zm51-2 35 8 3 34-35-7Zm48 11 10 2 3 34-10-2Zm-42 40 35 7 3 34-35-7Zm76-40 32-7 3 34-32 7Zm46-10 17-4 3 34-17 4Zm-41 61 32-8 3 34-32 7Zm46-11 17-3 3 34-17 3Z" />
          </g>
          <g stroke="var(--c-600)" strokeOpacity=".2" strokeWidth="1.2">
            <path d="m97 173 81-17 89 18 94-20M102 226l82-18 90 19 92-21M147 104l14 161m76-161 14 163m66-166 14 163" />
            <path d="m95 180 83-17 89 18 95-20M103 233l81-18 90 19 93-21M155 103l14 161m76-159 14 164m66-170 14 163" />
          </g>
          <path d="m126 237 24-5c9-2 10-11 17-15s14-3 21-2l35 7c12 2 21-4 20-16l-1-7c-1-10 5-15 14-13l13 2c10 1 16-3 15-12l-1-9c-1-7 4-12 11-13l24-5" stroke="var(--c-canvas)" strokeWidth="6" />
          <path d="m126 237 24-5c9-2 10-11 17-15s14-3 21-2l35 7c12 2 21-4 20-16l-1-7c-1-10 5-15 14-13l13 2c10 1 16-3 15-12l-1-9c-1-7 4-12 11-13l24-5" stroke="var(--p-500)" strokeOpacity=".9" strokeWidth="2.1" strokeDasharray="3 6" />
          <circle cx="126" cy="237" r="4" fill="var(--c-canvas)" stroke="var(--p-500)" strokeWidth="1.7" />
          <path d="m110 261 67-13m119 16 62-14" stroke="var(--c-600)" strokeOpacity=".22" strokeWidth="1.2" />
        </g>

        <path d="m179 94 14 160m77-141 14 160" stroke="var(--c-600)" strokeOpacity=".5" strokeWidth="1.3" />
        <path d="m182 100 13 148m78-129 13 147M92 118l82-17m102 17 74-16" stroke="var(--c-canvas)" strokeOpacity=".9" strokeWidth="1.2" />
        <g transform="translate(303 122)">
          <Icon name="pinSolid" size={30} color="var(--p-500)" />
        </g>
      </g>

      {/* A directional ticket lends the scene its one substantial terracotta note. */}
      <g transform="rotate(-9 113 253)" strokeWidth="1.4">
        <path d="M44 226h113l15 15v45H44Z" fill="var(--c-ink)" filter={shadow} />
        <path d="M42 223h113l15 15v45H42Z" fill={`url(#${ticketId})`} stroke="var(--p-700)" />
        <path d="M155 223v11a4 4 0 0 0 4 4h11Z" fill="var(--p-500)" stroke="var(--p-700)" />
        <path d="M47 243v-15h99m-96 50h104" stroke="var(--c-canvas)" strokeOpacity=".25" strokeWidth="1.1" />
        <circle cx="60" cy="253" r="4" fill="var(--c-canvas)" fillOpacity=".9" stroke="var(--p-700)" strokeWidth="1.1" />
        <path d="M76 248h23m-23 9h16" stroke="var(--c-canvas)" strokeOpacity=".55" strokeWidth="1.6" />
        <g transform="translate(116 238)">
          <Icon name="arrowR" size={30} color="var(--c-canvas)" />
        </g>
      </g>

      {/* A little appointment card rests on the map rather than floating above it. */}
      <g transform="rotate(7 376 254)" stroke="var(--c-600)" strokeWidth="1.5">
        <rect x="324" y="212" width="113" height="89" rx="5" fill="var(--c-ink)" stroke="none" filter={shadow} />
        <rect x="324" y="212" width="113" height="89" rx="5" fill="var(--c-mist)" />
        <rect x="321" y="208" width="113" height="89" rx="5" fill="var(--c-ink)" stroke="none" filter={contact} />
        <rect x="321" y="208" width="113" height="89" rx="5" fill={paper} />
        <path d="M326 208h103a5 5 0 0 1 5 5v16H321v-16a5 5 0 0 1 5-5Z" fill="var(--c-mist)" fillOpacity=".65" stroke="none" />
        <path d="M321 229h113" strokeOpacity=".4" strokeWidth="1.2" />
        <path d="M328 221v-8h15m73 79h10a3 3 0 0 0 3-3v-48" stroke="var(--c-canvas)" strokeOpacity=".85" strokeWidth="1.1" />
        <rect x="342" y="200" width="6" height="18" rx="3" fill="var(--c-canvas)" />
        <rect x="406" y="200" width="6" height="18" rx="3" fill="var(--c-canvas)" />
        <path d="M339 245h10m11 0h10m-31 13h10m11 0h10m-31 13h10m11 0h10" strokeOpacity=".3" strokeWidth="2" />
        <rect x="386" y="244" width="31" height="31" rx="4" fill="var(--p-500)" fillOpacity=".06" stroke="var(--p-500)" strokeOpacity=".45" strokeWidth="1.2" />
        <g transform="translate(390 248)">
          <Icon name="check" size={23} color="var(--p-500)" />
        </g>
        <path d="M339 286h63" strokeOpacity=".2" strokeWidth="1.2" />
      </g>
    </svg>
  );
}
