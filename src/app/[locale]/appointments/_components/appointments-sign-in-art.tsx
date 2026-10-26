/** A local appointment studio, with a clock and a calendar by the door. */
export function AppointmentsSignInArt() {
  return (
    <svg
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
        <path d="M5 190h326M24 198h29m17 0h10m109 0h18m59 0h35" />
      </g>

      {/* Warm stone neighbors frame the studio, as in the other streetscapes. */}
      <g stroke="var(--c-600)" strokeWidth="1.4">
        <path d="M26 189V84h60v105M22 84h68M31 84V67h50v17" fill="var(--c-mist)" />
        <path d="M37 98h13v23H37zM62 98h13v23H62z" fill="var(--c-canvas)" />
        <path d="M46 189v-38a10 10 0 0 1 20 0v38m-10-33v33m-4-22v5" />
        <path
          d="M37 106h13m12 0h13M31 127h23m5 0h22M26 134h60"
          stroke="var(--c-ink)"
          strokeOpacity="0.11"
        />
        <path d="M252 189V101h58v88M248 101h66M257 101V85h48v16" fill="var(--c-mist)" />
        <path d="M263 114h13v23h-13zM286 114h13v23h-13z" fill="var(--c-canvas)" />
        <path d="M263 189v-34h13v34m10 0v-34h13v34" />
        <path
          d="M263 122h13m10 0h13M257 143h22m3 0h23M252 149h58"
          stroke="var(--c-ink)"
          strokeOpacity="0.11"
        />
      </g>

      <g stroke="var(--p-500)" strokeWidth="1.7">
        <path d="M104 189V93h132v96" fill="var(--c-canvas)" />
        <path d="M104 189V93h132v96" fill="var(--p-500)" fillOpacity="0.04" stroke="none" />
        <path d="M99 93h142M110 93V83h120v10" fill="var(--c-canvas)" />
        <path d="M112 101h116" strokeWidth="1.4" strokeOpacity="0.25" />

        {/* A clock crowns the facade; no date or appointment is implied. */}
        <circle cx="170" cy="66" r="19" fill="var(--c-canvas)" />
        <path d="M170 53v3m13 10h-3m-10 13v-3m-13-10h3" strokeWidth="1.4" strokeOpacity="0.5" />
        <path d="M170 59v7l7 5" />

        <path d="M120 189v-52a21 21 0 0 1 42 0v52" fill="var(--c-canvas)" />
        <path d="M120 140h42m-21-24v24m-15-15 15 15 15-15M154 166v6" strokeWidth="1.4" />
        <path d="M115 190h52m-55 6h58" strokeWidth="1.4" />

        {/* A small hanging calendar identifies the appointments collection. */}
        <rect x="181" y="119" width="42" height="43" rx="3" fill="var(--c-canvas)" />
        <path d="M181 132h42m-32-17v9m22-9v9" strokeWidth="1.4" />
        <path
          d="M190 140h3m7 0h3m7 0h3m-23 13h3m7 0h3m7 0h3"
          strokeWidth="1.4"
          strokeOpacity="0.4"
        />
        <circle cx="201.5" cy="140" r="4.5" fill="var(--c-canvas)" strokeWidth="1.4" />
        <path d="M187 173h30" strokeWidth="1.4" strokeOpacity="0.25" />
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
