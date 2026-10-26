/** A personal key to a local place, in the marketplace's streetscape style. */
export function AccountAccessArt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="336"
      height="176"
      viewBox="0 32 336 176"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="var(--c-ink)" strokeOpacity="0.11" strokeWidth="1.5">
        <path d="M12 190h312M34 198h28m11 0h9m65 0h40m83 0h26" />
      </g>

      {/* Quiet stone facades keep the doorway and its key in focus. */}
      <g stroke="var(--c-600)" strokeWidth="1.4">
        <path d="M35 189V103h64v86M31 103h72M40 103V87h54v16" fill="var(--c-mist)" />
        <path d="M47 117h14v22H47zM74 117h14v22H74z" fill="var(--c-canvas)" />
        <path d="M47 125h14m13 0h14M47 189v-35h14v35m13 0v-35h14v35" />
        <path d="M40 145h23m5 0h26" strokeOpacity="0.25" />
        <path d="M239 189V92h61v97M235 92h69M245 92V75h49v17" fill="var(--c-mist)" />
        <path d="M250 106h13v24h-13zM277 106h13v24h-13z" fill="var(--c-canvas)" />
        <path d="M250 114h13m14 0h13M246 137h21m5 0h23M284 154h7v35" strokeOpacity="0.5" />
      </g>

      {/* An arched entrance echoes the neighborhood studios, without a lockout motif. */}
      <g stroke="var(--p-500)" strokeWidth="1.7">
        <path d="M112 189V78h114v111" fill="var(--c-canvas)" />
        <path d="M112 189V78h114v111" fill="var(--p-500)" fillOpacity="0.04" stroke="none" />
        <path d="M106 78h126M118 78V63h102v15" fill="var(--c-canvas)" />
        <path d="M130 70h78M121 87h96" strokeWidth="1.4" strokeOpacity="0.4" />
        <path d="M136 189v-61a30 30 0 0 1 60 0v61" fill="var(--c-canvas)" />
        <path d="M136 128h60m-30-30v30m-21-21 21 21 21-21" strokeWidth="1.4" />
        <path d="M145 139h42v42h-42z" strokeOpacity="0.3" strokeWidth="1.4" />
        <path d="M177 156v7M130 190h73m-77 6h81" strokeWidth="1.4" />
        <path d="M120 112h8v15h-8z" fill="var(--c-canvas)" strokeWidth="1.4" />
        <path d="M124 108v4m0 15v4" strokeWidth="1.4" />
      </g>

      {/* The key is deliberately a tangible object, not an authentication badge. */}
      <g transform="translate(235 130) rotate(-32)" stroke="var(--p-500)" strokeWidth="1.8">
        <path d="M-5 17.3a18 18 0 1 1 10 0V42h10v10H5v12H-5V17.3Z" fill="var(--c-canvas)" />
        <path d="M-5 17.3a18 18 0 1 1 10 0V42h10v10H5v12H-5V17.3Z" fill="var(--p-500)" fillOpacity="0.08" stroke="none" />
        <circle r="7" fill="var(--c-canvas)" />
        <path d="M0 26v29" strokeWidth="1.3" strokeOpacity="0.35" />
      </g>

      <g stroke="var(--c-600)" strokeWidth="1.4">
        <path d="M16 176h13l-2 13h-9l-2-13Z" fill="var(--c-mist)" />
        <path d="M22 176v-18m0 10c-7 0-10-6-8-10 5 0 8 4 8 10Zm1-4c0-7 3-11 7-12 2 5-1 11-7 12Z" fill="var(--c-canvas)" />
        <path d="M307 176h13l-2 13h-9l-2-13Z" fill="var(--c-mist)" />
        <path d="M313 176v-16m0 7c-7 0-9-5-8-9 5 0 8 4 8 9Zm0-3c0-6 3-10 7-11 2 5-1 10-7 11Z" fill="var(--c-canvas)" />
      </g>
    </svg>
  );
}
