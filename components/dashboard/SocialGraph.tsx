import { StatTile } from "@/components/StatTile";
import { HBarChart } from "@/components/charts/HBarChart";
import type { SocialGraph as SocialGraphData } from "@/lib/types";

export function SocialGraph({ data }: { data: SocialGraphData }) {
  const mutual = data.following_count - data.not_following_back_count;

  return (
    <div className="card">
      <h2>Social graph</h2>
      <div className="stat-row">
        <StatTile value={data.followers_count.toLocaleString()} label="Followers" />
        <StatTile value={data.following_count.toLocaleString()} label="Following" />
        <StatTile value={mutual.toLocaleString()} label="Mutual" />
        <StatTile value={data.close_friends_count.toLocaleString()} label="Close friends" />
      </div>
      <HBarChart
        items={[
          { label: "Follow back, don't follow you", value: data.not_followed_back_count },
          { label: "You follow, don't follow back", value: data.not_following_back_count },
          { label: "Recently unfollowed (by you)", value: data.recently_unfollowed_count },
          { label: "Blocked", value: data.blocked_count },
        ]}
        color="var(--series-them)"
        maxBars={10}
      />
      <div className="list-note" style={{ marginTop: 16 }}>
        Accounts you follow that don&rsquo;t follow you back ({data.not_following_back_list.length}
        ), as of this export&rsquo;s snapshot:
      </div>
      <div style={{ maxHeight: 220, overflowY: "auto", marginTop: 6 }}>
        {data.not_following_back_list.map((u) => (
          <div
            key={u}
            style={{ padding: "3px 0", fontSize: 13, borderBottom: "1px solid var(--gridline)" }}
          >
            {u}
          </div>
        ))}
      </div>
    </div>
  );
}
