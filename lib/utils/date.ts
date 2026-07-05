// Instagram's export timestamps look like "Jul 05, 2026 5:31 am" - no native
// Date.parse format handles this reliably, so we parse it manually. Kept as
// local time (no timezone in the source string) to match Python's naive
// strptime - otherwise every hour-of-day in the heatmap would shift.

const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

export const DATE_RE =
  /([A-Z][a-z]{2}) (\d{1,2}), (\d{4}) (\d{1,2}):(\d{2}) ?([ap])m/;

export function parseTimestamp(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const m = DATE_RE.exec(raw);
  if (!m) return null;
  const [, monStr, dayStr, yearStr, hourStr, minStr, ampm] = m;
  const month = MONTHS[monStr];
  if (month === undefined) return null;
  const day = Number(dayStr);
  const year = Number(yearStr);
  let hour = Number(hourStr) % 12;
  if (ampm === "p") hour += 12;
  const minute = Number(minStr);
  const dt = new Date(year, month, day, hour, minute);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Find the *last* date-like match in a string. A block's own timestamp is
 * always its last child, but quote-reply previews embed the quoted message's
 * timestamp earlier in the text - taking the last match (not the first)
 * avoids picking up the wrong one. */
export function findLastTimestamp(text: string): string | null {
  const re = new RegExp(DATE_RE.source, "g");
  let match: RegExpExecArray | null;
  let last: string | null = null;
  while ((match = re.exec(text)) !== null) {
    last = match[0];
  }
  return last;
}

/** Remove every embedded date-like string (e.g. leftover quote-preview dates
 * after the real trailing timestamp has already been stripped separately). */
export function stripAllTimestamps(text: string): string {
  return text.replace(new RegExp(DATE_RE.source, "g"), " ");
}
