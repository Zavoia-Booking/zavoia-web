import { useId } from "react";
import { Icon } from "@/components/ui/icon";

export type DiscoveryFeatureArtKind = "services" | "availability" | "reviews" | "bookingLink";

type ArtDepth = { paperShadow: string; contactShadow: string };

/** Paper menus with quiet rules for services, durations and prices. */
function ServicesArt({ paperShadow, contactShadow }: ArtDepth) {
  return (
    <>
      <g transform="rotate(-9 75 60)" stroke="var(--c-600)" strokeWidth="1.5">
        <rect x="30" y="23" width="77" height="73" rx="4" fill="var(--c-mist)" />
        <path d="M37 33h29m-29 8h46M37 85h58" strokeOpacity=".3" />
      </g>
      <g data-art-object="" stroke="var(--p-500)" strokeWidth="1.6">
        <rect x="46" y="15" width="77" height="84" rx="4" fill="var(--c-ink)" stroke="none" filter={paperShadow} />
        <path d="M50 18h76v79a4 4 0 0 1-4 4H50Z" fill="var(--c-mist)" />
        <path d="M54 98h65a4 4 0 0 0 4-4" stroke="var(--c-canvas)" strokeOpacity=".85" strokeWidth="1.1" />
        <rect x="44" y="12" width="77" height="84" rx="4" fill="var(--c-canvas)" />
        <path d="M48 12h69a4 4 0 0 1 4 4v19H44V16a4 4 0 0 1 4-4Z" fill="var(--p-500)" fillOpacity=".07" stroke="none" />
        <path d="M47 31V18a3 3 0 0 1 3-3h64M118 39v49" stroke="oklch(99.5% .003 85)" strokeOpacity=".75" strokeWidth="1.1" />
        <path d="M57 24h33M44 35h77" strokeOpacity=".5" />
        <path d="M56 47h32m-32 20h26m-26 20h36" stroke="var(--c-600)" />
        <path d="M101 47h8m-8 20h8" strokeOpacity=".65" />
        <path d="M56 54h20m-20 20h16" stroke="var(--c-600)" strokeOpacity=".3" strokeWidth="1.3" />
      </g>
      <g data-art-detail="" transform="rotate(-12 122 84)" stroke="var(--c-600)" strokeWidth="1.5">
        <path d="m104 78 10-10h29v24h-29l-10-10Z" fill="var(--c-ink)" stroke="none" filter={contactShadow} />
        <path d="m104 78 10-10h29v24h-29l-10-10Z" fill="var(--c-canvas)" />
        <path d="m114 92 3 4h27l-1-4" fill="var(--c-mist)" strokeOpacity=".5" />
        <path d="M116 71h24m-21 23h21" stroke="oklch(99.5% .003 85)" strokeOpacity=".8" strokeWidth="1" />
        <circle cx="114" cy="80" r="2" />
        <path d="M124 77h10m-10 6h7" strokeOpacity=".4" />
        <path d="M112 80c-12 3-20-4-17-12 2-5 7-6 10-3" stroke="var(--p-500)" />
      </g>
    </>
  );
}

/** A bound appointment planner and a small clock resting on its feet. */
function AvailabilityArt({ paperShadow, contactShadow }: ArtDepth) {
  return (
    <>
      <g data-art-object="" stroke="var(--c-600)" strokeWidth="1.5">
        <rect x="28" y="24" width="99" height="73" rx="5" fill="var(--c-ink)" stroke="none" filter={paperShadow} />
        <rect x="31" y="27" width="99" height="72" rx="5" fill="var(--c-mist)" />
        <path d="M36 96h83" stroke="var(--c-canvas)" strokeOpacity=".85" strokeWidth="1.1" />
        <rect x="25" y="21" width="99" height="73" rx="5" fill="var(--c-canvas)" />
        <path d="M30 21h89a5 5 0 0 1 5 5v16H25V26a5 5 0 0 1 5-5Z" fill="var(--p-500)" fillOpacity=".07" stroke="none" />
        <path d="M29 37V28a3 3 0 0 1 3-3h8m12 0h46m10 0h9" stroke="oklch(99.5% .003 85)" strokeOpacity=".8" strokeWidth="1.1" />
        <path d="M25 42h99" stroke="var(--p-500)" strokeOpacity=".7" />
        <rect x="43" y="13" width="5" height="17" rx="2.5" fill="var(--c-canvas)" />
        <rect x="101" y="13" width="5" height="17" rx="2.5" fill="var(--c-canvas)" />
        <path d="M60 49v35m28-35v35M34 67h81" strokeOpacity=".15" strokeWidth="1.2" />
        <rect x="35" y="50" width="18" height="11" rx="2" fill="var(--c-mist)" stroke="none" />
        <rect x="64" y="72" width="18" height="11" rx="2" fill="var(--c-mist)" stroke="none" />
        <rect x="91" y="50" width="23" height="13" rx="2" fill="var(--p-500)" fillOpacity=".09" stroke="var(--p-500)" />
        <path d="M94 52.5h17" stroke="oklch(99.5% .003 85)" strokeOpacity=".75" strokeWidth="1" />
        <path d="M96 56.5h13" stroke="var(--p-500)" strokeOpacity=".5" />
        <path d="M34 88h69" strokeOpacity=".15" />
      </g>
      <g data-art-detail="" stroke="var(--c-600)" strokeWidth="1.5">
        <circle cx="127" cy="79" r="21" fill="var(--c-ink)" stroke="none" filter={contactShadow} />
        <path d="m113 94-4 8m28-8 4 8" />
        <circle cx="127" cy="79" r="21" fill="var(--c-mist)" />
        <path d="M111 66a19 19 0 0 1 28-2" stroke="oklch(99.5% .003 85)" strokeOpacity=".8" strokeWidth="1.2" />
        <circle cx="125" cy="77" r="17" fill="var(--c-canvas)" />
        <path d="M125 64v2m13 11h-2m-11 13v-2m-13-11h2" strokeOpacity=".35" />
        <path d="M125 68v9l6 4" stroke="var(--p-500)" strokeWidth="1.8" />
        <path d="M121 52h8m-4 0v4" />
      </g>
    </>
  );
}

/** The completed visit stays behind the separate review slip. */
function ReviewsArt({ paperShadow, contactShadow }: ArtDepth) {
  return (
    <>
      <g stroke="var(--c-600)" strokeWidth="1.5">
        <path d="M40 20h69v78H40Z" fill="var(--c-ink)" stroke="none" filter={paperShadow} />
        <path d="M43 21h66a4 4 0 0 1 4 4v73H43Z" fill="var(--c-mist)" />
        <path d="M110 28v58" stroke="var(--c-canvas)" strokeOpacity=".8" strokeWidth="1.1" />
        <path d="M48 28h55" strokeOpacity=".2" />
      </g>
      <g data-art-object="" stroke="var(--p-500)" strokeWidth="1.6">
        <path d="m35 13 7 4 7-4 7 4 7-4 7 4 7-4 7 4 7-4 7 4 7-4v81l-7-4-7 4-7-4-7 4-7-4-7 4-7-4-7 4-7-4-7 4Z" fill="var(--c-canvas)" />
        <path d="M38 24v59m64-61v36" stroke="oklch(99.5% .003 85)" strokeOpacity=".8" strokeWidth="1.1" />
        <path d="m49 35 6 6 12-14" strokeWidth="2" />
        <path d="M76 31h16m-16 7h10" stroke="var(--c-600)" strokeOpacity=".4" />
        <path d="M46 52h47" strokeOpacity=".35" strokeDasharray="2 4" strokeWidth="1.2" />
        <path d="M46 64h37m-37 8h25" stroke="var(--c-600)" strokeOpacity=".4" />
      </g>
      <g data-art-detail="" transform="rotate(-7 107 81)" stroke="var(--c-600)" strokeWidth="1.5">
        <rect x="66" y="68" width="80" height="29" rx="3" fill="var(--c-ink)" stroke="none" filter={contactShadow} />
        <rect x="68" y="70" width="80" height="29" rx="3" fill="var(--c-mist)" />
        <path d="M75 96h65" stroke="var(--c-canvas)" strokeOpacity=".85" strokeWidth="1.1" />
        <rect x="65" y="65" width="80" height="29" rx="3" fill="var(--c-canvas)" />
        <path d="M70 68h69" stroke="oklch(99.5% .003 85)" strokeOpacity=".85" strokeWidth="1.1" />
        <path d="M71 89h68" strokeOpacity=".15" strokeWidth="1" />
        {[0, 1, 2, 3, 4].map(index => (
          <g key={index} transform={`translate(${71 + index * 14} 72)`} stroke="none">
            <Icon name="star" size={12} color="var(--p-500)" />
          </g>
        ))}
      </g>
    </>
  );
}

/** A public page on paper, joined to a second link by two physical loops. */
function BookingLinkArt({ paperShadow, contactShadow }: ArtDepth) {
  return (
    <>
      <g data-art-object="" stroke="var(--c-600)" strokeWidth="1.5">
        <path d="M30 22h74l22 19v55H30Z" fill="var(--c-ink)" stroke="none" filter={paperShadow} />
        <path d="M31 24h98v70a4 4 0 0 1-4 4H31Z" fill="var(--c-mist)" />
        <path d="M36 95h70" stroke="var(--c-canvas)" strokeOpacity=".85" strokeWidth="1.1" />
        <path d="M29 17h72l22 21v50a4 4 0 0 1-4 4H29a4 4 0 0 1-4-4V21a4 4 0 0 1 4-4Z" fill="var(--c-canvas)" />
        <path d="M29 81V24a3 3 0 0 1 3-3h64" stroke="oklch(99.5% .003 85)" strokeOpacity=".8" strokeWidth="1.1" />
        <path d="M100 19v16a5 5 0 0 0 5 5h17" stroke="var(--c-ink)" strokeOpacity=".06" strokeWidth="3" />
        <path d="M101 17v17a4 4 0 0 0 4 4h18Z" fill="var(--c-mist)" />
        <path d="M104 24v9a2 2 0 0 0 2 2h9" stroke="oklch(99.5% .003 85)" strokeOpacity=".75" strokeWidth="1.1" />
        <path d="M37 29h40" stroke="var(--p-500)" strokeWidth="1.8" />
        <path d="M36 77V57a16 16 0 0 1 32 0v20Z" fill="var(--p-500)" fillOpacity=".07" stroke="var(--p-500)" />
        <path d="M45 77V60a7 7 0 0 1 14 0v17M36 77h32" stroke="var(--p-500)" strokeOpacity=".45" />
        <path d="M79 48h29m-29 9h23m-23 9h16M37 84h43" strokeOpacity=".35" />
      </g>
      <g data-art-detail="" transform="rotate(-28 120 80)" stroke="var(--p-500)" strokeWidth="1.8">
        <g fill="var(--c-ink)" stroke="none" filter={contactShadow}>
          <rect x="111" y="70" width="38" height="20" rx="10" />
          <rect x="88" y="75" width="38" height="20" rx="10" />
        </g>
        <rect x="111" y="71" width="38" height="20" rx="10" fill="var(--c-mist)" />
        <rect x="111" y="68" width="38" height="20" rx="10" fill="var(--c-canvas)" />
        <path d="M122 70.5h16a7 7 0 0 1 7 7" stroke="oklch(99.5% .003 85)" strokeOpacity=".85" strokeWidth="1.2" />
        <path d="M122 73h16a5 5 0 0 1 0 10h-9" strokeOpacity=".35" />
        <rect x="88" y="76" width="38" height="20" rx="10" fill="var(--c-mist)" />
        <rect x="88" y="73" width="38" height="20" rx="10" fill="var(--c-canvas)" />
        <path d="M92 82a6 6 0 0 1 6-6h13" stroke="oklch(99.5% .003 85)" strokeOpacity=".85" strokeWidth="1.2" />
        <path d="M110 88H99a5 5 0 0 1 0-10h9" strokeOpacity=".35" />
        <path d="M117 73h13" strokeWidth="2.4" />
      </g>
    </>
  );
}

const scenes = {
  services: ServicesArt,
  availability: AvailabilityArt,
  reviews: ReviewsArt,
  bookingLink: BookingLinkArt,
};

/** Decorative miniatures share the illustrated trial band's paper and ink. */
export function DiscoveryFeatureArt({ kind }: { kind: DiscoveryFeatureArtKind }) {
  const id = useId();
  const paperId = `discovery-paper-${id}`;
  const contactId = `discovery-contact-${id}`;
  const Scene = scenes[kind];
  return (
    <svg
      width="168"
      height="112"
      viewBox="0 0 168 112"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-discovery-feature-art={kind}
    >
      <defs>
        {/* Only filled silhouettes enter these filters; drawn lines stay crisp. */}
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
      <ellipse cx="84" cy="101.5" rx="54" ry="2.5" fill="var(--c-ink)" fillOpacity=".03" />
      <path d="M15 103h138" stroke="var(--c-ink)" strokeOpacity=".09" strokeWidth="1.3" />
      <Scene paperShadow={`url(#${paperId})`} contactShadow={`url(#${contactId})`} />
    </svg>
  );
}
