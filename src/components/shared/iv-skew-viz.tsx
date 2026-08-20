"use client";

import { motion } from "framer-motion";

// ── Hardcoded deterministic data points ──────────────────────────────

const putData: { delta: number; iv: number }[] = [
  { delta: 10, iv: 28.5 },
  { delta: 15, iv: 26.2 },
  { delta: 20, iv: 24.5 },
  { delta: 25, iv: 23.1 },
  { delta: 30, iv: 22.0 },
  { delta: 35, iv: 21.2 },
  { delta: 40, iv: 20.6 },
  { delta: 45, iv: 20.2 },
  { delta: 50, iv: 20.0 },
];

const callData: { delta: number; iv: number }[] = [
  { delta: 50, iv: 20.0 },
  { delta: 55, iv: 20.1 },
  { delta: 60, iv: 20.4 },
  { delta: 65, iv: 20.9 },
  { delta: 70, iv: 21.5 },
  { delta: 75, iv: 22.4 },
  { delta: 80, iv: 23.6 },
  { delta: 85, iv: 25.2 },
  { delta: 90, iv: 27.5 },
];

// All data combined for axis range
const allData = [...putData, ...callData];
const minIv = 12;
const maxIv = 30;
const minDelta = 10;
const maxDelta = 90;

// ── SVG chart dimensions ─────────────────────────────────────────────

const viewBoxW = 800;
const viewBoxH = 300;
const padL = 48;
const padR = 16;
const padT = 28;
const padB = 32;
const plotW = viewBoxW - padL - padR;
const plotH = viewBoxH - padT - padB;

// ── Coordinate transforms ────────────────────────────────────────────

const xScale = (delta: number) =>
  padL + ((delta - minDelta) / (maxDelta - minDelta)) * plotW;
const yScale = (iv: number) =>
  padT + (1 - (iv - minIv) / (maxIv - minIv)) * plotH;

// ── Build SVG path string ────────────────────────────────────────────

function buildPath(data: { delta: number; iv: number }[]): string {
  return data
    .map((d, i) => {
      const x = xScale(d.delta);
      const y = yScale(d.iv);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");
}

// Smooth cubic bezier for nicer curves
function buildSmoothPath(data: { delta: number; iv: number }[]): string {
  if (data.length < 2) return "";
  const points = data.map((d) => ({ x: xScale(d.delta), y: yScale(d.iv) }));
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
    const cpx2 = prev.x + (curr.x - prev.x) * 0.6;
    path += ` C ${cpx1} ${prev.y} ${cpx2} ${curr.y} ${curr.x} ${curr.y}`;
  }
  return path;
}

// Build area fill path (closes down to the baseline)
function buildAreaPath(data: { delta: number; iv: number }[]): string {
  const baseline = yScale(minIv);
  const linePath = buildSmoothPath(data);
  const firstX = xScale(data[0].delta);
  const lastX = xScale(data[data.length - 1].delta);
  return `${linePath} L ${lastX} ${baseline} L ${firstX} ${baseline} Z`;
}

// ── Summary stat cards ───────────────────────────────────────────────

const statCards = [
  {
    label: "25\u0394 Put Skew",
    value: "-8.5%",
    accent: "rose" as const,
  },
  {
    label: "ATM IV",
    value: "20.0%",
    accent: "emerald" as const,
  },
  {
    label: "25\u0394 Call Skew",
    value: "+3.1%",
    accent: "cyan" as const,
  },
  {
    label: "RR 25\u0394",
    value: "11.6%",
    accent: "amber" as const,
  },
];

const statAccentMap: Record<string, { text: string; border: string; bg: string }> = {
  rose: {
    text: "text-rose-400",
    border: "border-rose-400/20",
    bg: "bg-rose-400/[0.05]",
  },
  emerald: {
    text: "text-emerald-400",
    border: "border-emerald-400/20",
    bg: "bg-emerald-400/[0.05]",
  },
  cyan: {
    text: "text-cyan-400",
    border: "border-cyan-400/20",
    bg: "bg-cyan-400/[0.05]",
  },
  amber: {
    text: "text-amber-400",
    border: "border-amber-400/20",
    bg: "bg-amber-400/[0.05]",
  },
};

// ── Grid helpers ─────────────────────────────────────────────────────

// Y-axis gridlines at 2% intervals from 12% to 30%
const yGridValues = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30];

// Y-axis labels (show every 4%)
const yLabelValues = [12, 16, 20, 24, 28];

// X-axis labels at specific deltas
const xLabelValues = [10, 25, 50, 75, 90];

// X-axis gridlines at every 5 delta
const xGridValues = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90];

// ── Main component ───────────────────────────────────────────────────

export function IVSkewViz() {
  const putPath = buildSmoothPath(putData);
  const callPath = buildSmoothPath(callData);
  const putArea = buildAreaPath(putData);
  const callArea = buildAreaPath(callData);
  const atmX = xScale(50);

  return (
    <div className="border-glow border-gradient rounded-2xl bg-noise bg-[oklch(0.20_0.014_252)]/80 p-5 backdrop-blur-xl card-inner-glow">
      {/* Terminal header */}
      <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <span className="ml-2 font-mono text-xs font-semibold text-white/70">
            vince · /iv_skew SPX · put vs call skew
          </span>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-white/40">
          DEMO
        </span>
      </div>

      {/* SVG chart */}
      <div className="overflow-x-auto -mx-1 px-1">
        <svg
          viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
          className="w-full min-w-[320px] sm:min-w-[480px]"
          style={{ height: "auto", maxHeight: 320 }}
          aria-label="IV Skew chart showing put vs call implied volatility by delta for SPX"
          role="img"
        >
          <defs>
            <linearGradient id="ivPutAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="ivCallAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Plot area background */}
          <rect
            x={padL}
            y={padT}
            width={plotW}
            height={plotH}
            fill="white"
            fillOpacity={0.012}
            rx={4}
          />

          {/* Horizontal grid lines at 2% intervals */}
          {yGridValues.map((iv) => {
            const y = yScale(iv);
            return (
              <line
                key={`hgrid-${iv}`}
                x1={padL}
                y1={y}
                x2={padL + plotW}
                y2={y}
                stroke="white"
                strokeOpacity={0.05}
                strokeWidth={0.5}
              />
            );
          })}

          {/* Vertical grid lines at 5Δ intervals */}
          {xGridValues.map((delta) => {
            const x = xScale(delta);
            return (
              <line
                key={`vgrid-${delta}`}
                x1={x}
                y1={padT}
                x2={x}
                y2={padT + plotH}
                stroke="white"
                strokeOpacity={0.05}
                strokeWidth={0.5}
              />
            );
          })}

          {/* ATM vertical dashed line */}
          <line
            x1={atmX}
            y1={padT}
            x2={atmX}
            y2={padT + plotH}
            stroke="white"
            strokeOpacity={0.15}
            strokeDasharray="4,4"
            strokeWidth={1}
          />

          {/* ATM label */}
          <text
            x={atmX + 4}
            y={padT + 12}
            className="font-mono"
            fill="white"
            fillOpacity={0.5}
            fontSize={8}
          >
            ATM 20.0%
          </text>

          {/* Put area fill */}
          <motion.path
            d={putArea}
            fill="url(#ivPutAreaGrad)"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />

          {/* Call area fill */}
          <motion.path
            d={callArea}
            fill="url(#ivCallAreaGrad)"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />

          {/* Put IV curve */}
          <motion.path
            d={putPath}
            fill="none"
            stroke="#f43f5e"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
          />

          {/* Call IV curve */}
          <motion.path
            d={callPath}
            fill="none"
            stroke="#34d399"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          />

          {/* Put data points */}
          {putData.map((d) => (
            <circle
              key={`put-dot-${d.delta}`}
              cx={xScale(d.delta)}
              cy={yScale(d.iv)}
              r={2}
              fill="#f43f5e"
              fillOpacity={0.7}
            />
          ))}

          {/* Call data points */}
          {callData.map((d) => (
            <circle
              key={`call-dot-${d.delta}`}
              cx={xScale(d.delta)}
              cy={yScale(d.iv)}
              r={2}
              fill="#34d399"
              fillOpacity={0.7}
            />
          ))}

          {/* ATM dot */}
          <circle
            cx={atmX}
            cy={yScale(20)}
            r={3.5}
            fill="white"
            fillOpacity={0.8}
            stroke="white"
            strokeWidth={1}
          />

          {/* PUT SKEW label */}
          <text
            x={xScale(20)}
            y={padT - 8}
            textAnchor="middle"
            className="font-mono"
            fill="#f43f5e"
            fillOpacity={0.7}
            fontSize={9}
            fontWeight="600"
          >
            {"\u2190"} PUT SKEW
          </text>

          {/* CALL SKEW label */}
          <text
            x={xScale(80)}
            y={padT - 8}
            textAnchor="middle"
            className="font-mono"
            fill="#34d399"
            fillOpacity={0.7}
            fontSize={9}
            fontWeight="600"
          >
            CALL SKEW {"\u2192"}
          </text>

          {/* X-axis labels */}
          {xLabelValues.map((delta) => {
            const x = xScale(delta);
            const label = delta === 50 ? "50\u0394/ATM" : `${delta}\u0394`;
            return (
              <text
                key={`xlabel-${delta}`}
                x={x}
                y={viewBoxH - 8}
                textAnchor="middle"
                className="font-mono"
                fill="white"
                fillOpacity={0.4}
                fontSize={8}
              >
                {label}
              </text>
            );
          })}

          {/* Y-axis labels */}
          {yLabelValues.map((iv) => {
            const y = yScale(iv);
            return (
              <text
                key={`ylabel-${iv}`}
                x={padL - 6}
                y={y + 3}
                textAnchor="end"
                className="font-mono"
                fill="white"
                fillOpacity={0.4}
                fontSize={8}
              >
                {iv}%
              </text>
            );
          })}
        </svg>
      </div>

      {/* Summary stat cards */}
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-4 sm:grid-cols-4">
        {statCards.map((card, i) => {
          const cm = statAccentMap[card.accent];
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
              className={`rounded-lg border ${cm.border} ${cm.bg} p-2.5`}
            >
              <div className={`font-mono text-[0.55rem] uppercase tracking-wider ${cm.text} opacity-80`}>
                {card.label}
              </div>
              <div className={`numeric mt-1 font-mono text-base font-semibold ${cm.text}`}>
                {card.value}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
