import { describe, it, expect } from "vitest";
import { fixMojibake } from "../lib/utils/mojibake";

describe("fixMojibake", () => {
  it("repairs UTF-8 text that was mis-read as Latin-1", () => {
    // "couldn't" with a right-single-quote (U+2019), mis-encoded the way
    // Instagram's export does it.
    const original = "couldn’t";
    const mojibake = Buffer.from(original, "utf-8").toString("latin1");
    expect(fixMojibake(mojibake)).toBe(original);
  });

  it("leaves already-correct text with real emoji untouched", () => {
    const text = "so proud 🚀"; // 🚀 (surrogate pair, code points > 0xFF)
    expect(fixMojibake(text)).toBe(text);
  });

  it("leaves plain ASCII untouched", () => {
    expect(fixMojibake("hello world")).toBe("hello world");
  });

  it("handles empty strings", () => {
    expect(fixMojibake("")).toBe("");
  });
});
