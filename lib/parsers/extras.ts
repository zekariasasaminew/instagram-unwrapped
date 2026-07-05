// Port of the EXTRAS section of instagram_analysis.py: recent searches,
// Meta AI's inferred interest categories, and shopping activity.
import type { ZipEntry } from "../zip/zipReader";
import { leafTableRows, leafPamTexts } from "../utils/htmlBlocks";
import { sortedEntries } from "../utils/agg";
import type { RecentSearches, AiInterest } from "../types";

export interface ExtrasResult {
  recentSearches: RecentSearches;
  aiInterests: AiInterest[];
  shoppingRecentlyViewed: string[];
}

export async function parseExtras(entries: ZipEntry[]): Promise<ExtrasResult> {
  const byFilename = new Map(entries.map((e) => [e.filename, e]));

  const searchCounter = new Map<string, number>();
  const searchRows: { query: string; time: string }[] = [];
  const searchEntry = byFilename.get("logged_information/recent_searches/recent_searches.html");
  if (searchEntry) {
    const html = await searchEntry.getText();
    for (const record of leafTableRows(html)) {
      const q = record["Search query"];
      const t = record["Update time"];
      if (q) {
        searchCounter.set(q, (searchCounter.get(q) ?? 0) + 1);
        searchRows.push({ query: q, time: t ?? "" });
      }
    }
  }
  const recentSearches: RecentSearches = {
    total: searchRows.length,
    top_queries: sortedEntries(searchCounter, 20).map(([query, count]) => ({ query, count })),
    most_recent: searchRows.slice(0, 20),
  };

  const aiInterests: AiInterest[] = [];
  const aiEntry = byFilename.get("your_instagram_activity/ai/interest_categories.html");
  if (aiEntry) {
    const html = await aiEntry.getText();
    for (const record of leafTableRows(html)) {
      const interest = record["Interest"];
      const t = record["Last updated time"];
      if (interest) aiInterests.push({ interest, time: t ?? "" });
    }
  }

  let shoppingRecentlyViewed: string[] = [];
  const shopEntry = byFilename.get("your_instagram_activity/shopping/recently_viewed_items.html");
  if (shopEntry) {
    const html = await shopEntry.getText();
    shoppingRecentlyViewed = [...new Set(leafPamTexts(html))]; // dedupe, keep order
  }

  return {
    recentSearches,
    aiInterests: aiInterests.slice(0, 30),
    shoppingRecentlyViewed: shoppingRecentlyViewed.slice(0, 30),
  };
}
