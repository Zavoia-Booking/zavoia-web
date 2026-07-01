import type { CSSProperties, ReactElement, SVGProps } from "react";

// Ported 1:1 from docs/icons.jsx (ICONS map). Each entry is the inner
// SVG content rendered inside a 24x24 viewBox. SVG attrs converted to
// React camelCase. googleG keeps its hardcoded brand colors.
const ICONS = {
  back: (
    <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  share: (
    <path d="M12 3v12M8 7l4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  heart: (
    <path d="M12 20.5s-7.5-4.5-9.5-9.5C1 7 4 4 7 4c2 0 3.5 1 5 2.5C13.5 5 15 4 17 4c3 0 6 3 4.5 7-2 5-9.5 9.5-9.5 9.5z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  ),
  heartO: (
    <path d="M12 20.5s-7.5-4.5-9.5-9.5C1 7 4 4 7 4c2 0 3.5 1 5 2.5C13.5 5 15 4 17 4c3 0 6 3 4.5 7-2 5-9.5 9.5-9.5 9.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  ),
  phone: (
    <path d="M5 4h3l2 5-2 1a11 11 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
  ),
  pin: (
    <>
      <path d="M12 22s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </>
  ),
  nav: (
    <path d="M3 11l18-7-7 18-2-8-9-3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
  ),
  star: (
    <path d="M12 3l2.6 5.8 6.4.6-4.8 4.4 1.4 6.3L12 17l-5.6 3 1.4-6.3L3 9.4l6.4-.6L12 3z" fill="currentColor" />
  ),
  starO: (
    <path d="M12 3l2.6 5.8 6.4.6-4.8 4.4 1.4 6.3L12 17l-5.6 3 1.4-6.3L3 9.4l6.4-.6L12 3z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  ),
  starHalf: (
    <>
      <path d="M12 3l2.6 5.8 6.4.6-4.8 4.4 1.4 6.3L12 17l-5.6 3 1.4-6.3L3 9.4l6.4-.6L12 3z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 3v14L6.4 20l1.4-6.3L3 9.4l6.4-.6L12 3z" fill="currentColor" />
    </>
  ),
  plus: (
    <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  ),
  check: (
    <path d="M5 12l4 4 10-10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  x: (
    <path d="M6 6l12 12M6 18L18 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  ),
  expand: (
    <path d="M15 4h5v5M20 4l-7 7M9 20H4v-5M4 20l7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  chevR: (
    <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  chevL: (
    <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  chevD: (
    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  chevU: (
    <path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  arrowUL: (
    <path d="M18 18L7 7M7 7v8M7 7h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  email: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 7l9 6 9-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </>
  ),
  ig: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </>
  ),
  tt: (
    <path d="M14 4v9a3 3 0 1 1-3-3v-2a5 5 0 1 0 5 5V8a6 6 0 0 0 4 1.5V7A4 4 0 0 1 16 4h-2z" fill="currentColor" />
  ),
  fb: (
    <path d="M13.4 21v-7h2.3l.4-2.9h-2.7V9.2c0-.85.27-1.43 1.49-1.43H16.2V5.16C15.9 5.12 14.96 5 13.86 5c-2.07 0-3.49 1.26-3.49 3.59v2.5H8v2.9h2.37V21h3.03z" fill="currentColor" />
  ),
  yt: (
    <>
      <rect x="2.8" y="6.2" width="18.4" height="11.6" rx="3.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10.4 9.4l4.7 2.6-4.7 2.6V9.4z" fill="currentColor" />
    </>
  ),
  pint: (
    <path d="M12 3a9 9 0 0 0-3.28 17.38c-.08-.73-.15-1.85.03-2.65.16-.69 1.06-4.5 1.06-4.5s-.27-.54-.27-1.34c0-1.26.73-2.2 1.63-2.2.77 0 1.14.58 1.14 1.27 0 .77-.49 1.92-.75 2.99-.21.9.45 1.62 1.34 1.62 1.6 0 2.84-1.69 2.84-4.13 0-2.16-1.55-3.67-3.77-3.67-2.57 0-4.08 1.92-4.08 3.91 0 .77.3 1.6.67 2.05a.27.27 0 0 1 .06.26c-.06.26-.21.86-.24.98-.04.16-.13.2-.29.12-1.1-.51-1.78-2.11-1.78-3.4 0-2.77 2.01-5.31 5.8-5.31 3.04 0 5.41 2.17 5.41 5.07 0 3.03-1.9 5.46-4.54 5.46-.89 0-1.72-.46-2-1.01l-.55 2.08c-.2.77-.73 1.73-1.09 2.32A9 9 0 1 0 12 3z" fill="currentColor" />
  ),
  lin: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="8" cy="8" r="1.05" fill="currentColor" />
      <path d="M8 10.6V16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11.6 16v-5.4M11.6 13.1c0-1.7 3-1.7 3 0V16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6" cy="7" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6" cy="17" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 9l12 11M8 15L20 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  filter: (
    <path d="M4 5h16l-6 8v6l-4-2v-4L4 5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </>
  ),
  list: (
    <path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15.5 15.5L20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  thumbUp: (
    <path d="M7 11v9H4v-9h3zm12 1l-3 7h-7v-9l4-6 1 1v4h5l-.8 5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  ),
  reply: (
    <path d="M10 9V5l-7 7 7 7v-4c5 0 8 2 10 5-1-7-5-11-10-11z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 10h18M16 14h2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </>
  ),
  wheelchair: (
    <>
      <circle cx="12" cy="5" r="2" fill="currentColor" />
      <path d="M11 9v6h6l3 4M11 12a5 5 0 105 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 15V5a1 1 0 011-1h10" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </>
  ),
  sparkle: (
    <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" fill="currentColor" />
  ),
  shield: (
    <>
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.5 12l2.5 2.5L16 9.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  warn: (
    <>
      <path d="M12 3L2 21h20L12 3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 10v5M12 18v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 11v6M12 7.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  dot: <circle cx="12" cy="12" r="4" fill="currentColor" />,
  drag: (
    <>
      <circle cx="9" cy="6" r="1.4" fill="currentColor" />
      <circle cx="15" cy="6" r="1.4" fill="currentColor" />
      <circle cx="9" cy="12" r="1.4" fill="currentColor" />
      <circle cx="15" cy="12" r="1.4" fill="currentColor" />
      <circle cx="9" cy="18" r="1.4" fill="currentColor" />
      <circle cx="15" cy="18" r="1.4" fill="currentColor" />
    </>
  ),
  bell: (
    <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16zM10 20a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  ),
  cal: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 3v4M16 3v4M3.5 10h17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h10M4 12h6M4 17h13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="17" cy="7" r="2" fill="currentColor" />
      <circle cx="13" cy="12" r="2" fill="currentColor" />
      <circle cx="20" cy="17" r="2" fill="currentColor" />
    </>
  ),
  home: (
    <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-9z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
  ),
  homeF: (
    <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-9z" fill="currentColor" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </>
  ),
  rebook: (
    <>
      <path d="M21 12a9 9 0 1 1-3-6.7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M21 4v5h-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  cross: (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 3v18M3 12h18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  flash: (
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill="currentColor" />
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 17l5-5-5-5M21 12H9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  pinSolid: (
    <>
      <path d="M12 22s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z" fill="currentColor" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" fill="#fff" />
    </>
  ),
  micro: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.45" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.45" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3 13l9 5 9-5M3 17l9 5 9-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" opacity="0.7" />
    </>
  ),
  car: (
    <>
      <path d="M3 13l2-6a2 2 0 0 1 2-1.4h10a2 2 0 0 1 2 1.4l2 6M3 13v5a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2h10v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-5M3 13h18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="7.5" cy="15.5" r="1.1" fill="currentColor" />
      <circle cx="16.5" cy="15.5" r="1.1" fill="currentColor" />
    </>
  ),
  tooth: (
    <path d="M8 3c-3 0-5 2-5 5 0 2 1 3 1.5 5l1 5c.3 1.4 1 3 2 3 1.2 0 1.5-1.5 2-3.5l.7-3c.2-1 .6-1.5 1.8-1.5s1.6.5 1.8 1.5l.7 3c.5 2 .8 3.5 2 3.5 1 0 1.7-1.6 2-3l1-5C20 11 21 10 21 8c0-3-2-5-5-5-1.5 0-2.5.6-4 .6S9.5 3 8 3z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  ),
  broom: (
    <>
      <path d="M14 3l-8 8M5 12l-2 7c-.2.7.5 1.4 1.2 1.2L11 18l-3-3-3-3z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M14 3l4 4-3 3-4-4 3-3zM10 13l1 2 2-2 2 1-2 3-3 3-3-3 3-4z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M3 9v6M6 6v12M18 6v12M21 9v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 12h12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  paw: (
    <>
      <circle cx="6" cy="10" r="1.8" fill="currentColor" />
      <circle cx="10" cy="6" r="1.8" fill="currentColor" />
      <circle cx="14" cy="6" r="1.8" fill="currentColor" />
      <circle cx="18" cy="10" r="1.8" fill="currentColor" />
      <path d="M12 11c-3 0-5.5 3-5.5 5.5 0 1.5 1.2 2.5 2.5 2.5 1 0 1.5-.5 3-.5s2 .5 3 .5c1.3 0 2.5-1 2.5-2.5 0-2.5-2.5-5.5-5.5-5.5z" fill="currentColor" />
    </>
  ),
  wrench: (
    <path d="M14.5 3.5a4 4 0 0 0-4.8 4.8L3 15l3 3 6.7-6.7a4 4 0 0 0 4.8-4.8L15 9l-2-2 1.5-3.5z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
  ),
  whatIcon: (
    <>
      <circle cx="11" cy="11" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15.5 15.5L20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  whereIcon: (
    <>
      <path d="M12 22s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.4" fill="currentColor" />
    </>
  ),
  whenIcon: (
    <>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 3.5v4M16 3.5v4M3.5 10.5h17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" />
    </>
  ),
  arrowR: (
    <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  arrowU: (
    <path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  link: (
    <>
      <path d="M9 15l6-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M11 7l1-1a3.5 3.5 0 0 1 5 5l-1.5 1.5M13 17l-1 1a3.5 3.5 0 0 1-5-5l1.5-1.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  bookmark: (
    <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  ),
  bookmarkO: (
    <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  ),
  xLogo: (
    <path d="M4 4l16 16M20 4L4 20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
  ),
  pencil: (
    <path d="M4 20l1-4L16 5l3 3L8 19l-4 1zM14 7l3 3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="15.5" r="1.4" fill="currentColor" />
    </>
  ),
  doc: (
    <>
      <path d="M6 3h8l4 4v14a0 0 0 0 1 0 0H6a0 0 0 0 1 0 0V3z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14 3v4h4M8.5 12h7M8.5 16h7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </>
  ),
  building: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  trash: (
    <>
      <path d="M5 7h14M10 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2M6.5 7l1 13a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1l1-13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  cookie: (
    <>
      <path d="M12 3a9 9 0 1 0 9 9 4 4 0 0 1-4-4 4 4 0 0 1-4-4 9 9 0 0 0-1 0z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="9" cy="13" r="1" fill="currentColor" />
      <circle cx="13" cy="16" r="1" fill="currentColor" />
      <circle cx="15" cy="11" r="1" fill="currentColor" />
    </>
  ),
  googleG: (
    <>
      <path d="M21 12.2c0-.7-.06-1.2-.18-1.8H12v3.4h5.1c-.1.9-.66 2.2-1.9 3.1l-.02.12 2.76 2.1.2.02C19.9 17.6 21 15.2 21 12.2z" fill="#4285F4" />
      <path d="M12 21c2.5 0 4.6-.8 6.1-2.2l-2.9-2.2c-.78.54-1.83.92-3.2.92-2.45 0-4.53-1.6-5.27-3.83l-.11.01-2.87 2.2-.04.1A9 9 0 0 0 12 21z" fill="#34A853" />
      <path d="M6.73 13.7A5.4 5.4 0 0 1 6.43 12c0-.6.11-1.18.29-1.7l-.005-.11-2.9-2.24-.095.045A9 9 0 0 0 3 12c0 1.45.35 2.82.96 4.03l2.77-2.33z" fill="#FBBC05" />
      <path d="M12 6.47c1.74 0 2.9.75 3.57 1.37l2.6-2.54C16.6 3.8 14.5 3 12 3a9 9 0 0 0-8.04 4.97l2.76 2.33C7.47 8.07 9.55 6.47 12 6.47z" fill="#EA4335" />
    </>
  ),
} satisfies Record<string, ReactElement>;

export type IconName = keyof typeof ICONS;

export const ICON_NAMES = Object.keys(ICONS) as IconName[];

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name" | "color"> {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 20, color, style, ...rest }: IconProps) {
  const path = ICONS[name];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ color: color || "currentColor", display: "block", flexShrink: 0, ...style }}
      aria-hidden="true"
      {...rest}
    >
      {path}
    </svg>
  );
}
