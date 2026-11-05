import { useId } from "react";
import { Icon } from "@/components/ui/icon";

/** A small paper guide, with a question tucked in and an answer to keep. */
export function FaqArtwork() {
  const id = useId();
  const paperId = `faq-paper-${id}`;
  const shadowId = `faq-shadow-${id}`;
  const contactId = `faq-contact-${id}`;
  const paper = `url(#${paperId})`;
  const shadow = `url(#${shadowId})`;
  const contact = `url(#${contactId})`;

  return (
    <svg width="220" height="156" viewBox="0 0 220 156" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" data-faq-artwork="">
      <defs>
        <linearGradient id={paperId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="var(--c-canvas)" />
          <stop offset="1" stopColor="oklch(96% .012 78)" />
        </linearGradient>
        <filter id={shadowId} filterUnits="userSpaceOnUse" x="-12" y="-12" width="244" height="184" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.4" />
          <feOffset dx="1.2" dy="3.2" result="shade" />
          <feFlood floodColor="#594536" floodOpacity=".15" />
          <feComposite in2="shade" operator="in" />
        </filter>
        <filter id={contactId} filterUnits="userSpaceOnUse" x="-12" y="-12" width="244" height="184" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation=".8" />
          <feOffset dx=".6" dy="1.6" result="shade" />
          <feFlood floodColor="#594536" floodOpacity=".19" />
          <feComposite in2="shade" operator="in" />
        </filter>
      </defs>

      <ellipse cx="112" cy="141" rx="78" ry="3" fill="var(--c-ink)" fillOpacity=".035" />
      <path d="M21 143h180" stroke="var(--c-ink)" strokeOpacity=".09" strokeWidth="1.2" />

      <g data-art-object="" stroke="var(--c-600)" strokeWidth="1.5">
        {/* The cover and exposed page edges give the open guide its weight. */}
        <path d="M31 51c23-11 48-10 72 1 23-15 49-15 73-6v82c-25-9-49-1-73 11-23-12-47-16-72-7Z" fill="var(--c-ink)" stroke="none" filter={shadow} />
        <path d="M30 48c24-11 49-10 73 1 23-15 49-15 73-6v83c-25-9-49-1-73 11-23-12-48-16-73-7Z" fill="var(--c-mist)" />
        <path d="M35 124c23-8 45-4 68 8 22-13 45-19 68-12M36 120c22-7 45-2 67 9" strokeOpacity=".27" strokeWidth="1" />
        <path d="M34 44c23-10 47-8 69 2v84c-22-12-46-16-69-6Z" fill={paper} />
        <path d="M103 46c23-14 46-15 68-6v79c-23-8-46-1-68 11Z" fill={paper} />
        <path d="M103 46c3-2 6-4 9-5v84l-9 5Z" fill="var(--c-ink)" fillOpacity=".035" stroke="none" />
        <path d="M99 50v72m9-74v74" stroke="var(--c-canvas)" strokeOpacity=".85" strokeWidth="1.2" />
        <path d="M39 78V48m74-2c16-8 34-10 52-4" stroke="oklch(99.5% .003 85)" strokeOpacity=".85" strokeWidth="1.1" />
        <path d="M45 83c13-2 26 0 40 5m-40 6c17-2 31 1 46 7m-46 5c12-1 23 1 34 4" strokeOpacity=".36" strokeWidth="1.4" />
        <path d="M120 58c12-5 24-6 37-3m-37 14c12-5 24-6 37-3m-37 14c8-3 16-5 24-4" strokeOpacity=".38" strokeWidth="1.4" />
        <path d="M147 35v24l6-5 6 4V36" fill="var(--p-500)" stroke="var(--p-700)" strokeWidth="1.1" />
        <path d="M150 37v14" stroke="var(--c-canvas)" strokeOpacity=".4" strokeWidth="1" />
      </g>

      <g data-art-detail="" transform="rotate(-9 62 47)" stroke="var(--p-700)" strokeWidth="1.4">
        <path d="M37 20h43l11 11v35H62L49 76V66H37Z" fill="var(--c-ink)" stroke="none" filter={contact} />
        <path d="M34 17h43l11 11v35H59L46 73V63H34Z" fill="var(--p-500)" />
        <path d="M77 17v8a3 3 0 0 0 3 3h8Z" fill="var(--p-400)" />
        <path d="M38 36V22h32m-19 43 6-5h23" stroke="var(--c-canvas)" strokeOpacity=".3" strokeWidth="1" />
        <path d="M52 34a8 8 0 0 1 15 3c0 5-7 6-7 11" stroke="var(--c-canvas)" strokeWidth="2.2" />
        <path d="M60 54h.01" stroke="var(--c-canvas)" strokeWidth="3" />
      </g>

      <g data-art-detail="" transform="rotate(6 161 110)" stroke="var(--c-600)" strokeWidth="1.4">
        <path d="M132 89h59v40h-10v9l-12-9h-37Z" fill="var(--c-ink)" stroke="none" filter={contact} />
        <path d="M130 87h59v40h-10v9l-12-9h-37Z" fill="var(--c-mist)" />
        <path d="M127 84h59v40h-10v9l-12-9h-37Z" fill={paper} />
        <path d="M131 98V88h48m-45 33h27" stroke="oklch(99.5% .003 85)" strokeOpacity=".9" strokeWidth="1.1" />
        <g transform="translate(133 91)"><Icon name="check" size={23} color="var(--p-500)" /></g>
        <path d="M162 99h13m-13 7h9M137 116h38" strokeOpacity=".36" strokeWidth="1.3" />
      </g>
    </svg>
  );
}
