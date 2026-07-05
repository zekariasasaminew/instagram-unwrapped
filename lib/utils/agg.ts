// Small aggregation helpers shared across parser stages - equivalents of
// Python's Counter.most_common(), statistics.median(), and naive local-time
// date/month key formatting (deliberately not UTC - see date.ts).

export function bump<K>(map: Map<K, number>, key: K, by = 1): void {
  map.set(key, (map.get(key) ?? 0) + by);
}

/** Entries sorted by count descending, ties broken by insertion order
 * (matches Python's Counter.most_common(), since JS sort is stable and Map
 * preserves insertion order). */
export function sortedEntries(map: Map<string, number>, n?: number): [string, number][] {
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
  return n === undefined ? sorted : sorted.slice(0, n);
}

export function topN(
  map: Map<string, number>,
  n: number
): { word: string; count: number }[] {
  return sortedEntries(map, n).map(([word, count]) => ({ word, count }));
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** "YYYY-MM-DD" in local time (matches Python's naive date().isoformat()). */
export function localDateKey(dt: Date): string {
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

/** "YYYY-MM" in local time (matches Python's naive strftime('%Y-%m')). */
export function localMonthKey(dt: Date): string {
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}`;
}

/** ISO-like string with no timezone suffix, so `new Date(...)` re-parses it
 * as local time on the other end (matches Python's naive isoformat()). */
export function toLocalIso(dt: Date): string {
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}T${pad2(dt.getHours())}:${pad2(dt.getMinutes())}:${pad2(dt.getSeconds())}`;
}

/** Python's datetime.weekday(): Monday=0 .. Sunday=6. JS Date.getDay() is
 * Sunday=0 .. Saturday=6, so this converts between the two. */
export function pyWeekday(dt: Date): number {
  return (dt.getDay() + 6) % 7;
}
