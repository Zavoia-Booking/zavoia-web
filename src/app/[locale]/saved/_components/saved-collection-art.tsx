/**
 * An empty collection, ready for favorite places and people. Shares the fine
 * rounded linework, street details and accent hierarchy of the marketplace
 * app's HomeStorefrontArt, using the web palette so the paper stays seamless.
 */
export function SavedCollectionArt({ className }: { className?: string }) {
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
      {/* A quiet street frames the collection, as it does on Home. */}
      <g stroke="var(--c-ink)" strokeOpacity="0.11" strokeWidth="1.5">
        <path d="M5 190h326M24 198h29m17 0h10m65 0h41m80 0h35" />
      </g>
      <g stroke="var(--c-600)" strokeWidth="1.4">
        <path
          d="M27 189V91h58v98M23 91h66M32 91V76h48v15"
          fill="var(--c-mist)"
        />
        <path
          d="M38 105h13v22H38zM62 105h13v22H62z"
          fill="var(--c-canvas)"
        />
        <path d="M38 189v-37h13v37m11 0v-37h13v37" />
        <path
          d="M38 113h13m11 0h13M33 133h23m3 0h21M27 140h58"
          stroke="var(--c-ink)"
          strokeOpacity="0.11"
        />
        <path
          d="M253 189V73h56v116M249 73h64M258 73V55h46v18"
          fill="var(--c-mist)"
        />
        <path
          d="M264 87h12v22h-12zM287 87h12v22h-12z"
          fill="var(--c-canvas)"
        />
        <path
          d="M264 95h12m11 0h12M259 115h22m3 0h20M253 123h56"
          stroke="var(--c-ink)"
          strokeOpacity="0.11"
        />
        <path d="M271 189v-43a10 10 0 0 1 20 0v43m-10-39v39m-4-28v5" />
      </g>

      {/* The open folder is deliberately empty: the heart marks its purpose. */}
      <g stroke="var(--p-500)" strokeWidth="1.7">
        <path
          d="M101 176V86a6 6 0 0 1 6-6h40l12 12h70a6 6 0 0 1 6 6v78"
          fill="var(--c-canvas)"
        />
        <path
          d="M101 176V86a6 6 0 0 1 6-6h40l12 12h70a6 6 0 0 1 6 6v78"
          fill="var(--p-500)"
          fillOpacity="0.04"
          stroke="none"
        />
        <path d="M111 104h114m-114 7h114" strokeWidth="1.4" strokeOpacity="0.25" />
        <path
          d="M91 122a5 5 0 0 1 5-6h43l12 12h89a5 5 0 0 1 5 6l-10 50a7 7 0 0 1-7 6H108a7 7 0 0 1-7-6l-10-62Z"
          fill="var(--c-canvas)"
        />
        <path
          d="M91 122a5 5 0 0 1 5-6h43l12 12h89a5 5 0 0 1 5 6l-10 50a7 7 0 0 1-7 6H108a7 7 0 0 1-7-6l-10-62Z"
          fill="var(--p-500)"
          fillOpacity="0.04"
          stroke="none"
        />
        <path
          d="M168 174s-17-10-17-20a9 9 0 0 1 17-4 9 9 0 0 1 17 4c0 10-17 20-17 20Z"
          fill="var(--c-canvas)"
        />
        <path d="M111 87h23" strokeWidth="1.4" />
      </g>

      {/* Small planters and the broken pavement line echo the source drawing. */}
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
