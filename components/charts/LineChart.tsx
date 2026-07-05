"use client";

import { useEffect, useRef } from "react";
import { useTooltip } from "./Tooltip";
import { formatNumber } from "./svgEscape";

export interface LineChartDatum {
  label: string;
  value: number;
}

/** Ported near-verbatim from the original dashboard's lineChart() function -
 * same layout math, same sparse tick spacing, same transparent hover targets. */
export function LineChart({ data, color }: { data: LineChartDatum[]; color: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { show, hide } = useTooltip();

  useEffect(() => {
    const el = containerRef.current;
    if (!el || data.length === 0) return;

    const w = el.clientWidth || 1000;
    const h = 220;
    const padL = 44;
    const padR = 16;
    const padT = 16;
    const padB = 28;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const maxY = Math.max(...data.map((d) => d.value));
    const xs = data.map((_, i) => padL + (i / (data.length - 1)) * plotW);
    const ys = data.map((d) => padT + plotH - (d.value / maxY) * plotH);

    let path = "";
    xs.forEach((x, i) => {
      path += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)} `;
    });
    const area = `${path}L${xs[xs.length - 1].toFixed(1)},${padT + plotH} L${xs[0].toFixed(1)},${padT + plotH} Z`;

    let ticks = "";
    data.forEach((d, i) => {
      if (i % Math.ceil(data.length / 8) === 0) {
        ticks += `<text x="${xs[i].toFixed(1)}" y="${h - 8}" font-size="10.5" fill="var(--text-muted)" text-anchor="middle">${d.label}</text>`;
      }
    });

    let dots = "";
    xs.forEach((x, i) => {
      dots += `<circle data-i="${i}" cx="${x.toFixed(1)}" cy="${ys[i].toFixed(1)}" r="7" fill="transparent" style="cursor:pointer" />`;
    });

    el.innerHTML = `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}">
      <line x1="${padL}" y1="${padT + plotH}" x2="${w - padR}" y2="${padT + plotH}" stroke="var(--baseline)" stroke-width="1"/>
      <path d="${area}" fill="${color}" opacity="0.12" />
      <path d="${path}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      ${ticks}
      ${dots}
    </svg>`;

    el.querySelectorAll("circle").forEach((c) => {
      c.addEventListener("mousemove", (e) => {
        const i = Number(c.getAttribute("data-i"));
        const mouseEvent = e as MouseEvent;
        show(
          `<b>${data[i].label}</b><br>${formatNumber(data[i].value)} messages`,
          mouseEvent.pageX,
          mouseEvent.pageY
        );
      });
      c.addEventListener("mouseleave", hide);
    });
  }, [data, color, show, hide]);

  return <div className="chart-wrap" ref={containerRef} />;
}
