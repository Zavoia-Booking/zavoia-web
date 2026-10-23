/** A favorite local place with its door open, welcoming the user back. */
export function SavedSignInArt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="336"
      height="168"
      viewBox="0 40 336 168"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="var(--c-ink)" strokeOpacity="0.11" strokeWidth="1.5">
        <path d="M5 190h326M24 198h29m17 0h10m65 0h41m80 0h35" />
      </g>

      {/* Quiet neighboring buildings keep the heart and open door in focus. */}
      <g stroke="var(--c-600)" strokeWidth="1.4">
        <path d="M26 189V94h61v95M22 94h69M32 94V78h49v16" fill="var(--c-mist)" />
        <path
          d="M37 108h14v23H37zM62 108h14v23H62z"
          fill="var(--c-canvas)"
        />
        <path d="M37 189v-39h14v39m11 0v-39h14v39" />
        <path
          d="M37 116h14m11 0h14M32 137h24m4 0h22M26 143h61"
          stroke="var(--c-ink)"
          strokeOpacity="0.11"
        />
        <path d="M251 189V84h59v105M247 84h67M257 84V66h47v18" fill="var(--c-mist)" />
        <path d="M262 98h13v23h-13zM286 98h13v23h-13z" fill="var(--c-canvas)" />
        <path d="M271 189v-38a10 10 0 0 1 20 0v38m-10-33v33m-4-22v5" />
        <path
          d="M262 106h13m11 0h13M257 127h22m3 0h22M251 134h59"
          stroke="var(--c-ink)"
          strokeOpacity="0.11"
        />
      </g>

      {/* The favorite storefront carries the same striped awning as Home. */}
      <g stroke="var(--p-500)" strokeWidth="1.7">
        <path d="M105 189v-68h130v68" fill="var(--c-canvas)" />
        <path d="M105 189v-68h130v68" fill="var(--p-500)" fillOpacity="0.04" stroke="none" />
        <path d="M111 103V85h118v18" fill="var(--c-canvas)" />
        <path d="M113 103h114l12 24H101l12-24Z" fill="var(--c-canvas)" />
        <path
          d="M113 103h23l-8 24h-27l12-24ZM159 103h22l3 24h-28l3-24ZM204 103h23l12 24h-27l-8-24Z"
          fill="var(--p-500)"
          fillOpacity="0.12"
          stroke="none"
        />
        <path
          d="M101 127v5c0 11 27 11 27 0v-5m0 5c0 11 28 11 28 0v-5m0 5c0 11 28 11 28 0v-5m0 5c0 11 28 11 28 0v-5m0 5c0 11 27 11 27 0v-5"
          fill="var(--c-canvas)"
        />
        <path d="m136 103-8 24m31-24-3 24m25-24 3 24m20-24 8 24M146 94h48" strokeWidth="1.4" />
        <path d="M117 151h43v26h-43z" fill="var(--c-canvas)" />
        <path d="m125 169 11-11m-2 13 10-10" strokeWidth="1.4" />

        {/* A door held open gives the sign-in screen a welcoming gesture. */}
        <path d="M180 189v-38h39v38" fill="var(--c-mist)" />
        <path d="M180 151l25-8v39l-25 7v-38Z" fill="var(--c-canvas)" />
        <path d="M198 163v5M176 190h47m-50 6h53" strokeWidth="1.4" />
        <path
          d="M170 77s-15-9-15-18a8 8 0 0 1 15-4 8 8 0 0 1 15 4c0 9-15 18-15 18Z"
          fill="var(--c-canvas)"
        />
      </g>

      <g stroke="var(--c-600)" strokeWidth="1.4">
        <path d="M6 176h13l-2 13H8l-2-13Z" fill="var(--c-mist)" />
        <path
          d="M12 176v-18m0 10c-7 0-10-6-8-10 5 0 8 4 8 10Zm1-4c0-7 3-11 7-12 2 5-1 11-7 12Z"
          fill="var(--c-canvas)"
        />
        <path d="M319 176h12l-2 13h-8l-2-13Z" fill="var(--c-mist)" />
        <path
          d="M325 176v-16m0 7c-7 0-9-5-8-9 5 0 8 4 8 9Zm0-3c0-6 3-10 7-11 2 5-1 10-7 11Z"
          fill="var(--c-canvas)"
        />
      </g>
    </svg>
  );
}
