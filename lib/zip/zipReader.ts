// Thin wrapper around @zip.js/zip.js: reads only the central directory (a
// few hundred KB even for ~8000 entries) via BlobReader's random access into
// the Blob's tail, then decompresses individual .html entries on demand.
// Never call file.arrayBuffer()/file.text() on the whole File - that's the
// actual way a 2-4GB input would blow up memory.
import { configure, BlobReader, ZipReader, TextWriter, type Entry } from "@zip.js/zip.js";

// We're already inside our own dedicated Worker - let zip.js decompress
// inline instead of spawning nested workers per entry (no parallelism
// benefit for ~8000 small files, pure overhead).
configure({ useWebWorkers: false });

export interface ZipEntry {
  /** Path with a possible single wrapping root folder already stripped. */
  filename: string;
  getText: () => Promise<string>;
}

const KNOWN_TOP_LEVEL = new Set([
  "your_instagram_activity",
  "connections",
  "ads_information",
  "apps_and_websites_off_of_instagram",
  "logged_information",
  "personal_information",
  "preferences",
  "security_and_login_information",
  "media",
  "files",
  "start_here.html",
]);

/** Some export tools/versions nest everything one level deeper inside a
 * single wrapping folder. Detect that case and strip it so category-prefix
 * matching works regardless of layout. */
export function detectWrappingRoot(filenames: string[]): string {
  if (filenames.length === 0) return "";
  const firsts = new Set(filenames.map((f) => f.split("/")[0]));
  if (firsts.size === 1) {
    const only = [...firsts][0];
    if (only && !KNOWN_TOP_LEVEL.has(only)) {
      return only + "/";
    }
  }
  return "";
}

export function looksLikeInstagramExport(filenames: string[]): boolean {
  const tops = new Set(filenames.map((f) => f.split("/")[0]));
  let matches = 0;
  for (const known of KNOWN_TOP_LEVEL) {
    if (tops.has(known)) matches++;
  }
  return matches >= 3; // a handful of the known categories should be present
}

export interface OpenedZip {
  entries: ZipEntry[];
  close: () => Promise<void>;
}

export async function openZip(file: File): Promise<OpenedZip> {
  const reader = new ZipReader(new BlobReader(file));
  let rawEntries: Entry[];
  try {
    rawEntries = await reader.getEntries();
  } catch (err) {
    await reader.close().catch(() => {});
    throw new Error(
      "This doesn't look like a valid zip file. Please upload the .zip Instagram sent you, without extracting it first."
    );
  }

  const rootPrefix = detectWrappingRoot(rawEntries.map((e) => e.filename));
  const stripped = rawEntries.map((e) => ({
    raw: e,
    filename: rootPrefix ? e.filename.slice(rootPrefix.length) : e.filename,
  }));

  if (!looksLikeInstagramExport(stripped.map((e) => e.filename))) {
    await reader.close().catch(() => {});
    throw new Error(
      "This doesn't look like an Instagram HTML export. Make sure you requested the \"HTML\" format (not JSON) from Instagram's \"Download your information\" page."
    );
  }

  const entries: ZipEntry[] = stripped
    .filter((e) => !e.raw.directory)
    .map((e) => ({
      filename: e.filename,
      getText: async () => {
        const fileEntry = e.raw as Extract<Entry, { directory: false }>;
        return fileEntry.getData(new TextWriter("utf-8"));
      },
    }));

  return { entries, close: () => reader.close() };
}
