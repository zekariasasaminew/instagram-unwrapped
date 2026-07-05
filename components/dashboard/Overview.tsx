import { StatTile } from "@/components/StatTile";
import type { Summary } from "@/lib/types";

export function Overview({ summary }: { summary: Summary }) {
  const { milestones: m, social_graph: sg, ads, security } = summary;
  const ageYears = security.account_age_days
    ? Math.round((security.account_age_days / 365) * 10) / 10
    : null;

  return (
    <div className="stat-row">
      <StatTile value={ageYears !== null ? `${ageYears} yrs` : "—"} label="Account age" />
      <StatTile value={m.total_messages.toLocaleString()} label="Total messages" />
      <StatTile value={m.total_threads.toLocaleString()} label="Conversations" />
      <StatTile value={sg.followers_count.toLocaleString()} label="Followers" />
      <StatTile value={sg.following_count.toLocaleString()} label="Following" />
      <StatTile value={ads.advertiser_count.toLocaleString()} label="Advertisers with your data" />
    </div>
  );
}
