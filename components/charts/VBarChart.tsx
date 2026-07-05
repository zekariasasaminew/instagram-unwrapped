"use client";

import { useEffect, useRef } from "react";
import { useTooltip } from "./Tooltip";
import { formatNumber } from "./svgEscape";

export interface VBarDatum {
  label: string;
  value: number;
}

/** Ported near-verbatim from the original dashboard's vBarChart() function. */
export function VBarChart({ data, color }: { data: VBarDatum[]; color: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { show, hide } = useTooltip();

  useEffect(() => {
    const el = containerRef.current;
    if (!el || data.length === 0) return;

    const w = el.clientWidth || 400;
    const h = 160;
    const padL = 36;
    const padR = 8;
    const padT = 10;
    const padB = 22;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const maxY = Math.max(...data.map((d) => d.value));
    const bw = plotW / data.length;

    let bars = "";
    data.forEach((d, i) => {
      const bh = (d.value / maxY) * plotH;
      const x = padL + i * bw + bw * 0.15;
      const y = padT + plotH - bh;
      bars += `<rect data-i="${i}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw * 0.7).toFixed(1)}" height="${bh.toFixed(1)}" rx="3" fill="${color}" style="cursor:pointer"/>`;
      bars += `<text x="${(x + bw * 0.35).toFixed(1)}" y="${h - 6}" font-size="10.5" fill="var(--text-muted)" text-anchor="middle">${d.label}</text>`;
    });

    el.innerHTML = `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}">
      <line x1="${padL}" y1="${padT + plotH}" x2="${w - padR}" y2="${padT + plotH}" stroke="var(--baseline)" stroke-width="1"/>
      ${bars}
    </svg>`;

    el.querySelectorAll("rect").forEach((r) => {
      r.addEventListener("mousemove", (e) => {
        const i = Number(r.getAttribute("data-i"));
        const mouseEvent = e as MouseEvent;
        show(`<b>${data[i].label}</b><br>${formatNumber(data[i].value)}`, mouseEvent.pageX, mouseEvent.pageY);
      });
      r.addEventListener("mouseleave", hide);
    });
  }, [data, color, show, hide]);

  return <div ref={containerRef} />;
}
