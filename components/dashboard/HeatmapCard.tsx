import { Heatmap } from "@/components/charts/Heatmap";
import type { HeatmapCell } from "@/lib/types";

export function HeatmapCard({ data }: { data: HeatmapCell[] }) {
  return (
    <div className="card">
      <h2>When you&rsquo;re active (by hour &amp; day)</h2>
      <Heatmap data={data} />
    </div>
  );
}
