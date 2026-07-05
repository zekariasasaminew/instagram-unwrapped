import { describe, it, expect } from "vitest";
import { parseTimestamp, findLastTimestamp } from "../lib/utils/date";

describe("parseTimestamp", () => {
  it("parses a morning timestamp", () => {
    const dt = parseTimestamp("Jul 05, 2026 5:31 am");
    expect(dt).not.toBeNull();
    expect(dt!.getFullYear()).toBe(2026);
    expect(dt!.getMonth()).toBe(6); // July = index 6
    expect(dt!.getDate()).toBe(5);
    expect(dt!.getHours()).toBe(5);
    expect(dt!.getMinutes()).toBe(31);
  });

  it("parses a 12am (midnight) timestamp correctly", () => {
    const dt = parseTimestamp("Jan 01, 2025 12:00 am");
    expect(dt!.getHours()).toBe(0);
  });

  it("parses a 12pm (noon) timestamp correctly", () => {
    const dt = parseTimestamp("Jan 01, 2025 12:00 pm");
    expect(dt!.getHours()).toBe(12);
  });

  it("parses a pm timestamp with hour rollover", () => {
    const dt = parseTimestamp("Oct 05, 2025 7:51 pm");
    expect(dt!.getHours()).toBe(19);
  });

  it("returns null for garbage input", () => {
    expect(parseTimestamp("not a date")).toBeNull();
    expect(parseTimestamp(null)).toBeNull();
    expect(parseTimestamp(undefined)).toBeNull();
  });
});

describe("findLastTimestamp", () => {
  it("picks the last of two embedded dates (quote-reply case)", () => {
    const text =
      "Thank you so much! Sam () Jan 01, 2025 8:00 pm Jan 02, 2025 4:15 pm";
    expect(findLastTimestamp(text)).toBe("Jan 02, 2025 4:15 pm");
  });

  it("returns null when there is no date", () => {
    expect(findLastTimestamp("no dates here")).toBeNull();
  });
});
