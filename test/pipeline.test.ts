import { describe, it, expect } from "vitest";
import { BlobWriter, TextReader, ZipWriter } from "@zip.js/zip.js";
import { runPipeline } from "../lib/pipeline";

function msgBlock(sender: string, text: string, ts: string): string {
  return `<div class="pam _3-95 _2ph- _a6-g uiBoxWhite noborder"><h2 class="_3-95 _2pim _a6-h _a6-i">${sender}</h2><div class="_3-95 _a6-p"><div><div></div><div>${text}</div><div></div><div></div></div></div><div class="_3-94 _a6-o">${ts}</div></div>`;
}

function page(...blocks: string[]): string {
  return `<html><body><main class="_a706" role="main">${blocks.join("")}</main></body></html>`;
}

/** Build a real in-memory zip (via zip.js) so this test exercises the whole
 * pipeline exactly the way a real upload does - random-access zip reading,
 * category-prefix matching, and every parser stage together. */
async function buildTestZip(): Promise<File> {
  const writer = new ZipWriter(new BlobWriter("application/zip"));

  await writer.add(
    "your_instagram_activity/messages/inbox/sam_1/message_1.html",
    new TextReader(
      page(
        msgBlock("Zeki", "hey how is it going", "Jan 01, 2025 9:00 am"),
        msgBlock("Sam", "good hbu", "Jan 01, 2025 9:05 am")
      )
    )
  );
  await writer.add(
    "connections/followers_and_following/following.html",
    new TextReader(
      page(
        `<div class="pam"><h2>alice</h2><div class="_a6-p"><div><div><a>link</a></div><div>Jan 01, 2025 1:00 am</div></div></div></div>`
      )
    )
  );
  await writer.add(
    "connections/followers_and_following/followers_1.html",
    new TextReader(page())
  );
  await writer.add(
    "security_and_login_information/login_and_profile_creation/login_activity.html",
    new TextReader(page())
  );

  const blob = await writer.close();
  return new File([blob], "export.zip", { type: "application/zip" });
}

describe("runPipeline (end-to-end via a real in-memory zip)", () => {
  it("reads the zip, runs every stage, and assembles a Summary", async () => {
    const file = await buildTestZip();
    const phases: string[] = [];
    const summary = await runPipeline(file, (phase) => {
      if (!phases.includes(phase)) phases.push(phase);
    });

    expect(summary.milestones.you_name).toBe("Zeki");
    expect(summary.milestones.total_messages).toBe(2);
    expect(summary.social_graph.following_count).toBe(1);
    expect(summary.social_graph.followers_count).toBe(0);
    expect(summary.social_graph.not_following_back_list).toEqual(["alice"]);
    expect(summary.security.login_count).toBe(0);
    expect(summary.skipped_files).toBe(0);

    expect(phases).toContain("Parsing messages");
    expect(phases).toContain("Parsing social graph");
    expect(phases).toContain("Parsing account & security");
  });

  it("rejects a zip that doesn't look like an Instagram export", async () => {
    const writer = new ZipWriter(new BlobWriter("application/zip"));
    await writer.add("random/file.txt", new TextReader("hello"));
    const blob = await writer.close();
    const file = new File([blob], "not-instagram.zip");

    await expect(runPipeline(file)).rejects.toThrow(/doesn't look like an Instagram/);
  });
});
