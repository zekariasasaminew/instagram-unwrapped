// Ported from the original dashboard's hBarChart() - this one never used SVG
// or the shared tooltip (just a native `title` attribute), so it ports
// directly to plain JSX with no imperative DOM work needed.
export interface HBarChartProps {
  items: { label: string; value: number }[];
  color: string;
  maxBars?: number;
}

export function HBarChart({ items, color, maxBars = 12 }: HBarChartProps) {
  const rows = items.slice(0, maxBars);
  if (rows.length === 0) return null;
  const maxV = Math.max(...rows.map((r) => r.value));

  return (
    <>
      {rows.map((r, i) => {
        const pct = ((r.value / maxV) * 100).toFixed(1);
        return (
          <div className="bar-row" key={`${r.label}-${i}`}>
            <div className="bar-label" title={r.label}>
              {r.label}
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <div className="bar-value">{r.value.toLocaleString()}</div>
          </div>
        );
      })}
    </>
  );
}
