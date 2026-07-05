import type { AiInterest } from "@/lib/types";

export function AIInterests({ data }: { data: AiInterest[] }) {
  return (
    <div className="card">
      <h2>Meta AI&rsquo;s read on you</h2>
      <div className="list-note">Interest categories AI has inferred from your activity</div>
      <div style={{ marginTop: 8 }}>
        {data.length === 0 ? (
          <p className="list-note">None recorded.</p>
        ) : (
          data.map((item, i) => (
            <div className="bar-row" key={i}>
              <div
                className="bar-label"
                style={{ width: "auto", flex: 1, textTransform: "capitalize" }}
              >
                {item.interest.replace(/^The user might be interested in /i, "")}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
