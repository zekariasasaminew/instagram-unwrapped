// Port of the ACTIVITY (likes/comments/story interactions/saved) and
// engagement-leaderboard sections of instagram_analysis.py.
import type { ZipEntry } from "../zip/zipReader";
import { pamBlocks, leafTableRows } from "../utils/htmlBlocks";
import { parseTimestamp } from "../utils/date";
import { STRUCTURAL_LABELS } from "../utils/text";
import { bump, sortedEntries } from "../utils/agg";
import type { EngagementEntry } from "../types";

const ACTIVITY_PREFIXES = [
  "your_instagram_activity/likes/",
  "your_instagram_activity/comments/",
  "your_instagram_activity/story_interactions/",
  "your_instagram_activity/saved/",
];

// Notes/reposts and "Instants" interactions also record whose content you
// engaged with (Name/Username pairs), nested a level deeper than likes/comments.
const EXTRA_ENGAGEMENT_PATHS = [
  "personal_information/personal_information/note_and_repost_interactions.html",
  "your_instagram_activity/instants/instants_interactions.html",
];

export interface ActivityResult {
  activityTotals: Record<string, number>;
  engagementLeaderboard: EngagementEntry[];
}

export async function parseActivity(entries: ZipEntry[]): Promise<ActivityResult> {
  const activityTypeCounts = new Map<string, number>();
  const engagementCounter = new Map<string, number>();

  for (const entry of entries) {
    if (!entry.filename.endsWith(".html")) continue;
    const prefix = ACTIVITY_PREFIXES.find((p) => entry.filename.startsWith(p));
    if (!prefix) continue;
    const kind = prefix.split("/").filter(Boolean).slice(-1)[0]; // e.g. "likes"
    try {
      const html = await entry.getText();

      for (const { header, timestamp } of pamBlocks(html)) {
        if (parseTimestamp(timestamp) === null) continue;
        bump(activityTypeCounts, kind);
        if ((kind === "likes" || kind === "comments") && header && !STRUCTURAL_LABELS.has(header)) {
          bump(engagementCounter, header);
        }
      }

      // Instagram's newer export nests likes/comments in tables (Username /
      // Media Owner fields) instead of a flat h2=username block.
      if (kind === "likes" || kind === "comments") {
        for (const record of leafTableRows(html)) {
          const who = record["Username"] || record["Media Owner"];
          if (who) bump(engagementCounter, who);
        }
      }
    } catch {
      // One malformed fragment shouldn't abort the whole stage.
    }
  }

  const byFilename = new Map(entries.map((e) => [e.filename, e]));
  for (const path of EXTRA_ENGAGEMENT_PATHS) {
    const entry = byFilename.get(path);
    if (!entry) continue;
    const html = await entry.getText();
    for (const record of leafTableRows(html)) {
      const who = record["Username"] || record["Name"];
      if (who && !STRUCTURAL_LABELS.has(who)) bump(engagementCounter, who);
    }
  }

  return {
    activityTotals: Object.fromEntries(activityTypeCounts),
    engagementLeaderboard: sortedEntries(engagementCounter, 20).map(([who, count]) => ({
      who,
      count,
    })),
  };
}
