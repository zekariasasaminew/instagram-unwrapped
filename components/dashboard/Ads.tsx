import { StatTile } from "@/components/StatTile";
import type { AdsInfo } from "@/lib/types";

export function Ads({ data }: { data: AdsInfo }) {
  return (
    <div className="card">
      <h2>Ads &amp; off-platform tracking</h2>
      <div className="stat-row">
        <StatTile value={data.advertiser_count.toLocaleString()} label="Advertisers" />
        <StatTile
          value={data.off_meta_company_count.toLocaleString()}
          label="Off-platform companies"
        />
        <StatTile
          value={(data.topic_counts.suggested_profiles_viewed ?? 0).toLocaleString()}
          label="Suggested profiles seen"
        />
      </div>
      <div className="list-note">Top advertisers who&rsquo;ve used your activity/info to target you</div>
      <div>
        {data.top_advertisers.slice(0, 10).map((a, i) => (
          <div className="bar-row" key={i}>
            <div className="bar-label" style={{ width: "auto", flex: 1 }}>
              {a}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
