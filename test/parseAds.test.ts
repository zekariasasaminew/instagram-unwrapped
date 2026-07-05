import { describe, it, expect } from "vitest";
import { parseAds } from "../lib/parsers/ads";
import type { ZipEntry } from "../lib/zip/zipReader";

function entry(filename: string, html: string): ZipEntry {
  return { filename, getText: async () => html };
}

describe("parseAds", () => {
  it("parses the older flat-table advertiser format", async () => {
    const oldFormat = `<html><body><table><tr class="_1isx"><td><strong>Brand A</strong></td><td>x</td><td>x</td></tr><tr class="_1isx"><td><strong>Brand B</strong></td><td>x</td><td>x</td></tr></table></body></html>`;
    const entries: ZipEntry[] = [
      entry(
        "ads_information/instagram_ads_and_businesses/advertisers_using_your_activity_or_information.html",
        oldFormat
      ),
    ];
    const result = await parseAds(entries);
    expect(result.advertiser_count).toBe(2);
    expect(result.top_advertisers).toEqual(["Brand A", "Brand B"]);
  });

  it("falls back to the newer nested-leaf format and dedupes", async () => {
    const newFormat = `<html><body><main><div class="pam"><div class="_a6-p"><div class="pam"><div class="_a6-p"><table><tr><td colspan="2" class="_a6_q">Name<div><div><div><div class="pam"><div class="_a6-p">Brand C</div></div></div><div><div class="pam"><div class="_a6-p">Brand C</div></div></div></div></td></tr></table></div></div></div></div></main></body></html>`;
    const entries: ZipEntry[] = [
      entry(
        "ads_information/instagram_ads_and_businesses/advertisers_using_your_activity_or_information.html",
        newFormat
      ),
    ];
    const result = await parseAds(entries);
    expect(result.advertiser_count).toBe(1); // deduped
    expect(result.top_advertisers).toEqual(["Brand C"]);
  });

  it("counts ad-topic entries regardless of internal nesting depth", async () => {
    const topicHtml = `<html><body><main><div class="pam"><div class="_a6-p">
      <div class="pam"><div class="_a6-p"><table><tr><td>Author</td><td>a</td></tr></table></div></div>
      <div class="pam"><div class="_a6-p"><table><tr><td>Author</td><td>b</td></tr></table></div></div>
    </div></div></main></body></html>`;
    const entries: ZipEntry[] = [
      entry("ads_information/ads_and_topics/ads_viewed.html", topicHtml),
    ];
    const result = await parseAds(entries);
    expect(result.topic_counts["ads_viewed"]).toBe(2);
  });

  it("parses the older off-meta span format", async () => {
    const oldOffMeta = `<html><body><main><span class="_38my">Activity received from Criteo US<span class="_c1c"></span></span></main></body></html>`;
    const entries: ZipEntry[] = [
      entry(
        "apps_and_websites_off_of_instagram/apps_and_websites/your_activity_off_meta_technologies/0.html",
        oldOffMeta
      ),
    ];
    const result = await parseAds(entries);
    expect(result.off_meta_company_count).toBe(1);
    expect(result.off_meta_event_count).toBe(1);
    expect(result.top_off_meta_companies[0]).toMatchObject({ company: "Criteo US", events: 1 });
  });

  it("parses the newer off-meta h1+table format with multiple events", async () => {
    const newOffMeta = `<html><body><main><h1>829 Studios</h1><div class="pam"><div class="_a6-p"><table><tr><td class="_a6_q">Received on</td><td class="_2piu _a6_r">Jan 01, 2025 1:00 am</td></tr></table></div></div><div class="pam"><div class="_a6-p"><table><tr><td class="_a6_q">Received on</td><td class="_2piu _a6_r">Jan 02, 2025 1:00 am</td></tr></table></div></div></main></body></html>`;
    const entries: ZipEntry[] = [
      entry(
        "apps_and_websites_off_of_instagram/apps_and_websites/your_activity_off_meta_technologies/829studios_1.html",
        newOffMeta
      ),
    ];
    const result = await parseAds(entries);
    expect(result.off_meta_company_count).toBe(1);
    expect(result.off_meta_event_count).toBe(2);
    expect(result.top_off_meta_companies[0]).toMatchObject({ company: "829 Studios", events: 2 });
  });
});
