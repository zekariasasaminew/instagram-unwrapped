"use client";

import { useEffect, useRef } from "react";
import { useTooltip } from "./Tooltip";
import { escapeHtml, formatNumber } from "./svgEscape";
import type { ContactYearBreakdown, YearCount } from "@/lib/types";

const COLOR_VARS = [
  "var(--series-you)",
  "var(--series-them)",
  "var(--series-3)",
  "#4a3aa7",
  "#e34948",
  "#e87ba4",
  "#eb6834",
];

/** Ported near-verbatim from the original dashboard's stackedYearChart(). */
export function StackedYearChart({
  breakdown,
  messagesPerYear,
}: {
  breakdown: ContactYearBreakdown;
  messagesPerYear: YearCount[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { show, hide } = useTooltip();
  const contacts = breakdown.contacts.slice(0, 7);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const years = breakdown.years;
    if (years.length === 0) return;

    const yearTotals = years.map((_, yi) => contacts.reduce((s, c) => s + c.by_year[yi], 0));
    const otherTotals = years.map((y, yi) => {
      const full = messagesPerYear.find((r) => r.year === y)?.count ?? 0;
      return Math.max(0, full - yearTotals[yi]);
    });

    const w = el.clientWidth || 800;
    const h = 260;
    const padL = 44;
    const padR = 16;
    const padT = 10;
    const padB = 24;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const maxTotal = Math.max(...years.map((_, yi) => yearTotals[yi] + otherTotals[yi]));
    const bw = plotW / years.length;

    let bars = "";
    years.forEach((y, yi) => {
      let yOffset = padT + plotH;
      const x = padL + yi * bw + bw * 0.15;
      const bwidth = bw * 0.7;
      contacts.forEach((c, ci) => {
        const v = c.by_year[yi];
        const segH = (v / maxTotal) * plotH;
        yOffset -= segH;
        if (v > 0) {
          bars += `<rect data-year="${y}" data-name="${escapeHtml(c.participant)}" data-v="${v}" x="${x.toFixed(1)}" y="${yOffset.toFixed(1)}" width="${bwidth.toFixed(1)}" height="${segH.toFixed(1)}" fill="${COLOR_VARS[ci]}" style="cursor:pointer"/>`;
        }
      });
      const otherV = otherTotals[yi];
      const otherH = (otherV / maxTotal) * plotH;
      yOffset -= otherH;
      if (otherV > 0) {
        bars += `<rect data-year="${y}" data-name="Other conversations" data-v="${otherV}" x="${x.toFixed(1)}" y="${yOffset.toFixed(1)}" width="${bwidth.toFixed(1)}" height="${otherH.toFixed(1)}" fill="var(--gridline)" style="cursor:pointer"/>`;
      }
      bars += `<text x="${(x + bwidth / 2).toFixed(1)}" y="${h - 6}" font-size="10.5" fill="var(--text-muted)" text-anchor="middle">${y}</text>`;
    });

    el.innerHTML = `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}">
      <line x1="${padL}" y1="${padT + plotH}" x2="${w - padR}" y2="${padT + plotH}" stroke="var(--baseline)" stroke-width="1"/>
      ${bars}
    </svg>`;

    el.querySelectorAll("rect").forEach((r) => {
      r.addEventListener("mousemove", (e) => {
        const mouseEvent = e as MouseEvent;
        show(
          `<b>${r.getAttribute("data-name")}</b><br>${r.getAttribute("data-year")}: ${formatNumber(Number(r.getAttribute("data-v")))} messages`,
          mouseEvent.pageX,
          mouseEvent.pageY
        );
      });
      r.addEventListener("mouseleave", hide);
    });
  }, [breakdown, messagesPerYear, contacts, show, hide]);

  return (
    <>
      <div className="chart-wrap" ref={containerRef} />
      <div className="legend" style={{ flexWrap: "wrap" }}>
        {contacts.map((c, ci) => (
          <span className="legend-item" key={c.participant}>
            <span className="swatch" style={{ background: COLOR_VARS[ci] }} />
            {c.participant}
          </span>
        ))}
        <span className="legend-item">
          <span className="swatch" style={{ background: "var(--gridline)" }} />
          Other conversations
        </span>
      </div>
    </>
  );
}
