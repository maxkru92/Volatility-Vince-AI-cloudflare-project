"use client";

import { useMemo, Fragment } from "react";
import { motion } from "framer-motion";
import { Timer, ArrowRight, Info } from "lucide-react";

// ── Hardcoded SPX-like price data with regime states ──────────────────
// 60 data points, regimes: 0=Bull/LowVol, 1=Sideways/Normal, 2=Bear/HighVol
interface PricePoint {
  price: number;
  regime: 0 | 1 | 2;
}

const PRICE_DATA: PricePoint[] = [
  { price: 5710, regime: 2 }, { price: 5695, regime: 2 }, { price: 5680, regime: 2 },
  { price: 5700, regime: 2 }, { price: 5720, regime: 1 }, { price: 5735, regime: 1 },
  { price: 5755, regime: 1 }, { price: 5740, regime: 1 }, { price: 5760, regime: 1 },
  { price: 5780, regime: 0 }, { price: 5800, regime: 0 }, { price: 5820, regime: 0 },
  { price: 5810, regime: 0 }, { price: 5835, regime: 0 }, { price: 5855, regime: 0 },
  { price: 5870, regime: 0 }, { price: 5890, regime: 0 }, { price: 5875, regime: 0 },
  { price: 5895, regime: 0 }, { price: 5910, regime: 0 }, { price: 5900, regime: 0 },
  { price: 5885, regime: 0 }, { price: 5870, regime: 1 }, { price: 5855, regime: 1 },
  { price: 5840, regime: 1 }, { price: 5855, regime: 1 }, { price: 5865, regime: 1 },
  { price: 5870, regime: 1 }, { price: 5855, regime: 1 }, { price: 5840, regime: 1 },
  { price: 5825, regime: 1 }, { price: 5835, regime: 1 }, { price: 5810, regime: 1 },
  { price: 5790, regime: 1 }, { price: 5770, regime: 2 }, { price: 5750, regime: 2 },
  { price: 5735, regime: 2 }, { price: 5710, regime: 2 }, { price: 5730, regime: 2 },
  { price: 5755, regime: 1 }, { price: 5780, regime: 1 }, { price: 5805, regime: 1 },
  { price: 5830, regime: 0 }, { price: 5855, regime: 0 }, { price: 5870, regime: 0 },
  { price: 5890, regime: 0 }, { price: 5905, regime: 0 }, { price: 5915, regime: 0 },
  { price: 5930, regime: 0 }, { price: 5920, regime: 0 }, { price: 5935, regime: 0 },
  { price: 5945, regime: 0 }, { price: 5935, regime: 0 }, { price: 5925, regime: 0 },
  { price: 5915, regime: 0 }, { price: 5905, regime: 0 }, { price: 5920, regime: 0 },
  { price: 5910, regime: 0 }, { price: 5925, regime: 0 }, { price: 5930, regime: 0 },
  { price: 5940, regime: 0 },
];

// Regime color map
const REGIME_COLORS: Record<0 | 1 | 2, string> = {
  0: "#34d399", // emerald
  1: "#22d3ee", // cyan
  2: "#f43f5e", // rose
};

const REGIME_LABELS: Record<0 | 1 | 2, string> = {
  0: "Bull / Low Vol",
  1: "Sideways / Normal",
  2: "Bear / High Vol",
};

// Current regime probabilities
const REGIME_PROBS = [
  { label: "Bull", prob: 0.72, state: 0 as const },
  { label: "Sideways", prob: 0.18, state: 1 as const },
  { label: "Bear", prob: 0.10, state: 2 as const },
];

// Probability history sparklines (last 20 periods each)
const PROB_HISTORY = {
  0: [0.15, 0.22, 0.30, 0.38, 0.45, 0.52, 0.58, 0.62, 0.65, 0.68, 0.55, 0.48, 0.42, 0.35, 0.28, 0.40, 0.55, 0.62, 0.68, 0.72],
  1: [0.35, 0.30, 0.28, 0.25, 0.22, 0.20, 0.18, 0.16, 0.15, 0.14, 0.25, 0.30, 0.32, 0.35, 0.38, 0.30, 0.22, 0.20, 0.18, 0.18],
  2: [0.50, 0.48, 0.42, 0.37, 0.33, 0.28, 0.24, 0.22, 0.20, 0.18, 0.20, 0.22, 0.26, 0.30, 0.34, 0.30, 0.23, 0.18, 0.14, 0.10],
};

// Transition probability matrix
const TRANSITION_MATRIX: number[][] = [
  [0.85, 0.12, 0.03],
  [0.15, 0.70, 0.15],
  [0.05, 0.20, 0.75],
];

const STATE_LABELS = ["Bull", "Sideways", "Bear"];

// ── SVG layout constants ──────────────────────────────────────────────
const VB_W = 800;
const VB_H = 280;
const PAD_L = 52;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 28;
const CHART_W = VB_W - PAD_L - PAD_R;
const CHART_H = VB_H - PAD_T - PAD_B;

// ── Sparkline SVG helper ──────────────────────────────────────────────
function Sparkline({
  data,
  color,
  width = 48,
  height = 16,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height * 0.8 - height * 0.1;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="shrink-0"
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.7}
      />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────
export function RegimeDetectionViz() {
  // Compute price range and scale
  const prices = useMemo(() => PRICE_DATA.map((d) => d.price), []);
  const minPrice = useMemo(() => Math.min(...prices) - 15, [prices]);
  const maxPrice = useMemo(() => Math.max(...prices) + 15, [prices]);

  // Scale helpers
  const xScale = (i: number) => PAD_L + (i / (PRICE_DATA.length - 1)) * CHART_W;
  const yScale = (p: number) =>
    PAD_T + CHART_H - ((p - minPrice) / (maxPrice - minPrice)) * CHART_H;

  // Find regime transition indices
  const transitions = useMemo(() => {
    const idxs: number[] = [];
    for (let i = 1; i < PRICE_DATA.length; i++) {
      if (PRICE_DATA[i].regime !== PRICE_DATA[i - 1].regime) {
        idxs.push(i);
      }
    }
    return idxs;
  }, []);

  // Build path segments grouped by consecutive regime runs
  const segments = useMemo(() => {
    const runs: { regime: 0 | 1 | 2; startIdx: number; endIdx: number }[] = [];
    let current = PRICE_DATA[0].regime;
    let start = 0;
    for (let i = 1; i <= PRICE_DATA.length; i++) {
      if (i === PRICE_DATA.length || PRICE_DATA[i].regime !== current) {
        runs.push({ regime: current, startIdx: start, endIdx: i - 1 });
        if (i < PRICE_DATA.length) {
          current = PRICE_DATA[i].regime;
          start = i;
        }
      }
    }
    return runs;
  }, []);

  // Build line path string for a segment
  const linePath = (startIdx: number, endIdx: number) => {
    const parts: string[] = [];
    for (let i = startIdx; i <= endIdx; i++) {
      const cmd = i === startIdx ? "M" : "L";
      parts.push(`${cmd}${xScale(i).toFixed(1)},${yScale(PRICE_DATA[i].price).toFixed(1)}`);
    }
    return parts.join(" ");
  };

  // Build area path string for a segment (fill below price line)
  const areaPath = (startIdx: number, endIdx: number) => {
    const top: string[] = [];
    for (let i = startIdx; i <= endIdx; i++) {
      const cmd = i === startIdx ? "M" : "L";
      top.push(`${cmd}${xScale(i).toFixed(1)},${yScale(PRICE_DATA[i].price).toFixed(1)}`);
    }
    // Close path down to baseline and back
    const baseline = (PAD_T + CHART_H).toFixed(1);
    const close = [
      `L${xScale(endIdx).toFixed(1)},${baseline}`,
      `L${xScale(startIdx).toFixed(1)},${baseline}`,
      "Z",
    ].join(" ");
    return top.join(" ") + " " + close;
  };

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const step = 50;
    const start = Math.ceil(minPrice / step) * step;
    const ticks: number[] = [];
    for (let v = start; v <= maxPrice; v += step) {
      ticks.push(v);
    }
    return ticks;
  }, [minPrice, maxPrice]);

  // X-axis labels
  const xLabels = [
    { idx: 0, label: "T-60" },
    { idx: 19, label: "T-40" },
    { idx: 39, label: "T-20" },
    { idx: 59, label: "Now" },
  ];

  // Transition matrix cell color
  const matrixCellColor = (val: number) => {
    if (val >= 0.7) return "text-emerald-400";
    if (val >= 0.15) return "text-amber-400";
    return "text-rose-400";
  };

  const matrixCellBg = (val: number) => {
    if (val >= 0.7) return "bg-emerald-400/10 border-emerald-400/20";
    if (val >= 0.15) return "bg-amber-400/10 border-amber-400/20";
    return "bg-rose-400/10 border-rose-400/20";
  };

  return (
    <div className="border-glow border-gradient rounded-2xl bg-noise bg-[oklch(0.20_0.014_252)]/80 p-5 backdrop-blur-xl card-inner-glow">
      {/* ── Terminal header ── */}
      <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <span className="ml-2 truncate font-mono text-xs font-semibold text-white/70">
            vince · /regime SPX · HMM 3-state
          </span>
        </div>
        <div className="flex shrink-0 items-center">
          <span className="rounded border border-amber-400/30 bg-amber-400/20 px-1.5 py-0.5 font-mono text-[0.6rem] font-semibold text-amber-400">
            DEMO
          </span>
        </div>
      </div>

      {/* ── Price path with regime overlay ── */}
      <div className="overflow-x-auto -mx-1 px-1">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full min-w-[320px] sm:min-w-[480px]"
          style={{ height: "auto" }}
          aria-label="SPX price path with HMM regime detection overlay"
          role="img"
        >
          {/* Subtle chart background */}
          <rect
            x={PAD_L}
            y={PAD_T}
            width={CHART_W}
            height={CHART_H}
            fill="white"
            fillOpacity={0.015}
            rx={4}
          />

          {/* Y-axis labels */}
          {yTicks.map((v) => (
            <text
              key={`yt-${v}`}
              x={PAD_L - 6}
              y={yScale(v) + 3}
              textAnchor="end"
              className="font-mono"
              fill="white"
              fillOpacity={0.35}
              fontSize={7}
            >
              {v.toFixed(0)}
            </text>
          ))}

          {/* Horizontal grid lines */}
          {yTicks.map((v) => (
            <line
              key={`yg-${v}`}
              x1={PAD_L}
              y1={yScale(v)}
              x2={PAD_L + CHART_W}
              y2={yScale(v)}
              stroke="white"
              strokeOpacity={0.04}
              strokeWidth={0.5}
            />
          ))}

          {/* X-axis labels */}
          {xLabels.map(({ idx, label }) => (
            <text
              key={`xl-${idx}`}
              x={xScale(idx)}
              y={VB_H - 4}
              textAnchor="middle"
              className="font-mono"
              fill="white"
              fillOpacity={0.35}
              fontSize={7}
            >
              {label}
            </text>
          ))}

          {/* Regime-colored area fills (below price) */}
          {segments.map((seg, i) => (
            <motion.path
              key={`area-${i}`}
              d={areaPath(seg.startIdx, seg.endIdx)}
              fill={REGIME_COLORS[seg.regime]}
              fillOpacity={0.15}
              stroke="none"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
            />
          ))}

          {/* Regime transition vertical dashed lines */}
          {transitions.map((idx) => (
            <line
              key={`trans-${idx}`}
              x1={xScale(idx)}
              y1={PAD_T}
              x2={xScale(idx)}
              y2={PAD_T + CHART_H}
              stroke="white"
              strokeOpacity={0.12}
              strokeWidth={0.7}
              strokeDasharray="3 3"
            />
          ))}

          {/* Price line segments colored by regime */}
          {segments.map((seg, i) => (
            <motion.path
              key={`line-${i}`}
              d={linePath(seg.startIdx, seg.endIdx)}
              fill="none"
              stroke={REGIME_COLORS[seg.regime]}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 1.2,
                delay: i * 0.08,
                ease: "easeOut",
              }}
            />
          ))}

          {/* Current marker (rightmost point) */}
          {(() => {
            const lastIdx = PRICE_DATA.length - 1;
            const lastRegime = PRICE_DATA[lastIdx].regime;
            const cx = xScale(lastIdx);
            const cy = yScale(PRICE_DATA[lastIdx].price);
            return (
              <g>
                {/* Vertical line */}
                <line
                  x1={cx}
                  y1={PAD_T}
                  x2={cx}
                  y2={PAD_T + CHART_H}
                  stroke={REGIME_COLORS[lastRegime]}
                  strokeOpacity={0.3}
                  strokeWidth={1}
                  strokeDasharray="4 2"
                />
                {/* Dot at current price */}
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={REGIME_COLORS[lastRegime]}
                  stroke={REGIME_COLORS[lastRegime]}
                  strokeWidth={2}
                  strokeOpacity={0.3}
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 1.2 }}
                />
                {/* Label */}
                <motion.g
                  initial={{ opacity: 0, x: 5 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 1.4 }}
                >
                  <rect
                    x={cx - 34}
                    y={cy - 20}
                    width={68}
                    height={14}
                    rx={3}
                    fill={REGIME_COLORS[lastRegime]}
                    fillOpacity={0.2}
                    stroke={REGIME_COLORS[lastRegime]}
                    strokeWidth={0.5}
                    strokeOpacity={0.4}
                  />
                  <text
                    x={cx}
                    y={cy - 11}
                    textAnchor="middle"
                    className="font-mono"
                    fill={REGIME_COLORS[lastRegime]}
                    fontSize={7}
                    fontWeight={700}
                  >
                    {REGIME_LABELS[lastRegime]}
                  </text>
                </motion.g>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* ── Regime probability bar chart ── */}
      <div className="mt-4 space-y-2">
        <div className="font-mono text-[0.55rem] uppercase tracking-wider text-white/40">
          Current Regime Probabilities
        </div>
        {REGIME_PROBS.map((rp, i) => (
          <div key={rp.label} className="flex items-center gap-2">
            <span
              className="w-16 shrink-0 font-mono text-xs font-semibold"
              style={{ color: REGIME_COLORS[rp.state] }}
            >
              {rp.label}
            </span>
            <div className="relative h-5 flex-1 overflow-hidden rounded bg-white/[0.04]">
              <motion.div
                className="h-full rounded"
                style={{ backgroundColor: REGIME_COLORS[rp.state] }}
                initial={{ width: 0 }}
                whileInView={{ width: `${rp.prob * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.12, ease: "easeOut" }}
              />
            </div>
            <span className="numeric w-10 shrink-0 text-right font-mono text-xs font-semibold text-white/70">
              {(rp.prob * 100).toFixed(0)}%
            </span>
            <Sparkline
              data={PROB_HISTORY[rp.state]}
              color={REGIME_COLORS[rp.state]}
            />
          </div>
        ))}
      </div>

      {/* ── Transition probability matrix ── */}
      <div className="mt-4">
        <div className="mb-2 font-mono text-[0.55rem] uppercase tracking-wider text-white/40">
          Transition Probability Matrix
        </div>
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="inline-grid min-w-[260px] grid-cols-[auto_repeat(3,1fr)] gap-px sm:min-w-[300px]">
            {/* Header row */}
            <div />
            {STATE_LABELS.map((label) => (
              <div
                key={`th-${label}`}
                className="py-1 text-center font-mono text-[0.6rem] font-semibold text-white/50"
              >
                {label}
              </div>
            ))}
            {/* Data rows */}
            {TRANSITION_MATRIX.map((row, r) => (
              <Fragment key={`row-wrapper-${r}`}>
                <div
                  className="flex items-center py-1 pr-2 font-mono text-[0.6rem] font-semibold text-white/50"
                >
                  {STATE_LABELS[r]}
                </div>
                {row.map((val, c) => (
                  <motion.div
                    key={`cell-${r}-${c}`}
                    className={`rounded border px-1.5 py-1.5 text-center font-mono text-[0.6rem] font-bold ${matrixCellColor(val)} ${matrixCellBg(val)}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.6 + (r * 3 + c) * 0.03 }}
                  >
                    {val.toFixed(2)}
                  </motion.div>
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── Summary stat cards ── */}
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-4 sm:grid-cols-4">
        <motion.div
          className="min-w-0 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] p-2.5"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.0 }}
        >
          <div className="font-mono text-[0.55rem] uppercase tracking-wider text-emerald-400/80">
            Current Regime
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
            <span className="font-mono text-xs font-semibold text-emerald-300">
              Bull / Low Vol
            </span>
          </div>
        </motion.div>

        <motion.div
          className="min-w-0 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.05] p-2.5"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          <div className="font-mono text-[0.55rem] uppercase tracking-wider text-cyan-400/80">
            Regime Duration
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <Timer className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
            <span className="numeric font-mono text-xs font-semibold text-cyan-300">
              14 days
            </span>
          </div>
        </motion.div>

        <motion.div
          className="min-w-0 rounded-lg border border-amber-400/20 bg-amber-400/[0.05] p-2.5"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.16 }}
        >
          <div className="font-mono text-[0.55rem] uppercase tracking-wider text-amber-400/80">
            Most Likely Transition
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            <span className="font-mono text-xs font-semibold text-amber-300">
              Sideways (12%)
            </span>
          </div>
        </motion.div>

        <motion.div
          className="min-w-0 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.24 }}
        >
          <div className="font-mono text-[0.55rem] uppercase tracking-wider text-white/40">
            HMM Log-Likelihood
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 shrink-0 text-white/50" />
            <span className="numeric font-mono text-xs font-semibold text-white/70">
              -847.3
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
