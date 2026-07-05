/**
 * Instagram's HTML export has a known bug: some text is UTF-8 that got
 * re-interpreted as Latin-1 somewhere in their export pipeline. Since Latin-1
 * code points map 1:1 to bytes, a mojibake string has every character's code
 * unit in 0x00-0xFF - so we can rebuild the original byte sequence and
 * re-decode it as UTF-8. Real emoji/CJK text that already decoded correctly
 * has code points above 0xFF and is left untouched (mirrors Python's
 * `s.encode('latin1')` raising UnicodeEncodeError for the same case).
 */
export function fixMojibake(s: string): string {
  if (!s) return s;
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code > 0xff) return s; // not latin1-representable - leave untouched
    bytes[i] = code;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return s;
  }
}
