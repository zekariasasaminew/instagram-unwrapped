export function ProgressView({
  phase,
  processed,
  total,
  onCancel,
}: {
  phase: string;
  processed: number;
  total: number;
  onCancel: () => void;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;

  return (
    <div className="card">
      <h2>Reading your export…</h2>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="progress-phase" aria-live="polite">
        {phase}
        {total > 1 ? ` (${processed.toLocaleString()} / ${total.toLocaleString()})` : ""}
      </p>
      <button className="btn" onClick={onCancel} style={{ marginTop: 12 }}>
        Cancel
      </button>
    </div>
  );
}
