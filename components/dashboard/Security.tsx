import { StatTile } from "@/components/StatTile";
import type { SecurityInfo, AdsInfo } from "@/lib/types";

export function Security({ security, ads }: { security: SecurityInfo; ads: AdsInfo }) {
  return (
    <div className="card">
      <h2>Account &amp; security</h2>
      <div className="stat-row">
        <StatTile value={security.account_created ?? "—"} label="Account created" />
        <StatTile value={security.login_count.toLocaleString()} label="Logins recorded" />
        <StatTile value={security.distinct_ip_count.toLocaleString()} label="Distinct IP addresses" />
        <StatTile
          value={security.password_change_count.toLocaleString()}
          label="Password changes"
        />
      </div>
      <div className="list-note">Companies off Instagram that shared activity with Meta</div>
      <div>
        {ads.top_off_meta_companies.slice(0, 10).map((c, i) => (
          <div className="bar-row" key={i}>
            <div className="bar-label" style={{ width: "auto", flex: 1 }}>
              {c.company}
            </div>
            <div className="bar-value">{c.events}</div>
          </div>
        ))}
      </div>
      <div className="list-note" style={{ marginTop: 16 }}>
        Public/private profile toggle history
      </div>
      <div style={{ marginTop: 6 }}>
        {security.privacy_changes.length === 0 ? (
          <p className="list-note">No changes recorded.</p>
        ) : (
          security.privacy_changes.map((p, i) => (
            <div className="bar-row" key={i}>
              <div className="bar-label" style={{ width: "auto", flex: 1 }}>
                {p.change}
              </div>
              <div className="bar-value" style={{ width: "auto", textAlign: "right", fontSize: 11 }}>
                {p.time}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
