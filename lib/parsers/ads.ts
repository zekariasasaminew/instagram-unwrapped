// Port of the ADS & OFF-PLATFORM TRACKING section of instagram_analysis.py.
// Instagram changed this export's template between the two real exports this
// was developed against, so both old and new formats are supported with a
// fallback, exactly like the Python original.
import type { ZipEntry } from "../zip/zipReader";
import { parseDocument, getText, leafPamTexts, countTopLevelEntries, tableRows } from "../utils/htmlBlocks";
import { fixMojibake } from "../utils/mojibake";
import { sortedEntries } from "../utils/agg";
import type { AdsInfo } from "../types";

const ADS_TOPIC_FILES = [
  "videos_watched.html",
  "ads_viewed.html",
  "posts_viewed.html",
  "suggested_profiles_viewed.html",
];

const OFF_META_PREFIX =
  "apps_and_websites_off_of_instagram/apps_and_websites/your_activity_off_meta_technologies/";

export async function parseAds(entries: ZipEntry[]): Promise<AdsInfo> {
  const byFilename = new Map(entries.map((e) => [e.filename, e]));

  // Advertisers list: older format is a flat <table><tr class="_1isx"><strong>;
  // newer format nests plain-text leaves (dedupe, since ~1-2% of names appear
  // under both "uploaded list" and "interactions" categories).
  const advertisers: string[] = [];
  const advPath =
    "ads_information/instagram_ads_and_businesses/advertisers_using_your_activity_or_information.html";
  const advEntry = byFilename.get(advPath);
  if (advEntry) {
    const advHtml = await advEntry.getText();
    const document = parseDocument(advHtml);
    for (const tr of Array.from(document.querySelectorAll("tr._1isx"))) {
      const strong = tr.querySelector("strong");
      if (strong) advertisers.push(fixMojibake(getText(strong).trim()));
    }
    if (advertisers.length === 0) {
      const seen = new Set<string>();
      for (const text of leafPamTexts(advHtml)) {
        if (!seen.has(text)) {
          seen.add(text);
          advertisers.push(text);
        }
      }
    }
  }

  const topicCounts: Record<string, number> = {};
  for (const suffix of ADS_TOPIC_FILES) {
    const path = `ads_information/ads_and_topics/${suffix}`;
    const entry = byFilename.get(path);
    if (!entry) continue;
    const html = await entry.getText();
    topicCounts[suffix.replace(".html", "")] = countTopLevelEntries(html);
  }

  const offMetaCompanies = new Map<string, number>();
  let offMetaEvents = 0;
  for (const entry of entries) {
    if (!entry.filename.startsWith(OFF_META_PREFIX) || !entry.filename.endsWith(".html")) continue;
    const offHtml = await entry.getText();
    const document = parseDocument(offHtml);
    let matched = false;
    for (const span of Array.from(document.querySelectorAll("span._38my"))) {
      const text = fixMojibake(getText(span).trim());
      const m = /Activity received from (.+)/.exec(text);
      if (m) {
        const company = m[1].trim();
        offMetaCompanies.set(company, (offMetaCompanies.get(company) ?? 0) + 1);
        offMetaEvents++;
        matched = true;
      }
    }
    if (!matched) {
      const h1 = document.querySelector("h1");
      const company = h1
        ? fixMojibake(getText(h1).trim())
        : entry.filename.split("/").pop()!;
      const events = tableRows(offHtml).filter((r) => "Received on" in r).length;
      if (events) {
        offMetaCompanies.set(company, (offMetaCompanies.get(company) ?? 0) + events);
        offMetaEvents += events;
      }
    }
  }

  return {
    advertiser_count: advertisers.length,
    top_advertisers: advertisers.slice(0, 15),
    topic_counts: topicCounts,
    off_meta_company_count: offMetaCompanies.size,
    off_meta_event_count: offMetaEvents,
    top_off_meta_companies: sortedEntries(offMetaCompanies, 10).map(([company, events]) => ({
      company,
      events,
    })),
  };
}
