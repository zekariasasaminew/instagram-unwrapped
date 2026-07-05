"use client";

import { useState } from "react";
import { HBarChart } from "@/components/charts/HBarChart";
import type { WordCount } from "@/lib/types";

export function WordFrequency({
  topWordsYou,
  topWordsReplies,
  topWordsByYear,
}: {
  topWordsYou: WordCount[];
  topWordsReplies: WordCount[];
  topWordsByYear: Record<string, { you: WordCount[]; them: WordCount[] }>;
}) {
  const years = Object.keys(topWordsByYear).sort();
  const [selectedYear, setSelectedYear] = useState("__all__");

  const you = selectedYear === "__all__" ? topWordsYou : topWordsByYear[selectedYear].you;
  const them = selectedYear === "__all__" ? topWordsReplies : topWordsByYear[selectedYear].them;

  return (
    <div className="card">
      <h2>Word frequency</h2>
      <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
        <option value="__all__">All years (overall)</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <div className="two-col">
        <div>
          <div className="legend">
            <span className="legend-item">
              <span className="swatch" style={{ background: "var(--series-you)" }} />
              Words you use
            </span>
          </div>
          <HBarChart
            items={you.map((w) => ({ label: w.word, value: w.count }))}
            color="var(--series-you)"
            maxBars={10}
          />
        </div>
        <div>
          <div className="legend">
            <span className="legend-item">
              <span className="swatch" style={{ background: "var(--series-them)" }} />
              Words you receive
            </span>
          </div>
          <HBarChart
            items={them.map((w) => ({ label: w.word, value: w.count }))}
            color="var(--series-them)"
            maxBars={10}
          />
        </div>
      </div>
    </div>
  );
}
