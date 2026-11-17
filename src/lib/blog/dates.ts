type PostDates = { publishedAt: string; modifiedAt?: string };

/** Parse an editorial timestamp, rejecting partial dates and calendar rollover. */
function timestamp(value: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return NaN;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 1 || month > 12 || day < 1 || day > days[month - 1]) return NaN;
  return Date.parse(value);
}

/** A publication claim must be a complete, valid timestamp that has elapsed. */
export function getPostPublishedAt({ publishedAt }: Pick<PostDates, "publishedAt">): string | undefined {
  const published = timestamp(publishedAt);
  return Number.isFinite(published) && published <= Date.now()
    ? new Date(published).toISOString()
    : undefined;
}

/** Only a real, already-published substantive edit may claim an update date. */
export function getPostModifiedAt({ publishedAt, modifiedAt }: PostDates): string | undefined {
  if (!modifiedAt) return undefined;
  const published = timestamp(publishedAt);
  const modified = timestamp(modifiedAt);
  if (!Number.isFinite(published) || !Number.isFinite(modified)
    || modified <= published || modified > Date.now()) return undefined;
  return new Date(modified).toISOString();
}
