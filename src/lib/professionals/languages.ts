// Languages offered by the profile editor, plus the existing venue dictionary.
// Stored profiles contain display names rather than standardized language codes.
const LANGUAGE_CODES = [
  "en", "es", "fr", "de", "it", "pt", "nl", "ru", "zh", "ja", "ko",
  "ar", "hi", "ro", "pl", "tr", "el", "sv", "no", "da", "fi", "cs",
  "hu", "uk", "bg", "hr", "sr", "sk", "sl", "et", "lv", "lt",
] as const;

function normalize(value: string): string {
  return value.trim().normalize("NFC").toLowerCase();
}

const languageCodesByName = new Map<string, string>();
for (const code of LANGUAGE_CODES) languageCodesByName.set(code, code);
for (const locale of ["en", "ro"]) {
  const names = new Intl.DisplayNames([locale], { type: "language" });
  for (const code of LANGUAGE_CODES) {
    const name = names.of(code);
    if (name) languageCodesByName.set(normalize(name), code);
  }
}
// The Romanian UI uses this common name rather than CLDR's "neerlandeză".
languageCodesByName.set("olandeză", "nl");

/** Translate recognized language names for display; preserve unfamiliar content. */
export function professionalLanguageLabels(
  values: readonly string[],
  labels: Readonly<Record<string, string>>,
): string[] {
  return values.map((value) => {
    const code = languageCodesByName.get(normalize(value));
    return (code && labels[code]) || value;
  });
}
