import styles from "./booking-drawer.module.css";

/**
 * The Appointments page's empty calendar, now with the visit on it: the day
 * filled and ticked once confirmed, ringed around a clock while the venue
 * reviews the request.
 */
export function BookingSuccessArt({ pending }: { pending: boolean }) {
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
        <path d="M6 190h324M22 198h29m14 0h12m66 0h40m61 0h26m10 0h16" />
      </g>

      {/* Stone neighbors, as in the Saved and Appointments streetscapes. */}
      <g stroke="var(--c-600)" strokeWidth="1.4">
        <path d="M27 189V90h58v99M23 90h66M32 90V74h48v16" fill="var(--c-mist)" />
        <path d="M38 103h13v23H38zM61 103h13v23H61z" fill="var(--c-canvas)" />
        <path d="M38 111h13m10 0h13M46 189v-34a10 10 0 0 1 20 0v34m-10-29v29m-4-19v5" />
        <path d="M32 134h22m4 0h21M27 140h58" strokeOpacity="0.2" />
        <path d="M251 189v-78h58v78M246 111h68M256 111V95h48v16" fill="var(--c-mist)" />
        <path d="M262 123h13v22h-13zM285 123h13v22h-13z" fill="var(--c-canvas)" />
        <path d="M262 131h13m10 0h13M262 189v-28h13v28m10 0v-28h13v28" />
        <path d="M256 151h22m3 0h23M251 156h58" strokeOpacity="0.2" />
      </g>

      <g stroke="var(--p-500)" strokeWidth="1.7">
        <rect x="105" y="78" width="132" height="111" rx="9" fill="var(--c-canvas)" />
        <rect x="105" y="78" width="132" height="111" rx="9" fill="var(--p-500)" fillOpacity="0.07" stroke="none" />
        <path d="M113 185h109a11 11 0 0 0 11-11" strokeWidth="1.2" strokeOpacity="0.3" />

        <path
          d="M108 70h116a9 9 0 0 1 9 9v85l-20 20H108a9 9 0 0 1-9-9V79a9 9 0 0 1 9-9Z"
          fill="var(--c-canvas)"
        />
        <path d="M108 70h116a9 9 0 0 1 9 9v22H99V79a9 9 0 0 1 9-9Z" fill="var(--p-500)" fillOpacity="0.07" stroke="none" />
        <path d="M99 101h134" strokeWidth="1.4" />

        <path d="M120 85h12m68 0h12" strokeWidth="1.4" strokeOpacity="0.25" />
        <rect x="122" y="58" width="8" height="27" rx="4" fill="var(--c-canvas)" />
        <rect x="202" y="58" width="8" height="27" rx="4" fill="var(--c-canvas)" />
        <path d="M154 86h24" strokeWidth="1.4" strokeOpacity="0.35" />

        {/* A confirmed day glows through the grid around it. */}
        {!pending && (
          <circle
            className={styles.artGlow}
            cx="182"
            cy="135.5"
            r="13.5"
            fill="var(--p-500)"
            fillOpacity="0.12"
            stroke="none"
          />
        )}
        <g strokeWidth="1" strokeOpacity="0.25" fill="var(--p-500)" fillOpacity="0.025">
          {[115, 132, 149, 166].map((y) =>
            [114, 130, 146, 162, 178, 194, 210].map((x) =>
              x === 178 && y === 132 ? null : (
                <rect key={x + "-" + y} x={x} y={y} width="8" height="7" rx="1.6" />
              ),
            ),
          )}
        </g>

        {pending ? (
          <g className={styles.artMark}>
            <circle cx="182" cy="135.5" r="9.5" fill="var(--c-canvas)" strokeWidth="1.4" strokeDasharray="2.6 2.4" />
            <path d="M182 131v4.5l3 2" strokeWidth="1.4" />
          </g>
        ) : (
          <g className={styles.artMark}>
            <circle cx="182" cy="135.5" r="9.5" fill="var(--p-500)" stroke="none" />
            <path
              className={styles.artCheck}
              d="M177.6 135.7l3 3 5.6-6.4"
              stroke="var(--c-canvas)"
              strokeWidth="1.8"
              pathLength={1}
            />
          </g>
        )}

        <path d="M213 184v-13a7 7 0 0 1 7-7h13l-20 20Z" fill="var(--c-canvas)" />
        <path d="M213 184v-13a7 7 0 0 1 7-7h13l-20 20Z" fill="var(--p-500)" fillOpacity="0.08" stroke="none" />
      </g>

      <g stroke="var(--c-600)" strokeWidth="1.4">
        <path d="M8 176h14l-2 13H10l-2-13Z" fill="var(--c-mist)" />
        <path d="M15 175v-19m0 11c-7 0-10-6-8-10 5 0 8 4 8 10Zm0-3c0-7 3-11 7-12 2 5-1 11-7 12Z" fill="var(--c-canvas)" />
        <path d="M317 176h14l-2 13h-10l-2-13Z" fill="var(--c-mist)" />
        <path d="M324 175v-17m0 10c-7 0-10-6-8-10 5 0 8 4 8 10Zm0-4c0-7 3-11 7-12 2 5-1 11-7 12Z" fill="var(--c-canvas)" />
      </g>
    </svg>
  );
}
