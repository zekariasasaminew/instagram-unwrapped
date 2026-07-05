import { HBarChart } from "@/components/charts/HBarChart";

export function ActivityTotals({ data }: { data: Record<string, number> }) {
  return (
    <div className="card">
      <h2>Account activity totals</h2>
      <HBarChart
        items={[
          { label: "Likes given", value: data.likes ?? 0 },
          { label: "Story interactions", value: data.story_interactions ?? 0 },
          { label: "Comments", value: data.comments ?? 0 },
          { label: "Saved posts", value: data.saved ?? 0 },
        ]}
        color="var(--series-you)"
        maxBars={10}
      />
    </div>
  );
}
