import { HBarChart } from "@/components/charts/HBarChart";
import type { WordCount } from "@/lib/types";

export function NonFillerWords({
  topWordsYouNonfiller,
  topWordsRepliesNonfiller,
}: {
  topWordsYouNonfiller: WordCount[];
  topWordsRepliesNonfiller: WordCount[];
}) {
  return (
    <div className="card">
      <h2>Word frequency, minus the filler</h2>
      <div className="list-note">
        Same ranking, with every word that already appears above (i&rsquo;m, new, how, lol, yeah,
        etc.) and common filler/interjections removed
      </div>
      <div className="two-col" style={{ marginTop: 12 }}>
        <div>
          <div className="legend">
            <span className="legend-item">
              <span className="swatch" style={{ background: "var(--series-you)" }} />
              You (non-filler)
            </span>
          </div>
          <HBarChart
            items={topWordsYouNonfiller.map((w) => ({ label: w.word, value: w.count }))}
            color="var(--series-you)"
            maxBars={10}
          />
        </div>
        <div>
          <div className="legend">
            <span className="legend-item">
              <span className="swatch" style={{ background: "var(--series-them)" }} />
              Them (non-filler)
            </span>
          </div>
          <HBarChart
            items={topWordsRepliesNonfiller.map((w) => ({ label: w.word, value: w.count }))}
            color="var(--series-them)"
            maxBars={10}
          />
        </div>
      </div>
    </div>
  );
}
