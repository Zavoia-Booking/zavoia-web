import type { PortableTextBlock } from "@portabletext/types";

// Estimate reading time from Portable Text body. Flattens every `block`-type
// entry's text children, counts whitespace-delimited words, and assumes a
// 200 wpm reading pace. Defensive about block/child shape.
export function readingMinutes(
  body: PortableTextBlock[] | undefined,
): number {
  if (!body || body.length === 0) return 1;

  let text = "";
  for (const block of body) {
    if (!block || block._type !== "block") continue;
    const children = (block as PortableTextBlock).children;
    if (!Array.isArray(children)) continue;
    for (const child of children) {
      if (
        child &&
        typeof child === "object" &&
        "text" in child &&
        typeof (child as { text?: unknown }).text === "string"
      ) {
        text += " " + (child as { text: string }).text;
      }
    }
  }

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`;
}
