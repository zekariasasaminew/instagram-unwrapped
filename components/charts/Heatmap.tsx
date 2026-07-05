"use client";

import { useEffect, useRef } from "react";
import { useTooltip } from "./Tooltip";
import { formatNumber } from "./svgEscape";
import type { HeatmapCell } from "@/lib/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STEPS = [
  "var(--seq-100)",
  "var(--seq-200)",
  "var(--seq-300)",
  "var(--seq-400)",
  "var(--seq-500)",
  "var(--seq-600)",
  "var(--seq-700)",
];

/** Ported near-verbatim from the original dashboard's heatmap() function. */
export function Heatmap({ data }: { data: HeatmapCell[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { show, hide } = useTooltip();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const grid = new Map<string, number>();
    let maxC = 0;
    for (const d of data) {
      grid.set(`${d.weekday}_${d.hour}`, d.count);
      maxC = Math.max(maxC, d.count);
    }

    const cellW = 26;
    const cellH = 20;
    const padL = 34;
    const padT = 16;
    const w = padL + 24 * cellW + 10;
    const h = padT + 7 * cellH + 20;

    let cells = "";
    for (let wd = 0; wd < 7; wd++) {
      cells += `<text x="${padL - 6}" y="${padT + wd * cellH + cellH * 0.68}" font-size="10.5" fill="var(--text-muted)" text-anchor="end">${DAYS[wd]}</text>`;
      for (let hr = 0; hr < 24; hr++) {
        const c = grid.get(`${wd}_${hr}`) ?? 0;
        const t = maxC ? c / maxC : 0;
        const stepIdx = c === 0 ? -1 : Math.min(STEPS.length - 1, Math.floor(t * STEPS.length));
        const fill = stepIdx === -1 ? "var(--gridline)" : STEPS[stepIdx];
        cells += `<rect data-wd="${wd}" data-hr="${hr}" data-c="${c}" x="${padL + hr * cellW}" y="${padT + wd * cellH}" width="${cellW - 2}" height="${cellH - 2}" rx="3" fill="${fill}" style="cursor:pointer"/>`;
      }
    }
    for (let hr = 0; hr < 24; hr += 3) {
      cells += `<text x="${padL + hr * cellW + cellW / 2}" y="${padT + 7 * cellH + 14}" font-size="10" fill="var(--text-muted)" text-anchor="middle">${hr}:00</text>`;
    }

    el.innerHTML = `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}">${cells}</svg>`;

    el.querySelectorAll("rect").forEach((r) => {
      r.addEventListener("mousemove", (e) => {
        const wd = Number(r.getAttribute("data-wd"));
        const hr = r.getAttribute("data-hr");
        const c = Number(r.getAttribute("data-c"));
        const mouseEvent = e as MouseEvent;
        show(`<b>${DAYS[wd]} ${hr}:00</b><br>${formatNumber(c)} messages`, mouseEvent.pageX, mouseEvent.pageY);
      });
      r.addEventListener("mouseleave", hide);
    });
  }, [data, show, hide]);

  return <div className="chart-wrap" ref={containerRef} />;
}
