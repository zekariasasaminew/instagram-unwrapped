import { HBarChart } from "@/components/charts/HBarChart";
import type { EngagementEntry } from "@/lib/types";

export function EngagementLeaderboard({ data }: { data: EngagementEntry[] }) {
  return (
    <div className="card">
      <h2>Who you engage with, beyond DMs</h2>
      <div className="list-note">
        Whose posts you like/comment on most, plus Notes, reposts, and Instants interactions
      </div>
      <div style={{ marginTop: 10 }}>
        <HBarChart
          items={data.map((d) => ({ label: d.who, value: d.count }))}
          color="var(--series-them)"
          maxBars={15}
        />
      </div>
    </div>
  );
}
