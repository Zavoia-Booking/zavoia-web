/** Interpolate translated copy without importing any dictionary data. */
export function format(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => vars[key] ?? match);
}

/** Cardinal counts, including Romanian's distinct 2–19 and 20+ forms. */
export function formatCount(
  count: number,
  locale: string,
  forms: { one: string; few: string; other: string },
): string {
  const plural = new Intl.PluralRules(locale).select(count);
  const template = forms[plural === "one" ? "one" : plural === "few" ? "few" : "other"];
  return format(template, { count: new Intl.NumberFormat(locale).format(count) });
}
