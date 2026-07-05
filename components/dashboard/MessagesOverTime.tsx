import { LineChart } from "@/components/charts/LineChart";
import type { MonthCount } from "@/lib/types";

export function MessagesOverTime({ data }: { data: MonthCount[] }) {
  return (
    <div className="card">
      <h2>Messages over time</h2>
      <LineChart data={data.map((d) => ({ label: d.month, value: d.count }))} color="var(--series-you)" />
    </div>
  );
}
