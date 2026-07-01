import type { Locale } from "./locales";
import { en } from "./dictionaries/en";
import { ro } from "./dictionaries/ro";

// `en` is the source of truth for the shape; new keys added to en.ts flow
// into this type, and ro.ts is forced to match it.
export type Dictionary = typeof en;

export const dictionaries: Record<Locale, Dictionary> = { en, ro };

export function format(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => vars[key] ?? match);
}
