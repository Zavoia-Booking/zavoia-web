// Verbatim port of zwSlug (web-blog.jsx:5). Must be used identically by prose
// headings and the TOC so generated anchor ids match exactly.
export function headingSlug(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
