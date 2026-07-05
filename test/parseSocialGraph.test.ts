import { describe, it, expect } from "vitest";
import { parseSocialGraph } from "../lib/parsers/socialGraph";
import type { ZipEntry } from "../lib/zip/zipReader";

function entry(filename: string, html: string): ZipEntry {
  return { filename, getText: async () => html };
}

function nameList(...names: string[]): string {
  const blocks = names
    .map(
      (n) =>
        `<div class="pam _3-95 _2ph- _a6-g uiBoxWhite noborder"><h2 class="_3-95 _2pim _a6-h _a6-i">${n}</h2><div class="_a6-p"><div><div><a>link</a></div><div>Jan 01, 2025 1:00 am</div></div></div></div>`
    )
    .join("");
  return `<html><body><main>${blocks}</main></body></html>`;
}

describe("parseSocialGraph", () => {
  it("computes mutual/non-mutual follower differences correctly", async () => {
    const entries: ZipEntry[] = [
      entry(
        "connections/followers_and_following/following.html",
        nameList("alice", "bob", "carol")
      ),
      entry("connections/followers_and_following/followers_1.html", nameList("alice", "dave")),
    ];

    const result = await parseSocialGraph(entries);
    expect(result.following_count).toBe(3);
    expect(result.followers_count).toBe(2);
    // you follow bob & carol, neither follows you back
    expect(result.not_following_back_count).toBe(2);
    expect(result.not_following_back_list).toEqual(["bob", "carol"]);
    // dave follows you, you don't follow back
    expect(result.not_followed_back_count).toBe(1);
  });

  it("returns empty/zeroed results when files are missing from the export", async () => {
    const result = await parseSocialGraph([]);
    expect(result.followers_count).toBe(0);
    expect(result.following_count).toBe(0);
    expect(result.not_following_back_list).toEqual([]);
  });
});
