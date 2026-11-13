import { LOCALES } from "@/i18n/locales";

// CLDR regions that are not countries.
const NOT_COUNTRIES = new Set(["EU", "EZ", "QO", "UN", "XA", "XB", "ZZ"]);
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

let lookup: { codes: Set<string>; byName: Map<string, string> } | undefined;

/** The current code for a region: withdrawn ones resolve (DD → DE, UK → GB). */
function currentRegion(code: string): string | undefined {
  return new Intl.Locale(`und-${code}`).region;
}

/** Case, accents and punctuation ignored: "România" and "romania" match. */
function nameKey(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

/**
 * Every country's name in English, in the site's languages and in the
 * country's own language, built once from the runtime's Intl region data.
 */
function countries() {
  if (lookup) return lookup;
  const displayNames = new Map<string, Intl.DisplayNames>();
  const namesIn = (language: string) => {
    let names = displayNames.get(language);
    if (!names) {
      names = new Intl.DisplayNames([language], { type: "region", fallback: "none" });
      displayNames.set(language, names);
    }
    return names;
  };
  const codes = new Set<string>();
  const byName = new Map<string, string>();
  // English first, so it wins if two languages ever share a spelling.
  const siteLanguages = ["en", ...LOCALES.filter((language) => language !== "en")];
  for (const first of LETTERS) {
    for (const second of LETTERS) {
      const code = first + second;
      // A withdrawn code carries its successor's name, so only current codes
      // are indexed: "Germania" must give DE, never the old DD.
      if (NOT_COUNTRIES.has(code) || currentRegion(code) !== code || !namesIn("en").of(code)) continue;
      codes.add(code);
      const ownLanguage = new Intl.Locale(`und-${code}`).maximize().language;
      for (const language of [...siteLanguages, ownLanguage]) {
        const name = namesIn(language).of(code);
        const key = name ? nameKey(name) : "";
        if (key && !byName.has(key)) byName.set(key, code);
      }
    }
  }
  lookup = { codes, byName };
  return lookup;
}

/**
 * ISO 3166-1 alpha-2 code for a stored country: a code, or the country's name
 * in English, a site language or its own language. No country list is kept
 * here, so any country works. Undefined when the value matches none.
 */
export function countryCode(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const trimmed = value.trim();
  const { codes, byName } = countries();
  if (/^[a-z]{2}$/i.test(trimmed)) {
    const code = currentRegion(trimmed.toUpperCase());
    return code && codes.has(code) ? code : undefined;
  }
  return byName.get(nameKey(trimmed));
}
