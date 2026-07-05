import type { EmojiUsage } from "@/lib/types";

export function EmojiList({ data }: { data: EmojiUsage[] }) {
  const rows = data.slice(0, 8);
  const max = Math.max(...data.map((x) => x.used_by_you + x.used_by_them), 1);

  return (
    <div className="card">
      <h2>Top emoji</h2>
      <div className="legend">
        <span className="legend-item">
          <span className="swatch" style={{ background: "var(--series-you)" }} />
          You
        </span>
        <span className="legend-item">
          <span className="swatch" style={{ background: "var(--series-them)" }} />
          Them
        </span>
      </div>
      {rows.map((e, i) => {
        const total = e.used_by_you + e.used_by_them;
        const pctYou = ((e.used_by_you / max) * 100).toFixed(1);
        const pctThem = ((e.used_by_them / max) * 100).toFixed(1);
        return (
          <div className="bar-row" key={`${e.emoji}-${i}`}>
            <div className="bar-label" style={{ width: 36, flex: "0 0 36px", fontSize: 18 }}>
              {e.emoji}
            </div>
            <div className="bar-track" style={{ display: "flex", overflow: "hidden" }}>
              <div
                className="bar-fill"
                style={{ width: `${pctYou}%`, background: "var(--series-you)" }}
              />
              <div
                className="bar-fill"
                style={{ width: `${pctThem}%`, background: "var(--series-them)" }}
              />
            </div>
            <div className="bar-value">{total.toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );
}
