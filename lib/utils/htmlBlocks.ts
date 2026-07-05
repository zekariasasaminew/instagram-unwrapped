// Port of the Python/BeautifulSoup helpers in instagram_analysis.py, using
// linkedom instead of a browser DOMParser (DOMParser is not available inside
// dedicated Web Workers in Chrome/Safari - linkedom works identically in
// workers, Node, and the main thread).
import { parseHTML } from "linkedom";
import { fixMojibake } from "./mojibake";
import { findLastTimestamp } from "./date";

export interface PamBlock {
  header: string | null;
  timestamp: string | null;
  content: string;
}

export type TableRecord = Record<string, string>;

/** Exported for parser stages that need to query a format-specific selector
 * this module doesn't have a named helper for (e.g. ads.ts's old/new export
 * format detection via <tr class="_1isx">, <span class="_38my">, <h1>). */
export function parseDocument(html: string) {
  return parseHTML(html).document;
}

export function getText(el: Element, separator = ""): string {
  const parts: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === 3 /* TEXT_NODE */) {
      const t = (node.textContent ?? "").trim();
      if (t) parts.push(t);
    } else {
      node.childNodes?.forEach(walk);
    }
  };
  walk(el);
  return parts.join(separator);
}

function directTextContent(el: Element): string {
  let text = "";
  el.childNodes.forEach((node) => {
    if (node.nodeType === 3) text += node.textContent ?? "";
  });
  return text;
}

function findParentPam(el: Element): Element | null {
  let cur = el.parentElement;
  while (cur) {
    if (cur.classList.contains("pam")) return cur;
    cur = cur.parentElement;
  }
  return null;
}

function parseDoc(html: string) {
  return parseHTML(html).document;
}

/** Yield (header, timestamp, content) for each top-level div.pam block. */
export function pamBlocks(html: string): PamBlock[] {
  const document = parseDoc(html);
  const blocks = Array.from(document.querySelectorAll("div.pam"));
  const out: PamBlock[] = [];
  for (const block of blocks) {
    const h2 = block.querySelector("h2");
    let header = h2 ? fixMojibake(getText(h2).trim()) : null;
    const fullText = fixMojibake(getText(block, " "));
    const ts = findLastTimestamp(fullText);
    if (!header) {
      const a = block.querySelector("a");
      const aText = a ? getText(a).trim() : "";
      if (aText) header = fixMojibake(aText);
    }
    let content = fullText;
    if (header) content = content.replace(header, "");
    if (ts) content = content.replace(ts, "");
    out.push({ header, timestamp: ts, content: content.trim() });
  }
  return out;
}

function extractTableRecord(table: Element): TableRecord {
  const record: TableRecord = {};
  for (const tr of Array.from(table.querySelectorAll("tr"))) {
    const tds = Array.from(tr.querySelectorAll("td"));
    if (tds.length === 2) {
      const label = getText(tds[0]).trim();
      const value = fixMojibake(getText(tds[1], " "));
      if (label) record[label] = value;
    } else if (tds.length === 1) {
      const td = tds[0];
      const nestedDiv = td.querySelector("div");
      if (nestedDiv) {
        const label = directTextContent(td).trim();
        const value = fixMojibake(getText(nestedDiv, " "));
        if (label) record[label] = value;
      }
    }
  }
  return record;
}

/** Yield label->value records for every div.pam that contains a <table>. */
export function tableRows(html: string): TableRecord[] {
  const document = parseDoc(html);
  const out: TableRecord[] = [];
  for (const block of Array.from(document.querySelectorAll("div.pam"))) {
    const table = block.querySelector("table");
    if (!table) continue;
    const record = extractTableRecord(table);
    if (Object.keys(record).length) out.push(record);
  }
  return out;
}

/** Like tableRows, but skips any div.pam that itself contains a nested
 * div.pam - i.e. only true leaf records, avoiding double-counting the
 * wrapping ancestor whose own table lookup would otherwise re-match the
 * same nested table. */
export function leafTableRows(html: string): TableRecord[] {
  const document = parseDoc(html);
  const out: TableRecord[] = [];
  for (const block of Array.from(document.querySelectorAll("div.pam"))) {
    if (block.querySelector("div.pam")) continue;
    const table = block.querySelector("table");
    if (!table) continue;
    const record = extractTableRecord(table);
    if (Object.keys(record).length) out.push(record);
  }
  return out;
}

/** Yield plain-text leaves: div.pam blocks whose content div has no nested
 * pam/table (Instagram's newer export nests plain-name lists this way, e.g.
 * advertiser names, category names). */
export function leafPamTexts(html: string): string[] {
  const document = parseDoc(html);
  const out: string[] = [];
  for (const block of Array.from(document.querySelectorAll("div.pam"))) {
    const content = block.querySelector("div._a6-p");
    if (!content) continue;
    if (content.querySelector("div.pam") || content.querySelector("table")) {
      continue;
    }
    const text = fixMojibake(getText(content).trim());
    if (text) out.push(text);
  }
  return out;
}

/** Count list entries regardless of how deeply each entry's own fields are
 * nested: every export page wraps its list in one outer div.pam, and each
 * entry is a direct child div.pam of that wrapper. */
export function countTopLevelEntries(html: string): number {
  const document = parseDoc(html);
  const allPam = Array.from(document.querySelectorAll("div.pam"));
  if (!allPam.length) return 0;
  const wrapper = allPam[0];
  let count = 0;
  for (const b of allPam.slice(1)) {
    if (findParentPam(b) === wrapper) count++;
  }
  return count;
}
