/** Safe inside a native JSON-LD script, including editor- and merchant-supplied text. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
