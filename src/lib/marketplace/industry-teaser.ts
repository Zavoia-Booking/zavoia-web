/**
 * Browse teaser for the map's floating rail — one hero TAG per industry,
 * day-rotated.
 *
 * Ported from the RN marketplace-app's `features/industry-tags/teaser.ts`. Two
 * decisions carry over verbatim:
 *
 *  - The rail teases TAGS, not industries. "Hair salon" is something a person
 *    is looking for; "Beauty" is a database column.
 *  - The order is a seeded shuffle over the day number, so it is stable for the
 *    whole day (spatial memory holds, and WCAG's consistent-navigation
 *    expectation is met) but rotates daily, giving every vertical its turn at
 *    the front of the rail instead of permanently rewarding whichever industry
 *    the taxonomy happens to list first.
 */

import type { Industry, IndustryTag } from "@/lib/api/marketplace/types";

export interface TeaserChip {
  industry: Industry;
  tag: IndustryTag;
}

/**
 * The one tag that fronts each industry — the vertical's highest-traffic
 * bookable service. Industries not listed fall back to their first tag.
 * Kept in step with the RN app's `HERO_TAG_SLUG`.
 */
const HERO_TAG_SLUG: Record<string, string> = {
  "beauty": "hair-salon",
  "spa-wellness": "massage-studio",
  "skin-aesthetics": "skincare-facial",
  "tattoo-piercing": "tattoo-studio",
  "health-medical": "dental-clinic",
  "fitness-sports": "personal-training",
  "pets": "pet-grooming",
  "automotive": "vehicle-inspection-itp",
  "home-services": "cleaning",
  "professional-services": "notary-office",
  "education-coaching": "tutoring",
  "events-creative": "photography-studio",
  "tailoring-repairs": "tailoring-alterations",
};

/** Milliseconds in a day — the shuffle seed advances once per day, UTC. */
const DAY_MS = 86_400_000;

/**
 * The current day number: the shuffle seed. Impure by design and kept out of
 * render — read it through an external-store subscription (see `TagRail`) so a
 * component never depends on the clock directly.
 */
export function currentDaySeed(): number {
  return Math.floor(Date.now() / DAY_MS);
}

/**
 * Diversity-first browse teaser: one hero tag per industry, day-shuffled.
 *
 * `daySeed` is passed in rather than read from the clock, so the order is
 * testable and a server render can be pinned to the same seed as the client
 * that hydrates it.
 */
export function industryTeaserChips(
  industries: readonly Industry[],
  daySeed: number,
): TeaserChip[] {
  const heroes: TeaserChip[] = [];
  for (const industry of industries) {
    const tags = industry.tags ?? [];
    if (tags.length === 0) continue;
    const tag =
      tags.find((x) => x.slug === HERO_TAG_SLUG[industry.slug]) ?? tags[0];
    heroes.push({ industry, tag });
  }
  return seededShuffle(heroes, daySeed);
}

// Fisher–Yates over a mulberry32 stream — deterministic for a given seed.
function seededShuffle<T>(items: T[], seed: number): T[] {
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
