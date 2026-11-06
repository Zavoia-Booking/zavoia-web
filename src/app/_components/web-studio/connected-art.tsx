import { useId, type ReactNode } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import styles from "./connected-story.module.css";

type Copy = Dictionary["webStudio"]["connected"]["artwork"];
type Scene = "details" | "website" | "calendar";

/** A drawn training space shared by the business folio and its website. */
function TrainingRoom({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  return (
    <svg x={x} y={y} width={width} height={height} viewBox="0 0 120 90" preserveAspectRatio="xMidYMid slice">
      <path d="M0 0h120v90H0Z" fill="var(--c-mist)" stroke="none" />
      <path d="M0 70h120v20H0Z" fill="var(--story-edge)" stroke="none" />
      <path d="M12 10h38v47H12Z" fill="var(--c-canvas)" stroke="var(--story-rule)" />
      <path d="M31 10v47M12 34h38M12 57l25 13H0" stroke="var(--story-rule)" />
      <path d="m58 72 39-7 19 12-39 8Z" fill="var(--story-clay-soft)" />
      <path d="M72 16v44m32-44v44M70 20h36M76 34h24" strokeWidth="2" />
      <path d="M77 26v16m5-13v10m12-10v10m5-13v16" stroke="var(--p-500)" strokeWidth="3.5" />
      <path d="m68 58 16 5m-18-9-3 9m8-8-3 9m13-6-3 9m8-7-3 9" strokeWidth="2" />
      <path d="M18 72v-8m0 5c-8 0-9-6-9-6 7-1 9 6 9 6Zm0-5c0-6 7-8 7-8s1 7-7 8Z" />
      <path d="M13 71h11l-2 10h-7Z" fill="var(--c-shade)" />
    </svg>
  );
}

function Paper({ children, shadow }: { children: ReactNode; shadow: string }) {
  return <g filter={`url(#${shadow})`}>{children}</g>;
}

function Details({ copy, shadow }: { copy: Copy; shadow: string }) {
  return (
    <>
      <ellipse cx="192" cy="249" rx="155" ry="6" fill="var(--c-ink)" opacity=".035" stroke="none" />
      <Paper shadow={shadow}>
        <g transform="rotate(-7 144 116)">
          <rect x="57" y="24" width="204" height="176" rx="4" fill="var(--story-edge)" />
          <rect x="53" y="20" width="204" height="176" rx="4" fill="var(--c-shade)" />
          <path d="M63 48V29h183" stroke="var(--c-canvas)" />
          <text x="72" y="47" className={styles.artBrand}>{copy.business}</text>
          <path d="M72 61h83M72 71h51" stroke="var(--story-rule)" />
        </g>
      </Paper>
      <Paper shadow={shadow}>
        <g transform="rotate(8 294 82)">
          <rect x="235" y="26" width="111" height="116" rx="3" fill="var(--story-edge)" />
          <rect x="231" y="22" width="111" height="116" rx="3" fill="var(--c-canvas)" />
          <TrainingRoom x={239} y={30} width={95} height={82} />
          <path d="M247 124h54" stroke="var(--story-rule)" />
        </g>
      </Paper>
      <Paper shadow={shadow}>
        <path d="M33 88h282v128H33Z" fill="var(--story-edge)" />
        <rect x="29" y="84" width="282" height="128" rx="4" fill="var(--c-canvas)" />
        <path d="M29 119h282" stroke="var(--story-rule)" />
        <path d="M46 102h12" stroke="var(--p-500)" strokeWidth="2" />
        <text x="67" y="107" className={styles.artLabel}>{copy.services}</text>
        <text x="46" y="146" className={styles.artService}>{copy.service}</text>
        <text x="46" y="184" className={styles.artPrice}>{copy.price}</text>
        <circle cx="177" cy="179" r="5" stroke="var(--c-600)" />
        <path d="M177 176v3l2 1" stroke="var(--c-600)" />
        <text x="190" y="184" className={styles.artMuted}>{copy.duration}</text>
      </Paper>
      <Paper shadow={shadow}>
        <g transform="rotate(-4 255 218)">
          <rect x="181" y="193" width="172" height="54" rx="4" fill="var(--story-edge)" />
          <rect x="178" y="190" width="172" height="54" rx="4" fill="var(--c-shade)" />
          <circle cx="203" cy="217" r="14" fill="var(--story-clay-soft)" stroke="none" />
          <text x="203" y="222" textAnchor="middle" className={styles.artInitial}>M</text>
          <text x="227" y="210" className={styles.artSmall}>{copy.team}</text>
          <text x="227" y="229" className={styles.artLabel}>{copy.member}</text>
          <path d="m321 218 3 3 6-7" stroke="var(--p-500)" />
        </g>
      </Paper>
    </>
  );
}

function Website({ copy, shadow }: { copy: Copy; shadow: string }) {
  return (
    <>
      <ellipse cx="203" cy="249" rx="184" ry="6" fill="var(--c-ink)" opacity=".035" stroke="none" />
      <Paper shadow={shadow}>
        <rect x="14" y="16" width="376" height="225" rx="8" fill="var(--story-edge)" />
        <rect x="10" y="12" width="376" height="225" rx="8" fill="var(--c-canvas)" />
        <path d="M18 12h360a8 8 0 0 1 8 8v18H10V20a8 8 0 0 1 8-8Z" fill="var(--c-shade)" />
        <path d="M10 38h376" stroke="var(--story-rule)" />
        {[25, 36, 47].map(cx => <circle key={cx} cx={cx} cy="25" r="2" stroke="var(--story-rule)" />)}
        <text x="198" y="28" textAnchor="middle" className={styles.artAddress}>zavoia.com/forma-studio</text>
        <text x="29" y="65" className={styles.artBrand}>{copy.business}</text>
        <path d="M349 57h16m-16 5h16" stroke="var(--c-600)" />
        <path d="M29 77h338" stroke="var(--story-rule)" />
        <TrainingRoom x={240} y={89} width={126} height={80} />
        <text x="29" y="108" className={styles.artSmall}>{copy.location}</text>
        <text x="29" y="134" className={styles.artService}>{copy.service}</text>
        <text x="29" y="158" className={styles.artMuted}>{copy.member} · {copy.duration}</text>
        <path d="M29 182h338" stroke="var(--story-rule)" />
        <text x="29" y="210" className={styles.artPrice}>{copy.price}</text>
        <rect x="221" y="194" width="146" height="28" rx="14" fill="var(--p-500)" stroke="none" />
        <text x="289" y="212" textAnchor="middle" className={styles.artBooking}>{copy.book}</text>
        <path d="M348 208h7m-3-3 3 3-3 3" stroke="var(--c-canvas)" />
      </Paper>
    </>
  );
}

function Calendar({ copy, shadow }: { copy: Copy; shadow: string }) {
  return (
    <>
      <ellipse cx="205" cy="249" rx="155" ry="6" fill="var(--c-ink)" opacity=".035" stroke="none" />
      <Paper shadow={shadow}>
        <rect x="50" y="29" width="302" height="211" rx="7" fill="var(--story-edge)" />
        <rect x="46" y="25" width="302" height="211" rx="7" fill="var(--c-canvas)" />
        <path d="M53 25h288a7 7 0 0 1 7 7v43H46V32a7 7 0 0 1 7-7Z" fill="var(--c-shade)" />
        <path d="M46 75h302" stroke="var(--story-rule)" />
        {[82, 310].map(x => <rect key={x} x={x} y="17" width="6" height="18" rx="3" fill="var(--c-canvas)" />)}
        <text x="64" y="58" className={styles.artBrand}>{copy.calendar}</text>
        <path d="m317 52 3 3-3 3m-12-6-3 3 3 3" stroke="var(--c-600)" />
        <text x="64" y="97" className={styles.artSmall}>{copy.day}</text>
        <circle cx="272" cy="94" r="9" fill="var(--story-clay-soft)" stroke="none" />
        <text x="272" y="98" textAnchor="middle" className={styles.artSmall}>M</text>
        <text x="288" y="98" className={styles.artSmall}>{copy.member}</text>
        <path d="M101 115v110M101 121h233m-233 49h233m-233 49h233" stroke="var(--story-rule)" />
        <text x="62" y="125" className={styles.artSmall}>09:00</text>
        <text x="62" y="174" className={styles.artSmall}>10:00</text>
        <text x="62" y="223" className={styles.artSmall}>11:00</text>
        <rect x="110" y="170" width="226" height="49" rx="4" fill="var(--story-clay-soft)" stroke="var(--story-clay-line)" />
        <text x="122" y="187" className={styles.artAppointment}>{copy.service}</text>
        <text x="122" y="207" className={styles.artSmall}>{copy.time}</text>
        <text x="323" y="207" textAnchor="end" className={styles.artSmall}>{copy.price}</text>
      </Paper>
    </>
  );
}

const scenes = { details: Details, website: Website, calendar: Calendar };

/** Illustrated example, not a simulated editor or a product screenshot. */
export function ConnectedArt({ kind, copy }: { kind: Scene; copy: Copy }) {
  const id = useId();
  const shadow = `connected-paper-${id}`;
  const Scene = scenes[kind];
  return (
    <svg className={styles.art} width="400" height="270" viewBox="0 0 400 270" fill="none" stroke="var(--story-ink)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" data-connected-art={kind} data-connected-scene="">
      <defs>
        <filter id={shadow} x="-15%" y="-15%" width="140%" height="150%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#32271c" floodOpacity=".08" />
          <feDropShadow dx="1" dy="9" stdDeviation="6" floodColor="#32271c" floodOpacity=".045" />
        </filter>
      </defs>
      <Scene copy={copy} shadow={shadow} />
    </svg>
  );
}

export function StoryConnectors() {
  return (
    <svg className={styles.connectors} width="1400" height="500" viewBox="0 0 1400 500" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M322 132c42-21 59 23 90 34" strokeDasharray="2 6" />
      <path d="m402 156 10 10-14 2" />
      <path d="M983 340c49-4 48 69 101 68" strokeDasharray="2 6" />
      <path d="m1073 400 11 8-11 7" />
    </svg>
  );
}
