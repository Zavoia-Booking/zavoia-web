import type { IndustrySlug } from "@/lib/marketplace/industry-visuals";
import type { StreetBuildingKind } from "./street-buildings";

export const STREET_WIDTH = 1600;
export const STREET_HEIGHT = 360;
export const STREET_GROUND = 330;

/** One source of geometry for the server drawing and its HTML hit areas. */
export const STREET_BUSINESSES: {
  industry: IndustrySlug;
  kind: StreetBuildingKind;
  x: number;
  y: number;
  scale: number;
  pinX: number;
  pinY: number;
  roofY: number;
}[] = [
  { industry: "beauty", kind: "salon", x: 20, y: 150, scale: .9, pinX: 105.5, pinY: 136.7, roofY: 188.7 },
  { industry: "automotive", kind: "garage", x: 205, y: 150, scale: .9, pinX: 295, pinY: 152, roofY: 204 },
  { industry: "health-medical", kind: "clinic", x: 410, y: 114, scale: .9, pinX: 491, pinY: 82.7, roofY: 134.7 },
  { industry: "events-creative", kind: "studio", x: 598, y: 166, scale: .82, pinX: 700.5, pinY: 132.9, roofY: 184.9 },
  { industry: "fitness-sports", kind: "gym", x: 817, y: 150, scale: .9, pinX: 907, pinY: 135.8, roofY: 187.8 },
  { industry: "spa-wellness", kind: "wellness", x: 1020, y: 150, scale: .9, pinX: 1103.7, pinY: 147.5, roofY: 199.5 },
  { industry: "pets", kind: "groomer", x: 1220, y: 150, scale: .9, pinX: 1301, pinY: 150.2, roofY: 202.2 },
  { industry: "education-coaching", kind: "school", x: 1392, y: 150, scale: .9, pinX: 1491, pinY: 116, roofY: 168 },
];
