/** Keep the catch-all industry last without changing the order of discoveries. */
export function otherIndustryLast<T>(
  items: readonly T[],
  getIndustrySlug: (item: T) => string,
): T[] {
  const specific: T[] = [];
  const other: T[] = [];
  for (const item of items) {
    (getIndustrySlug(item) === "other" ? other : specific).push(item);
  }
  return [...specific, ...other];
}
