import { describe, it, expect } from "vitest";
import { parseActivity } from "../lib/parsers/activity";
import type { ZipEntry } from "../lib/zip/zipReader";

function entry(filename: string, html: string): ZipEntry {
  return { filename, getText: async () => html };
}

describe("parseActivity", () => {
  it("counts activity totals and builds an engagement leaderboard from flat + table formats", async () => {
    const likedPosts = `<html><body><main><div class="pam _3-95 _2ph- _a6-g uiBoxWhite noborder"><h2 class="_3-95 _2pim _a6-h _a6-i">fake_account_one</h2><div class="_a6-p"><div><div><a target="_blank" href="https://www.instagram.com/p/fake/">&#128077;</a></div><div>Jan 05, 2025 4:40 am</div></div></div></div></main></body></html>`;

    const reelsComments = `<html><body><main><div class="pam _3-95 _2ph- _a6-g uiBoxWhite noborder"><div class="_a6-p"><table><tr><td colspan="2" class="_2pin _a6_q">Comment<div><div>nice one</div></div></td></tr><tr><td colspan="2" class="_2pin _a6_q">Media Owner<div><div>fake_account_two</div></div></td></tr><tr><td class="_2pin _a6_q">Time</td><td class="_2pin _2piu _a6_r">Jan 06, 2025 1:00 pm</td></tr></table></div></div></main></body></html>`;

    const notesReposts = `<html><body><main><div class="pam"><div class="_a6-p"><table><tr><td colspan="2" class="_a6_q"><div><div class="pam"><h2 class="_a6-h">Author</h2><div class="_a6-p"><div class="pam"><div class="_a6-p"><table><tr><td class="_a6_q">Name</td><td class="_2piu _a6_r">Fake Person</td></tr><tr><td class="_a6_q">Username</td><td class="_2piu _a6_r">fake_account_one</td></tr></table></div></div></div></div></div></td></tr></table></div></div></main></body></html>`;

    const entries: ZipEntry[] = [
      entry("your_instagram_activity/likes/liked_posts.html", likedPosts),
      entry("your_instagram_activity/comments/reels_comments.html", reelsComments),
      entry(
        "personal_information/personal_information/note_and_repost_interactions.html",
        notesReposts
      ),
    ];

    const result = await parseActivity(entries);
    expect(result.activityTotals.likes).toBe(1);
    expect(result.activityTotals.comments).toBe(1);

    const byWho = Object.fromEntries(result.engagementLeaderboard.map((e) => [e.who, e.count]));
    // fake_account_one appears once via the flat likes h2 and once via notes/reposts
    expect(byWho["fake_account_one"]).toBe(2);
    expect(byWho["fake_account_two"]).toBe(1);
    // structural labels must never leak in as if they were usernames
    expect(byWho["Owner"]).toBeUndefined();
    expect(byWho["Author"]).toBeUndefined();
    expect(byWho["Media Owner"]).toBeUndefined();
  });
});
