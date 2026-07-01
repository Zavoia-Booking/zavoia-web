// Verbatim port of zwPageWindow (web-blog.jsx:115-123). Builds a windowed page
// list: shows all pages when there are few, otherwise keeps first/last/current
// (and the pages adjacent to current) and inserts a literal "gap" wherever the
// numbering jumps by more than one. Page indices are 0-based.
export function pageWindow(
  page: number,
  total: number,
): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const keep = new Set([0, total - 1, page, page - 1, page + 1]);
  const sorted = [...keep]
    .filter((p) => p >= 0 && p < total)
    .sort((a, b) => a - b);
  const out: Array<number | "gap"> = [];
  let prev = -2;
  for (const p of sorted) {
    if (p - prev > 1) out.push("gap");
    out.push(p);
    prev = p;
  }
  return out;
}
