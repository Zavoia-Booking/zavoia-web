/** Warm paper and an unwritten conversation, matching the marketplace linework. */
export function ProfessionalReviewsEmptyArt() {
  return (
    <svg
      width="300"
      height="180"
      viewBox="0 0 300 180"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="var(--c-ink)" strokeOpacity="0.11" strokeWidth="1.4">
        <path d="M22 157h256M39 165h25m11 0h10m98 0h31m10 0h18" />
      </g>

      {/* The back sheet has a stitched margin and a softly turned corner. */}
      <g transform="rotate(-7 137 92)" stroke="var(--c-600)" strokeWidth="1.3">
        <path d="M86 35h104a8 8 0 0 1 8 8v96l-17 17H86a8 8 0 0 1-8-8V43a8 8 0 0 1 8-8Z" fill="var(--c-mist)" />
        <path d="M92 48h89M92 56h54" strokeOpacity="0.25" />
        <path d="M88 71v64" strokeOpacity="0.22" strokeDasharray="2 5" />
        <path d="M181 156v-11a6 6 0 0 1 6-6h11" fill="var(--c-canvas)" />
      </g>

      {/* An open speech panel waits for a real visit and a real voice. */}
      <g stroke="var(--p-500)" strokeWidth="1.6">
        <path d="M123 57h110a9 9 0 0 1 9 9v66a9 9 0 0 1-9 9h-67l-20 14v-14h-23a9 9 0 0 1-9-9V66a9 9 0 0 1 9-9Z" fill="var(--c-canvas)" />
        <path d="M123 57h110a9 9 0 0 1 9 9v29H114V66a9 9 0 0 1 9-9Z" fill="var(--p-500)" fillOpacity="0.055" stroke="none" />
        <path d="M114 96h128" strokeOpacity="0.2" strokeWidth="1.2" />

        {/* Outline stars are a motif, never an invented rating. */}
        {[134, 156, 178, 200, 222].map((x) => (
          <path
            key={x}
            transform={`translate(${x} 78)`}
            d="m0-7 2.15 4.36 4.81.7-3.48 3.39.82 4.79L0 3.98l-4.3 2.26.82-4.79-3.48-3.39 4.81-.7L0-7Z"
            fill="var(--c-canvas)"
            strokeWidth="1.2"
          />
        ))}

        <path d="M130 111h96m-96 10h73" strokeWidth="1.3" strokeOpacity="0.3" />
        <path d="M209 121h12" strokeWidth="1.3" strokeOpacity="0.16" />
      </g>

      {/* A desk plant and a laid-down pencil give the paper a quiet setting. */}
      <g stroke="var(--c-600)" strokeWidth="1.3">
        <path d="M36 137h29l-4 20H40l-4-20Z" fill="var(--c-mist)" />
        <path d="M34 137h33m-27 7h21" strokeOpacity="0.4" />
        <path d="M50 136v-31m0 15c-11-1-16-9-13-16 8 1 13 7 13 16Zm0-7c0-11 5-18 12-20 4 8-1 18-12 20Z" fill="var(--c-canvas)" />
        <path d="M50 128c5-6 10-8 15-6-1 7-7 11-15 10" fill="var(--c-canvas)" />
      </g>
      <g transform="rotate(27 259 130)" stroke="var(--p-500)" strokeWidth="1.3">
        <path d="M255 105a4 4 0 0 1 8 0v40l-4 9-4-9v-40Z" fill="var(--c-canvas)" />
        <path d="M255 111h8m-8 5h8m-4 0v29m-4 0h8m-4 9v-4" />
        <path d="M256 105a3 3 0 0 1 6 0v6h-6v-6Z" fill="var(--p-500)" fillOpacity="0.08" stroke="none" />
      </g>
    </svg>
  );
}
