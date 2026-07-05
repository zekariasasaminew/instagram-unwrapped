import { VBarChart } from "@/components/charts/VBarChart";
import { StackedYearChart } from "@/components/charts/StackedYearChart";
import type { YearCount, ContactYearBreakdown } from "@/lib/types";

export function YearBreakdown({
  messagesPerYear,
  contactYearBreakdown,
}: {
  messagesPerYear: YearCount[];
  contactYearBreakdown: ContactYearBreakdown;
}) {
  return (
    <div className="card">
      <h2>Why the last year or two looks quieter</h2>
      <div className="two-col">
        <div>
          <div className="list-note">Total messages per year</div>
          <VBarChart
            data={messagesPerYear.map((d) => ({ label: String(d.year), value: d.count }))}
            color="var(--series-you)"
          />
        </div>
        <div>
          <div className="list-note">
            Active conversations per year (distinct threads with ≥1 message)
          </div>
          <VBarChart
            data={messagesPerYear.map((d) => ({ label: String(d.year), value: d.active_threads }))}
            color="var(--series-them)"
          />
        </div>
      </div>
      <div className="list-note" style={{ marginTop: 18 }}>
        Same yearly totals, broken down by who you were talking to
      </div>
      <StackedYearChart breakdown={contactYearBreakdown} messagesPerYear={messagesPerYear} />
    </div>
  );
}
