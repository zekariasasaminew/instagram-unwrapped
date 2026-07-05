export function Shopping({ data }: { data: string[] }) {
  return (
    <div className="card">
      <h2>Recently viewed (Shopping)</h2>
      <div style={{ marginTop: 8 }}>
        {data.length === 0 ? (
          <p className="list-note">None recorded.</p>
        ) : (
          data.map((item, i) => (
            <div className="bar-row" key={i}>
              <div className="bar-label" style={{ width: "auto", flex: 1 }}>
                {item}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
