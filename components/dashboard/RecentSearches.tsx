import type { RecentSearches as RecentSearchesData } from "@/lib/types";

export function RecentSearches({ data }: { data: RecentSearchesData }) {
  return (
    <div className="card">
      <h2>Recent searches</h2>
      <div className="list-note">
        {data.total} searches saved in this export (Instagram only retains a rolling window)
      </div>
      <div style={{ marginTop: 8 }}>
        {data.most_recent.length === 0 ? (
          <p className="list-note">No recent searches in this export.</p>
        ) : (
          data.most_recent.map((r, i) => (
            <div className="bar-row" key={`${r.query}-${i}`}>
              <div className="bar-label" style={{ width: "auto", flex: 1 }}>
                {r.query}
              </div>
              <div className="bar-value" style={{ width: "auto", textAlign: "right", fontSize: 11 }}>
                {r.time}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
