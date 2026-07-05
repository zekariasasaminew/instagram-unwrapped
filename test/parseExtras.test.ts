import { describe, it, expect } from "vitest";
import { parseExtras } from "../lib/parsers/extras";
import type { ZipEntry } from "../lib/zip/zipReader";

function entry(filename: string, html: string): ZipEntry {
  return { filename, getText: async () => html };
}

function leafEntry(rows: [string, string][]): string {
  const cells = rows.map(([k, v]) => `<tr><td class="_a6_q">${k}</td><td class="_2piu _a6_r">${v}</td></tr>`).join("");
  return `<div class="pam"><div class="_3-95 _a6-p"><div class="pam"><div class="_a6-p"><table>${cells}</table></div></div></div><div class="_3-94 _a6-o"></div></div>`;
}

describe("parseExtras", () => {
  it("parses recent searches with a top-queries ranking", async () => {
    const html = `<html><body><main>${leafEntry([
      ["Search query", "chicago fire fc"],
      ["Update time", "Jul 04, 2026 9:03 pm"],
    ])}${leafEntry([
      ["Search query", "chicago fire fc"],
      ["Update time", "Jul 01, 2026 9:03 pm"],
    ])}</main></body></html>`;
    const entries: ZipEntry[] = [
      entry("logged_information/recent_searches/recent_searches.html", html),
    ];
    const result = await parseExtras(entries);
    expect(result.recentSearches.total).toBe(2);
    expect(result.recentSearches.top_queries[0]).toEqual({ query: "chicago fire fc", count: 2 });
    expect(result.recentSearches.most_recent[0].time).toBe("Jul 04, 2026 9:03 pm");
  });

  it("parses AI interest categories", async () => {
    const html = `<html><body><main>${leafEntry([
      ["Interest", "The user might be interested in technology"],
      ["Last updated time", "Jul 05, 2026 2:54 am"],
    ])}</main></body></html>`;
    const entries: ZipEntry[] = [
      entry("your_instagram_activity/ai/interest_categories.html", html),
    ];
    const result = await parseExtras(entries);
    expect(result.aiInterests).toEqual([
      { interest: "The user might be interested in technology", time: "Jul 05, 2026 2:54 am" },
    ]);
  });

  it("dedupes shopping items while preserving first-seen order", async () => {
    const html = `<html><body><main><div class="pam"><div class="_3-95 _a6-p"><table><tr><td colspan="2" class="_a6_q">Product names<div><div>
      <div><div class="pam"><div class="_a6-p">Item One</div></div></div>
      <div><div class="pam"><div class="_a6-p">Item Two</div></div></div>
      <div><div class="pam"><div class="_a6-p">Item One</div></div></div>
    </div></div></td></tr></table></div></div></main></body></html>`;
    const entries: ZipEntry[] = [
      entry("your_instagram_activity/shopping/recently_viewed_items.html", html),
    ];
    const result = await parseExtras(entries);
    expect(result.shoppingRecentlyViewed).toEqual(["Item One", "Item Two"]);
  });

  it("returns empty defaults when files are absent", async () => {
    const result = await parseExtras([]);
    expect(result.recentSearches.total).toBe(0);
    expect(result.aiInterests).toEqual([]);
    expect(result.shoppingRecentlyViewed).toEqual([]);
  });
});
