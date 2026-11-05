import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { INDUSTRY_VISUALS } from "@/lib/marketplace/industry-visuals";
import { Planter, StreetBuilding, StreetBuildingShadow } from "./street-buildings";
import { STREET_BUSINESSES, STREET_HEIGHT, STREET_WIDTH } from "./street-data";
import { StreetInteraction } from "./street-interaction";
import styles from "./for-business.module.css";

/** Architecture stays on the server; only its labelled controls need hydration. */
export function StreetScene({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale];
  return (
    <StreetInteraction label={dict.forBusiness.hero.streetLabel} labels={dict.industries}>
      <svg className={styles.street} viewBox={`0 0 ${STREET_WIDTH} ${STREET_HEIGHT}`} aria-hidden="true" focusable="false">
        <path className={styles.ground} d="M7 330h1586M30 340h62m26 0h26m192 0h60m160 0h38m370 0h64m202 0h40m126 0h52m170 0h38" />
        {STREET_BUSINESSES.map(({ industry, kind, x, y, scale, pinX, pinY, roofY }) => (
          <g key={industry}>
            <g className={styles.buildingLayer} data-industry={industry} data-street-building={industry}>
              <g transform={`translate(${x} ${y}) scale(${scale})`}><StreetBuildingShadow kind={kind} /></g>
              <g className={styles.buildingLift}>
                <g transform={`translate(${x} ${y}) scale(${scale})`}><StreetBuilding kind={kind} /></g>
              </g>
            </g>
            <path className={styles.stem} stroke={INDUSTRY_VISUALS[industry].accent} d={`M${pinX} ${pinY}V${roofY}`} />
          </g>
        ))}
        <Planter x={6} y={330} />
        <Planter x={1580} y={330} />
      </svg>
    </StreetInteraction>
  );
}
