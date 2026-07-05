import type { ReplySpeedEntry } from "@/lib/types";

export function ReplySpeed({ data }: { data: ReplySpeedEntry[] }) {
  if (data.length === 0) {
    return (
      <div className="card">
        <h2>Reply speed</h2>
        <p className="list-note">Not enough data.</p>
      </div>
    );
  }

  const fastest = [...data]
    .sort((a, b) => (a.their_median_reply_min ?? 0) - (b.their_median_reply_min ?? 0))
    .slice(0, 5);

  return (
    <div className="card">
      <h2>Reply speed</h2>
      <div className="list-note">Fastest repliers to you (median minutes, active contacts only)</div>
      {fastest.map((r) => (
        <div className="bar-row" key={r.participant}>
          <div className="bar-label">{r.participant}</div>
          <div className="bar-value" style={{ width: "auto", flex: 1, textAlign: "left" }}>
            {r.their_median_reply_min} min
          </div>
        </div>
      ))}
    </div>
  );
}
