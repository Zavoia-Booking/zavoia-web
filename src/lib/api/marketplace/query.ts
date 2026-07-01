/**
 * Tiny query-string helper for the marketplace GET endpoints.
 *
 * Builds a URLSearchParams from a flat record, skipping `undefined` / `null`.
 * Array values are joined into a single CSV param (matches the API's tagIds wire
 * format). Returns a leading-`?` string, or "" when there are no params.
 */
export function buildQuery(
  params: Record<string, string | number | boolean | number[] | undefined | null>,
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      search.set(key, value.join(","));
      continue;
    }

    search.set(key, String(value));
  }

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
