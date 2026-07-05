import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  pamBlocks,
  tableRows,
  leafTableRows,
  leafPamTexts,
  countTopLevelEntries,
} from "../lib/utils/htmlBlocks";

function fixture(name: string): string {
  return readFileSync(join(__dirname, "fixtures", name), "utf-8");
}

describe("pamBlocks", () => {
  it("extracts header, timestamp, and content for each message block", () => {
    const blocks = pamBlocks(fixture("message-thread.html"));
    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toMatchObject({
      header: "Alex",
      timestamp: "Jan 02, 2025 4:15 pm",
      content: "hey are we still on for tomorrow",
    });
    expect(blocks[1].header).toBe("Sam");
    expect(blocks[2].content).toBe("You missed an audio call");
  });

  it("picks the real trailing timestamp, not an embedded quote-reply date", () => {
    const blocks = pamBlocks(fixture("message-quote-reply.html"));
    expect(blocks).toHaveLength(1);
    // the real send time is the LAST date in the block, not the quoted one
    expect(blocks[0].timestamp).toBe("Jan 02, 2025 4:15 pm");
  });
});

describe("tableRows / leafTableRows", () => {
  it("extracts both colspan-2 single-td and two-td table rows", () => {
    const rows = tableRows(fixture("login-activity.html"));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      "IP Address": "10.0.0.1",
      Time: "Jan 02, 2025 6:00 am",
    });
  });

  it("leafTableRows isolates only the deepest leaf table (Username), skipping wrapper blobs", () => {
    const rows = leafTableRows(fixture("nested-owner.html"));
    // Should find exactly the leaf Owner table, not the outer URL/Caption table
    const withUsername = rows.filter((r) => "Username" in r);
    expect(withUsername).toHaveLength(1);
    expect(withUsername[0]).toMatchObject({
      Name: "Example Account",
      Username: "example_account",
    });
  });
});

describe("leafPamTexts", () => {
  it("extracts plain-text leaves from a nested name list, including duplicates", () => {
    const texts = leafPamTexts(fixture("leaf-names-list.html"));
    expect(texts).toEqual(["Fake Brand One", "Fake Brand Two", "Fake Brand One"]);
  });
});

describe("countTopLevelEntries", () => {
  it("counts direct-child entries under the single page wrapper, regardless of internal nesting", () => {
    expect(countTopLevelEntries(fixture("count-entries.html"))).toBe(3);
  });

  it("returns 0 for html with no pam blocks", () => {
    expect(countTopLevelEntries("<html><body>nothing here</body></html>")).toBe(0);
  });
});
