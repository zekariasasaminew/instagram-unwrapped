// Orchestrates every parser stage against one opened zip and assembles the
// final Summary - the single entry point the Web Worker calls.
import { openZip } from "./zip/zipReader";
import { parseMessages } from "./parsers/messages";
import { parseActivity } from "./parsers/activity";
import { parseSocialGraph } from "./parsers/socialGraph";
import { parseAds } from "./parsers/ads";
import { parseSecurity } from "./parsers/security";
import { parseExtras } from "./parsers/extras";
import type { Summary } from "./types";

export type ProgressCallback = (phase: string, processed: number, total: number) => void;

export async function runPipeline(file: File, onProgress?: ProgressCallback): Promise<Summary> {
  const { entries, close } = await openZip(file);
  try {
    onProgress?.("Parsing messages", 0, 1);
    const messages = await parseMessages(entries, (processed, total) => {
      onProgress?.("Parsing messages", processed, total);
    });

    onProgress?.("Parsing activity & engagement", 0, 1);
    const activity = await parseActivity(entries);
    onProgress?.("Parsing activity & engagement", 1, 1);

    onProgress?.("Parsing social graph", 0, 1);
    const socialGraph = await parseSocialGraph(entries);
    onProgress?.("Parsing social graph", 1, 1);

    onProgress?.("Parsing ads & off-platform tracking", 0, 1);
    const ads = await parseAds(entries);
    onProgress?.("Parsing ads & off-platform tracking", 1, 1);

    onProgress?.("Parsing account & security", 0, 1);
    const security = await parseSecurity(entries);
    onProgress?.("Parsing account & security", 1, 1);

    onProgress?.("Parsing searches, AI interests, shopping", 0, 1);
    const extras = await parseExtras(entries);
    onProgress?.("Parsing searches, AI interests, shopping", 1, 1);

    const summary: Summary = {
      top_contacts: messages.topContacts,
      top_words_you: messages.topWordsYou,
      top_words_replies: messages.topWordsReplies,
      top_words_you_nonfiller: messages.topWordsYouNonfiller,
      top_words_replies_nonfiller: messages.topWordsRepliesNonfiller,
      top_words_by_year: messages.topWordsByYear,
      top_emoji: messages.topEmoji,
      heatmap: messages.heatmap,
      messages_per_month: messages.messagesPerMonth,
      messages_per_year: messages.messagesPerYear,
      contact_year_breakdown: messages.contactYearBreakdown,
      milestones: messages.milestones,
      longest_streak: messages.longestStreak,
      activity_totals: activity.activityTotals,
      social_graph: socialGraph,
      ads,
      security,
      recent_searches: extras.recentSearches,
      ai_interests: extras.aiInterests,
      shopping_recently_viewed: extras.shoppingRecentlyViewed,
      engagement_leaderboard: activity.engagementLeaderboard,
      reply_speed: messages.replySpeed,
      skipped_files: messages.skippedFiles,
    };

    return summary;
  } finally {
    await close();
  }
}
