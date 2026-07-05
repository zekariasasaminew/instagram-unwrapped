import { describe, it, expect } from "vitest";
import {
  detectWrappingRoot,
  looksLikeInstagramExport,
} from "../lib/zip/zipReader";

describe("detectWrappingRoot", () => {
  it("returns empty string when category folders sit at the zip root", () => {
    const files = [
      "your_instagram_activity/messages/inbox/foo/message_1.html",
      "connections/followers_and_following/following.html",
    ];
    expect(detectWrappingRoot(files)).toBe("");
  });

  it("detects and returns a single wrapping root folder", () => {
    const files = [
      "instagram-someuser-2026-01-01/your_instagram_activity/messages/inbox/foo/message_1.html",
      "instagram-someuser-2026-01-01/connections/followers_and_following/following.html",
    ];
    expect(detectWrappingRoot(files)).toBe("instagram-someuser-2026-01-01/");
  });
});

describe("looksLikeInstagramExport", () => {
  it("accepts a normal export file list", () => {
    const files = [
      "your_instagram_activity/messages/inbox/foo/message_1.html",
      "connections/followers_and_following/following.html",
      "security_and_login_information/login_and_profile_creation/login_activity.html",
    ];
    expect(looksLikeInstagramExport(files)).toBe(true);
  });

  it("rejects an unrelated zip", () => {
    const files = ["photos/vacation.jpg", "notes/todo.txt"];
    expect(looksLikeInstagramExport(files)).toBe(false);
  });
});
