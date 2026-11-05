import { useId } from "react";

export type CalendarFeatureArtKind =
  | "calendars"
  | "bookingRules"
  | "bookingChanges"
  | "teamAccess"
  | "servicesBundles"
  | "clientHistory";

type ArtDepth = { paperShadow: string; contactShadow: string };
const paperLight = "oklch(99.5% .003 85)";

/** A paper day planner gives each person their own appointment column. */
function CalendarsArt({ paperShadow, contactShadow }: ArtDepth) {
  return (
    <>
      <g data-art-object="">
        <rect x="28" y="26" width="114" height="72" rx="5" fill="var(--c-ink)" stroke="none" filter={paperShadow} />
        <rect x="28" y="26" width="114" height="72" rx="5" fill="var(--c-mist)" />
        <path d="M35 95h97" stroke={paperLight} strokeOpacity=".8" strokeWidth="1.1" />
        <rect x="22" y="20" width="114" height="73" rx="5" fill="var(--c-canvas)" />
        <path d="M27 20h104a5 5 0 0 1 5 5v14H22V25a5 5 0 0 1 5-5Z" fill="var(--p-500)" fillOpacity=".07" stroke="none" />
        <path d="M27 34v-8a2 2 0 0 1 2-2h8m12 0h60m12 0h9" stroke={paperLight} strokeOpacity=".8" strokeWidth="1.1" />
        <path d="M22 39h114" stroke="var(--p-500)" strokeOpacity=".65" />
        <rect x="40" y="12" width="5" height="17" rx="2.5" fill="var(--c-canvas)" />
        <rect x="112" y="12" width="5" height="17" rx="2.5" fill="var(--c-canvas)" />
        {[44, 79, 114].map(x => (
          <g key={x} strokeWidth="1.2" strokeOpacity=".65">
            <circle cx={x} cy="47" r="3" />
            <path d={`M${x - 5} 56c0-6 10-6 10 0`} />
          </g>
        ))}
        <path d="M61 43v42m35-42v42M30 61h98m-98 15h98" strokeOpacity=".16" strokeWidth="1.1" />
        <rect x="33" y="64" width="21" height="8" rx="2" fill="var(--c-mist)" stroke="none" />
        <rect x="69" y="78" width="20" height="8" rx="2" fill="var(--p-500)" fillOpacity=".12" stroke="var(--p-500)" />
        <rect x="103" y="64" width="20" height="8" rx="2" fill="var(--c-mist)" stroke="none" />
      </g>
      <g data-art-detail="" transform="rotate(32 135 82)">
        <path d="M132 59h7v38l-3.5 8L132 97Z" fill="var(--c-ink)" stroke="none" filter={contactShadow} />
        <path d="M132 59h7v36h-7Z" fill="var(--c-canvas)" stroke="var(--p-500)" />
        <path d="M132 95h7l-3.5 8Z" fill="var(--c-mist)" />
        <path d="M135.5 64v27" stroke="var(--p-500)" strokeOpacity=".35" strokeWidth="1" />
        <path d="m134 100 1.5 3 1.5-3" fill="var(--c-600)" strokeWidth="1" />
      </g>
    </>
  );
}

/** A time sheet separates appointments with a visibly reserved interval. */
function BookingRulesArt({ paperShadow, contactShadow }: ArtDepth) {
  return (
    <>
      <g data-art-object="">
        <rect x="40" y="24" width="75" height="75" rx="4" fill="var(--c-ink)" stroke="none" filter={paperShadow} />
        <rect x="40" y="24" width="75" height="75" rx="4" fill="var(--c-mist)" />
        <rect x="34" y="17" width="75" height="77" rx="4" fill="var(--c-canvas)" />
        <path d="M38 88V23a2 2 0 0 1 2-2h63" stroke={paperLight} strokeWidth="1.1" />
        <path d="M48 28h41" stroke="var(--p-500)" strokeOpacity=".6" />
        <path d="M48 39v44m-3-42h6m-6 13h6m-6 13h6m-6 13h6" strokeOpacity=".4" strokeWidth="1.2" />
        <rect x="59" y="38" width="35" height="13" rx="2" fill="var(--c-mist)" stroke="none" />
        <rect x="59" y="58" width="35" height="12" rx="2" fill="var(--p-500)" fillOpacity=".07" stroke="var(--p-500)" />
        <path d="m63 67 6-6m2 6 6-6m2 6 6-6" stroke="var(--p-500)" strokeOpacity=".4" strokeWidth="1.2" />
        <rect x="59" y="77" width="35" height="9" rx="2" fill="var(--c-mist)" stroke="none" />
        <path d="M47 96h55" stroke={paperLight} strokeOpacity=".85" strokeWidth="1.1" />
      </g>
      <g data-art-detail="">
        <circle cx="126" cy="78" r="22" fill="var(--c-ink)" stroke="none" filter={contactShadow} />
        <path d="m112 95-3 7m29-7 3 7" />
        <circle cx="126" cy="78" r="22" fill="var(--c-mist)" />
        <path d="M110 65a20 20 0 0 1 29-2" stroke={paperLight} strokeOpacity=".8" strokeWidth="1.1" />
        <circle cx="124" cy="76" r="17" fill="var(--c-canvas)" />
        <path d="M124 63v2m13 11h-2m-11 13v-2m-13-11h2" strokeOpacity=".35" />
        <path d="M124 67v9l-7 5" stroke="var(--p-500)" strokeWidth="1.8" />
        <path d="M120 50h8m-4 0v4" />
      </g>
    </>
  );
}

/** An appointment slip moves from its previous position to the updated one. */
function BookingChangesArt({ paperShadow, contactShadow }: ArtDepth) {
  return (
    <>
      <g data-art-object="" transform="rotate(-7 55 61)">
        <rect x="27" y="34" width="62" height="56" rx="4" fill="var(--c-ink)" stroke="none" filter={paperShadow} />
        <rect x="27" y="34" width="62" height="56" rx="4" fill="var(--c-mist)" />
        <path d="M34 87h47" stroke={paperLight} strokeOpacity=".8" strokeWidth="1.1" />
        <rect x="23" y="30" width="62" height="56" rx="4" fill="var(--c-canvas)" />
        <path d="M27 45V36a2 2 0 0 1 2-2h49" stroke={paperLight} strokeWidth="1.1" />
        <path d="M35 43h25m-25 7h35" strokeOpacity=".4" strokeWidth="1.3" />
        <rect x="35" y="59" width="36" height="13" rx="2" fill="var(--c-mist)" fillOpacity=".45" strokeOpacity=".45" strokeWidth="1.2" />
        <path d="M32 65.5h42" stroke="var(--c-600)" strokeOpacity=".7" strokeWidth="1.5" />
        <path d="M35 79h20" strokeOpacity=".25" strokeWidth="1.2" />
      </g>
      <g data-art-detail="">
        <g transform="translate(3 4)">
          <path d="M88 36h44l14 14v42a4 4 0 0 1-4 4H88a4 4 0 0 1-4-4V40a4 4 0 0 1 4-4Z" fill="var(--c-ink)" stroke="none" filter={contactShadow} />
          <path d="M88 36h44l14 14v42a4 4 0 0 1-4 4H88a4 4 0 0 1-4-4V40a4 4 0 0 1 4-4Z" fill="var(--c-mist)" />
        </g>
        <path d="M88 36h44l14 14v42a4 4 0 0 1-4 4H88a4 4 0 0 1-4-4V40a4 4 0 0 1 4-4Z" fill="var(--c-canvas)" stroke="var(--p-500)" />
        <path d="M132 36v11a3 3 0 0 0 3 3h11Z" fill="var(--c-mist)" stroke="var(--p-500)" strokeOpacity=".65" />
        <path d="M88 54V42a2 2 0 0 1 2-2h36m-33 58h47m8-42v34" stroke={paperLight} strokeOpacity=".85" strokeWidth="1.1" />
        <path d="M96 49h23m-23 7h29" strokeOpacity=".4" strokeWidth="1.3" />
        <rect x="96" y="64" width="37" height="15" rx="2.5" fill="var(--p-500)" fillOpacity=".09" stroke="var(--p-500)" />
        <path d="M100 67h29" stroke={paperLight} strokeOpacity=".9" strokeWidth="1" />
        <path d="M102 71.5h25" stroke="var(--p-500)" strokeOpacity=".65" strokeWidth="1.3" />
        <path d="M96 87h24" strokeOpacity=".3" strokeWidth="1.2" />
      </g>
      {/* The change travels above both slips, clear of their edges and shadows. */}
      <path d="M48 19C67 4 102 5 119 22m-8-1 8 1-1-8" stroke="var(--p-500)" strokeWidth="1.9" />
    </>
  );
}

/** Individual staff passes and a key stand for controlled workspace access. */
function TeamAccessArt({ paperShadow, contactShadow }: ArtDepth) {
  return (
    <>
      <g transform="rotate(-10 67 62)">
        <rect x="30" y="28" width="62" height="67" rx="5" fill="var(--c-mist)" />
        <path d="M40 42h18m-18 40h35" strokeOpacity=".3" />
      </g>
      <g data-art-object="">
        <rect x="50" y="24" width="65" height="75" rx="5" fill="var(--c-ink)" stroke="none" filter={paperShadow} />
        <rect x="50" y="24" width="65" height="75" rx="5" fill="var(--c-mist)" />
        <rect x="45" y="18" width="65" height="76" rx="5" fill="var(--c-canvas)" stroke="var(--p-500)" />
        <path d="M49 37V25a3 3 0 0 1 3-3h13m25 0h13M54 96h48" stroke={paperLight} strokeOpacity=".8" strokeWidth="1.1" />
        <rect x="68" y="14" width="19" height="13" rx="3" fill="var(--c-mist)" />
        <path d="M73 20h9" strokeOpacity=".4" />
        <circle cx="77.5" cy="46" r="8" fill="var(--c-mist)" />
        <path d="M62 71v-5c0-13 31-13 31 0v5Z" fill="var(--p-500)" fillOpacity=".07" stroke="var(--p-500)" />
        <path d="M63 82h29m-23 5h17" strokeOpacity=".35" strokeWidth="1.2" />
      </g>
      <g data-art-detail="" stroke="var(--p-500)" strokeWidth="1.6">
        <path d="M119 74a14 14 0 1 1 11 10l-9 9h-7v7h-12v-8l18-18Z" fill="var(--c-ink)" stroke="none" filter={contactShadow} />
        <path d="M119 74a14 14 0 1 1 11 10l-9 9h-7v7h-12v-8l18-18Z" fill="var(--c-canvas)" />
        <circle cx="133" cy="67" r="4" fill="var(--c-mist)" />
        <path d="m107 94 16-16" strokeOpacity=".35" strokeWidth="1.1" />
        <path d="M125 60a11 11 0 0 1 15 3" stroke={paperLight} strokeWidth="1.2" />
      </g>
    </>
  );
}

/** Service tickets become one bundle when a paper band holds them together. */
function ServicesBundlesArt({ paperShadow, contactShadow }: ArtDepth) {
  return (
    <>
      <g data-art-object="">
        <rect x="35" y="28" width="99" height="69" rx="4" fill="var(--c-ink)" stroke="none" filter={paperShadow} />
        <g transform="rotate(-9 78 60)">
          <rect x="29" y="22" width="92" height="68" rx="4" fill="var(--c-mist)" />
          <path d="M38 33h34m-34 8h61" strokeOpacity=".3" />
        </g>
        <g transform="rotate(6 92 58)">
          <rect x="46" y="22" width="92" height="68" rx="4" fill="var(--c-canvas)" />
          <path d="M56 32h34m-34 8h48" strokeOpacity=".3" />
        </g>
        <rect x="39" y="32" width="92" height="64" rx="4" fill="var(--c-mist)" />
        <rect x="36" y="28" width="92" height="64" rx="4" fill="var(--c-canvas)" />
        <path d="M40 47V35a3 3 0 0 1 3-3h78M43 94h78" stroke={paperLight} strokeOpacity=".8" strokeWidth="1.1" />
        <path d="M49 41h34m-34 8h45m13-8h8M49 83h25m32 0h9" strokeOpacity=".45" strokeWidth="1.3" />
      </g>
      <g data-art-detail="" stroke="var(--p-500)" strokeWidth="1.6">
        <path d="m32 56 7-4h92l7 4v20l-7 4H39l-7-4Z" fill="var(--c-ink)" stroke="none" filter={contactShadow} />
        <path d="m32 56 7-4h92l7 4v20l-7 4H39l-7-4Z" fill="var(--c-mist)" />
        <path d="M32 56h106v20H32Z" fill="var(--c-canvas)" />
        <path d="M32 56h106v20H32Z" fill="var(--p-500)" fillOpacity=".08" stroke="none" />
        <path d="M37 59h96" stroke={paperLight} strokeOpacity=".8" strokeWidth="1.1" />
        <path d="M69 66h33m-33 5h23" strokeOpacity=".4" strokeWidth="1.2" />
      </g>
    </>
  );
}

/** A client's visit sheets stay in a folder beside a downloadable document. */
function ClientHistoryArt({ paperShadow, contactShadow }: ArtDepth) {
  return (
    <>
      <g data-art-object="">
        <path d="M27 36h35l8 9h63v55H27Z" fill="var(--c-ink)" stroke="none" filter={paperShadow} />
        <path d="M26 34h35l8 9h62v54H26Z" fill="var(--c-mist)" />
        <g transform="rotate(6 86 50)">
          <rect x="54" y="18" width="67" height="71" rx="3" fill="var(--c-mist)" />
        </g>
        <rect x="44" y="13" width="68" height="77" rx="3" fill="var(--c-canvas)" />
        <path d="M48 53V19a2 2 0 0 1 2-2h56" stroke={paperLight} strokeWidth="1.1" />
        <circle cx="59" cy="29" r="4" stroke="var(--p-500)" />
        <path d="M52 40c0-10 14-10 14 0m10-12h24m-24 8h16" strokeOpacity=".5" strokeWidth="1.3" />
        <path d="M55 49h43m-43 9h30" strokeOpacity=".3" strokeWidth="1.2" />
        <path d="M23 58h33l10 10h65v26a4 4 0 0 1-4 4H27a4 4 0 0 1-4-4Z" fill="var(--c-canvas)" />
        <path d="M23 58h33l10 10h65v26a4 4 0 0 1-4 4H27a4 4 0 0 1-4-4Z" fill="var(--c-mist)" fillOpacity=".45" stroke="none" />
        <path d="M28 90v2a2 2 0 0 0 2 2h67" stroke={paperLight} strokeOpacity=".8" strokeWidth="1.1" />
        <path d="M37 79h37m-37 7h23" strokeOpacity=".3" strokeWidth="1.2" />
      </g>
      <g data-art-detail="" stroke="var(--p-500)" strokeWidth="1.5">
        <path d="M106 52h24l15 15v35h-39Z" fill="var(--c-ink)" stroke="none" filter={contactShadow} />
        <path d="M104 49h24l15 15v33a3 3 0 0 1-3 3h-36Z" fill="var(--c-canvas)" />
        <path d="M128 49v12a3 3 0 0 0 3 3h12Z" fill="var(--c-mist)" />
        <path d="M108 65V53h15" stroke={paperLight} strokeWidth="1.1" />
        <path d="M123 72v14m-5-5 5 5 5-5m-15 9h20" strokeWidth="1.7" />
      </g>
    </>
  );
}

const scenes = {
  calendars: CalendarsArt,
  bookingRules: BookingRulesArt,
  bookingChanges: BookingChangesArt,
  teamAccess: TeamAccessArt,
  servicesBundles: ServicesBundlesArt,
  clientHistory: ClientHistoryArt,
};

/** Decorative server-rendered objects share Discovery's paper and light. */
export function CalendarFeatureArt({ kind }: { kind: CalendarFeatureArtKind }) {
  const id = useId();
  const paperId = `calendar-paper-${id}`;
  const contactId = `calendar-contact-${id}`;
  const Scene = scenes[kind];
  return (
    <svg width="168" height="112" viewBox="0 0 168 112" fill="none" stroke="var(--c-600)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" data-calendar-feature-art={kind}>
      <defs>
        {/* Shadow-only silhouettes leave the object linework sharp. */}
        <filter id={paperId} filterUnits="userSpaceOnUse" x="-12" y="-12" width="192" height="144" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.2" />
          <feOffset dx="1.2" dy="3.2" result="shade" />
          <feFlood floodColor="#594536" floodOpacity=".15" />
          <feComposite in2="shade" operator="in" />
        </filter>
        <filter id={contactId} filterUnits="userSpaceOnUse" x="-12" y="-12" width="192" height="144" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation=".8" />
          <feOffset dx=".6" dy="1.6" result="shade" />
          <feFlood floodColor="#594536" floodOpacity=".18" />
          <feComposite in2="shade" operator="in" />
        </filter>
      </defs>
      <ellipse cx="84" cy="101.5" rx="54" ry="2.5" fill="var(--c-ink)" fillOpacity=".03" stroke="none" />
      <path d="M15 103h138" stroke="var(--c-ink)" strokeOpacity=".09" strokeWidth="1.3" />
      <Scene paperShadow={`url(#${paperId})`} contactShadow={`url(#${contactId})`} />
    </svg>
  );
}
