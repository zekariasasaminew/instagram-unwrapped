import { describe, it, expect } from "vitest";
import { parseMessages } from "../lib/parsers/messages";
import type { ZipEntry } from "../lib/zip/zipReader";

function entry(filename: string, html: string): ZipEntry {
  return { filename, getText: async () => html };
}

function msgBlock(sender: string, text: string, ts: string): string {
  return `<div class="pam _3-95 _2ph- _a6-g uiBoxWhite noborder"><h2 class="_3-95 _2pim _a6-h _a6-i">${sender}</h2><div class="_3-95 _a6-p"><div><div></div><div>${text}</div><div></div><div></div></div></div><div class="_3-94 _a6-o">${ts}</div></div>`;
}

function thread(...blocks: string[]): string {
  return `<html><body><main class="_a706" role="main">${blocks.join("")}</main></body></html>`;
}

describe("parseMessages", () => {
  // "Zeki" appears in both threads, so it should be detected as "you".
  const threadWithSam = thread(
    msgBlock("Zeki", "hey how is it going", "Jan 01, 2025 9:00 am"),
    msgBlock("Sam", "good hbu", "Jan 01, 2025 9:05 am"),
    msgBlock("Zeki", "not bad honestly", "Jan 01, 2025 9:10 am")
  );
  const threadWithJamie = thread(
    msgBlock("Jamie", "lets meet up soon", "Feb 02, 2025 6:00 pm"),
    msgBlock("Zeki", "sounds great", "Feb 02, 2025 6:15 pm")
  );

  const entries: ZipEntry[] = [
    entry("your_instagram_activity/messages/inbox/sam_1/message_1.html", threadWithSam),
    entry("your_instagram_activity/messages/inbox/jamie_1/message_1.html", threadWithJamie),
    // non-message file should be ignored entirely
    entry("your_instagram_activity/likes/liked_posts.html", "<html></html>"),
  ];

  it("detects the account owner as the sender present in the most threads", async () => {
    const result = await parseMessages(entries);
    expect(result.milestones.you_name).toBe("Zeki");
    expect(result.milestones.total_threads).toBe(2);
    expect(result.milestones.total_messages).toBe(5);
  });

  it("builds a top-contacts ranking from 1:1 threads only", async () => {
    const result = await parseMessages(entries);
    const names = result.topContacts.map((c) => c.participant).sort();
    expect(names).toEqual(["Jamie", "Sam"]);
  });

  it("buckets messages into the correct month", async () => {
    const result = await parseMessages(entries);
    const byMonth = Object.fromEntries(result.messagesPerMonth.map((m) => [m.month, m.count]));
    expect(byMonth["2025-01"]).toBe(3);
    expect(byMonth["2025-02"]).toBe(2);
  });

  it("surfaces real content words but not stopwords", async () => {
    const result = await parseMessages(entries);
    const words = result.topWordsYou.map((w) => w.word);
    expect(words).toContain("honestly");
    expect(words).not.toContain("it"); // stopword
  });

  it("omits reply-speed entries below the 100-message volume floor", async () => {
    const result = await parseMessages(entries);
    // both contacts here have far fewer than 100 total messages
    expect(result.replySpeed).toHaveLength(0);
  });

  it("reports progress callbacks proportional to file count", async () => {
    const calls: [number, number][] = [];
    await parseMessages(entries, (processed, total) => calls.push([processed, total]));
    expect(calls.length).toBe(2); // 2 message files (the likes file isn't a message thread)
    expect(calls[calls.length - 1]).toEqual([2, 2]);
  });
});
